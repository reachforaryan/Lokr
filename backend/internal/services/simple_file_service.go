package services

import (
	"context"
	"crypto/sha256"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lib/pq"

	"lokr-backend/internal/domain"
)

type SimpleFileService struct {
	db      *pgxpool.Pool
	storage *S3StorageService
}

func NewSimpleFileService(db *pgxpool.Pool, storage *S3StorageService) *SimpleFileService {
	return &SimpleFileService{
		db:      db,
		storage: storage,
	}
}

func (s *SimpleFileService) UploadFile(ctx context.Context, userID uuid.UUID, filename, mimeType string, content []byte, folderID *uuid.UUID, description *string, tags []string, visibility *domain.FileVisibility) (*domain.File, error) {
	// Calculate content hash for deduplication
	hash := sha256.Sum256(content)
	contentHash := fmt.Sprintf("%x", hash)

	// Get user info to determine enterprise slug (for now, assuming personal files)
	// In a real implementation, you'd query the user's enterprise info
	enterpriseSlug := "" // Personal files

	// Check if file content already exists (deduplication)
	var existingRefCount int
	var existingFilePath string
	err := s.db.QueryRow(ctx, "SELECT reference_count, file_path FROM file_contents WHERE content_hash = $1", contentHash).Scan(&existingRefCount, &existingFilePath)

	var filePath string
	if err != nil && strings.Contains(err.Error(), "no rows") {
		// Content doesn't exist, store it in S3/local storage
		storedPath, err := s.storage.StoreFile(ctx, content, enterpriseSlug, userID.String(), contentHash, filename)
		if err != nil {
			return nil, fmt.Errorf("failed to store file: %w", err)
		}
		filePath = storedPath

		// Insert new file content record
		_, err = s.db.Exec(ctx, `
			INSERT INTO file_contents (content_hash, file_path, file_size, reference_count, created_at)
			VALUES ($1, $2, $3, 1, NOW())`,
			contentHash, filePath, len(content))
		if err != nil {
			return nil, fmt.Errorf("failed to create file content: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("failed to check existing content: %w", err)
	} else {
		// Content already exists, just increment reference count
		_, err = s.db.Exec(ctx, "UPDATE file_contents SET reference_count = reference_count + 1 WHERE content_hash = $1", contentHash)
		if err != nil {
			return nil, fmt.Errorf("failed to increment reference count: %w", err)
		}
		filePath = existingFilePath
	}

	// Set default visibility if not provided
	fileVisibility := domain.VisibilityPrivate
	if visibility != nil {
		fileVisibility = *visibility
	}

	// Generate safe filename
	safeFilename := generateSafeFilename(filename)

	// Create file record
	file := &domain.File{
		ID:            uuid.New(),
		UserID:        userID,
		FolderID:      folderID,
		Filename:      safeFilename,
		OriginalName:  filename,
		MimeType:      mimeType,
		FileSize:      int64(len(content)),
		ContentHash:   contentHash,
		Description:   description,
		Tags:          pq.StringArray(tags),
		Visibility:    fileVisibility,
		DownloadCount: 0,
		UploadDate:    time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Generate share token if public
	if fileVisibility == domain.VisibilityPublic {
		shareToken := uuid.New().String()
		file.ShareToken = &shareToken
	}

	// Insert file record
	_, err = s.db.Exec(ctx, `
		INSERT INTO files (id, user_id, folder_id, filename, original_name, mime_type,
		                  file_size, content_hash, description, tags, visibility,
		                  share_token, download_count, upload_date, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
		file.ID, file.UserID, file.FolderID, file.Filename, file.OriginalName,
		file.MimeType, file.FileSize, file.ContentHash, file.Description,
		file.Tags, file.Visibility, file.ShareToken, file.DownloadCount,
		file.UploadDate, file.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create file record: %w", err)
	}

	return file, nil
}

func (s *SimpleFileService) GetFilesByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*domain.File, error) {
	fmt.Printf("DEBUG: GetFilesByUserID called with userID=%s, limit=%d, offset=%d\n", userID.String(), limit, offset)

	query := `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files
		WHERE user_id = $1
		ORDER BY upload_date DESC
		LIMIT $2 OFFSET $3`

	rows, err := s.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		fmt.Printf("DEBUG: Query failed with error: %v\n", err)
		return nil, fmt.Errorf("failed to query files: %w", err)
	}
	defer rows.Close()

	var files []*domain.File
	for rows.Next() {
		file := &domain.File{}
		err := rows.Scan(
			&file.ID, &file.UserID, &file.FolderID, &file.Filename, &file.OriginalName,
			&file.MimeType, &file.FileSize, &file.ContentHash, &file.Description,
			&file.Tags, &file.Visibility, &file.ShareToken, &file.DownloadCount,
			&file.UploadDate, &file.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("DEBUG: Scan failed with error: %v\n", err)
			return nil, fmt.Errorf("failed to scan file: %w", err)
		}
		files = append(files, file)
	}

	fmt.Printf("DEBUG: Returning %d files\n", len(files))
	return files, nil
}

func (s *SimpleFileService) MoveFile(ctx context.Context, fileID, userID uuid.UUID, newFolderID *uuid.UUID) (*domain.File, error) {
	// Verify file ownership
	var existingFile domain.File
	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files
		WHERE id = $1 AND user_id = $2`, fileID, userID).Scan(
		&existingFile.ID, &existingFile.UserID, &existingFile.FolderID, &existingFile.Filename, &existingFile.OriginalName,
		&existingFile.MimeType, &existingFile.FileSize, &existingFile.ContentHash, &existingFile.Description,
		&existingFile.Tags, &existingFile.Visibility, &existingFile.ShareToken, &existingFile.DownloadCount,
		&existingFile.UploadDate, &existingFile.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("file not found or access denied: %w", err)
	}

	// Update file's folder_id
	_, err = s.db.Exec(ctx, `
		UPDATE files
		SET folder_id = $1, updated_at = NOW()
		WHERE id = $2 AND user_id = $3`,
		newFolderID, fileID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to move file: %w", err)
	}

	// Update the existing file object and return it
	existingFile.FolderID = newFolderID
	existingFile.UpdatedAt = time.Now()

	return &existingFile, nil
}

func (s *SimpleFileService) DeleteFile(ctx context.Context, fileID, userID uuid.UUID) error {
	// Verify file ownership and get file info
	var file domain.File
	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, content_hash
		FROM files
		WHERE id = $1 AND user_id = $2`, fileID, userID).Scan(
		&file.ID, &file.UserID, &file.ContentHash,
	)
	if err != nil {
		return fmt.Errorf("file not found or access denied: %w", err)
	}

	// Delete the file record
	_, err = s.db.Exec(ctx, "DELETE FROM files WHERE id = $1", fileID)
	if err != nil {
		return fmt.Errorf("failed to delete file record: %w", err)
	}

	// Decrement reference count and check if we should delete from storage
	var newRefCount int
	var filePath string
	err = s.db.QueryRow(ctx, `
		UPDATE file_contents
		SET reference_count = reference_count - 1
		WHERE content_hash = $1
		RETURNING reference_count, file_path`, file.ContentHash).Scan(&newRefCount, &filePath)

	if err != nil {
		return fmt.Errorf("failed to update reference count: %w", err)
	}

	// If no more references, delete from storage and database
	if newRefCount <= 0 {
		// Delete from S3/local storage
		err = s.storage.DeleteFile(ctx, filePath)
		if err != nil {
			// Log error but don't fail the whole operation
			fmt.Printf("WARNING: Failed to delete file from storage: %v\n", err)
		}

		// Delete from file_contents table
		_, err = s.db.Exec(ctx, "DELETE FROM file_contents WHERE content_hash = $1", file.ContentHash)
		if err != nil {
			return fmt.Errorf("failed to delete file content record: %w", err)
		}
	}

	return nil
}

func generateSafeFilename(originalName string) string {
	// Remove unsafe characters and generate a safe filename
	name := strings.ReplaceAll(originalName, " ", "_")
	name = strings.ReplaceAll(name, "..", "")

	// Add timestamp to ensure uniqueness
	ext := filepath.Ext(name)
	nameWithoutExt := strings.TrimSuffix(name, ext)
	return fmt.Sprintf("%s_%d%s", nameWithoutExt, time.Now().Unix(), ext)
}

func detectMimeType(filename string) string {
	// Basic MIME type detection based on file extension
	ext := strings.ToLower(filepath.Ext(filename))

	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".pdf":
		return "application/pdf"
	case ".txt":
		return "text/plain"
	case ".json":
		return "application/json"
	case ".xml":
		return "application/xml"
	case ".zip":
		return "application/zip"
	case ".mp4":
		return "video/mp4"
	case ".mp3":
		return "audio/mpeg"
	default:
		return "application/octet-stream"
	}
}