package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// FileVisibility represents file visibility settings
type FileVisibility string

const (
	VisibilityPrivate        FileVisibility = "PRIVATE"
	VisibilityPublic         FileVisibility = "PUBLIC"
	VisibilitySharedWithUsers FileVisibility = "SHARED_WITH_USERS"
)

// PermissionType represents sharing permission types
type PermissionType string

const (
	PermissionView     PermissionType = "VIEW"
	PermissionDownload PermissionType = "DOWNLOAD"
	PermissionEdit     PermissionType = "EDIT"
	PermissionDelete   PermissionType = "DELETE"
)

// File represents a file in the system
type File struct {
	ID            uuid.UUID      `json:"id" db:"id"`
	UserID        uuid.UUID      `json:"user_id" db:"user_id"`
	FolderID      *uuid.UUID     `json:"folder_id" db:"folder_id"`
	Filename      string         `json:"filename" db:"filename"`
	OriginalName  string         `json:"original_name" db:"original_name"`
	MimeType      string         `json:"mime_type" db:"mime_type"`
	FileSize      int64          `json:"file_size" db:"file_size"`
	ContentHash   string         `json:"content_hash" db:"content_hash"`
	Description   *string        `json:"description" db:"description"`
	Tags          pq.StringArray `json:"tags" db:"tags"`
	Visibility    FileVisibility `json:"visibility" db:"visibility"`
	ShareToken    *string        `json:"share_token" db:"share_token"`
	DownloadCount int            `json:"download_count" db:"download_count"`
	UploadDate    time.Time      `json:"upload_date" db:"upload_date"`
	UpdatedAt     time.Time      `json:"updated_at" db:"updated_at"`

	// Relations (populated by joins or separate queries)
	User    *User        `json:"user,omitempty"`
	Folder  *Folder      `json:"folder,omitempty"`
	Content *FileContent `json:"content,omitempty"`
	Shares  []*FileShare `json:"shares,omitempty"`
}

// FileContent represents deduplicated file content
type FileContent struct {
	ContentHash    string     `json:"content_hash" db:"content_hash"`
	FilePath       string     `json:"file_path" db:"file_path"`
	FileSize       int64      `json:"file_size" db:"file_size"`
	ReferenceCount int        `json:"reference_count" db:"reference_count"`
	EnterpriseID   *uuid.UUID `json:"enterprise_id" db:"enterprise_id"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
}

// Folder represents a folder for organizing files
type Folder struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Name      string     `json:"name" db:"name"`
	ParentID  *uuid.UUID `json:"parent_id" db:"parent_id"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`

	// Relations
	Parent   *Folder `json:"parent,omitempty"`
	Children []*Folder `json:"children,omitempty"`
	Files    []*File `json:"files,omitempty"`
}

// FileShare represents file sharing permissions
type FileShare struct {
	ID               uuid.UUID      `json:"id" db:"id"`
	FileID           uuid.UUID      `json:"file_id" db:"file_id"`
	SharedByUserID   uuid.UUID      `json:"shared_by_user_id" db:"shared_by_user_id"`
	SharedWithUserID uuid.UUID      `json:"shared_with_user_id" db:"shared_with_user_id"`
	PermissionType   PermissionType `json:"permission_type" db:"permission_type"`
	ExpiresAt        *time.Time     `json:"expires_at" db:"expires_at"`
	LastAccessedAt   *time.Time     `json:"last_accessed_at" db:"last_accessed_at"`
	AccessCount      int            `json:"access_count" db:"access_count"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`

	// Relations
	File         *File `json:"file,omitempty"`
	SharedBy     *User `json:"shared_by,omitempty"`
	SharedWith   *User `json:"shared_with,omitempty"`
}

// FileUploadRequest represents a file upload request
type FileUploadRequest struct {
	UserID      uuid.UUID      `json:"user_id" validate:"required"`
	FolderID    *uuid.UUID     `json:"folder_id"`
	Filename    string         `json:"filename" validate:"required"`
	MimeType    string         `json:"mime_type" validate:"required"`
	FileSize    int64          `json:"file_size" validate:"required,min=1"`
	Content     []byte         `json:"content" validate:"required"`
	Description *string        `json:"description"`
	Tags        []string       `json:"tags"`
	Visibility  FileVisibility `json:"visibility"`
}

// FileUpdateRequest represents a file update request
type FileUpdateRequest struct {
	Filename    *string        `json:"filename" validate:"omitempty,min=1"`
	Description *string        `json:"description"`
	Tags        *[]string      `json:"tags"`
	Visibility  *FileVisibility `json:"visibility"`
	FolderID    *uuid.UUID     `json:"folder_id"`
}

// FileSearchRequest represents file search parameters
type FileSearchRequest struct {
	UserID        *uuid.UUID      `json:"user_id"`
	Query         *string         `json:"query"`
	MimeTypes     []string        `json:"mime_types"`
	MinSize       *int64          `json:"min_size"`
	MaxSize       *int64          `json:"max_size"`
	UploadedAfter *time.Time      `json:"uploaded_after"`
	UploadedBefore *time.Time     `json:"uploaded_before"`
	Tags          []string        `json:"tags"`
	UploaderID    *uuid.UUID      `json:"uploader_id"`
	Visibility    *FileVisibility `json:"visibility"`
	Limit         int             `json:"limit" validate:"min=1,max=100"`
	Offset        int             `json:"offset" validate:"min=0"`
	SortBy        string          `json:"sort_by" validate:"oneof=name size upload_date download_count"`
	SortOrder     string          `json:"sort_order" validate:"oneof=asc desc"`
}

// FileShareRequest represents a file sharing request
type FileShareRequest struct {
	FileID         uuid.UUID        `json:"file_id" validate:"required"`
	UserIDs        []uuid.UUID      `json:"user_ids" validate:"required,dive,required"`
	PermissionType PermissionType   `json:"permission_type" validate:"required"`
	ExpiresAt      *time.Time       `json:"expires_at"`
}

type ShareFileInput struct {
	FileID         uuid.UUID       `json:"fileId"`
	SharedWithUserID uuid.UUID     `json:"sharedWithUserId"`
	PermissionType PermissionType  `json:"permissionType"`
	ExpiresAt      *time.Time      `json:"expiresAt,omitempty"`
}

type PublicShareResponse struct {
	ShareToken string `json:"shareToken"`
	ShareURL   string `json:"shareUrl"`
}

type FileShareInfo struct {
	IsShared       bool            `json:"isShared"`
	ShareToken     string          `json:"shareToken,omitempty"`
	ShareURL       string          `json:"shareUrl,omitempty"`
	SharedWithUsers []FileShare     `json:"sharedWithUsers"`
	DownloadCount   int            `json:"downloadCount"`
}

// FileRepository defines the interface for file data operations
type FileRepository interface {
	Create(file *File) error
	GetByID(id uuid.UUID) (*File, error)
	GetByUserID(userID uuid.UUID, limit, offset int) ([]*File, error)
	GetByContentHash(hash string) (*File, error)
	Update(file *File) error
	Delete(id uuid.UUID) error
	Search(request *FileSearchRequest) ([]*File, int, error)
	GetPublicFile(shareToken string) (*File, error)
	IncrementDownloadCount(id uuid.UUID) error
	GetSharedWithUser(userID uuid.UUID, limit, offset int) ([]*File, error)
}

// FileContentRepository defines the interface for file content operations
type FileContentRepository interface {
	Create(content *FileContent) error
	GetByHash(hash string) (*FileContent, error)
	IncrementReference(hash string) error
	DecrementReference(hash string) error
	Delete(hash string) error
	GetOrphaned() ([]*FileContent, error)
}

// FolderRepository defines the interface for folder operations
type FolderRepository interface {
	Create(folder *Folder) error
	GetByID(id uuid.UUID) (*Folder, error)
	GetByUserID(userID uuid.UUID) ([]*Folder, error)
	GetChildren(parentID uuid.UUID) ([]*Folder, error)
	Update(folder *Folder) error
	Delete(id uuid.UUID) error
}

// FileReference represents a reference/shortcut to a file in a folder
type FileReference struct {
	ID        uuid.UUID `json:"id" db:"id"`
	FolderID  uuid.UUID `json:"folder_id" db:"folder_id"`
	FileID    uuid.UUID `json:"file_id" db:"file_id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Name      *string   `json:"name" db:"name"`        // Optional custom name for the reference
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	// Relations
	File   *File   `json:"file,omitempty"`
	Folder *Folder `json:"folder,omitempty"`
	User   *User   `json:"user,omitempty"`
}

// FileShareRepository defines the interface for file sharing operations
type FileShareRepository interface {
	Create(share *FileShare) error
	GetByID(id uuid.UUID) (*FileShare, error)
	GetByFileID(fileID uuid.UUID) ([]*FileShare, error)
	GetSharedWithUser(userID uuid.UUID, limit, offset int) ([]*FileShare, error)
	GetSharedByUser(userID uuid.UUID, limit, offset int) ([]*FileShare, error)
	Update(share *FileShare) error
	Delete(id uuid.UUID) error
	DeleteByFileID(fileID uuid.UUID) error
}

// FileReferenceRepository defines the interface for file reference operations
type FileReferenceRepository interface {
	Create(reference *FileReference) error
	GetByID(id uuid.UUID) (*FileReference, error)
	GetByFolderID(folderID uuid.UUID) ([]*FileReference, error)
	GetByFileID(fileID uuid.UUID) ([]*FileReference, error)
	Delete(id uuid.UUID) error
	DeleteByFileID(fileID uuid.UUID) error
	DeleteByFolderID(folderID uuid.UUID) error
}