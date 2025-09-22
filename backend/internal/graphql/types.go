package graphql

import (
	"time"

	"lokr-backend/internal/domain"
)

// GraphQL Input Types
type CreateUserInput struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Password string `json:"password"`
}

type UpdateUserInput struct {
	Name         *string `json:"name"`
	ProfileImage *string `json:"profileImage"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type FileUploadInput struct {
	FolderID    *string                  `json:"folderId"`
	Description *string                  `json:"description"`
	Tags        []string                 `json:"tags"`
	Visibility  *domain.FileVisibility   `json:"visibility"`
}

type ShareFileInput struct {
	FileID           string     `json:"fileId"`
	SharedWithUserID string     `json:"sharedWithUserId"`
	PermissionType   string     `json:"permissionType"`
	ExpiresAt        *time.Time `json:"expiresAt"`
}

type CreateFolderInput struct {
	Name     string  `json:"name"`
	ParentID *string `json:"parentId"`
}

type UpdateFolderInput struct {
	Name     *string `json:"name"`
	ParentID *string `json:"parentId"`
}

type CreateFileReferenceInput struct {
	FileID   string  `json:"fileId"`
	FolderID string  `json:"folderId"`
	Name     *string `json:"name"`
}

// GraphQL Response Types
type AuthPayload struct {
	Token        string      `json:"token"`
	RefreshToken string      `json:"refreshToken"`
	User         *domain.User `json:"user"`
}

type UserResponse struct {
	ID                  string                     `json:"id"`
	Email               string                     `json:"email"`
	Name                string                     `json:"name"`
	ProfileImage        *string                    `json:"profileImage"`
	Role                domain.Role                `json:"role"`
	StorageUsed         int64                      `json:"storageUsed"`
	StorageQuota        int64                      `json:"storageQuota"`
	EmailVerified       bool                       `json:"emailVerified"`
	LastLoginAt         *time.Time                 `json:"lastLoginAt"`
	EnterpriseID        *string                    `json:"enterpriseId"`
	EnterpriseRole      *domain.EnterpriseRole     `json:"enterpriseRole"`
	Enterprise          *domain.Enterprise         `json:"enterprise"`
	CreatedAt           time.Time                  `json:"createdAt"`
	UpdatedAt           time.Time                  `json:"updatedAt"`
}

// Conversion functions
func UserToGraphQL(user *domain.User) *UserResponse {
	if user == nil {
		return nil
	}

	resp := &UserResponse{
		ID:                  user.ID.String(),
		Email:               user.Email,
		Name:                user.Name,
		ProfileImage:        user.ProfileImage,
		Role:                user.Role,
		StorageUsed:         user.StorageUsed,
		StorageQuota:        user.StorageQuota,
		EmailVerified:       user.EmailVerified,
		LastLoginAt:         user.LastLoginAt,
		Enterprise:          user.Enterprise,
		CreatedAt:           user.CreatedAt,
		UpdatedAt:           user.UpdatedAt,
		EnterpriseRole:      user.EnterpriseRole,
	}

	if user.EnterpriseID != nil {
		enterpriseID := user.EnterpriseID.String()
		resp.EnterpriseID = &enterpriseID
	}

	return resp
}

func CreateUserInputToDomain(input CreateUserInput) domain.CreateUserRequest {
	return domain.CreateUserRequest{
		Email:    input.Email,
		Name:     input.Name,
		Password: input.Password,
	}
}

func UpdateUserInputToDomain(input UpdateUserInput) domain.UpdateUserRequest {
	return domain.UpdateUserRequest{
		Name:         input.Name,
		ProfileImage: input.ProfileImage,
	}
}

// File Sharing Types
type FileShareInfo struct {
	IsShared        bool                   `json:"isShared"`
	ShareToken      string                 `json:"shareToken,omitempty"`
	ShareURL        string                 `json:"shareUrl,omitempty"`
	SharedWithUsers []*FileShareWithUser   `json:"sharedWithUsers"`
	DownloadCount   int                    `json:"downloadCount"`
}

type FileShareWithUser struct {
	ID               string        `json:"id"`
	SharedWithUserID string        `json:"shared_with_user_id"`
	PermissionType   string        `json:"permission_type"`
	CreatedAt        time.Time     `json:"created_at"`
	SharedWith       *domain.User  `json:"shared_with"`
}

type PublicShareResponse struct {
	ShareToken string `json:"shareToken"`
	ShareURL   string `json:"shareUrl"`
}