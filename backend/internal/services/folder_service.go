package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"lokr-backend/internal/domain"
)

type FolderService struct {
	db *pgxpool.Pool
}

func NewFolderService(db *pgxpool.Pool) *FolderService {
	return &FolderService{db: db}
}

// Create creates a new folder
func (s *FolderService) CreateFolder(ctx context.Context, userID uuid.UUID, name string, parentID *uuid.UUID) (*domain.Folder, error) {
	// Validate folder name
	if name == "" {
		return nil, fmt.Errorf("folder name cannot be empty")
	}

	// Check if folder with same name already exists in the same parent
	var existingCount int
	var checkQuery string
	var checkArgs []interface{}

	if parentID == nil {
		// Root level folder
		checkQuery = "SELECT COUNT(*) FROM folders WHERE user_id = $1 AND parent_id IS NULL AND name = $2"
		checkArgs = []interface{}{userID, name}
	} else {
		// Subfolder
		checkQuery = "SELECT COUNT(*) FROM folders WHERE user_id = $1 AND parent_id = $2 AND name = $3"
		checkArgs = []interface{}{userID, *parentID, name}
	}

	err := s.db.QueryRow(ctx, checkQuery, checkArgs...).Scan(&existingCount)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing folder: %w", err)
	}

	if existingCount > 0 {
		return nil, fmt.Errorf("folder with name '%s' already exists", name)
	}

	// Create the folder
	folder := &domain.Folder{
		ID:        uuid.New(),
		UserID:    userID,
		Name:      name,
		ParentID:  parentID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	query := `
		INSERT INTO folders (id, user_id, name, parent_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err = s.db.Exec(ctx, query, folder.ID, folder.UserID, folder.Name, folder.ParentID, folder.CreatedAt, folder.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create folder: %w", err)
	}

	return folder, nil
}

// GetFolderByID gets a folder by ID, ensuring user ownership
func (s *FolderService) GetFolderByID(ctx context.Context, folderID, userID uuid.UUID) (*domain.Folder, error) {
	query := `
		SELECT id, user_id, name, parent_id, created_at, updated_at
		FROM folders
		WHERE id = $1 AND user_id = $2`

	var folder domain.Folder
	err := s.db.QueryRow(ctx, query, folderID, userID).Scan(
		&folder.ID, &folder.UserID, &folder.Name, &folder.ParentID, &folder.CreatedAt, &folder.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("folder not found: %w", err)
	}

	return &folder, nil
}

// GetUserFolders gets all folders for a user with hierarchical structure
func (s *FolderService) GetUserFolders(ctx context.Context, userID uuid.UUID) ([]*domain.Folder, error) {
	query := `
		SELECT id, user_id, name, parent_id, created_at, updated_at
		FROM folders
		WHERE user_id = $1
		ORDER BY parent_id NULLS FIRST, name ASC`

	rows, err := s.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user folders: %w", err)
	}
	defer rows.Close()

	var folders []*domain.Folder
	for rows.Next() {
		var folder domain.Folder
		err := rows.Scan(
			&folder.ID, &folder.UserID, &folder.Name, &folder.ParentID, &folder.CreatedAt, &folder.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan folder: %w", err)
		}
		folders = append(folders, &folder)
	}

	return folders, nil
}

// GetFolderTree gets folders organized as a tree structure
func (s *FolderService) GetFolderTree(ctx context.Context, userID uuid.UUID) ([]*domain.Folder, error) {
	folders, err := s.GetUserFolders(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Build tree structure
	folderMap := make(map[uuid.UUID]*domain.Folder)
	var rootFolders []*domain.Folder

	// First pass: create folder map
	for _, folder := range folders {
		folderMap[folder.ID] = folder
		folder.Children = []*domain.Folder{} // Initialize children slice
	}

	// Second pass: build tree relationships
	for _, folder := range folders {
		if folder.ParentID == nil {
			// Root folder
			rootFolders = append(rootFolders, folder)
		} else {
			// Child folder
			if parent, exists := folderMap[*folder.ParentID]; exists {
				parent.Children = append(parent.Children, folder)
				folder.Parent = parent
			}
		}
	}

	return rootFolders, nil
}

// RenameFolder renames a folder
func (s *FolderService) RenameFolder(ctx context.Context, folderID, userID uuid.UUID, newName string) (*domain.Folder, error) {
	if newName == "" {
		return nil, fmt.Errorf("folder name cannot be empty")
	}

	// Get the folder first to ensure user ownership and get parent_id
	folder, err := s.GetFolderByID(ctx, folderID, userID)
	if err != nil {
		return nil, err
	}

	// Check if new name conflicts with existing folder in same parent
	var existingCount int
	var checkQuery string
	var checkArgs []interface{}

	if folder.ParentID == nil {
		checkQuery = "SELECT COUNT(*) FROM folders WHERE user_id = $1 AND parent_id IS NULL AND name = $2 AND id != $3"
		checkArgs = []interface{}{userID, newName, folderID}
	} else {
		checkQuery = "SELECT COUNT(*) FROM folders WHERE user_id = $1 AND parent_id = $2 AND name = $3 AND id != $4"
		checkArgs = []interface{}{userID, *folder.ParentID, newName, folderID}
	}

	err = s.db.QueryRow(ctx, checkQuery, checkArgs...).Scan(&existingCount)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing folder: %w", err)
	}

	if existingCount > 0 {
		return nil, fmt.Errorf("folder with name '%s' already exists", newName)
	}

	// Update the folder name
	query := `
		UPDATE folders
		SET name = $1, updated_at = $2
		WHERE id = $3 AND user_id = $4`

	_, err = s.db.Exec(ctx, query, newName, time.Now(), folderID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to rename folder: %w", err)
	}

	// Return updated folder
	folder.Name = newName
	folder.UpdatedAt = time.Now()

	return folder, nil
}

// MoveFolder moves a folder to a new parent
func (s *FolderService) MoveFolder(ctx context.Context, folderID, userID uuid.UUID, newParentID *uuid.UUID) (*domain.Folder, error) {
	// Get the folder to ensure user ownership
	folder, err := s.GetFolderByID(ctx, folderID, userID)
	if err != nil {
		return nil, err
	}

	// Prevent moving folder into itself or its descendants
	if newParentID != nil && *newParentID == folderID {
		return nil, fmt.Errorf("cannot move folder into itself")
	}

	// Check for circular reference by ensuring new parent is not a descendant
	if newParentID != nil {
		isDescendant, err := s.isDescendant(ctx, folderID, *newParentID)
		if err != nil {
			return nil, err
		}
		if isDescendant {
			return nil, fmt.Errorf("cannot move folder into its own descendant")
		}
	}

	// Check if folder with same name already exists in new parent
	var existingCount int
	var checkQuery string
	var checkArgs []interface{}

	if newParentID == nil {
		checkQuery = "SELECT COUNT(*) FROM folders WHERE user_id = $1 AND parent_id IS NULL AND name = $2 AND id != $3"
		checkArgs = []interface{}{userID, folder.Name, folderID}
	} else {
		checkQuery = "SELECT COUNT(*) FROM folders WHERE user_id = $1 AND parent_id = $2 AND name = $3 AND id != $4"
		checkArgs = []interface{}{userID, *newParentID, folder.Name, folderID}
	}

	err = s.db.QueryRow(ctx, checkQuery, checkArgs...).Scan(&existingCount)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing folder: %w", err)
	}

	if existingCount > 0 {
		return nil, fmt.Errorf("folder with name '%s' already exists in destination", folder.Name)
	}

	// Update the folder's parent
	query := `
		UPDATE folders
		SET parent_id = $1, updated_at = $2
		WHERE id = $3 AND user_id = $4`

	_, err = s.db.Exec(ctx, query, newParentID, time.Now(), folderID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to move folder: %w", err)
	}

	// Return updated folder
	folder.ParentID = newParentID
	folder.UpdatedAt = time.Now()

	return folder, nil
}

// DeleteFolder deletes a folder and optionally its contents
func (s *FolderService) DeleteFolder(ctx context.Context, folderID, userID uuid.UUID, force bool) error {
	// Get the folder to ensure user ownership
	_, err := s.GetFolderByID(ctx, folderID, userID)
	if err != nil {
		return err
	}

	// Check if folder has children or files
	if !force {
		var childCount, fileCount int

		err = s.db.QueryRow(ctx, "SELECT COUNT(*) FROM folders WHERE parent_id = $1", folderID).Scan(&childCount)
		if err != nil {
			return fmt.Errorf("failed to check child folders: %w", err)
		}

		err = s.db.QueryRow(ctx, "SELECT COUNT(*) FROM files WHERE folder_id = $1", folderID).Scan(&fileCount)
		if err != nil {
			return fmt.Errorf("failed to check folder files: %w", err)
		}

		if childCount > 0 || fileCount > 0 {
			return fmt.Errorf("folder is not empty, use force=true to delete non-empty folder")
		}
	}

	// Delete the folder (CASCADE will handle children and set files.folder_id to NULL)
	query := `DELETE FROM folders WHERE id = $1 AND user_id = $2`

	result, err := s.db.Exec(ctx, query, folderID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete folder: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("folder not found")
	}

	return nil
}

// GetFolderContents gets files and subfolders within a folder
func (s *FolderService) GetFolderContents(ctx context.Context, folderID *uuid.UUID, userID uuid.UUID) (folders []*domain.Folder, files []*domain.File, err error) {
	// Get subfolders
	var folderQuery string
	var folderArgs []interface{}

	if folderID == nil {
		// Root level
		folderQuery = "SELECT id, user_id, name, parent_id, created_at, updated_at FROM folders WHERE user_id = $1 AND parent_id IS NULL ORDER BY name ASC"
		folderArgs = []interface{}{userID}
	} else {
		// Specific folder
		folderQuery = "SELECT id, user_id, name, parent_id, created_at, updated_at FROM folders WHERE user_id = $1 AND parent_id = $2 ORDER BY name ASC"
		folderArgs = []interface{}{userID, *folderID}
	}

	rows, err := s.db.Query(ctx, folderQuery, folderArgs...)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get folders: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var folder domain.Folder
		err := rows.Scan(&folder.ID, &folder.UserID, &folder.Name, &folder.ParentID, &folder.CreatedAt, &folder.UpdatedAt)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to scan folder: %w", err)
		}
		folders = append(folders, &folder)
	}

	// Get files
	var fileQuery string
	var fileArgs []interface{}

	if folderID == nil {
		// Root level files
		fileQuery = `
			SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
				   content_hash, description, tags, visibility, share_token, download_count, upload_date, updated_at
			FROM files
			WHERE user_id = $1 AND folder_id IS NULL
			ORDER BY upload_date DESC`
		fileArgs = []interface{}{userID}
	} else {
		// Files in specific folder
		fileQuery = `
			SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
				   content_hash, description, tags, visibility, share_token, download_count, upload_date, updated_at
			FROM files
			WHERE user_id = $1 AND folder_id = $2
			ORDER BY upload_date DESC`
		fileArgs = []interface{}{userID, *folderID}
	}

	fileRows, err := s.db.Query(ctx, fileQuery, fileArgs...)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get files: %w", err)
	}
	defer fileRows.Close()

	for fileRows.Next() {
		var file domain.File
		err := fileRows.Scan(
			&file.ID, &file.UserID, &file.FolderID, &file.Filename, &file.OriginalName,
			&file.MimeType, &file.FileSize, &file.ContentHash, &file.Description,
			&file.Tags, &file.Visibility, &file.ShareToken, &file.DownloadCount,
			&file.UploadDate, &file.UpdatedAt,
		)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to scan file: %w", err)
		}
		files = append(files, &file)
	}

	return folders, files, nil
}

// isDescendant checks if targetID is a descendant of ancestorID
func (s *FolderService) isDescendant(ctx context.Context, ancestorID, targetID uuid.UUID) (bool, error) {
	query := `
		WITH RECURSIVE folder_tree AS (
			-- Base case: direct children of ancestor
			SELECT id, parent_id
			FROM folders
			WHERE parent_id = $1

			UNION ALL

			-- Recursive case: children of children
			SELECT f.id, f.parent_id
			FROM folders f
			INNER JOIN folder_tree ft ON f.parent_id = ft.id
		)
		SELECT EXISTS(SELECT 1 FROM folder_tree WHERE id = $2)`

	var exists bool
	err := s.db.QueryRow(ctx, query, ancestorID, targetID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check descendant relationship: %w", err)
	}

	return exists, nil
}