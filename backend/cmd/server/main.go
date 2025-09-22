package main

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
	"lokr-backend/internal/infrastructure"
	"lokr-backend/internal/graphql"
	"lokr-backend/internal/repository"
	"lokr-backend/internal/services"
	"lokr-backend/pkg/auth"
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

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize infrastructure
	infra, err := infrastructure.NewInfrastructure(logger)
	if err != nil {
		logger.Fatal("Failed to initialize infrastructure", zap.Error(err))
	}
	defer infra.Close()

	// Initialize JWT manager
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-in-production" // Default for dev
	}
	jwtManager := auth.NewJWTManager(jwtSecret)

	// Initialize repositories
	fileReferenceRepo := repository.NewFileReferenceRepository(infra.DB, logger)
	fileRepo := repository.NewFileRepository(infra.DB, logger)
	folderRepo := repository.NewFolderRepository(infra.DB, logger)

	// Initialize services
	userService := services.NewUserService(infra.DB)

	// Initialize S3 storage service
	storageService, err := services.NewS3StorageService(logger)
	if err != nil {
		logger.Fatal("Failed to initialize storage service", zap.Error(err))
	}

	simpleFileService := services.NewSimpleFileService(infra.DB, storageService)

	// Initialize file sharing service
	fileSharingService := services.NewFileSharingService(infra.DB)

	// Initialize folder service
	folderService := services.NewFolderService(infra.DB)

	// Initialize file reference service
	fileReferenceService := services.NewFileReferenceService(fileReferenceRepo, fileRepo, folderRepo)
	folderFileService := services.NewFolderFileService(infra.DB)

	// Initialize audit service
	auditService := services.NewAuditService(infra.DB, logger)

	// Initialize GraphQL resolver and handler
	resolver := graphql.NewResolver(userService, simpleFileService, fileSharingService, folderService, fileReferenceService, folderFileService, auditService, jwtManager)
	graphqlHandler := graphql.NewHandler(resolver, jwtManager)

	// Create Gin router
	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID"}
	config.AllowCredentials = true
	router.Use(cors.New(config))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "lokr-api",
			"version": "1.0.0",
			"time":    time.Now().UTC(),
		})
	})

	// API routes
	api := router.Group("/api/v1")
	{
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "pong"})
		})

		// File upload endpoint
		api.POST("/files/upload", func(c *gin.Context) {
			// Get JWT token and validate user
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}

			// Parse multipart form
			form, err := c.MultipartForm()
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form"})
				return
			}

			files := form.File["files"]
			if len(files) == 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "no files provided"})
				return
			}

			userUUID, _ := uuid.Parse(claims.UserID)
			uploadedFiles := make([]map[string]interface{}, 0)

			for _, fileHeader := range files {
				// Open the file
				file, err := fileHeader.Open()
				if err != nil {
					continue
				}
				defer file.Close()

				// Read file content
				content, err := io.ReadAll(file)
				if err != nil {
					continue
				}

				// Detect MIME type
				mimeType := fileHeader.Header.Get("Content-Type")
				if mimeType == "" {
					mimeType = "application/octet-stream"
				}

				// Upload file
				uploadedFile, err := simpleFileService.UploadFile(
					c.Request.Context(),
					userUUID,
					fileHeader.Filename,
					mimeType,
					content,
					nil, // folderID
					nil, // description
					nil, // tags
					nil, // visibility (defaults to private)
				)
				if err != nil {
					// Log failed upload
					auditService.LogFileUpload(c.Request.Context(), userUUID, uuid.Nil, fileHeader.Filename, c.ClientIP(), c.GetHeader("User-Agent"))
					continue
				}

				// Log successful upload
				auditService.LogFileUpload(c.Request.Context(), userUUID, uploadedFile.ID, uploadedFile.OriginalName, c.ClientIP(), c.GetHeader("User-Agent"))

				uploadedFiles = append(uploadedFiles, map[string]interface{}{
					"id":           uploadedFile.ID.String(),
					"filename":     uploadedFile.Filename,
					"originalName": uploadedFile.OriginalName,
					"fileSize":     uploadedFile.FileSize,
					"mimeType":     uploadedFile.MimeType,
					"uploadDate":   uploadedFile.UploadDate,
				})
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "files uploaded successfully",
				"files":   uploadedFiles,
			})
		})

		// File download endpoint
		api.GET("/files/:id/download", func(c *gin.Context) {
			// Get JWT token and validate user
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}

			fileID := c.Param("id")
			userUUID, _ := uuid.Parse(claims.UserID)
			fileUUID, err := uuid.Parse(fileID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID"})
				return
			}

			// Get file metadata directly from database (works for both owned and shared files)
			var targetFile domain.File
			var folderID sql.NullString
			var description sql.NullString
			var shareToken sql.NullString
			err = infra.DB.QueryRow(c.Request.Context(), `
				SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
					   content_hash, description, tags, visibility, share_token, download_count, upload_date
				FROM files
				WHERE id = $1 AND user_id = $2`, fileUUID, userUUID).Scan(
				&targetFile.ID, &targetFile.UserID, &folderID, &targetFile.Filename, &targetFile.OriginalName,
				&targetFile.MimeType, &targetFile.FileSize, &targetFile.ContentHash, &description, &targetFile.Tags,
				&targetFile.Visibility, &shareToken, &targetFile.DownloadCount, &targetFile.UploadDate)

			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "file not found or access denied"})
				return
			}

			// Get the correct file path from file_contents table
			var filePath string
			err = infra.DB.QueryRow(c.Request.Context(), `
				SELECT file_path FROM file_contents WHERE content_hash = $1`, targetFile.ContentHash).Scan(&filePath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get file path"})
				return
			}

			// Get file content from storage using the correct path
			content, err := storageService.GetFile(c.Request.Context(), filePath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get file content"})
				return
			}

			// Log successful download
			auditService.LogFileDownload(c.Request.Context(), userUUID, targetFile.ID, targetFile.OriginalName, c.ClientIP(), c.GetHeader("User-Agent"))

			// Set headers for download
			c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", targetFile.OriginalName))
			c.Header("Content-Type", targetFile.MimeType)
			c.Header("Content-Length", fmt.Sprintf("%d", len(content)))

			// Send file content
			c.Data(http.StatusOK, targetFile.MimeType, content)
		})

		// File preview endpoint
		api.GET("/files/:id/preview", func(c *gin.Context) {
			// Get JWT token from either header or query parameter
			var token string
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				token = strings.TrimPrefix(authHeader, "Bearer ")
			} else {
				token = c.Query("token")
			}

			if token == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}

			fileID := c.Param("id")
			userUUID, _ := uuid.Parse(claims.UserID)
			fileUUID, err := uuid.Parse(fileID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID"})
				return
			}

			// Get file metadata directly from database (works for both owned and shared files)
			var targetFile domain.File
			var folderID sql.NullString
			var description sql.NullString
			var shareToken sql.NullString
			err = infra.DB.QueryRow(c.Request.Context(), `
				SELECT id, user_id, folder_id, filename, original_name, mime_type, file_size,
					   content_hash, description, tags, visibility, share_token, download_count, upload_date
				FROM files
				WHERE id = $1 AND user_id = $2`, fileUUID, userUUID).Scan(
				&targetFile.ID, &targetFile.UserID, &folderID, &targetFile.Filename, &targetFile.OriginalName,
				&targetFile.MimeType, &targetFile.FileSize, &targetFile.ContentHash, &description, &targetFile.Tags,
				&targetFile.Visibility, &shareToken, &targetFile.DownloadCount, &targetFile.UploadDate)

			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "file not found or access denied"})
				return
			}

			// Get the correct file path from file_contents table
			var filePath string
			err = infra.DB.QueryRow(c.Request.Context(), `
				SELECT file_path FROM file_contents WHERE content_hash = $1`, targetFile.ContentHash).Scan(&filePath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get file path"})
				return
			}

			// Get file content from storage using the correct path
			content, err := storageService.GetFile(c.Request.Context(), filePath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get file content"})
				return
			}

			// Log successful preview
			auditService.LogFilePreview(c.Request.Context(), userUUID, targetFile.ID, targetFile.OriginalName, c.ClientIP(), c.GetHeader("User-Agent"))

			// Set headers for inline display
			c.Header("Content-Type", targetFile.MimeType)
			c.Header("Content-Length", fmt.Sprintf("%d", len(content)))

			// Send file content inline
			c.Data(http.StatusOK, targetFile.MimeType, content)
		})

		// File sharing endpoints

		// Create public share
		api.POST("/files/:id/share/public", func(c *gin.Context) {
			// Get JWT token and validate user
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}

			fileID := c.Param("id")
			fileUUID, err := uuid.Parse(fileID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID"})
				return
			}

			userUUID, _ := uuid.Parse(claims.UserID)

			shareResponse, err := fileSharingService.CreatePublicShare(c.Request.Context(), fileUUID, userUUID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Get file details for logging
			var fileName string
			err = infra.DB.QueryRow(c.Request.Context(), "SELECT original_name FROM files WHERE id = $1", fileUUID).Scan(&fileName)
			if err != nil {
				fileName = "Unknown file"
			}

			// Log successful public share
			auditService.LogPublicShare(c.Request.Context(), userUUID, fileUUID, fileName, shareResponse.ShareToken, c.ClientIP(), c.GetHeader("User-Agent"))

			c.JSON(http.StatusOK, shareResponse)
		})

		// Remove public share
		api.DELETE("/files/:id/share/public", func(c *gin.Context) {
			// Get JWT token and validate user
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}

			fileID := c.Param("id")
			fileUUID, err := uuid.Parse(fileID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID"})
				return
			}

			userUUID, _ := uuid.Parse(claims.UserID)

			err = fileSharingService.RemovePublicShare(c.Request.Context(), fileUUID, userUUID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Public share removed successfully"})
		})

		// Share with user
		api.POST("/files/:id/share/user", func(c *gin.Context) {
			// Get JWT token and validate user
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}

			fileID := c.Param("id")
			fileUUID, err := uuid.Parse(fileID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID"})
				return
			}

			var shareRequest struct {
				SharedWithUserID string `json:"sharedWithUserId"`
				PermissionType   string `json:"permissionType"`
				ExpiresAt        *time.Time `json:"expiresAt"`
			}

			// Debug: log request body
			body, _ := c.GetRawData()
			fmt.Printf("DEBUG: Raw request body: %s\n", string(body))

			// Reset body for binding
			c.Request.Body = io.NopCloser(strings.NewReader(string(body)))

			if err := c.ShouldBindJSON(&shareRequest); err != nil {
				fmt.Printf("DEBUG: JSON binding error: %v\n", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request body: %v", err)})
				return
			}

			fmt.Printf("DEBUG: Parsed request - SharedWithUserID: '%s', PermissionType: '%s'\n", shareRequest.SharedWithUserID, shareRequest.PermissionType)

			// Manual validation since binding validation might be the issue
			if shareRequest.SharedWithUserID == "" {
				fmt.Printf("DEBUG: SharedWithUserID is empty\n")
				c.JSON(http.StatusBadRequest, gin.H{"error": "sharedWithUserId is required"})
				return
			}

			if shareRequest.PermissionType == "" {
				fmt.Printf("DEBUG: PermissionType is empty\n")
				c.JSON(http.StatusBadRequest, gin.H{"error": "permissionType is required"})
				return
			}

			sharedWithUserUUID, err := uuid.Parse(shareRequest.SharedWithUserID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid shared with user ID"})
				return
			}

			userUUID, _ := uuid.Parse(claims.UserID)

			input := domain.ShareFileInput{
				FileID:           fileUUID,
				SharedWithUserID: sharedWithUserUUID,
				PermissionType:   domain.PermissionType(shareRequest.PermissionType),
				ExpiresAt:        shareRequest.ExpiresAt,
			}

			fileShare, err := fileSharingService.ShareWithUser(c.Request.Context(), input, userUUID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, fileShare)
		})

		// Remove user share
		api.DELETE("/files/:id/share/user/:userId", func(c *gin.Context) {
			// Get JWT token and validate user
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}

			fileID := c.Param("id")
			fileUUID, err := uuid.Parse(fileID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID"})
				return
			}

			sharedWithUserID := c.Param("userId")
			sharedWithUserUUID, err := uuid.Parse(sharedWithUserID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
				return
			}

			userUUID, _ := uuid.Parse(claims.UserID)

			err = fileSharingService.RemoveUserShare(c.Request.Context(), fileUUID, sharedWithUserUUID, userUUID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "User share removed successfully"})
		})

		// Get file sharing info
		api.GET("/files/:id/share", func(c *gin.Context) {
			// Get JWT token and validate user
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}

			fileID := c.Param("id")
			fileUUID, err := uuid.Parse(fileID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file ID"})
				return
			}

			userUUID, _ := uuid.Parse(claims.UserID)

			shareInfo, err := fileSharingService.GetFileShareInfo(c.Request.Context(), fileUUID, userUUID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, shareInfo)
		})

		// Public file access (no auth required)
		api.GET("/shared/:token", func(c *gin.Context) {
			shareToken := c.Param("token")

			file, err := fileSharingService.GetFileByShareToken(c.Request.Context(), shareToken)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Shared file not found"})
				return
			}

			// Increment download count
			fileSharingService.IncrementDownloadCount(c.Request.Context(), file.ID)

			// Get file content from storage
			content, err := storageService.GetFile(c.Request.Context(), fmt.Sprintf("personal/users/%s/%s", file.UserID.String(), file.ContentHash))
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get file content"})
				return
			}

			// Set headers for download
			c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", file.OriginalName))
			c.Header("Content-Type", file.MimeType)
			c.Header("Content-Length", fmt.Sprintf("%d", len(content)))

			// Send file content
			c.Data(http.StatusOK, file.MimeType, content)
		})

		// Public file preview (no auth required)
		api.GET("/shared/:token/preview", func(c *gin.Context) {
			shareToken := c.Param("token")

			file, err := fileSharingService.GetFileByShareToken(c.Request.Context(), shareToken)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Shared file not found"})
				return
			}

			// Get file content from storage
			content, err := storageService.GetFile(c.Request.Context(), fmt.Sprintf("personal/users/%s/%s", file.UserID.String(), file.ContentHash))
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get file content"})
				return
			}

			// Set headers for inline display
			c.Header("Content-Type", file.MimeType)
			c.Header("Content-Length", fmt.Sprintf("%d", len(content)))

			// Send file content inline
			c.Data(http.StatusOK, file.MimeType, content)
		})
	}

	// GraphQL endpoint
	router.POST("/graphql", graphqlHandler.ServeHTTP)
	router.GET("/graphql", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "GraphQL endpoint",
			"usage":   "Send POST requests with GraphQL queries",
		})
	})

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", port),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		logger.Info("Starting server", zap.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}