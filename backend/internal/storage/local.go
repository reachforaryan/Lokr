package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// LocalStorage implements StorageService for local file system
type LocalStorage struct {
	basePath string
	logger   *zap.Logger
}

// NewLocalStorage creates a new local storage service
func NewLocalStorage(basePath string, logger *zap.Logger) (*LocalStorage, error) {
	// Ensure the base directory exists
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create base directory: %w", err)
	}

	return &LocalStorage{
		basePath: basePath,
		logger:   logger,
	}, nil
}

// GenerateLocalPath creates a local file path based on enterprise and user
// Path structure: basePath/enterprise-slug/user-id/content-hash
func (l *LocalStorage) GenerateLocalPath(enterpriseSlug string, userID uuid.UUID, contentHash string) string {
	return filepath.Join(l.basePath, enterpriseSlug, userID.String(), contentHash)
}

// GeneratePersonalLocalPath creates a local file path for personal (non-enterprise) users
// Path structure: basePath/personal/user-id/content-hash
func (l *LocalStorage) GeneratePersonalLocalPath(userID uuid.UUID, contentHash string) string {
	return filepath.Join(l.basePath, "personal", userID.String(), contentHash)
}

// Store stores a file locally
func (l *LocalStorage) Store(ctx context.Context, path string, content io.Reader, mimeType string) error {
	fullPath := filepath.Join(l.basePath, path)

	l.logger.Info("Storing file locally",
		zap.String("path", fullPath),
		zap.String("mime_type", mimeType))

	// Ensure directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Create the file
	file, err := os.Create(fullPath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// Copy content to file
	size, err := io.Copy(file, content)
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	l.logger.Info("Successfully stored file locally",
		zap.String("path", fullPath),
		zap.Int64("size", size))

	return nil
}

// Get retrieves a file from local storage
func (l *LocalStorage) Get(ctx context.Context, path string) (io.ReadCloser, error) {
	fullPath := filepath.Join(l.basePath, path)

	l.logger.Info("Retrieving file from local storage",
		zap.String("path", fullPath))

	file, err := os.Open(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("file not found: %w", err)
		}
		return nil, fmt.Errorf("failed to open file: %w", err)
	}

	l.logger.Info("Successfully retrieved file from local storage",
		zap.String("path", fullPath))

	return file, nil
}

// Delete removes a file from local storage
func (l *LocalStorage) Delete(ctx context.Context, path string) error {
	fullPath := filepath.Join(l.basePath, path)

	l.logger.Info("Deleting file from local storage",
		zap.String("path", fullPath))

	err := os.Remove(fullPath)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	l.logger.Info("Successfully deleted file from local storage",
		zap.String("path", fullPath))

	return nil
}

// Exists checks if a file exists in local storage
func (l *LocalStorage) Exists(ctx context.Context, path string) (bool, error) {
	fullPath := filepath.Join(l.basePath, path)

	_, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}

// GetFileInfo retrieves metadata about a local file
func (l *LocalStorage) GetFileInfo(ctx context.Context, path string) (*FileInfo, error) {
	fullPath := filepath.Join(l.basePath, path)

	stat, err := os.Stat(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	// Try to determine MIME type from file extension
	mimeType := determineMimeType(fullPath)

	uploadTime := stat.ModTime()
	fileInfo := &FileInfo{
		Path:         path,
		Size:         stat.Size(),
		MimeType:     mimeType,
		LastModified: stat.ModTime(),
		UploadedAt:   &uploadTime, // Use modification time as upload time
		ContentHash:  extractContentHashFromPath(path),
	}

	return fileInfo, nil
}

// ListFiles lists files in a specific directory
func (l *LocalStorage) ListFiles(ctx context.Context, prefix string) ([]*FileInfo, error) {
	fullPrefix := filepath.Join(l.basePath, prefix)

	l.logger.Info("Listing files in local storage",
		zap.String("prefix", fullPrefix))

	var files []*FileInfo

	err := filepath.Walk(fullPrefix, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Convert absolute path back to relative path
		relPath, err := filepath.Rel(l.basePath, path)
		if err != nil {
			return err
		}

		mimeType := determineMimeType(path)
		uploadTime := info.ModTime()

		files = append(files, &FileInfo{
			Path:         relPath,
			Size:         info.Size(),
			MimeType:     mimeType,
			LastModified: info.ModTime(),
			UploadedAt:   &uploadTime,
			ContentHash:  extractContentHashFromPath(relPath),
		})

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w", err)
	}

	l.logger.Info("Successfully listed files",
		zap.String("prefix", prefix),
		zap.Int("count", len(files)))

	return files, nil
}

// determineMimeType determines MIME type from file extension
func determineMimeType(filename string) string {
	ext := filepath.Ext(filename)

	mimeTypes := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".pdf":  "application/pdf",
		".txt":  "text/plain",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls":  "application/vnd.ms-excel",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".ppt":  "application/vnd.ms-powerpoint",
		".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".zip":  "application/zip",
		".rar":  "application/x-rar-compressed",
		".7z":   "application/x-7z-compressed",
		".mp4":  "video/mp4",
		".avi":  "video/x-msvideo",
		".mov":  "video/quicktime",
		".mp3":  "audio/mpeg",
		".wav":  "audio/wav",
		".json": "application/json",
		".xml":  "application/xml",
		".html": "text/html",
		".css":  "text/css",
		".js":   "application/javascript",
	}

	if mimeType, found := mimeTypes[ext]; found {
		return mimeType
	}

	return "application/octet-stream"
}