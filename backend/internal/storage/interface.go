package storage

import (
	"context"
	"io"
	"time"
)

// StorageService defines the interface for file storage operations
type StorageService interface {
	// Store stores content at the given path
	Store(ctx context.Context, path string, content io.Reader, mimeType string) error

	// Get retrieves content from the given path
	Get(ctx context.Context, path string) (io.ReadCloser, error)

	// Delete removes content at the given path
	Delete(ctx context.Context, path string) error

	// Exists checks if content exists at the given path
	Exists(ctx context.Context, path string) (bool, error)

	// GetFileInfo retrieves metadata about the file
	GetFileInfo(ctx context.Context, path string) (*FileInfo, error)

	// ListFiles lists files with the given prefix
	ListFiles(ctx context.Context, prefix string) ([]*FileInfo, error)
}

// PresignedURLService defines interface for services that support presigned URLs
type PresignedURLService interface {
	// GeneratePresignedURL generates a presigned URL for downloading
	GeneratePresignedURL(ctx context.Context, path string, expiration time.Duration) (string, error)

	// GenerateUploadPresignedURL generates a presigned URL for uploading
	GenerateUploadPresignedURL(ctx context.Context, path, mimeType string, expiration time.Duration) (string, error)
}

// StorageConfig contains configuration for different storage backends
type StorageConfig struct {
	Backend string    `json:"backend" validate:"required,oneof=s3 local"`
	S3      S3Config  `json:"s3,omitempty"`
	Local   LocalConfig `json:"local,omitempty"`
}

// LocalConfig contains configuration for local file storage
type LocalConfig struct {
	BasePath string `json:"base_path" validate:"required"`
}