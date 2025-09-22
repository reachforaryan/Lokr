package services

import (
	"context"
	"fmt"
	"lokr-backend/internal/domain"
	"time"

	"github.com/google/uuid"
)

// FileReferenceService handles file reference operations
type FileReferenceService struct {
	referenceRepo domain.FileReferenceRepository
	fileRepo      domain.FileRepository
	folderRepo    domain.FolderRepository
}

// NewFileReferenceService creates a new file reference service
func NewFileReferenceService(
	referenceRepo domain.FileReferenceRepository,
	fileRepo domain.FileRepository,
	folderRepo domain.FolderRepository,
) *FileReferenceService {
	return &FileReferenceService{
		referenceRepo: referenceRepo,
		fileRepo:      fileRepo,
		folderRepo:    folderRepo,
	}
}

// CreateFileReference creates a new file reference in a folder
func (s *FileReferenceService) CreateFileReference(ctx context.Context, userID, fileID, folderID uuid.UUID, customName *string) (*domain.FileReference, error) {
	// Verify the file exists and user has access
	file, err := s.fileRepo.GetByID(fileID)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	// Verify the folder exists and user has access
	folder, err := s.folderRepo.GetByID(folderID)
	if err != nil {
		return nil, fmt.Errorf("folder not found: %w", err)
	}

	// Check if user owns the folder
	if folder.UserID != userID {
		return nil, fmt.Errorf("user does not have access to this folder")
	}

	// Check if reference already exists
	existingRefs, err := s.referenceRepo.GetByFolderID(folderID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing references: %w", err)
	}

	for _, ref := range existingRefs {
		if ref.FileID == fileID {
			return nil, fmt.Errorf("file reference already exists in this folder")
		}
	}

	// Create the file reference
	reference := &domain.FileReference{
		ID:        uuid.New(),
		FolderID:  folderID,
		FileID:    fileID,
		UserID:    userID,
		Name:      customName,
		CreatedAt: time.Now(),
	}

	err = s.referenceRepo.Create(reference)
	if err != nil {
		return nil, fmt.Errorf("failed to create file reference: %w", err)
	}

	// Load relations
	reference.File = file
	reference.Folder = folder

	return reference, nil
}

// GetFolderReferences gets all file references in a folder
func (s *FileReferenceService) GetFolderReferences(ctx context.Context, userID, folderID uuid.UUID) ([]*domain.FileReference, error) {
	// Verify the folder exists and user has access
	folder, err := s.folderRepo.GetByID(folderID)
	if err != nil {
		return nil, fmt.Errorf("folder not found: %w", err)
	}

	if folder.UserID != userID {
		return nil, fmt.Errorf("user does not have access to this folder")
	}

	references, err := s.referenceRepo.GetByFolderID(folderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get folder references: %w", err)
	}

	// Load file information for each reference
	for _, ref := range references {
		file, err := s.fileRepo.GetByID(ref.FileID)
		if err != nil {
			continue // Skip references to deleted files
		}
		ref.File = file
		ref.Folder = folder
	}

	return references, nil
}

// DeleteFileReference deletes a file reference
func (s *FileReferenceService) DeleteFileReference(ctx context.Context, userID, referenceID uuid.UUID) error {
	// Get the reference to verify ownership
	reference, err := s.referenceRepo.GetByID(referenceID)
	if err != nil {
		return fmt.Errorf("reference not found: %w", err)
	}

	if reference.UserID != userID {
		return fmt.Errorf("user does not have access to this reference")
	}

	err = s.referenceRepo.Delete(referenceID)
	if err != nil {
		return fmt.Errorf("failed to delete file reference: %w", err)
	}

	return nil
}

// GetFileReferences gets all references to a specific file
func (s *FileReferenceService) GetFileReferences(ctx context.Context, userID, fileID uuid.UUID) ([]*domain.FileReference, error) {
	// Verify the file exists and user has access
	file, err := s.fileRepo.GetByID(fileID)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	// Only allow access if user owns the file or has shared access
	if file.UserID != userID {
		// TODO: Check if file is shared with user
		return nil, fmt.Errorf("user does not have access to this file")
	}

	references, err := s.referenceRepo.GetByFileID(fileID)
	if err != nil {
		return nil, fmt.Errorf("failed to get file references: %w", err)
	}

	// Load folder information for each reference
	for _, ref := range references {
		if ref.UserID == userID { // Only show user's own references
			folder, err := s.folderRepo.GetByID(ref.FolderID)
			if err == nil {
				ref.Folder = folder
			}
		}
	}

	// Filter to only user's references
	var userReferences []*domain.FileReference
	for _, ref := range references {
		if ref.UserID == userID {
			ref.File = file
			userReferences = append(userReferences, ref)
		}
	}

	return userReferences, nil
}

// CleanupFileReferences removes all references to a deleted file
func (s *FileReferenceService) CleanupFileReferences(ctx context.Context, fileID uuid.UUID) error {
	err := s.referenceRepo.DeleteByFileID(fileID)
	if err != nil {
		return fmt.Errorf("failed to cleanup file references: %w", err)
	}
	return nil
}

// CleanupFolderReferences removes all references in a deleted folder
func (s *FileReferenceService) CleanupFolderReferences(ctx context.Context, folderID uuid.UUID) error {
	err := s.referenceRepo.DeleteByFolderID(folderID)
	if err != nil {
		return fmt.Errorf("failed to cleanup folder references: %w", err)
	}
	return nil
}