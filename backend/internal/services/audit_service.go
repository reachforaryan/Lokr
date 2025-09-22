package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"lokr-backend/internal/domain"
)

type AuditService struct {
	db     *pgxpool.Pool
	logger *zap.Logger
}

func NewAuditService(db *pgxpool.Pool, logger *zap.Logger) *AuditService {
	return &AuditService{
		db:     db,
		logger: logger,
	}
}

// LogAction logs an audit entry to the database
func (s *AuditService) LogAction(ctx context.Context, entry *domain.AuditLogEntry) error {
	// Use formatted description if no description provided
	description := entry.Description
	if description == "" {
		description = entry.FormatDescription()
	}

	// Convert metadata to JSON
	var metadataJSON []byte
	var err error
	if entry.Metadata != nil {
		metadataJSON, err = json.Marshal(entry.Metadata)
		if err != nil {
			s.logger.Error("Failed to marshal audit metadata", zap.Error(err))
			metadataJSON = []byte("{}")
		}
	} else {
		metadataJSON = []byte("{}")
	}

	// Insert audit log entry
	query := `
		INSERT INTO audit_logs (id, user_id, action, status, resource_type, resource_id,
		                       resource_name, description, ip_address, user_agent, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err = s.db.Exec(ctx, query,
		uuid.New(),
		entry.UserID,
		entry.Action,
		entry.Status,
		entry.ResourceType,
		entry.ResourceID,
		entry.ResourceName,
		description,
		entry.IPAddress,
		entry.UserAgent,
		metadataJSON,
		time.Now(),
	)

	if err != nil {
		s.logger.Error("Failed to insert audit log", zap.Error(err))
		return fmt.Errorf("failed to log audit entry: %w", err)
	}

	// Log to application logs as well for debugging
	s.logger.Info("Audit log entry created",
		zap.String("user_id", entry.UserID.String()),
		zap.String("action", string(entry.Action)),
		zap.String("status", string(entry.Status)),
		zap.String("resource_type", entry.ResourceType),
		zap.String("resource_name", entry.ResourceName),
		zap.String("description", description),
	)

	return nil
}

// GetAuditLogs retrieves audit logs with pagination and filtering
func (s *AuditService) GetAuditLogs(ctx context.Context, userID uuid.UUID, limit, offset int, action *domain.AuditAction, status *domain.AuditStatus) ([]*domain.AuditLog, error) {
	query := `
		SELECT a.id, a.user_id, a.action, a.status, a.resource_type, a.resource_id,
		       a.resource_name, a.description, a.ip_address, a.user_agent, a.metadata, a.created_at,
		       u.id, u.email, u.name, u.profile_image
		FROM audit_logs a
		LEFT JOIN users u ON a.user_id = u.id
		WHERE a.user_id = $1`

	args := []interface{}{userID}
	argIndex := 2

	if action != nil {
		query += fmt.Sprintf(" AND a.action = $%d", argIndex)
		args = append(args, *action)
		argIndex++
	}

	if status != nil {
		query += fmt.Sprintf(" AND a.status = $%d", argIndex)
		args = append(args, *status)
		argIndex++
	}

	query += fmt.Sprintf(" ORDER BY a.created_at DESC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query audit logs: %w", err)
	}
	defer rows.Close()

	var logs []*domain.AuditLog
	for rows.Next() {
		log := &domain.AuditLog{
			User: &domain.User{},
		}
		var metadataJSON []byte

		err := rows.Scan(
			&log.ID, &log.UserID, &log.Action, &log.Status, &log.ResourceType, &log.ResourceID,
			&log.ResourceName, &log.Description, &log.IPAddress, &log.UserAgent, &metadataJSON, &log.CreatedAt,
			&log.User.ID, &log.User.Email, &log.User.Name, &log.User.ProfileImage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}

		// Parse metadata JSON
		if len(metadataJSON) > 0 {
			var metadata map[string]interface{}
			if err := json.Unmarshal(metadataJSON, &metadata); err != nil {
				s.logger.Warn("Failed to unmarshal audit metadata", zap.Error(err))
			} else {
				log.Metadata = metadata
			}
		}

		logs = append(logs, log)
	}

	return logs, nil
}

// GetRecentActivity gets recent activity for the user (last 24 hours)
func (s *AuditService) GetRecentActivity(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.AuditLog, error) {
	query := `
		SELECT a.id, a.user_id, a.action, a.status, a.resource_type, a.resource_id,
		       a.resource_name, a.description, a.ip_address, a.user_agent, a.metadata, a.created_at,
		       u.id, u.email, u.name, u.profile_image
		FROM audit_logs a
		LEFT JOIN users u ON a.user_id = u.id
		WHERE a.user_id = $1 AND a.created_at > $2
		ORDER BY a.created_at DESC
		LIMIT $3`

	since := time.Now().Add(-24 * time.Hour)
	rows, err := s.db.Query(ctx, query, userID, since, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query recent activity: %w", err)
	}
	defer rows.Close()

	var logs []*domain.AuditLog
	for rows.Next() {
		log := &domain.AuditLog{
			User: &domain.User{},
		}
		var metadataJSON []byte

		err := rows.Scan(
			&log.ID, &log.UserID, &log.Action, &log.Status, &log.ResourceType, &log.ResourceID,
			&log.ResourceName, &log.Description, &log.IPAddress, &log.UserAgent, &metadataJSON, &log.CreatedAt,
			&log.User.ID, &log.User.Email, &log.User.Name, &log.User.ProfileImage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}

		// Parse metadata JSON
		if len(metadataJSON) > 0 {
			var metadata map[string]interface{}
			if err := json.Unmarshal(metadataJSON, &metadata); err != nil {
				s.logger.Warn("Failed to unmarshal audit metadata", zap.Error(err))
			} else {
				log.Metadata = metadata
			}
		}

		logs = append(logs, log)
	}

	return logs, nil
}

// GetActivityStats gets activity statistics for the user
func (s *AuditService) GetActivityStats(ctx context.Context, userID uuid.UUID, since time.Time) (map[string]int, error) {
	query := `
		SELECT action, COUNT(*) as count
		FROM audit_logs
		WHERE user_id = $1 AND created_at > $2
		GROUP BY action
		ORDER BY count DESC`

	rows, err := s.db.Query(ctx, query, userID, since)
	if err != nil {
		return nil, fmt.Errorf("failed to query activity stats: %w", err)
	}
	defer rows.Close()

	stats := make(map[string]int)
	for rows.Next() {
		var action string
		var count int
		if err := rows.Scan(&action, &count); err != nil {
			return nil, fmt.Errorf("failed to scan activity stat: %w", err)
		}
		stats[action] = count
	}

	return stats, nil
}

// Helper methods for common audit logging patterns

func (s *AuditService) LogFileUpload(ctx context.Context, userID, fileID uuid.UUID, fileName, ipAddress, userAgent string) {
	entry := &domain.AuditLogEntry{
		UserID:       userID,
		Action:       domain.ActionFileUpload,
		Status:       domain.StatusSuccess,
		ResourceType: "file",
		ResourceID:   &fileID,
		ResourceName: fileName,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}
	s.LogAction(ctx, entry)
}

func (s *AuditService) LogFileDownload(ctx context.Context, userID, fileID uuid.UUID, fileName, ipAddress, userAgent string) {
	entry := &domain.AuditLogEntry{
		UserID:       userID,
		Action:       domain.ActionFileDownload,
		Status:       domain.StatusSuccess,
		ResourceType: "file",
		ResourceID:   &fileID,
		ResourceName: fileName,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}
	s.LogAction(ctx, entry)
}

func (s *AuditService) LogFilePreview(ctx context.Context, userID, fileID uuid.UUID, fileName, ipAddress, userAgent string) {
	entry := &domain.AuditLogEntry{
		UserID:       userID,
		Action:       domain.ActionFilePreview,
		Status:       domain.StatusSuccess,
		ResourceType: "file",
		ResourceID:   &fileID,
		ResourceName: fileName,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}
	s.LogAction(ctx, entry)
}

func (s *AuditService) LogFileDelete(ctx context.Context, userID, fileID uuid.UUID, fileName, ipAddress, userAgent string) {
	entry := &domain.AuditLogEntry{
		UserID:       userID,
		Action:       domain.ActionFileDelete,
		Status:       domain.StatusSuccess,
		ResourceType: "file",
		ResourceID:   &fileID,
		ResourceName: fileName,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}
	s.LogAction(ctx, entry)
}

func (s *AuditService) LogFileShare(ctx context.Context, userID, fileID uuid.UUID, fileName, sharedWithUserID, ipAddress, userAgent string) {
	entry := &domain.AuditLogEntry{
		UserID:       userID,
		Action:       domain.ActionFileShare,
		Status:       domain.StatusSuccess,
		ResourceType: "file",
		ResourceID:   &fileID,
		ResourceName: fileName,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		Metadata: map[string]interface{}{
			"shared_with_user_id": sharedWithUserID,
		},
	}
	s.LogAction(ctx, entry)
}

func (s *AuditService) LogPublicShare(ctx context.Context, userID, fileID uuid.UUID, fileName, shareToken, ipAddress, userAgent string) {
	entry := &domain.AuditLogEntry{
		UserID:       userID,
		Action:       domain.ActionPublicShare,
		Status:       domain.StatusSuccess,
		ResourceType: "file",
		ResourceID:   &fileID,
		ResourceName: fileName,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		Metadata: map[string]interface{}{
			"share_token": shareToken,
		},
	}
	s.LogAction(ctx, entry)
}