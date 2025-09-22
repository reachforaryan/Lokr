package services

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"lokr-backend/internal/domain"
)

type FolderFileService struct {
	db *pgxpool.Pool
}

func NewFolderFileService(db *pgxpool.Pool) *FolderFileService {
	return &FolderFileService{
		db: db,
	}
}

// AddFileToFolder creates a copy of the file metadata for the target folder (like file sharing)
func (s *FolderFileService) AddFileToFolder(ctx context.Context, fileID uuid.UUID, folderID uuid.UUID, userID uuid.UUID) (*domain.File, error) {
	// Check if user owns the file
	var ownerID uuid.UUID
	err := s.db.QueryRow(ctx, "SELECT user_id FROM files WHERE id = $1", fileID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file not found")
		}
		return nil, fmt.Errorf("failed to check file ownership: %w", err)
	}

	if ownerID != userID {
		return nil, fmt.Errorf("permission denied")
	}

	// Check if user owns the folder
	var folderOwnerID uuid.UUID
	err = s.db.QueryRow(ctx, "SELECT user_id FROM folders WHERE id = $1", folderID).Scan(&folderOwnerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("folder not found")
		}
		return nil, fmt.Errorf("failed to check folder ownership: %w", err)
	}

	if folderOwnerID != userID {
		return nil, fmt.Errorf("permission denied - folder not owned by user")
	}

	// Create a copy of the file for the folder
	copiedFileID, err := s.copyFileToFolder(ctx, fileID, folderID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to copy file to folder: %w", err)
	}

	// Return the copied file
	return s.getFileByID(ctx, copiedFileID)
}

// copyFileToFolder creates a copy of the file metadata for the target folder
func (s *FolderFileService) copyFileToFolder(ctx context.Context, originalFileID uuid.UUID, folderID uuid.UUID, userID uuid.UUID) (uuid.UUID, error) {
	// Get original file information
	var originalFile domain.File
	var originalFolderID sql.NullString
	var description sql.NullString
	var shareToken sql.NullString

	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count, upload_date
		FROM files WHERE id = $1`, originalFileID).Scan(
		&originalFile.ID, &originalFile.UserID, &originalFolderID, &originalFile.Filename, &originalFile.OriginalName,
		&originalFile.MimeType, &originalFile.FileSize, &originalFile.ContentHash, &description, &originalFile.Tags,
		&originalFile.Visibility, &shareToken, &originalFile.DownloadCount, &originalFile.UploadDate)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to get original file: %w", err)
	}

	// Create new file ID for the copy
	copiedFileID := uuid.New()

	// Keep the original filename - no need to modify it like in file sharing
	newFilename := originalFile.OriginalName

	// Insert the copied file record with the target folder ID
	_, err = s.db.Exec(ctx, `
		INSERT INTO files (id, user_id, folder_id, filename, original_name, mime_type, file_size,
		                  content_hash, description, tags, visibility, share_token, download_count, upload_date, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PRIVATE', NULL, 0, NOW(), NOW())`,
		copiedFileID, userID, folderID, newFilename, newFilename, originalFile.MimeType, originalFile.FileSize,
		originalFile.ContentHash, description, originalFile.Tags)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to create file copy: %w", err)
	}

	// Update the reference count in file_contents (since we're sharing the same physical file)
	_, err = s.db.Exec(ctx, `
		UPDATE file_contents
		SET reference_count = reference_count + 1
		WHERE content_hash = $1`, originalFile.ContentHash)
	if err != nil {
		// If the file_contents record doesn't exist, create it
		_, err = s.db.Exec(ctx, `
			INSERT INTO file_contents (content_hash, file_path, file_size, reference_count, created_at)
			VALUES ($1, $2, $3, 1, NOW())
			ON CONFLICT (content_hash) DO UPDATE SET reference_count = file_contents.reference_count + 1`,
			originalFile.ContentHash, fmt.Sprintf("personal/users/%s/%s", originalFile.UserID.String(), originalFile.ContentHash), originalFile.FileSize)
		if err != nil {
			return uuid.Nil, fmt.Errorf("failed to update file contents reference: %w", err)
		}
	}

	return copiedFileID, nil
}

// getFileByID retrieves a file by its ID
func (s *FolderFileService) getFileByID(ctx context.Context, fileID uuid.UUID) (*domain.File, error) {
	var file domain.File
	var folderID sql.NullString
	var description sql.NullString
	var shareToken sql.NullString

	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files WHERE id = $1`, fileID).Scan(
		&file.ID, &file.UserID, &folderID, &file.Filename, &file.OriginalName,
		&file.MimeType, &file.FileSize, &file.ContentHash, &description, &file.Tags,
		&file.Visibility, &shareToken, &file.DownloadCount,
		&file.UploadDate, &file.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file not found")
		}
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	if folderID.Valid {
		folderUUID, err := uuid.Parse(folderID.String)
		if err == nil {
			file.FolderID = &folderUUID
		}
	}

	if description.Valid {
		file.Description = &description.String
	}

	if shareToken.Valid {
		file.ShareToken = &shareToken.String
	}

	return &file, nil
}

// GetFolderFiles retrieves all files in a folder (used for FolderReferences)
func (s *FolderFileService) GetFolderFiles(ctx context.Context, folderID uuid.UUID, userID uuid.UUID) ([]*domain.File, error) {
	// Check if user owns the folder
	var folderOwnerID uuid.UUID
	err := s.db.QueryRow(ctx, "SELECT user_id FROM folders WHERE id = $1", folderID).Scan(&folderOwnerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("folder not found")
		}
		return nil, fmt.Errorf("failed to check folder ownership: %w", err)
	}

	if folderOwnerID != userID {
		return nil, fmt.Errorf("permission denied - folder not owned by user")
	}

	// Get all files in the folder
	rows, err := s.db.Query(ctx, `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files
		WHERE folder_id = $1 AND user_id = $2
		ORDER BY original_name ASC`, folderID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get folder files: %w", err)
	}
	defer rows.Close()

	var files []*domain.File
	for rows.Next() {
		var file domain.File
		var folderIDStr sql.NullString
		var description sql.NullString
		var shareToken sql.NullString

		err := rows.Scan(
			&file.ID, &file.UserID, &folderIDStr, &file.Filename, &file.OriginalName,
			&file.MimeType, &file.FileSize, &file.ContentHash, &description, &file.Tags,
			&file.Visibility, &shareToken, &file.DownloadCount,
			&file.UploadDate, &file.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file: %w", err)
		}

		if folderIDStr.Valid {
			folderUUID, err := uuid.Parse(folderIDStr.String)
			if err == nil {
				file.FolderID = &folderUUID
			}
		}

		if description.Valid {
			file.Description = &description.String
		}

		if shareToken.Valid {
			file.ShareToken = &shareToken.String
		}

		files = append(files, &file)
	}

	return files, nil
}