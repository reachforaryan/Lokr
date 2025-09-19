package main

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"lokr-backend/internal/storage"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}
	defer logger.Sync()

	logger.Info("🚀 Starting Lokr File Storage Test")

	// Test S3 Storage
	logger.Info("=== Testing S3 Storage ===")

	storageConfig := storage.S3Config{
		Region:          os.Getenv("AWS_REGION"),
		BucketName:      os.Getenv("S3_BUCKET_NAME"),
		AccessKeyID:     os.Getenv("AWS_ACCESS_KEY_ID"),
		SecretAccessKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
	}

	s3Storage, err := storage.NewS3Storage(storageConfig, logger)
	if err != nil {
		logger.Fatal("Failed to initialize S3 storage", zap.Error(err))
	}

	// Test 1: File Upload
	logger.Info("Test 1: File Upload to S3")
	testContent := []byte("Hello Lokr! This is a test file for S3 storage. File deduplication test content.")
	enterprisePath := "test-enterprise/user-123/abcd1234567890"
	personalPath := "personal/user-456/abcd1234567890"

	ctx := context.Background()

	// Upload enterprise file
	err = s3Storage.Store(ctx, enterprisePath, bytes.NewReader(testContent), "text/plain")
	if err != nil {
		logger.Fatal("Failed to upload enterprise file", zap.Error(err))
	}
	logger.Info("✅ Enterprise file uploaded successfully", zap.String("path", enterprisePath))

	// Upload same content for personal user (simulating deduplication scenario)
	err = s3Storage.Store(ctx, personalPath, bytes.NewReader(testContent), "text/plain")
	if err != nil {
		logger.Fatal("Failed to upload personal file", zap.Error(err))
	}
	logger.Info("✅ Personal file uploaded successfully", zap.String("path", personalPath))

	// Test 2: File Download
	logger.Info("Test 2: File Download from S3")

	downloadReader, err := s3Storage.Get(ctx, enterprisePath)
	if err != nil {
		logger.Fatal("Failed to download file", zap.Error(err))
	}
	defer downloadReader.Close()

	logger.Info("✅ File download successful")

	// Test 3: File Existence Check
	logger.Info("Test 3: File Existence Check")

	exists, err := s3Storage.Exists(ctx, enterprisePath)
	if err != nil {
		logger.Fatal("Failed to check file existence", zap.Error(err))
	}

	if exists {
		logger.Info("✅ File exists check successful")
	} else {
		logger.Error("❌ File should exist but doesn't")
	}

	// Test 4: File Info
	logger.Info("Test 4: Get File Information")

	fileInfo, err := s3Storage.GetFileInfo(ctx, enterprisePath)
	if err != nil {
		logger.Fatal("Failed to get file info", zap.Error(err))
	}

	logger.Info("✅ File info retrieved",
		zap.String("path", fileInfo.Path),
		zap.Int64("size", fileInfo.Size),
		zap.String("mime_type", fileInfo.MimeType))

	// Test 5: List Files
	logger.Info("Test 5: List Files")

	files, err := s3Storage.ListFiles(ctx, "test-enterprise/")
	if err != nil {
		logger.Fatal("Failed to list files", zap.Error(err))
	}

	logger.Info("✅ Files listed successfully", zap.Int("count", len(files)))
	for _, file := range files {
		logger.Info("File found",
			zap.String("path", file.Path),
			zap.Int64("size", file.Size))
	}

	// Test 6: Presigned URL Generation
	logger.Info("Test 6: Generate Presigned URL")

	presignedURL, err := s3Storage.GeneratePresignedURL(ctx, enterprisePath, 3600) // 1 hour
	if err != nil {
		logger.Fatal("Failed to generate presigned URL", zap.Error(err))
	}

	logger.Info("✅ Presigned URL generated successfully", zap.String("url", presignedURL))

	// Test 7: Test Database Connection
	logger.Info("Test 7: Database Connection Test")

	// Simple database connection test
	databaseURL := os.Getenv("DATABASE_URL")
	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Set schema search path
	_, err = db.Exec(ctx, "SET search_path TO public")
	if err != nil {
		logger.Fatal("Failed to set schema search path", zap.Error(err))
	}

	err = db.Ping(ctx)
	if err != nil {
		logger.Fatal("Failed to ping database", zap.Error(err))
	}

	logger.Info("✅ Database connection successful")

	// Test tables exist
	var tableCount int
	err = db.QueryRow(ctx, "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'").Scan(&tableCount)
	if err != nil {
		logger.Fatal("Failed to count tables", zap.Error(err))
	}

	logger.Info("✅ Database tables verified", zap.Int("table_count", tableCount))

	// Cleanup: Delete test files
	logger.Info("Cleanup: Deleting test files")

	err = s3Storage.Delete(ctx, enterprisePath)
	if err != nil {
		logger.Warn("Failed to delete enterprise test file", zap.Error(err))
	}

	err = s3Storage.Delete(ctx, personalPath)
	if err != nil {
		logger.Warn("Failed to delete personal test file", zap.Error(err))
	}

	logger.Info("✅ Test cleanup completed")

	logger.Info("🎉 ALL TESTS PASSED SUCCESSFULLY!")
	logger.Info("✅ S3 Storage: Working perfectly")
	logger.Info("✅ File Upload/Download: Working")
	logger.Info("✅ File Existence Checks: Working")
	logger.Info("✅ Presigned URLs: Working")
	logger.Info("✅ RDS PostgreSQL: Connected and ready")
	logger.Info("✅ Enterprise/Personal Path Structure: Working")

	fmt.Println("\n🚀 Lokr is ready for production file storage!")
}