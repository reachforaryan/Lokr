package storage

import (
	"fmt"
	"go.uber.org/zap"
)

// NewStorageService creates a new storage service based on the configuration
func NewStorageService(config StorageConfig, logger *zap.Logger) (StorageService, error) {
	switch config.Backend {
	case "s3":
		if config.S3.BucketName == "" {
			return nil, fmt.Errorf("S3 bucket name is required")
		}
		if config.S3.Region == "" {
			return nil, fmt.Errorf("S3 region is required")
		}

		return NewS3Storage(config.S3, logger)

	case "local":
		if config.Local.BasePath == "" {
			return nil, fmt.Errorf("local storage base path is required")
		}

		return NewLocalStorage(config.Local.BasePath, logger)

	default:
		return nil, fmt.Errorf("unsupported storage backend: %s", config.Backend)
	}
}

// GetStorageServiceWithPresignedURL returns storage service and presigned URL service if supported
func GetStorageServiceWithPresignedURL(config StorageConfig, logger *zap.Logger) (StorageService, PresignedURLService, error) {
	storageService, err := NewStorageService(config, logger)
	if err != nil {
		return nil, nil, err
	}

	// Check if the storage service also supports presigned URLs
	if presignedService, ok := storageService.(PresignedURLService); ok {
		return storageService, presignedService, nil
	}

	// Return storage service without presigned URL support
	return storageService, nil, nil
}