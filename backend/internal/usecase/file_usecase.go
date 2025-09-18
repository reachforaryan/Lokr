package usecase

import (
	"context"
	"fmt"
	"mime"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/h2non/filetype"

	"lokr-backend/internal/domain"
	"lokr-backend/pkg/hash"
	"lokr-backend/pkg/storage"
)

// FileUsecase handles file-related business logic
type FileUsecase struct {
	fileRepo        domain.FileRepository
	fileContentRepo domain.FileContentRepository
	userRepo        domain.UserRepository
	storage         storage.StorageProvider
}

// NewFileUsecase creates a new file use case
func NewFileUsecase(
	fileRepo domain.FileRepository,
	fileContentRepo domain.FileContentRepository,
	userRepo domain.UserRepository,
	storage storage.StorageProvider,
) *FileUsecase {
	return &FileUsecase{
		fileRepo:        fileRepo,
		fileContentRepo: fileContentRepo,
		userRepo:        userRepo,
		storage:         storage,
	}
}

// UploadFile handles file upload with deduplication
func (uc *FileUsecase) UploadFile(ctx context.Context, req *domain.FileUploadRequest) (*domain.File, error) {
	// Validate file size
	if req.FileSize <= 0 {
		return nil, fmt.Errorf("invalid file size")
	}

	// Validate MIME type against file content
	if !uc.validateMimeType(req.Content, req.MimeType) {
		return nil, fmt.Errorf("mime type mismatch: declared %s does not match file content", req.MimeType)
	}

	// Calculate content hash
	contentHash := hash.SHA256Hash(req.Content)

	// Check if content already exists (deduplication)
	existingContent, err := uc.fileContentRepo.GetByHash(contentHash)
	if err != nil && err.Error() != "not found" {
		return nil, fmt.Errorf("failed to check existing content: %w", err)
	}

	// If content doesn't exist, store it
	if existingContent == nil {
		// Generate storage key
		storageKey := uc.generateStorageKey(contentHash, req.Filename)

		// Store file content
		if err := uc.storage.Store(ctx, storageKey, req.Content); err != nil {
			return nil, fmt.Errorf("failed to store file: %w", err)
		}

		// Create file content record
		fileContent := &domain.FileContent{
			ContentHash:    contentHash,
			FilePath:       storageKey,
			FileSize:       req.FileSize,
			ReferenceCount: 1,
			CreatedAt:      time.Now(),
		}

		if err := uc.fileContentRepo.Create(fileContent); err != nil {
			// Clean up stored file if database operation fails
			_ = uc.storage.Delete(ctx, storageKey)
			return nil, fmt.Errorf("failed to create file content record: %w", err)
		}
	} else {
		// Increment reference count for existing content
		if err := uc.fileContentRepo.IncrementReference(contentHash); err != nil {
			return nil, fmt.Errorf("failed to increment reference count: %w", err)
		}
	}

	// Create file record
	file := &domain.File{
		ID:            uuid.New(),
		UserID:        req.UserID,
		FolderID:      req.FolderID,
		Filename:      req.Filename,
		OriginalName:  req.Filename,
		MimeType:      req.MimeType,
		FileSize:      req.FileSize,
		ContentHash:   contentHash,
		Description:   req.Description,
		Tags:          req.Tags,
		Visibility:    req.Visibility,
		DownloadCount: 0,
		UploadDate:    time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := uc.fileRepo.Create(file); err != nil {
		// Decrement reference count if file creation fails
		_ = uc.fileContentRepo.DecrementReference(contentHash)
		return nil, fmt.Errorf("failed to create file record: %w", err)
	}

	// Update user storage usage
	if err := uc.updateUserStorageUsage(ctx, req.UserID, req.FileSize); err != nil {
		// Log error but don't fail the upload
		// In production, you might want to queue this for retry
		fmt.Printf("Warning: failed to update user storage usage: %v\n", err)
	}

	return file, nil
}

// DeleteFile handles file deletion with reference counting
func (uc *FileUsecase) DeleteFile(ctx context.Context, fileID, userID uuid.UUID) error {
	// Get file record
	file, err := uc.fileRepo.GetByID(fileID)
	if err != nil {
		return fmt.Errorf("file not found: %w", err)
	}

	// Check ownership
	if file.UserID != userID {
		return fmt.Errorf("unauthorized: user does not own this file")
	}

	// Delete file record
	if err := uc.fileRepo.Delete(fileID); err != nil {
		return fmt.Errorf("failed to delete file record: %w", err)
	}

	// Decrement reference count
	if err := uc.fileContentRepo.DecrementReference(file.ContentHash); err != nil {
		return fmt.Errorf("failed to decrement reference count: %w", err)
	}

	// Check if content should be deleted
	content, err := uc.fileContentRepo.GetByHash(file.ContentHash)
	if err != nil {
		return fmt.Errorf("failed to get file content: %w", err)
	}

	// If no more references, delete physical file
	if content.ReferenceCount <= 0 {
		if err := uc.storage.Delete(ctx, content.FilePath); err != nil {
			// Log error but continue - we don't want to fail deletion over storage cleanup
			fmt.Printf("Warning: failed to delete file from storage: %v\n", err)
		}

		if err := uc.fileContentRepo.Delete(file.ContentHash); err != nil {
			fmt.Printf("Warning: failed to delete content record: %v\n", err)
		}
	}

	// Update user storage usage
	if err := uc.updateUserStorageUsage(ctx, userID, -file.FileSize); err != nil {
		fmt.Printf("Warning: failed to update user storage usage: %v\n", err)
	}

	return nil
}

// GetFile retrieves file with access control
func (uc *FileUsecase) GetFile(ctx context.Context, fileID uuid.UUID, userID *uuid.UUID) (*domain.File, error) {
	file, err := uc.fileRepo.GetByID(fileID)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	// Check access permissions
	if !uc.canAccessFile(file, userID) {
		return nil, fmt.Errorf("access denied")
	}

	return file, nil
}

// SearchFiles performs file search with filters
func (uc *FileUsecase) SearchFiles(ctx context.Context, req *domain.FileSearchRequest) ([]*domain.File, int, error) {
	return uc.fileRepo.Search(req)
}

// validateMimeType checks if declared MIME type matches file content
func (uc *FileUsecase) validateMimeType(content []byte, declaredMimeType string) bool {
	// Detect actual file type
	detectedType, err := filetype.Match(content)
	if err != nil {
		return false
	}

	// If we can't detect the type, allow text files and others
	if detectedType == filetype.Unknown {
		// Allow common text types and application types that are hard to detect
		switch declaredMimeType {
		case "text/plain", "text/csv", "application/json", "application/xml":
			return true
		}
		return false
	}

	// Get detected MIME type
	detectedMimeType := detectedType.MIME.Value

	// Direct match
	if declaredMimeType == detectedMimeType {
		return true
	}

	// Handle common aliases and variations
	return uc.areMimeTypesCompatible(declaredMimeType, detectedMimeType)
}

// areMimeTypesCompatible checks if two MIME types are compatible
func (uc *FileUsecase) areMimeTypesCompatible(declared, detected string) bool {
	// Handle common aliases
	aliases := map[string][]string{
		"application/pdf": {"application/pdf"},
		"image/jpeg":      {"image/jpeg", "image/jpg"},
		"image/png":       {"image/png"},
		"text/plain":      {"text/plain", "text/x-plain"},
	}

	if compatibleTypes, exists := aliases[declared]; exists {
		for _, compatibleType := range compatibleTypes {
			if detected == compatibleType {
				return true
			}
		}
	}

	return false
}

// generateStorageKey creates a unique storage key for file content
func (uc *FileUsecase) generateStorageKey(contentHash, filename string) string {
	ext := filepath.Ext(filename)
	// Use first 2 chars of hash for directory partitioning
	dir1 := contentHash[:2]
	dir2 := contentHash[2:4]
	return fmt.Sprintf("%s/%s/%s%s", dir1, dir2, contentHash, ext)
}

// canAccessFile checks if user can access the file
func (uc *FileUsecase) canAccessFile(file *domain.File, userID *uuid.UUID) bool {
	// Public files are accessible to everyone
	if file.Visibility == domain.VisibilityPublic {
		return true
	}

	// For private files, user must be authenticated
	if userID == nil {
		return false
	}

	// Owner can always access
	if file.UserID == *userID {
		return true
	}

	// TODO: Check if file is shared with the user
	// This would require checking the file_shares table
	return false
}

// updateUserStorageUsage updates user's storage usage
func (uc *FileUsecase) updateUserStorageUsage(ctx context.Context, userID uuid.UUID, sizeDelta int64) error {
	user, err := uc.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	newStorageUsed := user.StorageUsed + sizeDelta
	if newStorageUsed < 0 {
		newStorageUsed = 0
	}

	return uc.userRepo.UpdateStorageUsed(userID, newStorageUsed)
}