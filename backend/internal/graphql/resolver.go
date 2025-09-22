package graphql

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"lokr-backend/internal/domain"
	"lokr-backend/internal/services"
	"lokr-backend/pkg/auth"
)

type Resolver struct {
	userService     *services.UserService
	simpleFileService *services.SimpleFileService
	fileSharingService *services.FileSharingService
	jwtManager      *auth.JWTManager
}

func NewResolver(
	userService *services.UserService,
	simpleFileService *services.SimpleFileService,
	fileSharingService *services.FileSharingService,
	jwtManager *auth.JWTManager,
) *Resolver {
	return &Resolver{
		userService:       userService,
		simpleFileService: simpleFileService,
		fileSharingService: fileSharingService,
		jwtManager:        jwtManager,
	}
}

// Authentication Resolvers
func (r *Resolver) Login(ctx context.Context, email, password string) (*AuthPayload, error) {
	// Get user by email from database
	user, err := r.userService.GetUserByEmail(email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Update last login
	r.userService.UpdateLastLogin(user.ID)

	// Generate tokens
	token, err := r.jwtManager.GenerateToken(user.ID.String(), user.Email, string(user.Role))
	if err != nil {
		return nil, fmt.Errorf("failed to generate token")
	}

	refreshToken, err := r.jwtManager.GenerateRefreshToken(user.ID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token")
	}

	return &AuthPayload{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func (r *Resolver) Register(ctx context.Context, input CreateUserInput) (*AuthPayload, error) {
	// Create user in database
	user, err := r.userService.CreateUser(input.Email, input.Name, input.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}

	// Generate tokens
	token, err := r.jwtManager.GenerateToken(user.ID.String(), user.Email, string(user.Role))
	if err != nil {
		return nil, fmt.Errorf("failed to generate token")
	}

	refreshToken, err := r.jwtManager.GenerateRefreshToken(user.ID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token")
	}

	return &AuthPayload{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func (r *Resolver) Me(ctx context.Context) (*domain.User, error) {
	// Get user ID from context (set by auth middleware)
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	user, err := r.userService.GetUserByID(id)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	return user, nil
}

func (r *Resolver) RefreshToken(ctx context.Context) (*AuthPayload, error) {
	// This would typically validate the refresh token and generate new tokens
	// For now, just return error as not implemented
	return nil, errors.New("refresh token not implemented yet")
}

func (r *Resolver) Logout(ctx context.Context) (bool, error) {
	// In a real implementation, you might want to invalidate the token
	// For JWT tokens, this is often handled client-side
	return true, nil
}

// User Resolvers
func (r *Resolver) GetUser(ctx context.Context, id string) (*domain.User, error) {
	userID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID")
	}

	user, err := r.userService.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	return user, nil
}

func (r *Resolver) GetUsers(ctx context.Context, limit, offset *int) ([]*domain.User, error) {
	// Not implemented for now
	return []*domain.User{}, nil
}

func (r *Resolver) UpdateProfile(ctx context.Context, input UpdateUserInput) (*domain.User, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	user, err := r.userService.GetUserByID(id)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// For now, just return the user without updating
	// TODO: Implement user update in service
	return user, nil
}

// File Resolvers
func (r *Resolver) UploadFile(ctx context.Context, fileHeader interface{}, input FileUploadInput) (*domain.File, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// For now, we'll create a simple mock upload since we don't have the actual file multipart parsing
	// This would be replaced with actual file processing that reads from the HTTP request
	mockContent := []byte("This is a test file content uploaded through GraphQL - " + time.Now().Format(time.RFC3339))
	filename := "uploaded-file.txt"
	mimeType := "text/plain" // Simple default for now

	// Convert folder ID if provided
	var folderID *uuid.UUID
	if input.FolderID != nil {
		folderUUID, err := uuid.Parse(*input.FolderID)
		if err != nil {
			return nil, fmt.Errorf("invalid folder ID: %w", err)
		}
		folderID = &folderUUID
	}

	// Use the simplified file service to upload with real database storage
	file, err := r.simpleFileService.UploadFile(ctx, userUUID, filename, mimeType, mockContent, folderID, input.Description, input.Tags, input.Visibility)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	return file, nil
}

func (r *Resolver) GetMyFiles(ctx context.Context, limit, offset *int) ([]*domain.File, error) {
	fmt.Printf("DEBUG: GetMyFiles called\n")

	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		fmt.Printf("DEBUG: No userID in context\n")
		return nil, errors.New("unauthorized")
	}
	fmt.Printf("DEBUG: Found userID in context: %s\n", userID)

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		fmt.Printf("DEBUG: Failed to parse userID: %v\n", err)
		return nil, errors.New("invalid user ID")
	}

	// Set default values
	defaultLimit := 20
	defaultOffset := 0
	if limit == nil {
		limit = &defaultLimit
	}
	if offset == nil {
		offset = &defaultOffset
	}
	fmt.Printf("DEBUG: Using limit=%d, offset=%d\n", *limit, *offset)

	// Get files from the simplified file service
	files, err := r.simpleFileService.GetFilesByUserID(ctx, userUUID, *limit, *offset)
	if err != nil {
		fmt.Printf("DEBUG: GetFilesByUserID failed: %v\n", err)
		return nil, fmt.Errorf("failed to get files: %w", err)
	}

	fmt.Printf("DEBUG: GetMyFiles returning %d files\n", len(files))
	return files, nil
}

func (r *Resolver) GetFile(ctx context.Context, id string) (*domain.File, error) {
	// File service not available yet
	return nil, fmt.Errorf("file service not available")
}

// Storage Stats
func (r *Resolver) GetStorageStats(ctx context.Context) (*domain.StorageStats, error) {
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Mock storage stats for now
	stats := &domain.StorageStats{
		UserID:                id,
		TotalUsed:             1024000,
		OriginalSize:          2048000,
		Savings:               1024000,
		SavingsPercentage:     50.0,
		TotalUsedFormatted:    "1 MB",
		OriginalSizeFormatted: "2 MB",
		SavingsFormatted:      "1 MB",
	}

	return stats, nil
}

// File Sharing Resolvers

func (r *Resolver) SearchUsers(ctx context.Context, query string, limit *int) ([]*domain.User, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Default limit
	defaultLimit := 10
	if limit == nil {
		limit = &defaultLimit
	}

	users, err := r.fileSharingService.SearchUsers(ctx, query, *limit, userUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}

	return users, nil
}

func (r *Resolver) FileShareInfo(ctx context.Context, fileID string) (*FileShareInfo, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	fileUUID, err := uuid.Parse(fileID)
	if err != nil {
		return nil, fmt.Errorf("invalid file ID")
	}

	shareInfo, err := r.fileSharingService.GetFileShareInfo(ctx, fileUUID, userUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to get file share info: %w", err)
	}

	// Convert to GraphQL type
	var sharedWithUsers []*FileShareWithUser
	for _, share := range shareInfo.SharedWithUsers {
		sharedWithUsers = append(sharedWithUsers, &FileShareWithUser{
			ID:                share.ID.String(),
			SharedWithUserID:  share.SharedWithUserID.String(),
			PermissionType:    string(share.PermissionType),
			CreatedAt:         share.CreatedAt,
			SharedWith:        share.SharedWith,
		})
	}

	return &FileShareInfo{
		IsShared:        shareInfo.IsShared,
		ShareToken:      shareInfo.ShareToken,
		ShareURL:        shareInfo.ShareURL,
		SharedWithUsers: sharedWithUsers,
		DownloadCount:   shareInfo.DownloadCount,
	}, nil
}

func (r *Resolver) ShareFileWithUser(ctx context.Context, input ShareFileInput) (*domain.FileShare, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	fileUUID, err := uuid.Parse(input.FileID)
	if err != nil {
		return nil, fmt.Errorf("invalid file ID")
	}

	sharedWithUserUUID, err := uuid.Parse(input.SharedWithUserID)
	if err != nil {
		return nil, fmt.Errorf("invalid shared with user ID")
	}

	shareInput := domain.ShareFileInput{
		FileID:           fileUUID,
		SharedWithUserID: sharedWithUserUUID,
		PermissionType:   domain.PermissionType(input.PermissionType),
		ExpiresAt:        input.ExpiresAt,
	}

	fileShare, err := r.fileSharingService.ShareWithUser(ctx, shareInput, userUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to share file: %w", err)
	}

	return fileShare, nil
}

func (r *Resolver) RemoveFileShare(ctx context.Context, fileID, sharedWithUserID string) (bool, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return false, errors.New("unauthorized")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return false, errors.New("invalid user ID")
	}

	fileUUID, err := uuid.Parse(fileID)
	if err != nil {
		return false, fmt.Errorf("invalid file ID")
	}

	sharedWithUserUUID, err := uuid.Parse(sharedWithUserID)
	if err != nil {
		return false, fmt.Errorf("invalid shared with user ID")
	}

	err = r.fileSharingService.RemoveUserShare(ctx, fileUUID, sharedWithUserUUID, userUUID)
	if err != nil {
		return false, fmt.Errorf("failed to remove file share: %w", err)
	}

	return true, nil
}

func (r *Resolver) CreatePublicShare(ctx context.Context, fileID string) (*PublicShareResponse, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	fileUUID, err := uuid.Parse(fileID)
	if err != nil {
		return nil, fmt.Errorf("invalid file ID")
	}

	shareResponse, err := r.fileSharingService.CreatePublicShare(ctx, fileUUID, userUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to create public share: %w", err)
	}

	return &PublicShareResponse{
		ShareToken: shareResponse.ShareToken,
		ShareURL:   shareResponse.ShareURL,
	}, nil
}

func (r *Resolver) RemovePublicShare(ctx context.Context, fileID string) (bool, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return false, errors.New("unauthorized")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return false, errors.New("invalid user ID")
	}

	fileUUID, err := uuid.Parse(fileID)
	if err != nil {
		return false, fmt.Errorf("invalid file ID")
	}

	err = r.fileSharingService.RemovePublicShare(ctx, fileUUID, userUUID)
	if err != nil {
		return false, fmt.Errorf("failed to remove public share: %w", err)
	}

	return true, nil
}

func (r *Resolver) SharedWithMe(ctx context.Context, limit, offset *int) ([]*domain.File, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	// Set default values
	defaultLimit := 20
	defaultOffset := 0
	if limit == nil {
		limit = &defaultLimit
	}
	if offset == nil {
		offset = &defaultOffset
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Get shared files from database
	files, err := r.fileSharingService.GetSharedWithMeFiles(ctx, userUUID, *limit, *offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get shared files: %w", err)
	}

	return files, nil
}