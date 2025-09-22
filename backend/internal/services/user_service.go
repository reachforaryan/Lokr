package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"lokr-backend/internal/domain"
)

type UserService struct {
	db *pgxpool.Pool
}

func NewUserService(db *pgxpool.Pool) *UserService {
	return &UserService{db: db}
}

func (s *UserService) CreateUser(email, name, password string) (*domain.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &domain.User{
		ID:             uuid.New(),
		Email:          email,
		Name:           name,
		PasswordHash:   string(hashedPassword),
		Role:           domain.RoleUser,
		StorageUsed:    0,
		StorageQuota:   10 * 1024 * 1024, // 10MB default
		EmailVerified:  false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Get default enterprise ID
	var enterpriseID uuid.UUID
	err = s.db.QueryRow(context.Background(), "SELECT id FROM enterprises WHERE slug = 'lokr-main' LIMIT 1").Scan(&enterpriseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get default enterprise: %w", err)
	}

	user.EnterpriseID = &enterpriseID
	enterpriseRole := domain.EnterpriseRole("MEMBER")
	user.EnterpriseRole = &enterpriseRole

	query := `
		INSERT INTO users (id, email, name, password_hash, role, storage_used, storage_quota, email_verified, enterprise_id, enterprise_role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err = s.db.Exec(context.Background(), query,
		user.ID, user.Email, user.Name, user.PasswordHash, user.Role,
		user.StorageUsed, user.StorageQuota, user.EmailVerified, user.EnterpriseID, user.EnterpriseRole,
		user.CreatedAt, user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (s *UserService) GetUserByEmail(email string) (*domain.User, error) {
	query := `
		SELECT id, email, name, profile_image, password_hash, role, storage_used, storage_quota,
		       email_verified, last_login_at, enterprise_id, enterprise_role, created_at, updated_at
		FROM users WHERE email = $1`

	user := &domain.User{}
	err := s.db.QueryRow(context.Background(), query, email).Scan(
		&user.ID, &user.Email, &user.Name, &user.ProfileImage, &user.PasswordHash,
		&user.Role, &user.StorageUsed, &user.StorageQuota, &user.EmailVerified,
		&user.LastLoginAt, &user.EnterpriseID, &user.EnterpriseRole, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return user, nil
}

func (s *UserService) GetUserByID(id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, email, name, profile_image, password_hash, role, storage_used, storage_quota,
		       email_verified, last_login_at, enterprise_id, enterprise_role, created_at, updated_at
		FROM users WHERE id = $1`

	user := &domain.User{}
	err := s.db.QueryRow(context.Background(), query, id).Scan(
		&user.ID, &user.Email, &user.Name, &user.ProfileImage, &user.PasswordHash,
		&user.Role, &user.StorageUsed, &user.StorageQuota, &user.EmailVerified,
		&user.LastLoginAt, &user.EnterpriseID, &user.EnterpriseRole, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return user, nil
}

func (s *UserService) UpdateLastLogin(userID uuid.UUID) error {
	query := `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`
	_, err := s.db.Exec(context.Background(), query, userID)
	return err
}