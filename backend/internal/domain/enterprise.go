package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Enterprise represents a business organization using Lokr
type Enterprise struct {
	ID                  uuid.UUID              `json:"id" db:"id"`
	Name                string                 `json:"name" db:"name" validate:"required,min=2,max=255"`
	Slug                string                 `json:"slug" db:"slug" validate:"required,min=2,max=100,alpha_dash"`
	Domain              *string                `json:"domain" db:"domain" validate:"omitempty,hostname"`
	StorageQuota        int64                  `json:"storage_quota" db:"storage_quota" validate:"min=0"`
	StorageUsed         int64                  `json:"storage_used" db:"storage_used"`
	MaxUsers            int                    `json:"max_users" db:"max_users" validate:"min=1"`
	CurrentUsers        int                    `json:"current_users" db:"current_users"`
	Settings            map[string]interface{} `json:"settings" db:"settings"`
	SubscriptionPlan    SubscriptionPlan       `json:"subscription_plan" db:"subscription_plan"`
	SubscriptionStatus  SubscriptionStatus     `json:"subscription_status" db:"subscription_status"`
	SubscriptionExpires *time.Time             `json:"subscription_expires_at" db:"subscription_expires_at"`
	BillingEmail        *string                `json:"billing_email" db:"billing_email" validate:"omitempty,email"`
	CreatedAt           time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at" db:"updated_at"`
}

type SubscriptionPlan string

const (
	SubscriptionPlanBasic      SubscriptionPlan = "BASIC"
	SubscriptionPlanStandard   SubscriptionPlan = "STANDARD"
	SubscriptionPlanPremium    SubscriptionPlan = "PREMIUM"
	SubscriptionPlanEnterprise SubscriptionPlan = "ENTERPRISE"
)

type SubscriptionStatus string

const (
	SubscriptionStatusActive    SubscriptionStatus = "ACTIVE"
	SubscriptionStatusSuspended SubscriptionStatus = "SUSPENDED"
	SubscriptionStatusCancelled SubscriptionStatus = "CANCELLED"
)

type EnterpriseRole string

const (
	EnterpriseRoleOwner  EnterpriseRole = "OWNER"
	EnterpriseRoleAdmin  EnterpriseRole = "ADMIN"
	EnterpriseRoleMember EnterpriseRole = "MEMBER"
)

// EnterpriseInvitation represents an invitation to join an enterprise
type EnterpriseInvitation struct {
	ID             uuid.UUID      `json:"id" db:"id"`
	EnterpriseID   uuid.UUID      `json:"enterprise_id" db:"enterprise_id"`
	Email          string         `json:"email" db:"email" validate:"required,email"`
	InvitedByID    uuid.UUID      `json:"invited_by_user_id" db:"invited_by_user_id"`
	Role           EnterpriseRole `json:"role" db:"role"`
	Token          string         `json:"token" db:"token"`
	ExpiresAt      time.Time      `json:"expires_at" db:"expires_at"`
	AcceptedAt     *time.Time     `json:"accepted_at" db:"accepted_at"`
	CreatedAt      time.Time      `json:"created_at" db:"created_at"`

	// Relations
	Enterprise *Enterprise `json:"enterprise,omitempty"`
	InvitedBy  *User       `json:"invited_by,omitempty"`
}

// CreateEnterpriseRequest represents the data needed to create a new enterprise
type CreateEnterpriseRequest struct {
	Name         string                 `json:"name" validate:"required,min=2,max=255"`
	Slug         string                 `json:"slug" validate:"required,min=2,max=100,alpha_dash"`
	Domain       *string                `json:"domain" validate:"omitempty,hostname"`
	BillingEmail *string                `json:"billing_email" validate:"omitempty,email"`
	Settings     map[string]interface{} `json:"settings"`
}

// UpdateEnterpriseRequest represents the data needed to update an enterprise
type UpdateEnterpriseRequest struct {
	Name         *string                `json:"name" validate:"omitempty,min=2,max=255"`
	Domain       *string                `json:"domain" validate:"omitempty,hostname"`
	BillingEmail *string                `json:"billing_email" validate:"omitempty,email"`
	Settings     map[string]interface{} `json:"settings"`
	MaxUsers     *int                   `json:"max_users" validate:"omitempty,min=1"`
	StorageQuota *int64                 `json:"storage_quota" validate:"omitempty,min=0"`
}

// InviteUserRequest represents the data needed to invite a user to an enterprise
type InviteUserRequest struct {
	Email string         `json:"email" validate:"required,email"`
	Role  EnterpriseRole `json:"role" validate:"required,oneof=ADMIN MEMBER"`
}

// EnterpriseStats represents statistics for an enterprise
type EnterpriseStats struct {
	TotalUsers       int     `json:"total_users"`
	TotalFiles       int     `json:"total_files"`
	StorageUsed      int64   `json:"storage_used"`
	StorageQuota     int64   `json:"storage_quota"`
	StorageUsagePerc float64 `json:"storage_usage_percentage"`
	FilesThisMonth   int     `json:"files_this_month"`
	ActiveUsers      int     `json:"active_users"`
}

// S3Path generates the S3 path for files belonging to this enterprise
func (e *Enterprise) S3Path(userID uuid.UUID, contentHash string) string {
	return e.Slug + "/" + userID.String() + "/" + contentHash
}

// CanAddUser checks if the enterprise can add more users
func (e *Enterprise) CanAddUser() bool {
	return e.CurrentUsers < e.MaxUsers
}

// CanUseStorage checks if the enterprise can use the specified amount of storage
func (e *Enterprise) CanUseStorage(size int64) bool {
	return e.StorageUsed+size <= e.StorageQuota
}

// HasExpired checks if the enterprise subscription has expired
func (e *Enterprise) HasExpired() bool {
	if e.SubscriptionExpires == nil {
		return false
	}
	return time.Now().After(*e.SubscriptionExpires)
}

// Custom JSON marshaling for Settings field
func (e *Enterprise) MarshalJSON() ([]byte, error) {
	type Alias Enterprise
	aux := &struct {
		Settings json.RawMessage `json:"settings"`
		*Alias
	}{
		Alias: (*Alias)(e),
	}

	if e.Settings != nil {
		settingsBytes, err := json.Marshal(e.Settings)
		if err != nil {
			return nil, err
		}
		aux.Settings = settingsBytes
	} else {
		aux.Settings = json.RawMessage("{}")
	}

	return json.Marshal(aux)
}

// Custom JSON unmarshaling for Settings field
func (e *Enterprise) UnmarshalJSON(data []byte) error {
	type Alias Enterprise
	aux := &struct {
		Settings json.RawMessage `json:"settings"`
		*Alias
	}{
		Alias: (*Alias)(e),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if len(aux.Settings) > 0 {
		err := json.Unmarshal(aux.Settings, &e.Settings)
		if err != nil {
			return err
		}
	}

	return nil
}

// EnterpriseRepository defines the interface for enterprise data operations
type EnterpriseRepository interface {
	Create(enterprise *Enterprise) error
	GetByID(id uuid.UUID) (*Enterprise, error)
	GetBySlug(slug string) (*Enterprise, error)
	GetByDomain(domain string) (*Enterprise, error)
	Update(enterprise *Enterprise) error
	Delete(id uuid.UUID) error
	List(limit, offset int) ([]*Enterprise, error)
	GetStats(id uuid.UUID) (*EnterpriseStats, error)
	GetUsersByEnterprise(enterpriseID uuid.UUID, limit, offset int) ([]*User, error)
}

// EnterpriseInvitationRepository defines the interface for enterprise invitation operations
type EnterpriseInvitationRepository interface {
	Create(invitation *EnterpriseInvitation) error
	GetByID(id uuid.UUID) (*EnterpriseInvitation, error)
	GetByToken(token string) (*EnterpriseInvitation, error)
	GetByEnterpriseAndEmail(enterpriseID uuid.UUID, email string) (*EnterpriseInvitation, error)
	GetByEnterprise(enterpriseID uuid.UUID, limit, offset int) ([]*EnterpriseInvitation, error)
	Accept(id uuid.UUID) error
	Delete(id uuid.UUID) error
	DeleteExpired() error
}