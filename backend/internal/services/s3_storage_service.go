package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go.uber.org/zap"
)

type S3StorageService struct {
	client     *s3.Client
	bucketName string
	logger     *zap.Logger
	useLocal   bool
	localPath  string
}

func NewS3StorageService(logger *zap.Logger) (*S3StorageService, error) {
	bucketName := os.Getenv("S3_BUCKET_NAME")
	useS3 := os.Getenv("USE_S3") == "true"

	service := &S3StorageService{
		bucketName: bucketName,
		logger:     logger,
		useLocal:   !useS3,
		localPath:  "./storage", // Local storage fallback
	}

	if useS3 && bucketName != "" {
		// Load AWS configuration
		cfg, err := config.LoadDefaultConfig(context.TODO(),
			config.WithRegion(os.Getenv("AWS_REGION")),
		)
		if err != nil {
			return nil, fmt.Errorf("failed to load AWS config: %w", err)
		}

		service.client = s3.NewFromConfig(cfg)
		logger.Info("S3 storage service initialized", zap.String("bucket", bucketName))
	} else {
		// Ensure local storage directory exists
		if err := os.MkdirAll(service.localPath, 0755); err != nil {
			return nil, fmt.Errorf("failed to create local storage directory: %w", err)
		}
		logger.Info("Local storage service initialized", zap.String("path", service.localPath))
	}

	return service, nil
}

// StoreFile stores a file with proper enterprise/user structure
func (s *S3StorageService) StoreFile(ctx context.Context, content []byte, enterpriseSlug, userID, contentHash, filename string) (string, error) {
	// Generate structured path: enterprise/user/hash or personal/user/hash
	var storagePath string
	if enterpriseSlug != "" {
		storagePath = fmt.Sprintf("enterprises/%s/users/%s/%s", enterpriseSlug, userID, contentHash)
	} else {
		storagePath = fmt.Sprintf("personal/users/%s/%s", userID, contentHash)
	}

	if s.useLocal {
		return s.storeFileLocally(content, storagePath, filename)
	}

	return s.storeFileS3(ctx, content, storagePath, filename)
}

func (s *S3StorageService) storeFileS3(ctx context.Context, content []byte, storagePath, filename string) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("S3 client not initialized")
	}

	reader := bytes.NewReader(content)

	// Determine content type from filename extension
	contentType := detectContentType(filename)

	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(storagePath),
		Body:        reader,
		ContentType: aws.String(contentType),
		Metadata: map[string]string{
			"original-filename": filename,
			"content-hash":      extractHashFromPath(storagePath),
		},
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload to S3: %w", err)
	}

	s.logger.Info("File stored in S3",
		zap.String("bucket", s.bucketName),
		zap.String("key", storagePath),
		zap.String("filename", filename))

	return storagePath, nil
}

func (s *S3StorageService) storeFileLocally(content []byte, storagePath, filename string) (string, error) {
	fullPath := filepath.Join(s.localPath, storagePath)

	// Create directory structure
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory structure: %w", err)
	}

	// Write file content
	if err := os.WriteFile(fullPath, content, 0644); err != nil {
		return "", fmt.Errorf("failed to write file locally: %w", err)
	}

	s.logger.Info("File stored locally",
		zap.String("path", fullPath),
		zap.String("filename", filename))

	return storagePath, nil
}

// GetFile retrieves a file from storage
func (s *S3StorageService) GetFile(ctx context.Context, storagePath string) ([]byte, error) {
	if s.useLocal {
		return s.getFileLocally(storagePath)
	}

	return s.getFileS3(ctx, storagePath)
}

func (s *S3StorageService) getFileS3(ctx context.Context, storagePath string) ([]byte, error) {
	if s.client == nil {
		return nil, fmt.Errorf("S3 client not initialized")
	}

	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(storagePath),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get object from S3: %w", err)
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}

func (s *S3StorageService) getFileLocally(storagePath string) ([]byte, error) {
	fullPath := filepath.Join(s.localPath, storagePath)
	return os.ReadFile(fullPath)
}

// DeleteFile removes a file from storage
func (s *S3StorageService) DeleteFile(ctx context.Context, storagePath string) error {
	if s.useLocal {
		return s.deleteFileLocally(storagePath)
	}

	return s.deleteFileS3(ctx, storagePath)
}

func (s *S3StorageService) deleteFileS3(ctx context.Context, storagePath string) error {
	if s.client == nil {
		return fmt.Errorf("S3 client not initialized")
	}

	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(storagePath),
	})

	if err != nil {
		return fmt.Errorf("failed to delete from S3: %w", err)
	}

	s.logger.Info("File deleted from S3",
		zap.String("bucket", s.bucketName),
		zap.String("key", storagePath))

	return nil
}

func (s *S3StorageService) deleteFileLocally(storagePath string) error {
	fullPath := filepath.Join(s.localPath, storagePath)
	err := os.Remove(fullPath)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete local file: %w", err)
	}

	s.logger.Info("File deleted locally", zap.String("path", fullPath))
	return nil
}

// Helper functions
func detectContentType(filename string) string {
	ext := filepath.Ext(filename)
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".pdf":
		return "application/pdf"
	case ".txt":
		return "text/plain"
	case ".json":
		return "application/json"
	case ".xml":
		return "application/xml"
	case ".zip":
		return "application/zip"
	case ".mp4":
		return "video/mp4"
	case ".mp3":
		return "audio/mpeg"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	default:
		return "application/octet-stream"
	}
}

func extractHashFromPath(storagePath string) string {
	return filepath.Base(storagePath)
}