package services

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"lokr-backend/internal/domain"
)

type FileSharingService struct {
	db *pgxpool.Pool
}

func NewFileSharingService(db *pgxpool.Pool) *FileSharingService {
	return &FileSharingService{
		db: db,
	}
}

// GenerateShareToken creates a random secure token for public file sharing
func (s *FileSharingService) generateShareToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// CreatePublicShare enables public sharing for a file
func (s *FileSharingService) CreatePublicShare(ctx context.Context, fileID uuid.UUID, userID uuid.UUID) (*domain.PublicShareResponse, error) {
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

	// Generate share token
	shareToken, err := s.generateShareToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate share token: %w", err)
	}

	// Update file to make it publicly shareable
	_, err = s.db.Exec(ctx, `
		UPDATE files
		SET visibility = 'PUBLIC', share_token = $1, updated_at = NOW()
		WHERE id = $2`,
		shareToken, fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to create public share: %w", err)
	}

	shareURL := fmt.Sprintf("http://localhost:3000/shared/%s", shareToken)

	return &domain.PublicShareResponse{
		ShareToken: shareToken,
		ShareURL:   shareURL,
	}, nil
}

// RemovePublicShare disables public sharing for a file
func (s *FileSharingService) RemovePublicShare(ctx context.Context, fileID uuid.UUID, userID uuid.UUID) error {
	// Check if user owns the file
	var ownerID uuid.UUID
	err := s.db.QueryRow(ctx, "SELECT user_id FROM files WHERE id = $1", fileID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("file not found")
		}
		return fmt.Errorf("failed to check file ownership: %w", err)
	}

	if ownerID != userID {
		return fmt.Errorf("permission denied")
	}

	// Update file to make it private
	_, err = s.db.Exec(ctx, `
		UPDATE files
		SET visibility = 'PRIVATE', share_token = NULL, updated_at = NOW()
		WHERE id = $1`,
		fileID)
	if err != nil {
		return fmt.Errorf("failed to remove public share: %w", err)
	}

	return nil
}

// ShareWithUser shares a file with a specific user
func (s *FileSharingService) ShareWithUser(ctx context.Context, input domain.ShareFileInput, sharedByUserID uuid.UUID) (*domain.FileShare, error) {
	// Check if user owns the file
	var ownerID uuid.UUID
	err := s.db.QueryRow(ctx, "SELECT user_id FROM files WHERE id = $1", input.FileID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file not found")
		}
		return nil, fmt.Errorf("failed to check file ownership: %w", err)
	}

	if ownerID != sharedByUserID {
		return nil, fmt.Errorf("permission denied")
	}

	// Check if target user exists and is in the same enterprise
	var targetUserEnterpriseID *uuid.UUID
	var ownerEnterpriseID *uuid.UUID

	err = s.db.QueryRow(ctx, "SELECT enterprise_id FROM users WHERE id = $1", input.SharedWithUserID).Scan(&targetUserEnterpriseID)
	if err != nil {
		return nil, fmt.Errorf("target user not found")
	}

	err = s.db.QueryRow(ctx, "SELECT enterprise_id FROM users WHERE id = $1", sharedByUserID).Scan(&ownerEnterpriseID)
	if err != nil {
		return nil, fmt.Errorf("failed to check file owner enterprise: %w", err)
	}

	// Ensure both users are in the same enterprise
	if targetUserEnterpriseID == nil || ownerEnterpriseID == nil || *targetUserEnterpriseID != *ownerEnterpriseID {
		return nil, fmt.Errorf("can only share files with users in the same enterprise")
	}

	// Create a copy of the file for the shared user
	copiedFileID, err := s.copyFileForUser(ctx, input.FileID, input.SharedWithUserID, sharedByUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to copy file for sharing: %w", err)
	}

	// Insert the file share record
	shareID := uuid.New()
	_, err = s.db.Exec(ctx, `
		INSERT INTO file_shares (id, file_id, shared_by_user_id, shared_with_user_id, permission_type, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (file_id, shared_with_user_id)
		DO UPDATE SET permission_type = $5, expires_at = $6, created_at = NOW()`,
		shareID, copiedFileID, sharedByUserID, input.SharedWithUserID, input.PermissionType, input.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed to share file: %w", err)
	}

	// Return the created share
	return s.GetFileShare(ctx, copiedFileID, input.SharedWithUserID)
}

// RemoveUserShare removes sharing with a specific user
func (s *FileSharingService) RemoveUserShare(ctx context.Context, fileID uuid.UUID, sharedWithUserID uuid.UUID, sharedByUserID uuid.UUID) error {
	// Check if user owns the file
	var ownerID uuid.UUID
	err := s.db.QueryRow(ctx, "SELECT user_id FROM files WHERE id = $1", fileID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("file not found")
		}
		return fmt.Errorf("failed to check file ownership: %w", err)
	}

	if ownerID != sharedByUserID {
		return fmt.Errorf("permission denied")
	}

	// Delete the file share
	result, err := s.db.Exec(ctx, `
		DELETE FROM file_shares
		WHERE file_id = $1 AND shared_with_user_id = $2`,
		fileID, sharedWithUserID)
	if err != nil {
		return fmt.Errorf("failed to remove file share: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("file share not found")
	}

	// Check if there are any remaining user shares
	var hasUserShares bool
	err = s.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM file_shares WHERE file_id = $1)", fileID).Scan(&hasUserShares)
	if err != nil {
		return fmt.Errorf("failed to check remaining shares: %w", err)
	}

	// If no user shares remain and file is not public, make it private
	if !hasUserShares {
		var isPublic bool
		err = s.db.QueryRow(ctx, "SELECT share_token IS NOT NULL FROM files WHERE id = $1", fileID).Scan(&isPublic)
		if err != nil {
			return fmt.Errorf("failed to check public status: %w", err)
		}

		if !isPublic {
			_, err = s.db.Exec(ctx, `
				UPDATE files
				SET visibility = 'PRIVATE', updated_at = NOW()
				WHERE id = $1`,
				fileID)
			if err != nil {
				return fmt.Errorf("failed to update file visibility: %w", err)
			}
		}
	}

	return nil
}

// GetFileShare retrieves a specific file share
func (s *FileSharingService) GetFileShare(ctx context.Context, fileID uuid.UUID, sharedWithUserID uuid.UUID) (*domain.FileShare, error) {
	var share domain.FileShare
	var expiresAt, lastAccessedAt sql.NullTime

	err := s.db.QueryRow(ctx, `
		SELECT id, file_id, shared_by_user_id, shared_with_user_id, permission_type,
			   expires_at, last_accessed_at, access_count, created_at
		FROM file_shares
		WHERE file_id = $1 AND shared_with_user_id = $2`,
		fileID, sharedWithUserID).Scan(
		&share.ID, &share.FileID, &share.SharedByUserID, &share.SharedWithUserID,
		&share.PermissionType, &expiresAt, &lastAccessedAt, &share.AccessCount, &share.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file share not found")
		}
		return nil, fmt.Errorf("failed to get file share: %w", err)
	}

	if expiresAt.Valid {
		share.ExpiresAt = &expiresAt.Time
	}
	if lastAccessedAt.Valid {
		share.LastAccessedAt = &lastAccessedAt.Time
	}

	return &share, nil
}

// GetFileShares retrieves all shares for a file
func (s *FileSharingService) GetFileShares(ctx context.Context, fileID uuid.UUID, ownerID uuid.UUID) ([]domain.FileShare, error) {
	// Check if user owns the file
	var actualOwnerID uuid.UUID
	err := s.db.QueryRow(ctx, "SELECT user_id FROM files WHERE id = $1", fileID).Scan(&actualOwnerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file not found")
		}
		return nil, fmt.Errorf("failed to check file ownership: %w", err)
	}

	if actualOwnerID != ownerID {
		return nil, fmt.Errorf("permission denied")
	}

	rows, err := s.db.Query(ctx, `
		SELECT fs.id, fs.file_id, fs.shared_by_user_id, fs.shared_with_user_id, fs.permission_type,
			   fs.expires_at, fs.last_accessed_at, fs.access_count, fs.created_at,
			   u.name, u.email
		FROM file_shares fs
		JOIN users u ON fs.shared_with_user_id = u.id
		WHERE fs.file_id = $1
		ORDER BY fs.created_at DESC`,
		fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to get file shares: %w", err)
	}
	defer rows.Close()

	var shares []domain.FileShare
	for rows.Next() {
		var share domain.FileShare
		var user domain.User
		var expiresAt, lastAccessedAt sql.NullTime

		err := rows.Scan(
			&share.ID, &share.FileID, &share.SharedByUserID, &share.SharedWithUserID,
			&share.PermissionType, &expiresAt, &lastAccessedAt, &share.AccessCount, &share.CreatedAt,
			&user.Name, &user.Email)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file share: %w", err)
		}

		user.ID = share.SharedWithUserID
		share.SharedWith = &user

		if expiresAt.Valid {
			share.ExpiresAt = &expiresAt.Time
		}
		if lastAccessedAt.Valid {
			share.LastAccessedAt = &lastAccessedAt.Time
		}

		shares = append(shares, share)
	}

	return shares, nil
}

// GetFileShareInfo gets comprehensive sharing information for a file
func (s *FileSharingService) GetFileShareInfo(ctx context.Context, fileID uuid.UUID, ownerID uuid.UUID) (*domain.FileShareInfo, error) {
	// Get file details
	var shareToken sql.NullString
	var visibility string
	var downloadCount int

	err := s.db.QueryRow(ctx, `
		SELECT share_token, visibility, download_count
		FROM files
		WHERE id = $1 AND user_id = $2`,
		fileID, ownerID).Scan(&shareToken, &visibility, &downloadCount)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file not found or permission denied")
		}
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	// Get user shares
	userShares, err := s.GetFileShares(ctx, fileID, ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user shares: %w", err)
	}

	info := &domain.FileShareInfo{
		IsShared:        visibility != "PRIVATE",
		SharedWithUsers: userShares,
		DownloadCount:   downloadCount,
	}

	if shareToken.Valid {
		info.ShareToken = shareToken.String
		info.ShareURL = fmt.Sprintf("http://localhost:3000/shared/%s", shareToken.String)
	}

	return info, nil
}

// GetFileByShareToken retrieves a file by its public share token
func (s *FileSharingService) GetFileByShareToken(ctx context.Context, shareToken string) (*domain.File, error) {
	var file domain.File
	var folderID sql.NullString
	var description, shareTokenDB sql.NullString
	var tags []string

	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
			   content_hash, description, tags, visibility, share_token, download_count,
			   upload_date, updated_at
		FROM files
		WHERE share_token = $1 AND visibility = 'PUBLIC'`,
		shareToken).Scan(
		&file.ID, &file.UserID, &folderID, &file.Filename, &file.OriginalName,
		&file.MimeType, &file.FileSize, &file.ContentHash, &description,
		&tags, &file.Visibility, &shareTokenDB, &file.DownloadCount,
		&file.UploadDate, &file.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("shared file not found")
		}
		return nil, fmt.Errorf("failed to get shared file: %w", err)
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

	if shareTokenDB.Valid {
		file.ShareToken = &shareTokenDB.String
	}

	file.Tags = tags

	return &file, nil
}

// IncrementDownloadCount increments the download counter for a file
func (s *FileSharingService) IncrementDownloadCount(ctx context.Context, fileID uuid.UUID) error {
	_, err := s.db.Exec(ctx, `
		UPDATE files
		SET download_count = download_count + 1, updated_at = NOW()
		WHERE id = $1`,
		fileID)
	if err != nil {
		return fmt.Errorf("failed to increment download count: %w", err)
	}
	return nil
}

// RecordShareAccess records when a shared file is accessed
func (s *FileSharingService) RecordShareAccess(ctx context.Context, fileID uuid.UUID, userID uuid.UUID) error {
	_, err := s.db.Exec(ctx, `
		UPDATE file_shares
		SET access_count = access_count + 1, last_accessed_at = NOW()
		WHERE file_id = $1 AND shared_with_user_id = $2`,
		fileID, userID)
	if err != nil {
		return fmt.Errorf("failed to record share access: %w", err)
	}
	return nil
}

// SearchUsers searches for users by name or email within the same enterprise
func (s *FileSharingService) SearchUsers(ctx context.Context, query string, limit int, userID uuid.UUID) ([]*domain.User, error) {
	if limit <= 0 || limit > 50 {
		limit = 10
	}

	// Get the user's enterprise ID
	var enterpriseID *uuid.UUID
	err := s.db.QueryRow(ctx, "SELECT enterprise_id FROM users WHERE id = $1", userID).Scan(&enterpriseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user enterprise: %w", err)
	}

	if enterpriseID == nil {
		return []*domain.User{}, nil
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, email, name, profile_image, role, created_at
		FROM users
		WHERE (name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
		AND email_verified = true
		AND enterprise_id = $3
		AND id != $4
		ORDER BY name ASC
		LIMIT $2`,
		query, limit, enterpriseID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var user domain.User
		var profileImage sql.NullString

		err := rows.Scan(
			&user.ID, &user.Email, &user.Name, &profileImage, &user.Role, &user.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		if profileImage.Valid {
			user.ProfileImage = &profileImage.String
		}

		users = append(users, &user)
	}

	return users, nil
}

// GetSharedWithMeFiles gets files that have been shared with the user (copied files owned by the user)
func (s *FileSharingService) GetSharedWithMeFiles(ctx context.Context, userID uuid.UUID, limit int, offset int) ([]*domain.File, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	// Get files owned by the user that were shared (have "Shared from" in the filename)
	rows, err := s.db.Query(ctx, `
		SELECT f.id, f.user_id, f.folder_id, f.filename, f.original_name,
		       f.mime_type, f.file_size, f.content_hash, f.description, f.tags,
		       f.visibility, f.share_token, f.download_count, f.upload_date, f.updated_at
		FROM files f
		WHERE f.user_id = $1
		AND f.filename LIKE '[Shared from %'
		ORDER BY f.upload_date DESC
		LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query shared files: %w", err)
	}
	defer rows.Close()

	var files []*domain.File
	for rows.Next() {
		var file domain.File
		var folderID sql.NullString
		var description sql.NullString
		var shareToken sql.NullString

		err := rows.Scan(
			&file.ID, &file.UserID, &folderID, &file.Filename, &file.OriginalName,
			&file.MimeType, &file.FileSize, &file.ContentHash, &description, &file.Tags,
			&file.Visibility, &shareToken, &file.DownloadCount, &file.UploadDate, &file.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file: %w", err)
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

		files = append(files, &file)
	}

	return files, nil
}

// copyFileForUser creates a copy of the file metadata for the target user
func (s *FileSharingService) copyFileForUser(ctx context.Context, originalFileID uuid.UUID, targetUserID uuid.UUID, sharedByUserID uuid.UUID) (uuid.UUID, error) {
	// Get original file information
	var originalFile domain.File
	var folderID sql.NullString
	var description sql.NullString
	var shareToken sql.NullString

	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count, upload_date
		FROM files WHERE id = $1`, originalFileID).Scan(
		&originalFile.ID, &originalFile.UserID, &folderID, &originalFile.Filename, &originalFile.OriginalName,
		&originalFile.MimeType, &originalFile.FileSize, &originalFile.ContentHash, &description, &originalFile.Tags,
		&originalFile.Visibility, &shareToken, &originalFile.DownloadCount, &originalFile.UploadDate)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to get original file: %w", err)
	}

	// Create new file ID for the copy
	copiedFileID := uuid.New()

	// Create new filename with "Shared from [owner]" prefix
	var ownerName string
	err = s.db.QueryRow(ctx, "SELECT name FROM users WHERE id = $1", sharedByUserID).Scan(&ownerName)
	if err != nil {
		ownerName = "Unknown User"
	}

	newFilename := fmt.Sprintf("[Shared from %s] %s", ownerName, originalFile.OriginalName)

	// Insert the copied file record
	_, err = s.db.Exec(ctx, `
		INSERT INTO files (id, user_id, folder_id, filename, original_name, mime_type, file_size,
		                  content_hash, description, tags, visibility, share_token, download_count, upload_date, updated_at)
		VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, 'PRIVATE', NULL, 0, NOW(), NOW())`,
		copiedFileID, targetUserID, newFilename, newFilename, originalFile.MimeType, originalFile.FileSize,
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
		// This might happen if the original file was uploaded via REST API
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