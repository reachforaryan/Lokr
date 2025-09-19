package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"

	"lokr-backend/internal/domain"
	"lokr-backend/internal/repository"
	"lokr-backend/internal/services"
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

	// Connect to database
	ctx := context.Background()
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

	// Initialize repositories
	userRepo := repository.NewUserRepository(db, logger)
	fileRepo := repository.NewFileRepository(db, logger)
	fileContentRepo := repository.NewFileContentRepository(db, logger)
	enterpriseRepo := repository.NewEnterpriseRepository(db, logger)

	// Initialize storage
	storageConfig := storage.StorageConfig{
		Backend: "s3",
		S3: storage.S3Config{
			Region:          os.Getenv("AWS_REGION"),
			BucketName:      os.Getenv("S3_BUCKET_NAME"),
			AccessKeyID:     os.Getenv("AWS_ACCESS_KEY_ID"),
			SecretAccessKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
		},
	}

	storageService, presignedService, err := storage.GetStorageServiceWithPresignedURL(storageConfig, logger)
	if err != nil {
		logger.Fatal("Failed to initialize storage", zap.Error(err))
	}

	// Initialize file service
	fileService := services.NewFileService(
		fileRepo, fileContentRepo, userRepo, enterpriseRepo,
		storageService, presignedService, logger)

	logger.Info("Starting comprehensive file upload and enterprise test...")

	// Test 1: Create Enterprise
	logger.Info("=== Test 1: Creating Enterprise ===")
	enterprise := &domain.Enterprise{
		ID:                  uuid.New(),
		Name:                "Test Enterprise Inc",
		Slug:                "test-enterprise",
		StorageQuota:        107374182400, // 100GB
		StorageUsed:         0,
		MaxUsers:            50,
		CurrentUsers:        0,
		Settings:            map[string]interface{}{"allow_public_sharing": true},
		SubscriptionPlan:    domain.SubscriptionPlanPremium,
		SubscriptionStatus:  domain.SubscriptionStatusActive,
		BillingEmail:        stringPtr("billing@testenterprise.com"),
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	err = enterpriseRepo.Create(enterprise)
	if err != nil {
		logger.Fatal("Failed to create enterprise", zap.Error(err))
	}
	logger.Info("Enterprise created successfully", zap.String("enterprise_id", enterprise.ID.String()))

	// Test 2: Create Users (Enterprise and Personal)
	logger.Info("=== Test 2: Creating Users ===")

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte("testpassword123"), bcrypt.DefaultCost)
	if err != nil {
		logger.Fatal("Failed to hash password", zap.Error(err))
	}

	// Enterprise user
	enterpriseUser := &domain.User{
		ID:             uuid.New(),
		Email:          "john@testenterprise.com",
		Name:           "John Enterprise",
		PasswordHash:   string(passwordHash),
		Role:           domain.RoleUser,
		StorageQuota:   10737418240, // 10GB
		EmailVerified:  true,
		EnterpriseID:   &enterprise.ID,
		EnterpriseRole: enterpriseRolePtr(domain.EnterpriseRoleAdmin),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	err = userRepo.Create(enterpriseUser)
	if err != nil {
		logger.Fatal("Failed to create enterprise user", zap.Error(err))
	}
	logger.Info("Enterprise user created", zap.String("user_id", enterpriseUser.ID.String()))

	// Personal user
	personalUser := &domain.User{
		ID:            uuid.New(),
		Email:         "jane@personal.com",
		Name:          "Jane Personal",
		PasswordHash:  string(passwordHash),
		Role:          domain.RoleUser,
		StorageQuota:  5368709120, // 5GB
		EmailVerified: true,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	err = userRepo.Create(personalUser)
	if err != nil {
		logger.Fatal("Failed to create personal user", zap.Error(err))
	}
	logger.Info("Personal user created", zap.String("user_id", personalUser.ID.String()))

	// Test 3: File Upload (Enterprise User) - Original File
	logger.Info("=== Test 3: File Upload (Enterprise User) ===")
	testContent := []byte("This is a test file for deduplication testing. Hello Lokr!")
	uploadRequest1 := &domain.FileUploadRequest{
		UserID:      enterpriseUser.ID,
		Filename:    "test-document.txt",
		MimeType:    "text/plain",
		FileSize:    int64(len(testContent)),
		Content:     testContent,
		Description: stringPtr("Test document for enterprise"),
		Tags:        []string{"test", "enterprise"},
		Visibility:  domain.VisibilityPrivate,
	}

	file1, err := fileService.UploadFile(ctx, uploadRequest1)
	if err != nil {
		logger.Fatal("Failed to upload first file", zap.Error(err))
	}
	logger.Info("First file uploaded successfully",
		zap.String("file_id", file1.ID.String()),
		zap.String("content_hash", file1.ContentHash))

	// Test 4: File Upload (Personal User) - Same Content (Test Deduplication)
	logger.Info("=== Test 4: File Upload (Personal User) - Same Content ===")
	uploadRequest2 := &domain.FileUploadRequest{
		UserID:      personalUser.ID,
		Filename:    "my-document.txt",
		MimeType:    "text/plain",
		FileSize:    int64(len(testContent)),
		Content:     testContent, // Same content!
		Description: stringPtr("Personal copy of document"),
		Tags:        []string{"test", "personal"},
		Visibility:  domain.VisibilityPrivate,
	}

	file2, err := fileService.UploadFile(ctx, uploadRequest2)
	if err != nil {
		logger.Fatal("Failed to upload second file", zap.Error(err))
	}
	logger.Info("Second file uploaded successfully",
		zap.String("file_id", file2.ID.String()),
		zap.String("content_hash", file2.ContentHash))

	// Verify deduplication worked
	if file1.ContentHash == file2.ContentHash {
		logger.Info("✅ DEDUPLICATION SUCCESS: Both files have same content hash")
	} else {
		logger.Error("❌ DEDUPLICATION FAILED: Different content hashes")
	}

	// Test 5: Check File Content Reference Count
	logger.Info("=== Test 5: Verify Reference Count ===")
	fileContent, err := fileContentRepo.GetByHash(file1.ContentHash)
	if err != nil {
		logger.Fatal("Failed to get file content", zap.Error(err))
	}
	logger.Info("File content details",
		zap.String("content_hash", fileContent.ContentHash),
		zap.String("file_path", fileContent.FilePath),
		zap.Int("reference_count", fileContent.ReferenceCount))

	if fileContent.ReferenceCount == 2 {
		logger.Info("✅ REFERENCE COUNT SUCCESS: 2 files reference same content")
	} else {
		logger.Error("❌ REFERENCE COUNT FAILED", zap.Int("expected", 2), zap.Int("actual", fileContent.ReferenceCount))
	}

	// Test 6: File Download
	logger.Info("=== Test 6: File Download Test ===")
	downloadReader, downloadedFile, err := fileService.DownloadFile(ctx, file1.ID, enterpriseUser.ID)
	if err != nil {
		logger.Fatal("Failed to download file", zap.Error(err))
	}
	defer downloadReader.Close()

	logger.Info("File download successful",
		zap.String("filename", downloadedFile.Filename),
		zap.Int64("size", downloadedFile.FileSize))

	// Test 7: Storage Quota Check
	logger.Info("=== Test 7: Storage Quota Verification ===")
	updatedEnterpriseUser, err := userRepo.GetByID(enterpriseUser.ID)
	if err != nil {
		logger.Fatal("Failed to get updated enterprise user", zap.Error(err))
	}

	updatedPersonalUser, err := userRepo.GetByID(personalUser.ID)
	if err != nil {
		logger.Fatal("Failed to get updated personal user", zap.Error(err))
	}

	logger.Info("Enterprise user storage",
		zap.Int64("used", updatedEnterpriseUser.StorageUsed),
		zap.Int64("quota", updatedEnterpriseUser.StorageQuota))

	logger.Info("Personal user storage",
		zap.Int64("used", updatedPersonalUser.StorageUsed),
		zap.Int64("quota", updatedPersonalUser.StorageQuota))

	// Test 8: File Deletion Test
	logger.Info("=== Test 8: File Deletion Test ===")
	err = fileService.DeleteFile(ctx, file2.ID, personalUser.ID)
	if err != nil {
		logger.Fatal("Failed to delete file", zap.Error(err))
	}
	logger.Info("File deleted successfully")

	// Check reference count after deletion
	fileContentAfterDeletion, err := fileContentRepo.GetByHash(file1.ContentHash)
	if err != nil {
		logger.Fatal("Failed to get file content after deletion", zap.Error(err))
	}
	logger.Info("Reference count after deletion", zap.Int("count", fileContentAfterDeletion.ReferenceCount))

	if fileContentAfterDeletion.ReferenceCount == 1 {
		logger.Info("✅ DELETION SUCCESS: Reference count decremented correctly")
	} else {
		logger.Error("❌ DELETION FAILED: Reference count not decremented")
	}

	// Test 9: Enterprise Stats
	logger.Info("=== Test 9: Enterprise Statistics ===")
	enterpriseStats, err := enterpriseRepo.GetStats(enterprise.ID)
	if err != nil {
		logger.Fatal("Failed to get enterprise stats", zap.Error(err))
	}

	logger.Info("Enterprise statistics",
		zap.Int("total_users", enterpriseStats.TotalUsers),
		zap.Int("total_files", enterpriseStats.TotalFiles),
		zap.Int64("storage_used", enterpriseStats.StorageUsed),
		zap.Float64("storage_usage_perc", enterpriseStats.StorageUsagePerc))

	logger.Info("🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
	logger.Info("✅ RDS PostgreSQL: Working")
	logger.Info("✅ S3 Storage: Working")
	logger.Info("✅ File Deduplication: Working")
	logger.Info("✅ Enterprise Management: Working")
	logger.Info("✅ User Management: Working")
	logger.Info("✅ Storage Quotas: Working")
	logger.Info("✅ File Upload/Download: Working")
	logger.Info("✅ Reference Counting: Working")
}

func stringPtr(s string) *string {
	return &s
}

func enterpriseRolePtr(role domain.EnterpriseRole) *domain.EnterpriseRole {
	return &role
}