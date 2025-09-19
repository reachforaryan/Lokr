package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
)

type FileContentRepository struct {
	db     *pgxpool.Pool
	logger *zap.Logger
}

func NewFileContentRepository(db *pgxpool.Pool, logger *zap.Logger) *FileContentRepository {
	return &FileContentRepository{
		db:     db,
		logger: logger,
	}
}

func (r *FileContentRepository) Create(content *domain.FileContent) error {
	query := `
		INSERT INTO file_contents (content_hash, file_path, file_size, reference_count, enterprise_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query,
		content.ContentHash, content.FilePath, content.FileSize, content.ReferenceCount,
		content.EnterpriseID, content.CreatedAt)

	if err != nil {
		r.logger.Error("Failed to create file content", zap.Error(err))
		return fmt.Errorf("failed to create file content: %w", err)
	}

	return nil
}

func (r *FileContentRepository) GetByHash(hash string) (*domain.FileContent, error) {
	query := `
		SELECT content_hash, file_path, file_size, reference_count, enterprise_id, created_at
		FROM file_contents WHERE content_hash = $1`

	content := &domain.FileContent{}
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, hash)

	err := row.Scan(
		&content.ContentHash, &content.FilePath, &content.FileSize, &content.ReferenceCount,
		&content.EnterpriseID, &content.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("file content not found")
		}
		r.logger.Error("Failed to get file content by hash", zap.Error(err))
		return nil, fmt.Errorf("failed to get file content: %w", err)
	}

	return content, nil
}

func (r *FileContentRepository) IncrementReference(hash string) error {
	query := `UPDATE file_contents SET reference_count = reference_count + 1 WHERE content_hash = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query, hash)
	if err != nil {
		r.logger.Error("Failed to increment reference count", zap.Error(err))
		return fmt.Errorf("failed to increment reference count: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("file content not found")
	}

	return nil
}

func (r *FileContentRepository) DecrementReference(hash string) error {
	query := `
		UPDATE file_contents
		SET reference_count = GREATEST(reference_count - 1, 0)
		WHERE content_hash = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query, hash)
	if err != nil {
		r.logger.Error("Failed to decrement reference count", zap.Error(err))
		return fmt.Errorf("failed to decrement reference count: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("file content not found")
	}

	return nil
}

func (r *FileContentRepository) Delete(hash string) error {
	query := `DELETE FROM file_contents WHERE content_hash = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query, hash)
	if err != nil {
		r.logger.Error("Failed to delete file content", zap.Error(err))
		return fmt.Errorf("failed to delete file content: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("file content not found")
	}

	return nil
}

func (r *FileContentRepository) GetOrphaned() ([]*domain.FileContent, error) {
	query := `
		SELECT content_hash, file_path, file_size, reference_count, enterprise_id, created_at
		FROM file_contents
		WHERE reference_count = 0`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		r.logger.Error("Failed to get orphaned file contents", zap.Error(err))
		return nil, fmt.Errorf("failed to get orphaned file contents: %w", err)
	}
	defer rows.Close()

	var contents []*domain.FileContent
	for rows.Next() {
		content := &domain.FileContent{}
		err := rows.Scan(
			&content.ContentHash, &content.FilePath, &content.FileSize, &content.ReferenceCount,
			&content.EnterpriseID, &content.CreatedAt)

		if err != nil {
			r.logger.Error("Failed to scan file content", zap.Error(err))
			continue
		}

		contents = append(contents, content)
	}

	return contents, nil
}

// CleanupOrphaned removes file contents with zero references and returns count of cleaned up items
func (r *FileContentRepository) CleanupOrphaned() (int, error) {
	query := `DELETE FROM file_contents WHERE reference_count = 0`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query)
	if err != nil {
		r.logger.Error("Failed to cleanup orphaned file contents", zap.Error(err))
		return 0, fmt.Errorf("failed to cleanup orphaned file contents: %w", err)
	}

	rowsAffected := int(result.RowsAffected())
	if rowsAffected > 0 {
		r.logger.Info("Cleaned up orphaned file contents", zap.Int("count", rowsAffected))
	}

	return rowsAffected, nil
}