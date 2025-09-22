package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
)

type EnterpriseRepository struct {
	db     *pgxpool.Pool
	logger *zap.Logger
}

func NewEnterpriseRepository(db *pgxpool.Pool, logger *zap.Logger) *EnterpriseRepository {
	return &EnterpriseRepository{
		db:     db,
		logger: logger,
	}
}

func (r *EnterpriseRepository) Create(enterprise *domain.Enterprise) error {
	settingsJSON, err := json.Marshal(enterprise.Settings)
	if err != nil {
		return fmt.Errorf("failed to marshal settings: %w", err)
	}

	query := `
		INSERT INTO enterprises (id, name, slug, domain, storage_quota, storage_used, max_users,
		                        current_users, settings, subscription_plan, subscription_status,
		                        subscription_expires_at, billing_email, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	ctx := context.Background()
	_, err = r.db.Exec(ctx, query,
		enterprise.ID, enterprise.Name, enterprise.Slug, enterprise.Domain, enterprise.StorageQuota,
		enterprise.StorageUsed, enterprise.MaxUsers, enterprise.CurrentUsers, settingsJSON,
		enterprise.SubscriptionPlan, enterprise.SubscriptionStatus, enterprise.SubscriptionExpires,
		enterprise.BillingEmail, enterprise.CreatedAt, enterprise.UpdatedAt)

	if err != nil {
		r.logger.Error("Failed to create enterprise", zap.Error(err))
		return fmt.Errorf("failed to create enterprise: %w", err)
	}

	return nil
}

func (r *EnterpriseRepository) GetByID(id uuid.UUID) (*domain.Enterprise, error) {
	query := `
		SELECT id, name, slug, domain, storage_quota, storage_used, max_users, current_users,
		       settings, subscription_plan, subscription_status, subscription_expires_at,
		       billing_email, created_at, updated_at
		FROM enterprises WHERE id = $1`

	enterprise := &domain.Enterprise{}
	var settingsJSON []byte
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, id)

	err := row.Scan(
		&enterprise.ID, &enterprise.Name, &enterprise.Slug, &enterprise.Domain,
		&enterprise.StorageQuota, &enterprise.StorageUsed, &enterprise.MaxUsers,
		&enterprise.CurrentUsers, &settingsJSON, &enterprise.SubscriptionPlan,
		&enterprise.SubscriptionStatus, &enterprise.SubscriptionExpires, &enterprise.BillingEmail,
		&enterprise.CreatedAt, &enterprise.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("enterprise not found")
		}
		r.logger.Error("Failed to get enterprise by ID", zap.Error(err))
		return nil, fmt.Errorf("failed to get enterprise: %w", err)
	}

	// Unmarshal settings
	err = json.Unmarshal(settingsJSON, &enterprise.Settings)
	if err != nil {
		r.logger.Error("Failed to unmarshal enterprise settings", zap.Error(err))
		enterprise.Settings = make(map[string]interface{})
	}

	return enterprise, nil
}

func (r *EnterpriseRepository) GetBySlug(slug string) (*domain.Enterprise, error) {
	query := `
		SELECT id, name, slug, domain, storage_quota, storage_used, max_users, current_users,
		       settings, subscription_plan, subscription_status, subscription_expires_at,
		       billing_email, created_at, updated_at
		FROM enterprises WHERE slug = $1`

	enterprise := &domain.Enterprise{}
	var settingsJSON []byte
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, slug)

	err := row.Scan(
		&enterprise.ID, &enterprise.Name, &enterprise.Slug, &enterprise.Domain,
		&enterprise.StorageQuota, &enterprise.StorageUsed, &enterprise.MaxUsers,
		&enterprise.CurrentUsers, &settingsJSON, &enterprise.SubscriptionPlan,
		&enterprise.SubscriptionStatus, &enterprise.SubscriptionExpires, &enterprise.BillingEmail,
		&enterprise.CreatedAt, &enterprise.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("enterprise not found")
		}
		r.logger.Error("Failed to get enterprise by slug", zap.Error(err))
		return nil, fmt.Errorf("failed to get enterprise: %w", err)
	}

	// Unmarshal settings
	err = json.Unmarshal(settingsJSON, &enterprise.Settings)
	if err != nil {
		r.logger.Error("Failed to unmarshal enterprise settings", zap.Error(err))
		enterprise.Settings = make(map[string]interface{})
	}

	return enterprise, nil
}

func (r *EnterpriseRepository) GetByDomain(domain string) (*domain.Enterprise, error) {
	query := `
		SELECT id, name, slug, domain, storage_quota, storage_used, max_users, current_users,
		       settings, subscription_plan, subscription_status, subscription_expires_at,
		       billing_email, created_at, updated_at
		FROM enterprises WHERE domain = $1`

	enterprise := &domain.Enterprise{}
	var settingsJSON []byte
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, domain)

	err := row.Scan(
		&enterprise.ID, &enterprise.Name, &enterprise.Slug, &enterprise.Domain,
		&enterprise.StorageQuota, &enterprise.StorageUsed, &enterprise.MaxUsers,
		&enterprise.CurrentUsers, &settingsJSON, &enterprise.SubscriptionPlan,
		&enterprise.SubscriptionStatus, &enterprise.SubscriptionExpires, &enterprise.BillingEmail,
		&enterprise.CreatedAt, &enterprise.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("enterprise not found")
		}
		r.logger.Error("Failed to get enterprise by domain", zap.Error(err))
		return nil, fmt.Errorf("failed to get enterprise: %w", err)
	}

	// Unmarshal settings
	err = json.Unmarshal(settingsJSON, &enterprise.Settings)
	if err != nil {
		r.logger.Error("Failed to unmarshal enterprise settings", zap.Error(err))
		enterprise.Settings = make(map[string]interface{})
	}

	return enterprise, nil
}

func (r *EnterpriseRepository) Update(enterprise *domain.Enterprise) error {
	settingsJSON, err := json.Marshal(enterprise.Settings)
	if err != nil {
		return fmt.Errorf("failed to marshal settings: %w", err)
	}

	query := `
		UPDATE enterprises
		SET name = $2, domain = $3, storage_quota = $4, storage_used = $5, max_users = $6,
		    current_users = $7, settings = $8, subscription_plan = $9, subscription_status = $10,
		    subscription_expires_at = $11, billing_email = $12, updated_at = $13
		WHERE id = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query,
		enterprise.ID, enterprise.Name, enterprise.Domain, enterprise.StorageQuota,
		enterprise.StorageUsed, enterprise.MaxUsers, enterprise.CurrentUsers, settingsJSON,
		enterprise.SubscriptionPlan, enterprise.SubscriptionStatus, enterprise.SubscriptionExpires,
		enterprise.BillingEmail, enterprise.UpdatedAt)

	if err != nil {
		r.logger.Error("Failed to update enterprise", zap.Error(err))
		return fmt.Errorf("failed to update enterprise: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("enterprise not found")
	}

	return nil
}

func (r *EnterpriseRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM enterprises WHERE id = $1`

	ctx := context.Background()
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		r.logger.Error("Failed to delete enterprise", zap.Error(err))
		return fmt.Errorf("failed to delete enterprise: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("enterprise not found")
	}

	return nil
}

func (r *EnterpriseRepository) List(limit, offset int) ([]*domain.Enterprise, error) {
	query := `
		SELECT id, name, slug, domain, storage_quota, storage_used, max_users, current_users,
		       settings, subscription_plan, subscription_status, subscription_expires_at,
		       billing_email, created_at, updated_at
		FROM enterprises
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		r.logger.Error("Failed to list enterprises", zap.Error(err))
		return nil, fmt.Errorf("failed to list enterprises: %w", err)
	}
	defer rows.Close()

	var enterprises []*domain.Enterprise
	for rows.Next() {
		enterprise := &domain.Enterprise{}
		var settingsJSON []byte

		err := rows.Scan(
			&enterprise.ID, &enterprise.Name, &enterprise.Slug, &enterprise.Domain,
			&enterprise.StorageQuota, &enterprise.StorageUsed, &enterprise.MaxUsers,
			&enterprise.CurrentUsers, &settingsJSON, &enterprise.SubscriptionPlan,
			&enterprise.SubscriptionStatus, &enterprise.SubscriptionExpires, &enterprise.BillingEmail,
			&enterprise.CreatedAt, &enterprise.UpdatedAt)

		if err != nil {
			r.logger.Error("Failed to scan enterprise", zap.Error(err))
			continue
		}

		// Unmarshal settings
		err = json.Unmarshal(settingsJSON, &enterprise.Settings)
		if err != nil {
			r.logger.Error("Failed to unmarshal enterprise settings", zap.Error(err))
			enterprise.Settings = make(map[string]interface{})
		}

		enterprises = append(enterprises, enterprise)
	}

	return enterprises, nil
}

func (r *EnterpriseRepository) GetStats(id uuid.UUID) (*domain.EnterpriseStats, error) {
	query := `
		SELECT
			e.current_users as total_users,
			COUNT(f.id) as total_files,
			e.storage_used,
			e.storage_quota,
			COUNT(CASE WHEN f.upload_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as files_this_month,
			COUNT(DISTINCT CASE WHEN u.last_login_at >= CURRENT_DATE - INTERVAL '30 days' THEN u.id END) as active_users
		FROM enterprises e
		LEFT JOIN users u ON u.enterprise_id = e.id
		LEFT JOIN files f ON f.user_id = u.id
		WHERE e.id = $1
		GROUP BY e.id, e.current_users, e.storage_used, e.storage_quota`

	stats := &domain.EnterpriseStats{}
	ctx := context.Background()
	row := r.db.QueryRow(ctx, query, id)

	err := row.Scan(
		&stats.TotalUsers, &stats.TotalFiles, &stats.StorageUsed, &stats.StorageQuota,
		&stats.FilesThisMonth, &stats.ActiveUsers)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("enterprise not found")
		}
		r.logger.Error("Failed to get enterprise stats", zap.Error(err))
		return nil, fmt.Errorf("failed to get enterprise stats: %w", err)
	}

	// Calculate storage usage percentage
	if stats.StorageQuota > 0 {
		stats.StorageUsagePerc = float64(stats.StorageUsed) / float64(stats.StorageQuota) * 100
	}

	return stats, nil
}

func (r *EnterpriseRepository) GetUsersByEnterprise(enterpriseID uuid.UUID, limit, offset int) ([]*domain.User, error) {
	query := `
		SELECT id, email, name, profile_image, role, storage_used, storage_quota,
		       email_verified, enterprise_id, enterprise_role, created_at, updated_at
		FROM users
		WHERE enterprise_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	ctx := context.Background()
	rows, err := r.db.Query(ctx, query, enterpriseID, limit, offset)
	if err != nil {
		r.logger.Error("Failed to get users by enterprise", zap.Error(err))
		return nil, fmt.Errorf("failed to get users by enterprise: %w", err)
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		user := &domain.User{}
		err := rows.Scan(
			&user.ID, &user.Email, &user.Name, &user.ProfileImage, &user.Role,
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