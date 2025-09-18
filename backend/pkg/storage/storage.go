package storage

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
)

// StorageProvider defines the interface for file storage
type StorageProvider interface {
	Store(ctx context.Context, key string, data []byte) error
	Retrieve(ctx context.Context, key string) ([]byte, error)
	Delete(ctx context.Context, key string) error
	GetURL(ctx context.Context, key string) (string, error)
}

// LocalStorage implements local file system storage
type LocalStorage struct {
	basePath string
}

// NewLocalStorage creates a new local storage provider
func NewLocalStorage(basePath string) *LocalStorage {
	return &LocalStorage{
		basePath: basePath,
	}
}

// Store saves data to local file system
func (ls *LocalStorage) Store(ctx context.Context, key string, data []byte) error {
	filePath := filepath.Join(ls.basePath, key)

	// Create directory if it doesn't exist
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Write file
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// Retrieve reads data from local file system
func (ls *LocalStorage) Retrieve(ctx context.Context, key string) ([]byte, error) {
	filePath := filepath.Join(ls.basePath, key)
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}
	return data, nil
}

// Delete removes file from local file system
func (ls *LocalStorage) Delete(ctx context.Context, key string) error {
	filePath := filepath.Join(ls.basePath, key)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}

// GetURL returns a file path (not a URL for local storage)
func (ls *LocalStorage) GetURL(ctx context.Context, key string) (string, error) {
	return filepath.Join(ls.basePath, key), nil
}

// S3Storage implements AWS S3 storage
type S3Storage struct {
	client *s3.Client
	bucket string
}

// NewS3Storage creates a new S3 storage provider
func NewS3Storage(ctx context.Context, bucket, region string) (*S3Storage, error) {
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(region),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg)

	return &S3Storage{
		client: client,
		bucket: bucket,
	}, nil
}

// Store uploads data to S3
func (s3s *S3Storage) Store(ctx context.Context, key string, data []byte) error {
	_, err := s3s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s3s.bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(data),
	})
	if err != nil {
		return fmt.Errorf("failed to upload to S3: %w", err)
	}
	return nil
}

// Retrieve downloads data from S3
func (s3s *S3Storage) Retrieve(ctx context.Context, key string) ([]byte, error) {
	result, err := s3s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s3s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to download from S3: %w", err)
	}
	defer result.Body.Close()

	data, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read S3 object body: %w", err)
	}

	return data, nil
}

// Delete removes object from S3
func (s3s *S3Storage) Delete(ctx context.Context, key string) error {
	_, err := s3s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s3s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete from S3: %w", err)
	}
	return nil
}

// GetURL generates a pre-signed URL for S3 object
func (s3s *S3Storage) GetURL(ctx context.Context, key string) (string, error) {
	presigner := s3.NewPresignClient(s3s.client)

	request, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s3s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate pre-signed URL: %w", err)
	}

	return request.URL, nil
}

// NewStorageProvider creates appropriate storage provider based on configuration
func NewStorageProvider(ctx context.Context, useS3 bool, s3Bucket, s3Region, localPath string) (StorageProvider, error) {
	if useS3 {
		return NewS3Storage(ctx, s3Bucket, s3Region)
	}
	return NewLocalStorage(localPath), nil
}