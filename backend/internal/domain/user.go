package domain

import (
	"time"

	"github.com/google/uuid"
)

// Role represents user roles
type Role string

const (
	RoleUser  Role = "USER"
	RoleAdmin Role = "ADMIN"
)

// User represents a user in the system
type User struct {
	ID                         uuid.UUID       `json:"id" db:"id"`
	Email                      string          `json:"email" db:"email"`
	Name                       string          `json:"name" db:"name"`
	ProfileImage               *string         `json:"profile_image" db:"profile_image"`
	PasswordHash               string          `json:"-" db:"password_hash"` // Required for internal auth, hidden from JSON
	Role                       Role            `json:"role" db:"role"`
	StorageUsed                int64           `json:"storage_used" db:"storage_used"`
	StorageQuota               int64           `json:"storage_quota" db:"storage_quota"`
	EmailVerified              bool            `json:"email_verified" db:"email_verified"`
	EmailVerificationToken     *string         `json:"-" db:"email_verification_token"` // Hidden from JSON
	EmailVerificationExpiresAt *time.Time      `json:"-" db:"email_verification_expires_at"`
	ResetPasswordToken         *string         `json:"-" db:"reset_password_token"`
	ResetPasswordExpiresAt     *time.Time      `json:"-" db:"reset_password_expires_at"`
	LastLoginAt                *time.Time      `json:"last_login_at" db:"last_login_at"`
	EnterpriseID               *uuid.UUID      `json:"enterprise_id" db:"enterprise_id"`
	EnterpriseRole             *EnterpriseRole `json:"enterprise_role" db:"enterprise_role"`
	CreatedAt                  time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt                  time.Time       `json:"updated_at" db:"updated_at"`

	// Relations (not stored in DB)
	Enterprise *Enterprise `json:"enterprise,omitempty"`
}

// CreateUserRequest represents a request to create a new user
type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name" validate:"required,min=2,max=100"`
	Password string `json:"password" validate:"required,min=8"`
}

// UpdateUserRequest represents a request to update user information
type UpdateUserRequest struct {
	Name         *string `json:"name" validate:"omitempty,min=2,max=100"`
	ProfileImage *string `json:"profile_image" validate:"omitempty,url"`
}

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(user *User) error
	GetByID(id uuid.UUID) (*User, error)
	GetByEmail(email string) (*User, error)
	Update(user *User) error
	Delete(id uuid.UUID) error
	UpdateStorageUsed(userID uuid.UUID, storageUsed int64) error
	List(limit, offset int) ([]*User, error)
	GetStorageStats(userID uuid.UUID) (*StorageStats, error)
}

// StorageStats represents user storage statistics
type StorageStats struct {
	UserID              uuid.UUID `json:"user_id"`
	TotalUsed           int64     `json:"total_used"`
	OriginalSize        int64     `json:"original_size"`
	Savings             int64     `json:"savings"`
	SavingsPercentage   float64   `json:"savings_percentage"`
	TotalUsedFormatted  string    `json:"total_used_formatted"`
	OriginalSizeFormatted string  `json:"original_size_formatted"`
	SavingsFormatted    string    `json:"savings_formatted"`
}