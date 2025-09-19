package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
)

type UserRepository struct {
	db     *pgxpool.Pool
	logger *zap.Logger
}

func NewUserRepository(db *pgxpool.Pool, logger *zap.Logger) *UserRepository {
	return &UserRepository{
		db:     db,
		logger: logger,
	}
}

func (r *UserRepository) Create(user *domain.User) error {
	query := `
		INSERT INTO users (id, email, name, profile_image, password_hash, role, storage_used, storage_quota,
		                  email_verified, enterprise_id, enterprise_role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	ctx := context.Background()
	_, err := r.db.Exec(ctx, query,
		user.ID, user.Email, user.Name, user.ProfileImage, user.PasswordHash, user.Role,
		user.StorageUsed, user.StorageQuota, user.EmailVerified, user.EnterpriseID, user.EnterpriseRole,
		user.CreatedAt, user.UpdatedAt)

	if err != nil {
		r.logger.Error("Failed to create user", zap.Error(err))
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

func (r *UserRepository) GetByID(id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, email, name, profile_image, password_hash, role, storage_used, storage_quota,
		       email_verified, email_verification_token, email_verification_expires_at,
		       reset_password_token, reset_password_expires_at, last_login_at,
		       enterprise_id, enterprise_role, created_at, updated_at
		FROM users WHERE id = $1`

	user := &domain.User{}
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, id)

	err := row.Scan(
		&user.ID, &user.Email, &user.Name, &user.ProfileImage, &user.PasswordHash, &user.Role,
		&user.StorageUsed, &user.StorageQuota, &user.EmailVerified, &user.EmailVerificationToken,
		&user.EmailVerificationExpiresAt, &user.ResetPasswordToken, &user.ResetPasswordExpiresAt,
		&user.LastLoginAt, &user.EnterpriseID, &user.EnterpriseRole, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		r.logger.Error("Failed to get user by ID", zap.Error(err))
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) GetByEmail(email string) (*domain.User, error) {
	query := `
		SELECT id, email, name, profile_image, password_hash, role, storage_used, storage_quota,
		       email_verified, email_verification_token, email_verification_expires_at,
		       reset_password_token, reset_password_expires_at, last_login_at,
		       enterprise_id, enterprise_role, created_at, updated_at
		FROM users WHERE email = $1`

	user := &domain.User{}
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, email)

	err := row.Scan(
		&user.ID, &user.Email, &user.Name, &user.ProfileImage, &user.PasswordHash, &user.Role,
		&user.StorageUsed, &user.StorageQuota, &user.EmailVerified, &user.EmailVerificationToken,
		&user.EmailVerificationExpiresAt, &user.ResetPasswordToken, &user.ResetPasswordExpiresAt,
		&user.LastLoginAt, &user.EnterpriseID, &user.EnterpriseRole, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		r.logger.Error("Failed to get user by email", zap.Error(err))
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) Update(user *domain.User) error {
	query := `
		UPDATE users
		SET name = $2, profile_image = $3, password_hash = $4, role = $5, storage_used = $6,
		    storage_quota = $7, email_verified = $8, email_verification_token = $9,
		    email_verification_expires_at = $10, reset_password_token = $11,
		    reset_password_expires_at = $12, last_login_at = $13, enterprise_id = $14,
		    enterprise_role = $15, updated_at = $16
		WHERE id = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query,
		user.ID, user.Name, user.ProfileImage, user.PasswordHash, user.Role,
		user.StorageUsed, user.StorageQuota, user.EmailVerified, user.EmailVerificationToken,
		user.EmailVerificationExpiresAt, user.ResetPasswordToken, user.ResetPasswordExpiresAt,
		user.LastLoginAt, user.EnterpriseID, user.EnterpriseRole, user.UpdatedAt)

	if err != nil {
		r.logger.Error("Failed to update user", zap.Error(err))
		return fmt.Errorf("failed to update user: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (r *UserRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		r.logger.Error("Failed to delete user", zap.Error(err))
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (r *UserRepository) UpdateStorageUsed(userID uuid.UUID, storageUsed int64) error {
	query := `UPDATE users SET storage_used = $2 WHERE id = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query, userID, storageUsed)
	if err != nil {
		r.logger.Error("Failed to update user storage", zap.Error(err))
		return fmt.Errorf("failed to update user storage: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (r *UserRepository) List(limit, offset int) ([]*domain.User, error) {
	query := `
		SELECT id, email, name, profile_image, password_hash, role, storage_used, storage_quota,
		       email_verified, enterprise_id, enterprise_role, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		r.logger.Error("Failed to list users", zap.Error(err))
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		user := &domain.User{}
		err := rows.Scan(
			&user.ID, &user.Email, &user.Name, &user.ProfileImage, &user.PasswordHash, &user.Role,
			&user.StorageUsed, &user.StorageQuota, &user.EmailVerified, &user.EnterpriseID,
			&user.EnterpriseRole, &user.CreatedAt, &user.UpdatedAt)

		if err != nil {
			r.logger.Error("Failed to scan user", zap.Error(err))
			continue
		}

		users = append(users, user)
	}

	return users, nil
}

func (r *UserRepository) GetStorageStats(userID uuid.UUID) (*domain.StorageStats, error) {
	query := `
		SELECT
			u.id,
			u.storage_used,
			COALESCE(SUM(fc.file_size), 0) as original_size
		FROM users u
		LEFT JOIN files f ON f.user_id = u.id
		LEFT JOIN file_contents fc ON fc.content_hash = f.content_hash
		WHERE u.id = $1
		GROUP BY u.id, u.storage_used`

	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, userID)

	stats := &domain.StorageStats{}
	var originalSize int64

	err := row.Scan(&stats.UserID, &stats.TotalUsed, &originalSize)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		r.logger.Error("Failed to get storage stats", zap.Error(err))
		return nil, fmt.Errorf("failed to get storage stats: %w", err)
	}

	stats.OriginalSize = originalSize
	stats.Savings = originalSize - stats.TotalUsed
	if originalSize > 0 {
		stats.SavingsPercentage = float64(stats.Savings) / float64(originalSize) * 100
	}

	// Format sizes
	stats.TotalUsedFormatted = formatBytes(stats.TotalUsed)
	stats.OriginalSizeFormatted = formatBytes(stats.OriginalSize)
	stats.SavingsFormatted = formatBytes(stats.Savings)

	return stats, nil
}

// formatBytes formats bytes into human readable format
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}