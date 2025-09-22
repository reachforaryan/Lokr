package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
)

type FileReferenceRepository struct {
	db     *pgxpool.Pool
	logger *zap.Logger
}

func NewFileReferenceRepository(db *pgxpool.Pool, logger *zap.Logger) *FileReferenceRepository {
	return &FileReferenceRepository{
		db:     db,
		logger: logger,
	}
}

func (r *FileReferenceRepository) Create(reference *domain.FileReference) error {
	query := `
		INSERT INTO file_references (id, folder_id, file_id, user_id, name, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query,
		reference.ID, reference.FolderID, reference.FileID, reference.UserID,
		reference.Name, reference.CreatedAt)

	if err != nil {
		r.logger.Error("Failed to create file reference", zap.Error(err))
		return fmt.Errorf("failed to create file reference: %w", err)
	}

	return nil
}

func (r *FileReferenceRepository) GetByID(id uuid.UUID) (*domain.FileReference, error) {
	query := `
		SELECT id, folder_id, file_id, user_id, name, created_at
		FROM file_references
		WHERE id = $1`

	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, id)

	reference := &domain.FileReference{}
	err := row.Scan(
		&reference.ID, &reference.FolderID, &reference.FileID, &reference.UserID,
		&reference.Name, &reference.CreatedAt,
	)

	if err != nil {
		r.logger.Error("Failed to get file reference by ID", zap.Error(err), zap.String("id", id.String()))
		return nil, fmt.Errorf("failed to get file reference: %w", err)
	}

	return reference, nil
}

func (r *FileReferenceRepository) GetByFolderID(folderID uuid.UUID) ([]*domain.FileReference, error) {
	query := `
		SELECT id, folder_id, file_id, user_id, name, created_at
		FROM file_references
		WHERE folder_id = $1
		ORDER BY created_at DESC`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, folderID)
	if err != nil {
		r.logger.Error("Failed to get file references by folder ID", zap.Error(err), zap.String("folder_id", folderID.String()))
		return nil, fmt.Errorf("failed to get file references: %w", err)
	}
	defer rows.Close()

	var references []*domain.FileReference
	for rows.Next() {
		reference := &domain.FileReference{}
		err := rows.Scan(
			&reference.ID, &reference.FolderID, &reference.FileID, &reference.UserID,
			&reference.Name, &reference.CreatedAt,
		)
		if err != nil {
			r.logger.Error("Failed to scan file reference", zap.Error(err))
			continue
		}
		references = append(references, reference)
	}

	if err = rows.Err(); err != nil {
		r.logger.Error("Error iterating over file references", zap.Error(err))
		return nil, fmt.Errorf("failed to iterate file references: %w", err)
	}

	return references, nil
}

func (r *FileReferenceRepository) GetByFileID(fileID uuid.UUID) ([]*domain.FileReference, error) {
	query := `
		SELECT id, folder_id, file_id, user_id, name, created_at
		FROM file_references
		WHERE file_id = $1
		ORDER BY created_at DESC`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, fileID)
	if err != nil {
		r.logger.Error("Failed to get file references by file ID", zap.Error(err), zap.String("file_id", fileID.String()))
		return nil, fmt.Errorf("failed to get file references: %w", err)
	}
	defer rows.Close()

	var references []*domain.FileReference
	for rows.Next() {
		reference := &domain.FileReference{}
		err := rows.Scan(
			&reference.ID, &reference.FolderID, &reference.FileID, &reference.UserID,
			&reference.Name, &reference.CreatedAt,
		)
		if err != nil {
			r.logger.Error("Failed to scan file reference", zap.Error(err))
			continue
		}
		references = append(references, reference)
	}

	if err = rows.Err(); err != nil {
		r.logger.Error("Error iterating over file references", zap.Error(err))
		return nil, fmt.Errorf("failed to iterate file references: %w", err)
	}

	return references, nil
}

func (r *FileReferenceRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM file_references WHERE id = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		r.logger.Error("Failed to delete file reference", zap.Error(err), zap.String("id", id.String()))
		return fmt.Errorf("failed to delete file reference: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("file reference not found")
	}

	return nil
}

func (r *FileReferenceRepository) DeleteByFileID(fileID uuid.UUID) error {
	query := `DELETE FROM file_references WHERE file_id = $1`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query, fileID)
	if err != nil {
		r.logger.Error("Failed to delete file references by file ID", zap.Error(err), zap.String("file_id", fileID.String()))
		return fmt.Errorf("failed to delete file references: %w", err)
	}

	return nil
}

func (r *FileReferenceRepository) DeleteByFolderID(folderID uuid.UUID) error {
	query := `DELETE FROM file_references WHERE folder_id = $1`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query, folderID)
	if err != nil {
		r.logger.Error("Failed to delete file references by folder ID", zap.Error(err), zap.String("folder_id", folderID.String()))
		return fmt.Errorf("failed to delete file references: %w", err)
	}

	return nil
}