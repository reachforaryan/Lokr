package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lib/pq"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
)

type FileRepository struct {
	db     *pgxpool.Pool
	logger *zap.Logger
}

func NewFileRepository(db *pgxpool.Pool, logger *zap.Logger) *FileRepository {
	return &FileRepository{
		db:     db,
		logger: logger,
	}
}

func (r *FileRepository) Create(file *domain.File) error {
	query := `
		INSERT INTO files (id, user_id, folder_id, filename, original_name, mime_type, file_size,
		                  content_hash, description, tags, visibility, share_token, download_count,
		                  upload_date, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query,
		file.ID, file.UserID, file.FolderID, file.Filename, file.OriginalName, file.MimeType,
		file.FileSize, file.ContentHash, file.Description, pq.Array(file.Tags), file.Visibility,
		file.ShareToken, file.DownloadCount, file.UploadDate, file.UpdatedAt)

	if err != nil {
		r.logger.Error("Failed to create file", zap.Error(err))
		return fmt.Errorf("failed to create file: %w", err)
	}

	return nil
}

func (r *FileRepository) GetByID(id uuid.UUID) (*domain.File, error) {
	query := `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files WHERE id = $1`

	file := &domain.File{}
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, id)

	err := row.Scan(
		&file.ID, &file.UserID, &file.FolderID, &file.Filename, &file.OriginalName, &file.MimeType,
		&file.FileSize, &file.ContentHash, &file.Description, pq.Array(&file.Tags), &file.Visibility,
		&file.ShareToken, &file.DownloadCount, &file.UploadDate, &file.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file not found")
		}
		r.logger.Error("Failed to get file by ID", zap.Error(err))
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	return file, nil
}

func (r *FileRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]*domain.File, error) {
	query := `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files
		WHERE user_id = $1
		ORDER BY upload_date DESC
		LIMIT $2 OFFSET $3`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		r.logger.Error("Failed to get files by user ID", zap.Error(err))
		return nil, fmt.Errorf("failed to get files: %w", err)
	}
	defer rows.Close()

	var files []*domain.File
	for rows.Next() {
		file := &domain.File{}
		err := rows.Scan(
			&file.ID, &file.UserID, &file.FolderID, &file.Filename, &file.OriginalName, &file.MimeType,
			&file.FileSize, &file.ContentHash, &file.Description, pq.Array(&file.Tags), &file.Visibility,
			&file.ShareToken, &file.DownloadCount, &file.UploadDate, &file.UpdatedAt)

		if err != nil {
			r.logger.Error("Failed to scan file", zap.Error(err))
			continue
		}

		files = append(files, file)
	}

	return files, nil
}

func (r *FileRepository) GetByContentHash(hash string) (*domain.File, error) {
	query := `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files WHERE content_hash = $1 LIMIT 1`

	file := &domain.File{}
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, hash)

	err := row.Scan(
		&file.ID, &file.UserID, &file.FolderID, &file.Filename, &file.OriginalName, &file.MimeType,
		&file.FileSize, &file.ContentHash, &file.Description, pq.Array(&file.Tags), &file.Visibility,
		&file.ShareToken, &file.DownloadCount, &file.UploadDate, &file.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file not found")
		}
		r.logger.Error("Failed to get file by content hash", zap.Error(err))
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	return file, nil
}

func (r *FileRepository) Update(file *domain.File) error {
	query := `
		UPDATE files
		SET filename = $2, description = $3, tags = $4, visibility = $5, folder_id = $6, updated_at = $7
		WHERE id = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query,
		file.ID, file.Filename, file.Description, pq.Array(file.Tags), file.Visibility,
		file.FolderID, file.UpdatedAt)

	if err != nil {
		r.logger.Error("Failed to update file", zap.Error(err))
		return fmt.Errorf("failed to update file: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("file not found")
	}

	return nil
}

func (r *FileRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM files WHERE id = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		r.logger.Error("Failed to delete file", zap.Error(err))
		return fmt.Errorf("failed to delete file: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("file not found")
	}

	return nil
}

func (r *FileRepository) Search(request *domain.FileSearchRequest) ([]*domain.File, int, error) {
	baseQuery := `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files WHERE 1=1`

	countQuery := `SELECT COUNT(*) FROM files WHERE 1=1`

	var conditions []string
	var args []interface{}
	argCount := 0

	// Add user filter
	if request.UserID != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argCount))
		args = append(args, *request.UserID)
	}

	// Add query filter
	if request.Query != nil && *request.Query != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("(filename ILIKE $%d OR description ILIKE $%d)", argCount, argCount))
		args = append(args, "%"+*request.Query+"%")
	}

	// Add MIME type filter
	if len(request.MimeTypes) > 0 {
		argCount++
		conditions = append(conditions, fmt.Sprintf("mime_type = ANY($%d)", argCount))
		args = append(args, pq.Array(request.MimeTypes))
	}

	// Add size filters
	if request.MinSize != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("file_size >= $%d", argCount))
		args = append(args, *request.MinSize)
	}

	if request.MaxSize != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("file_size <= $%d", argCount))
		args = append(args, *request.MaxSize)
	}

	// Add date filters
	if request.UploadedAfter != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("upload_date >= $%d", argCount))
		args = append(args, *request.UploadedAfter)
	}

	if request.UploadedBefore != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("upload_date <= $%d", argCount))
		args = append(args, *request.UploadedBefore)
	}

	// Add tags filter
	if len(request.Tags) > 0 {
		argCount++
		conditions = append(conditions, fmt.Sprintf("tags && $%d", argCount))
		args = append(args, pq.Array(request.Tags))
	}

	// Add uploader filter
	if request.UploaderID != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argCount))
		args = append(args, *request.UploaderID)
	}

	// Add visibility filter
	if request.Visibility != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("visibility = $%d", argCount))
		args = append(args, *request.Visibility)
	}

	// Build final queries
	if len(conditions) > 0 {
		conditionStr := " AND " + strings.Join(conditions, " AND ")
		baseQuery += conditionStr
		countQuery += conditionStr
	}

	// Get total count
	var totalCount int
	ctx := context.Background()
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		r.logger.Error("Failed to get file count", zap.Error(err))
		return nil, 0, fmt.Errorf("failed to get file count: %w", err)
	}

	// Add ordering and pagination
	orderBy := "upload_date"
	if request.SortBy != "" {
		orderBy = request.SortBy
	}

	sortOrder := "DESC"
	if request.SortOrder != "" {
		sortOrder = strings.ToUpper(request.SortOrder)
	}

	baseQuery += fmt.Sprintf(" ORDER BY %s %s", orderBy, sortOrder)

	argCount++
	baseQuery += fmt.Sprintf(" LIMIT $%d", argCount)
	args = append(args, request.Limit)

	argCount++
	baseQuery += fmt.Sprintf(" OFFSET $%d", argCount)
	args = append(args, request.Offset)

	// Execute search query
	rows, err := r.db.Query(ctx, baseQuery, args...)
	if err != nil {
		r.logger.Error("Failed to search files", zap.Error(err))
		return nil, 0, fmt.Errorf("failed to search files: %w", err)
	}
	defer rows.Close()

	var files []*domain.File
	for rows.Next() {
		file := &domain.File{}
		err := rows.Scan(
			&file.ID, &file.UserID, &file.FolderID, &file.Filename, &file.OriginalName, &file.MimeType,
			&file.FileSize, &file.ContentHash, &file.Description, pq.Array(&file.Tags), &file.Visibility,
			&file.ShareToken, &file.DownloadCount, &file.UploadDate, &file.UpdatedAt)

		if err != nil {
			r.logger.Error("Failed to scan file", zap.Error(err))
			continue
		}

		files = append(files, file)
	}

	return files, totalCount, nil
}

func (r *FileRepository) GetPublicFile(shareToken string) (*domain.File, error) {
	query := `
		SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
		       content_hash, description, tags, visibility, share_token, download_count,
		       upload_date, updated_at
		FROM files WHERE share_token = $1 AND visibility = 'PUBLIC'`

	file := &domain.File{}
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, shareToken)

	err := row.Scan(
		&file.ID, &file.UserID, &file.FolderID, &file.Filename, &file.OriginalName, &file.MimeType,
		&file.FileSize, &file.ContentHash, &file.Description, pq.Array(&file.Tags), &file.Visibility,
		&file.ShareToken, &file.DownloadCount, &file.UploadDate, &file.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("public file not found")
		}
		r.logger.Error("Failed to get public file", zap.Error(err))
		return nil, fmt.Errorf("failed to get public file: %w", err)
	}

	return file, nil
}

func (r *FileRepository) IncrementDownloadCount(id uuid.UUID) error {
	query := `UPDATE files SET download_count = download_count + 1 WHERE id = $1`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		r.logger.Error("Failed to increment download count", zap.Error(err))
		return fmt.Errorf("failed to increment download count: %w", err)
	}

	return nil
}

func (r *FileRepository) GetSharedWithUser(userID uuid.UUID, limit, offset int) ([]*domain.File, error) {
	query := `
		SELECT f.id, f.user_id, f.folder_id, f.filename, f.original_name, f.mime_type, f.file_size,
		       f.content_hash, f.description, f.tags, f.visibility, f.share_token, f.download_count,
		       f.upload_date, f.updated_at
		FROM files f
		INNER JOIN file_shares fs ON f.id = fs.file_id
		WHERE fs.shared_with_user_id = $1
		ORDER BY fs.created_at DESC
		LIMIT $2 OFFSET $3`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		r.logger.Error("Failed to get shared files", zap.Error(err))
		return nil, fmt.Errorf("failed to get shared files: %w", err)
	}
	defer rows.Close()

	var files []*domain.File
	for rows.Next() {
		file := &domain.File{}
		err := rows.Scan(
			&file.ID, &file.UserID, &file.FolderID, &file.Filename, &file.OriginalName, &file.MimeType,
			&file.FileSize, &file.ContentHash, &file.Description, pq.Array(&file.Tags), &file.Visibility,
			&file.ShareToken, &file.DownloadCount, &file.UploadDate, &file.UpdatedAt)

		if err != nil {
			r.logger.Error("Failed to scan shared file", zap.Error(err))
			continue
		}

		files = append(files, file)
	}

	return files, nil
}