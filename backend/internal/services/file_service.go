package services

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
	"lokr-backend/internal/storage"
)

// FileService handles file operations with deduplication
type FileService struct {
	fileRepo        domain.FileRepository
	fileContentRepo domain.FileContentRepository
	userRepo        domain.UserRepository
	enterpriseRepo  domain.EnterpriseRepository
	storageService  storage.StorageService
	presignedService storage.PresignedURLService
	logger          *zap.Logger
}

// NewFileService creates a new file service
func NewFileService(
	fileRepo domain.FileRepository,
	fileContentRepo domain.FileContentRepository,
	userRepo domain.UserRepository,
	enterpriseRepo domain.EnterpriseRepository,
	storageService storage.StorageService,
	presignedService storage.PresignedURLService,
	logger *zap.Logger,
) *FileService {
	return &FileService{
		fileRepo:         fileRepo,
		fileContentRepo:  fileContentRepo,
		userRepo:         userRepo,
		enterpriseRepo:   enterpriseRepo,
		storageService:   storageService,
		presignedService: presignedService,
		logger:           logger,
	}
}

// UploadFile handles file upload with deduplication
func (s *FileService) UploadFile(ctx context.Context, request *domain.FileUploadRequest) (*domain.File, error) {
	s.logger.Info("Starting file upload",
		zap.String("filename", request.Filename),
		zap.String("user_id", request.UserID.String()),
		zap.Int64("size", request.FileSize))

	// Get user information
	user, err := s.userRepo.GetByID(request.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check user storage quota
	if user.StorageUsed+request.FileSize > user.StorageQuota {
		return nil, fmt.Errorf("storage quota exceeded")
	}

	// Check enterprise storage quota if user belongs to an enterprise
	var enterprise *domain.Enterprise
	if user.EnterpriseID != nil {
		enterprise, err = s.enterpriseRepo.GetByID(*user.EnterpriseID)
		if err != nil {
			return nil, fmt.Errorf("failed to get enterprise: %w", err)
		}

		if !enterprise.CanUseStorage(request.FileSize) {
			return nil, fmt.Errorf("enterprise storage quota exceeded")
		}
	}

	// Calculate content hash (SHA-256)
	contentHash := s.calculateSHA256(request.Content)
	s.logger.Info("Calculated content hash", zap.String("hash", contentHash))

	// Check if content already exists (deduplication)
	existingContent, err := s.fileContentRepo.GetByHash(contentHash)
	if err != nil && !isNotFoundError(err) {
		return nil, fmt.Errorf("failed to check existing content: %w", err)
	}

	var storagePath string
	var shouldStore bool = existingContent == nil

	if shouldStore {
		// Generate storage path based on enterprise/user structure
		if enterprise != nil {
			storagePath = s.generateEnterprisePath(enterprise.Slug, user.ID, contentHash)
		} else {
			storagePath = s.generatePersonalPath(user.ID, contentHash)
		}

		// Store the file content
		contentReader := bytes.NewReader(request.Content)
		err = s.storageService.Store(ctx, storagePath, contentReader, request.MimeType)
		if err != nil {
			return nil, fmt.Errorf("failed to store file content: %w", err)
		}

		// Create file content record
		fileContent := &domain.FileContent{
			ContentHash:    contentHash,
			FilePath:       storagePath,
			FileSize:       request.FileSize,
			ReferenceCount: 1,
			EnterpriseID:   user.EnterpriseID,
			CreatedAt:      time.Now(),
		}

		err = s.fileContentRepo.Create(fileContent)
		if err != nil {
			// Clean up storage if database operation fails
			s.storageService.Delete(ctx, storagePath)
			return nil, fmt.Errorf("failed to create file content record: %w", err)
		}
	} else {
		// Content already exists, increment reference count
		err = s.fileContentRepo.IncrementReference(contentHash)
		if err != nil {
			return nil, fmt.Errorf("failed to increment reference count: %w", err)
		}
		storagePath = existingContent.FilePath
	}

	// Create file record
	file := &domain.File{
		ID:           uuid.New(),
		UserID:       request.UserID,
		FolderID:     request.FolderID,
		Filename:     s.generateUniqueFilename(request.Filename),
		OriginalName: request.Filename,
		MimeType:     request.MimeType,
		FileSize:     request.FileSize,
		ContentHash:  contentHash,
		Description:  request.Description,
		Tags:         request.Tags,
		Visibility:   request.Visibility,
		UploadDate:   time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Generate share token if file is public
	if file.Visibility == domain.VisibilityPublic {
		shareToken := uuid.New().String()
		file.ShareToken = &shareToken
	}

	err = s.fileRepo.Create(file)
	if err != nil {
		// Clean up: decrement reference count or delete content
		if shouldStore {
			s.fileContentRepo.Delete(contentHash)
			s.storageService.Delete(ctx, storagePath)
		} else {
			s.fileContentRepo.DecrementReference(contentHash)
		}
		return nil, fmt.Errorf("failed to create file record: %w", err)
	}

	// Update user storage usage
	err = s.userRepo.UpdateStorageUsed(user.ID, user.StorageUsed+request.FileSize)
	if err != nil {
		s.logger.Error("Failed to update user storage usage", zap.Error(err))
		// Don't fail the upload for this, but log the error
	}

	s.logger.Info("File upload completed successfully",
		zap.String("file_id", file.ID.String()),
		zap.String("content_hash", contentHash),
		zap.Bool("deduplicated", !shouldStore))

	return file, nil
}

// DownloadFile handles file download
func (s *FileService) DownloadFile(ctx context.Context, fileID uuid.UUID, userID uuid.UUID) (io.ReadCloser, *domain.File, error) {
	// Get file information
	file, err := s.fileRepo.GetByID(fileID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get file: %w", err)
	}

	// Check permissions
	if !s.canUserAccessFile(file, userID) {
		return nil, nil, fmt.Errorf("access denied")
	}

	// Get file content information
	content, err := s.fileContentRepo.GetByHash(file.ContentHash)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get file content: %w", err)
	}

	// Get file from storage
	reader, err := s.storageService.Get(ctx, content.FilePath)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get file from storage: %w", err)
	}

	// Increment download count
	go func() {
		if err := s.fileRepo.IncrementDownloadCount(fileID); err != nil {
			s.logger.Error("Failed to increment download count", zap.Error(err))
		}
	}()

	return reader, file, nil
}

// DeleteFile handles file deletion with deduplication cleanup
func (s *FileService) DeleteFile(ctx context.Context, fileID uuid.UUID, userID uuid.UUID) error {
	// Get file information
	file, err := s.fileRepo.GetByID(fileID)
	if err != nil {
		return fmt.Errorf("failed to get file: %w", err)
	}

	// Check ownership
	if file.UserID != userID {
		return fmt.Errorf("access denied")
	}

	// Delete file record
	err = s.fileRepo.Delete(fileID)
	if err != nil {
		return fmt.Errorf("failed to delete file record: %w", err)
	}

	// Decrement reference count
	err = s.fileContentRepo.DecrementReference(file.ContentHash)
	if err != nil {
		s.logger.Error("Failed to decrement reference count", zap.Error(err))
		return nil // Don't fail the deletion for this
	}

	// Check if content should be physically deleted
	content, err := s.fileContentRepo.GetByHash(file.ContentHash)
	if err == nil && content.ReferenceCount == 0 {
		// No more references, delete physical file and content record
		if err := s.storageService.Delete(ctx, content.FilePath); err != nil {
			s.logger.Error("Failed to delete file from storage", zap.Error(err))
		}

		if err := s.fileContentRepo.Delete(file.ContentHash); err != nil {
			s.logger.Error("Failed to delete content record", zap.Error(err))
		}
	}

	// Update user storage usage
	user, err := s.userRepo.GetByID(userID)
	if err == nil {
		newStorageUsed := user.StorageUsed - file.FileSize
		if newStorageUsed < 0 {
			newStorageUsed = 0
		}
		if err := s.userRepo.UpdateStorageUsed(userID, newStorageUsed); err != nil {
			s.logger.Error("Failed to update user storage usage", zap.Error(err))
		}
	}

	return nil
}

// GetPresignedDownloadURL generates a presigned URL for file download
func (s *FileService) GetPresignedDownloadURL(ctx context.Context, fileID uuid.UUID, userID uuid.UUID, expiration time.Duration) (string, error) {
	if s.presignedService == nil {
		return "", fmt.Errorf("presigned URLs not supported by storage backend")
	}

	// Get file information and check permissions
	file, err := s.fileRepo.GetByID(fileID)
	if err != nil {
		return "", fmt.Errorf("failed to get file: %w", err)
	}

	if !s.canUserAccessFile(file, userID) {
		return "", fmt.Errorf("access denied")
	}

	// Get storage path
	content, err := s.fileContentRepo.GetByHash(file.ContentHash)
	if err != nil {
		return "", fmt.Errorf("failed to get file content: %w", err)
	}

	// Generate presigned URL
	url, err := s.presignedService.GeneratePresignedURL(ctx, content.FilePath, expiration)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return url, nil
}

// ProcessMultipartUpload handles multipart file upload
func (s *FileService) ProcessMultipartUpload(ctx context.Context, userID uuid.UUID, fileHeader *multipart.FileHeader, folderID *uuid.UUID, description *string, tags []string, visibility domain.FileVisibility) (*domain.File, error) {
	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	// Read file content
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file content: %w", err)
	}

	// Determine MIME type
	mimeType := fileHeader.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = s.detectMimeType(fileHeader.Filename, content)
	}

	// Create upload request
	request := &domain.FileUploadRequest{
		UserID:      userID,
		FolderID:    folderID,
		Filename:    fileHeader.Filename,
		MimeType:    mimeType,
		FileSize:    fileHeader.Size,
		Content:     content,
		Description: description,
		Tags:        tags,
		Visibility:  visibility,
	}

	return s.UploadFile(ctx, request)
}

// calculateSHA256 calculates SHA-256 hash of content
func (s *FileService) calculateSHA256(content []byte) string {
	hash := sha256.Sum256(content)
	return fmt.Sprintf("%x", hash)
}

// generateEnterprisePath generates storage path for enterprise files
func (s *FileService) generateEnterprisePath(enterpriseSlug string, userID uuid.UUID, contentHash string) string {
	return filepath.Join(enterpriseSlug, userID.String(), contentHash)
}

// generatePersonalPath generates storage path for personal files
func (s *FileService) generatePersonalPath(userID uuid.UUID, contentHash string) string {
	return filepath.Join("personal", userID.String(), contentHash)
}

// generateUniqueFilename generates a unique filename to prevent conflicts
func (s *FileService) generateUniqueFilename(originalFilename string) string {
	ext := filepath.Ext(originalFilename)
	name := strings.TrimSuffix(originalFilename, ext)
	timestamp := time.Now().Unix()
	return fmt.Sprintf("%s_%d%s", name, timestamp, ext)
}

// canUserAccessFile checks if a user can access a file
func (s *FileService) canUserAccessFile(file *domain.File, userID uuid.UUID) bool {
	// Owner can always access
	if file.UserID == userID {
		return true
	}

	// Public files can be accessed by anyone
	if file.Visibility == domain.VisibilityPublic {
		return true
	}

	// For shared files, we would need to check the file_shares table
	// This would be implemented based on the sharing logic
	return false
}

// detectMimeType attempts to detect MIME type from filename and content
func (s *FileService) detectMimeType(filename string, content []byte) string {
	// Simple MIME type detection based on file extension
	ext := strings.ToLower(filepath.Ext(filename))

	mimeTypes := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".pdf":  "application/pdf",
		".txt":  "text/plain",
		".json": "application/json",
		".xml":  "application/xml",
		".zip":  "application/zip",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".mp4":  "video/mp4",
		".mp3":  "audio/mpeg",
	}

	if mimeType, found := mimeTypes[ext]; found {
		return mimeType
	}

	return "application/octet-stream"
}

// isNotFoundError checks if an error represents a "not found" condition
func isNotFoundError(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "not found") ||
		   strings.Contains(strings.ToLower(err.Error()), "no rows")
}