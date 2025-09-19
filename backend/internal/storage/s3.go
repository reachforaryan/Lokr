package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// S3Storage implements StorageService for AWS S3
type S3Storage struct {
	client     *s3.Client
	bucketName string
	logger     *zap.Logger
	region     string
}

// S3Config contains configuration for S3 storage
type S3Config struct {
	Region          string
	BucketName      string
	AccessKeyID     string
	SecretAccessKey string
	Endpoint        string // Optional for S3-compatible services like MinIO
	UsePathStyle    bool   // For S3-compatible services
}

// NewS3Storage creates a new S3 storage service
func NewS3Storage(config S3Config, logger *zap.Logger) (*S3Storage, error) {
	var cfg aws.Config
	var err error

	if config.Endpoint != "" {
		// Custom endpoint (e.g., MinIO)
		customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
			return aws.Endpoint{
				URL:               config.Endpoint,
				HostnameImmutable: true,
				SigningRegion:     config.Region,
			}, nil
		})

		cfg, err = awsConfig.LoadDefaultConfig(context.TODO(),
			awsConfig.WithRegion(config.Region),
			awsConfig.WithEndpointResolverWithOptions(customResolver),
			awsConfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				config.AccessKeyID,
				config.SecretAccessKey,
				"",
			)),
		)
	} else {
		// Standard AWS S3
		if config.AccessKeyID != "" && config.SecretAccessKey != "" {
			cfg, err = awsConfig.LoadDefaultConfig(context.TODO(),
				awsConfig.WithRegion(config.Region),
				awsConfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
					config.AccessKeyID,
					config.SecretAccessKey,
					"",
				)),
			)
		} else {
			// Use default credential chain (IAM roles, environment variables, etc.)
			cfg, err = awsConfig.LoadDefaultConfig(context.TODO(),
				awsConfig.WithRegion(config.Region),
			)
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		if config.UsePathStyle {
			o.UsePathStyle = true
		}
	})

	storage := &S3Storage{
		client:     client,
		bucketName: config.BucketName,
		logger:     logger,
		region:     config.Region,
	}

	// Verify bucket exists and is accessible
	if err := storage.ensureBucket(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ensure bucket exists: %w", err)
	}

	return storage, nil
}

// GenerateS3Path creates the S3 path for a file based on enterprise and user
// Path structure: enterprise-slug/user-id/content-hash
func (s *S3Storage) GenerateS3Path(enterpriseSlug string, userID uuid.UUID, contentHash string) string {
	return filepath.Join(enterpriseSlug, userID.String(), contentHash)
}

// GeneratePersonalS3Path creates the S3 path for personal (non-enterprise) users
// Path structure: personal/user-id/content-hash
func (s *S3Storage) GeneratePersonalS3Path(userID uuid.UUID, contentHash string) string {
	return filepath.Join("personal", userID.String(), contentHash)
}

// Store stores a file in S3 with the given path and content
func (s *S3Storage) Store(ctx context.Context, path string, content io.Reader, mimeType string) error {
	s.logger.Info("Storing file in S3",
		zap.String("path", path),
		zap.String("mime_type", mimeType),
		zap.String("bucket", s.bucketName))

	// Read content into memory to get size
	contentBytes, err := io.ReadAll(content)
	if err != nil {
		return fmt.Errorf("failed to read content: %w", err)
	}

	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucketName),
		Key:           aws.String(path),
		Body:          bytes.NewReader(contentBytes),
		ContentType:   aws.String(mimeType),
		ContentLength: aws.Int64(int64(len(contentBytes))),
		ServerSideEncryption: types.ServerSideEncryptionAes256,
		Metadata: map[string]string{
			"uploaded-at": time.Now().UTC().Format(time.RFC3339),
			"content-hash": extractContentHashFromPath(path),
		},
	})

	if err != nil {
		s.logger.Error("Failed to store file in S3",
			zap.String("path", path),
			zap.Error(err))
		return fmt.Errorf("failed to store file in S3: %w", err)
	}

	s.logger.Info("Successfully stored file in S3",
		zap.String("path", path),
		zap.Int("size", len(contentBytes)))

	return nil
}

// Get retrieves a file from S3
func (s *S3Storage) Get(ctx context.Context, path string) (io.ReadCloser, error) {
	s.logger.Info("Retrieving file from S3",
		zap.String("path", path),
		zap.String("bucket", s.bucketName))

	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(path),
	})

	if err != nil {
		s.logger.Error("Failed to retrieve file from S3",
			zap.String("path", path),
			zap.Error(err))
		return nil, fmt.Errorf("failed to retrieve file from S3: %w", err)
	}

	s.logger.Info("Successfully retrieved file from S3",
		zap.String("path", path))

	return result.Body, nil
}

// Delete removes a file from S3
func (s *S3Storage) Delete(ctx context.Context, path string) error {
	s.logger.Info("Deleting file from S3",
		zap.String("path", path),
		zap.String("bucket", s.bucketName))

	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(path),
	})

	if err != nil {
		s.logger.Error("Failed to delete file from S3",
			zap.String("path", path),
			zap.Error(err))
		return fmt.Errorf("failed to delete file from S3: %w", err)
	}

	s.logger.Info("Successfully deleted file from S3",
		zap.String("path", path))

	return nil
}

// Exists checks if a file exists in S3
func (s *S3Storage) Exists(ctx context.Context, path string) (bool, error) {
	s.logger.Debug("Checking if file exists in S3",
		zap.String("path", path))

	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(path),
	})

	if err != nil {
		var notFound *types.NotFound
		if errors.As(err, &notFound) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}

// GetFileInfo retrieves metadata about a file in S3
func (s *S3Storage) GetFileInfo(ctx context.Context, path string) (*FileInfo, error) {
	result, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(path),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	fileInfo := &FileInfo{
		Path:         path,
		Size:         aws.ToInt64(result.ContentLength),
		MimeType:     aws.ToString(result.ContentType),
		LastModified: aws.ToTime(result.LastModified),
		ETag:         strings.Trim(aws.ToString(result.ETag), "\""),
	}

	if result.Metadata != nil {
		if uploadedAt, exists := result.Metadata["uploaded-at"]; exists {
			if t, err := time.Parse(time.RFC3339, uploadedAt); err == nil {
				fileInfo.UploadedAt = &t
			}
		}
		if contentHash, exists := result.Metadata["content-hash"]; exists {
			fileInfo.ContentHash = contentHash
		}
	}

	return fileInfo, nil
}

// ListFiles lists files in a specific "directory" (prefix)
func (s *S3Storage) ListFiles(ctx context.Context, prefix string) ([]*FileInfo, error) {
	s.logger.Info("Listing files in S3",
		zap.String("prefix", prefix))

	var files []*FileInfo

	paginator := s3.NewListObjectsV2Paginator(s.client, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.bucketName),
		Prefix: aws.String(prefix),
	})

	for paginator.HasMorePages() {
		output, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to list files: %w", err)
		}

		for _, obj := range output.Contents {
			files = append(files, &FileInfo{
				Path:         aws.ToString(obj.Key),
				Size:         aws.ToInt64(obj.Size),
				LastModified: aws.ToTime(obj.LastModified),
				ETag:         strings.Trim(aws.ToString(obj.ETag), "\""),
			})
		}
	}

	s.logger.Info("Successfully listed files",
		zap.String("prefix", prefix),
		zap.Int("count", len(files)))

	return files, nil
}

// GeneratePresignedURL generates a presigned URL for downloading a file
func (s *S3Storage) GeneratePresignedURL(ctx context.Context, path string, expiration time.Duration) (string, error) {
	presigner := s3.NewPresignClient(s.client)

	request, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(path),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiration
	})

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return request.URL, nil
}

// GenerateUploadPresignedURL generates a presigned URL for uploading a file
func (s *S3Storage) GenerateUploadPresignedURL(ctx context.Context, path, mimeType string, expiration time.Duration) (string, error) {
	presigner := s3.NewPresignClient(s.client)

	request, err := presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(path),
		ContentType: aws.String(mimeType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiration
	})

	if err != nil {
		return "", fmt.Errorf("failed to generate upload presigned URL: %w", err)
	}

	return request.URL, nil
}

// ensureBucket ensures the bucket exists and is accessible
func (s *S3Storage) ensureBucket(ctx context.Context) error {
	// Check if bucket exists
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(s.bucketName),
	})

	if err != nil {
		// Bucket doesn't exist or we don't have access
		s.logger.Info("Bucket doesn't exist, attempting to create it",
			zap.String("bucket", s.bucketName))

		_, createErr := s.client.CreateBucket(ctx, &s3.CreateBucketInput{
			Bucket: aws.String(s.bucketName),
			CreateBucketConfiguration: &types.CreateBucketConfiguration{
				LocationConstraint: types.BucketLocationConstraint(s.region),
			},
		})

		if createErr != nil {
			return fmt.Errorf("failed to create bucket: %w", createErr)
		}

		s.logger.Info("Successfully created bucket",
			zap.String("bucket", s.bucketName))
	}

	return nil
}

// extractContentHashFromPath extracts the content hash from the S3 path
// Path format: enterprise-slug/user-id/content-hash
func extractContentHashFromPath(path string) string {
	parts := strings.Split(path, "/")
	if len(parts) >= 3 {
		return parts[len(parts)-1] // Return the last part (content hash)
	}
	return ""
}

// FileInfo contains metadata about a stored file
type FileInfo struct {
	Path         string     `json:"path"`
	Size         int64      `json:"size"`
	MimeType     string     `json:"mime_type"`
	LastModified time.Time  `json:"last_modified"`
	UploadedAt   *time.Time `json:"uploaded_at,omitempty"`
	ETag         string     `json:"etag"`
	ContentHash  string     `json:"content_hash,omitempty"`
}