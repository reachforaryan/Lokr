package domain

import (
	"time"

	"github.com/google/uuid"
)

// AuditAction represents the type of action being logged
type AuditAction string

const (
	// File operations
	ActionFileUpload    AuditAction = "FILE_UPLOAD"
	ActionFileDownload  AuditAction = "FILE_DOWNLOAD"
	ActionFilePreview   AuditAction = "FILE_PREVIEW"
	ActionFileDelete    AuditAction = "FILE_DELETE"
	ActionFileMove      AuditAction = "FILE_MOVE"
	ActionFileRename    AuditAction = "FILE_RENAME"

	// Sharing operations
	ActionFileShare     AuditAction = "FILE_SHARE"
	ActionFileUnshare   AuditAction = "FILE_UNSHARE"
	ActionPublicShare   AuditAction = "PUBLIC_SHARE"
	ActionPublicUnshare AuditAction = "PUBLIC_UNSHARE"

	// Folder operations
	ActionFolderCreate  AuditAction = "FOLDER_CREATE"
	ActionFolderDelete  AuditAction = "FOLDER_DELETE"
	ActionFolderMove    AuditAction = "FOLDER_MOVE"
	ActionFolderRename  AuditAction = "FOLDER_RENAME"

	// Authentication
	ActionUserLogin     AuditAction = "USER_LOGIN"
	ActionUserLogout    AuditAction = "USER_LOGOUT"
	ActionUserRegister  AuditAction = "USER_REGISTER"
)

// AuditStatus represents the result of the action
type AuditStatus string

const (
	StatusSuccess AuditStatus = "SUCCESS"
	StatusFailed  AuditStatus = "FAILED"
	StatusPending AuditStatus = "PENDING"
)

// AuditLog represents a single audit log entry
type AuditLog struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"userId"`
	User         *User      `json:"user,omitempty"`
	Action       AuditAction `json:"action"`
	Status       AuditStatus `json:"status"`
	ResourceType string     `json:"resourceType"` // "file", "folder", "user", etc.
	ResourceID   *uuid.UUID `json:"resourceId,omitempty"`
	ResourceName string     `json:"resourceName"`
	Description  string     `json:"description"`
	IPAddress    string     `json:"ipAddress"`
	UserAgent    string     `json:"userAgent"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"` // Additional context data
	CreatedAt    time.Time  `json:"createdAt"`
}

// AuditLogEntry is used for creating new audit entries
type AuditLogEntry struct {
	UserID       uuid.UUID  `json:"userId"`
	Action       AuditAction `json:"action"`
	Status       AuditStatus `json:"status"`
	ResourceType string     `json:"resourceType"`
	ResourceID   *uuid.UUID `json:"resourceId,omitempty"`
	ResourceName string     `json:"resourceName"`
	Description  string     `json:"description"`
	IPAddress    string     `json:"ipAddress"`
	UserAgent    string     `json:"userAgent"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// FormatDescription creates a human-readable description for common actions
func (entry *AuditLogEntry) FormatDescription() string {
	switch entry.Action {
	case ActionFileUpload:
		return "Uploaded file: " + entry.ResourceName
	case ActionFileDownload:
		return "Downloaded file: " + entry.ResourceName
	case ActionFilePreview:
		return "Previewed file: " + entry.ResourceName
	case ActionFileDelete:
		return "Deleted file: " + entry.ResourceName
	case ActionFileShare:
		return "Shared file: " + entry.ResourceName
	case ActionFileUnshare:
		return "Unshared file: " + entry.ResourceName
	case ActionPublicShare:
		return "Made file public: " + entry.ResourceName
	case ActionPublicUnshare:
		return "Made file private: " + entry.ResourceName
	case ActionFolderCreate:
		return "Created folder: " + entry.ResourceName
	case ActionFolderDelete:
		return "Deleted folder: " + entry.ResourceName
	case ActionUserLogin:
		return "User logged in"
	case ActionUserLogout:
		return "User logged out"
	case ActionUserRegister:
		return "User registered"
	default:
		return entry.Description
	}
}