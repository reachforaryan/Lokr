package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
)

type FolderRepository struct {
	db     *pgxpool.Pool
	logger *zap.Logger
}

func NewFolderRepository(db *pgxpool.Pool, logger *zap.Logger) *FolderRepository {
	return &FolderRepository{
		db:     db,
		logger: logger,
	}
}

func (r *FolderRepository) GetByID(id uuid.UUID) (*domain.Folder, error) {
	query := `
		SELECT id, user_id, name, parent_id, created_at, updated_at
		FROM folders
		WHERE id = $1`

	folder := &domain.Folder{}
	ctx := context.Background()
	err := r.db.QueryRow(ctx, query, id).Scan(
		&folder.ID, &folder.UserID, &folder.Name, &folder.ParentID,
		&folder.CreatedAt, &folder.UpdatedAt,
	)

	if err != nil {
		r.logger.Error("Failed to get folder by ID", zap.Error(err), zap.String("id", id.String()))
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}

	return folder, nil
}

func (r *FolderRepository) Create(folder *domain.Folder) error {
	query := `
		INSERT INTO folders (id, user_id, name, parent_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query,
		folder.ID, folder.UserID, folder.Name, folder.ParentID,
		folder.CreatedAt, folder.UpdatedAt,
	)

	if err != nil {
		r.logger.Error("Failed to create folder", zap.Error(err))
		return fmt.Errorf("failed to create folder: %w", err)
	}

	return nil
}

func (r *FolderRepository) GetByUserID(userID uuid.UUID) ([]*domain.Folder, error) {
	query := `
		SELECT id, user_id, name, parent_id, created_at, updated_at
		FROM folders
		WHERE user_id = $1
		ORDER BY name ASC`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		r.logger.Error("Failed to get folders by user ID", zap.Error(err))
		return nil, fmt.Errorf("failed to get folders: %w", err)
	}
	defer rows.Close()

	var folders []*domain.Folder
	for rows.Next() {
		folder := &domain.Folder{}
		err := rows.Scan(
			&folder.ID, &folder.UserID, &folder.Name, &folder.ParentID,
			&folder.CreatedAt, &folder.UpdatedAt,
		)
		if err != nil {
			r.logger.Error("Failed to scan folder", zap.Error(err))
			return nil, fmt.Errorf("failed to scan folder: %w", err)
		}
		folders = append(folders, folder)
	}

	return folders, nil
}

func (r *FolderRepository) GetChildren(parentID uuid.UUID) ([]*domain.Folder, error) {
	query := `
		SELECT id, user_id, name, parent_id, created_at, updated_at
		FROM folders
		WHERE parent_id = $1
		ORDER BY name ASC`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, parentID)
	if err != nil {
		r.logger.Error("Failed to get folder children", zap.Error(err))
		return nil, fmt.Errorf("failed to get folder children: %w", err)
	}
	defer rows.Close()

	var folders []*domain.Folder
	for rows.Next() {
		folder := &domain.Folder{}
		err := rows.Scan(
			&folder.ID, &folder.UserID, &folder.Name, &folder.ParentID,
			&folder.CreatedAt, &folder.UpdatedAt,
		)
		if err != nil {
			r.logger.Error("Failed to scan folder", zap.Error(err))
			return nil, fmt.Errorf("failed to scan folder: %w", err)
		}
		folders = append(folders, folder)
	}

	return folders, nil
}

func (r *FolderRepository) Update(folder *domain.Folder) error {
	query := `
		UPDATE folders
		SET name = $2, parent_id = $3, updated_at = $4
		WHERE id = $1`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query,
		folder.ID, folder.Name, folder.ParentID, folder.UpdatedAt,
	)

	if err != nil {
		r.logger.Error("Failed to update folder", zap.Error(err))
		return fmt.Errorf("failed to update folder: %w", err)
	}

	return nil
}

func (r *FolderRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM folders WHERE id = $1`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		r.logger.Error("Failed to delete folder", zap.Error(err))
		return fmt.Errorf("failed to delete folder: %w", err)
	}

	return nil
}