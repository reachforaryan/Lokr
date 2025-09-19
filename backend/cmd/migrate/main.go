package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}
	defer logger.Sync()

	// Get database URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		logger.Fatal("DATABASE_URL environment variable is required")
	}

	// Connect to database
	ctx := context.Background()
	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Test connection
	err = db.Ping(ctx)
	if err != nil {
		logger.Fatal("Failed to ping database", zap.Error(err))
	}

	logger.Info("Connected to database successfully")

	// Set schema search path
	_, err = db.Exec(ctx, "SET search_path TO public")
	if err != nil {
		logger.Fatal("Failed to set schema search path", zap.Error(err))
	}

	// Run migrations
	err = runMigrations(ctx, db, logger)
	if err != nil {
		logger.Fatal("Failed to run migrations", zap.Error(err))
	}

	logger.Info("Migrations completed successfully")
}

func runMigrations(ctx context.Context, db *pgxpool.Pool, logger *zap.Logger) error {
	// Migration 1: Initial schema
	migration1 := `
	-- Enable UUID extension
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		email VARCHAR(255) UNIQUE NOT NULL,
		name VARCHAR(255) NOT NULL,
		profile_image TEXT,
		password_hash VARCHAR(255) NOT NULL, -- Required for secure internal auth
		role VARCHAR(50) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
		storage_used BIGINT NOT NULL DEFAULT 0,
		storage_quota BIGINT NOT NULL DEFAULT 10737418240, -- 10GB default
		email_verified BOOLEAN NOT NULL DEFAULT false,
		email_verification_token VARCHAR(255),
		email_verification_expires_at TIMESTAMP WITH TIME ZONE,
		reset_password_token VARCHAR(255),
		reset_password_expires_at TIMESTAMP WITH TIME ZONE,
		last_login_at TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	);

	-- File contents table (for deduplication)
	CREATE TABLE IF NOT EXISTS file_contents (
		content_hash VARCHAR(64) PRIMARY KEY, -- SHA-256 hash
		file_path TEXT NOT NULL, -- Storage path (S3 or local)
		file_size BIGINT NOT NULL,
		reference_count INTEGER NOT NULL DEFAULT 1,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	);

	-- Folders table
	CREATE TABLE IF NOT EXISTS folders (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		UNIQUE(user_id, parent_id, name) -- Prevent duplicate folder names in same location
	);

	-- Files table
	CREATE TABLE IF NOT EXISTS files (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
		filename VARCHAR(255) NOT NULL,
		original_name VARCHAR(255) NOT NULL,
		mime_type VARCHAR(255) NOT NULL,
		file_size BIGINT NOT NULL,
		content_hash VARCHAR(64) NOT NULL REFERENCES file_contents(content_hash) ON DELETE CASCADE,
		description TEXT,
		tags TEXT[], -- PostgreSQL array for tags
		visibility VARCHAR(50) NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC', 'SHARED_WITH_USERS')),
		share_token VARCHAR(255) UNIQUE,
		download_count INTEGER NOT NULL DEFAULT 0,
		upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	);

	-- File shares table (for user-specific sharing)
	CREATE TABLE IF NOT EXISTS file_shares (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
		shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		permission_type VARCHAR(50) NOT NULL DEFAULT 'VIEW' CHECK (permission_type IN ('VIEW', 'DOWNLOAD', 'EDIT', 'DELETE')),
		expires_at TIMESTAMP WITH TIME ZONE,
		last_accessed_at TIMESTAMP WITH TIME ZONE,
		access_count INTEGER NOT NULL DEFAULT 0,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		UNIQUE(file_id, shared_with_user_id) -- Prevent duplicate shares to same user
	);

	-- Rate limiting table
	CREATE TABLE IF NOT EXISTS rate_limits (
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		endpoint VARCHAR(255) NOT NULL,
		request_count INTEGER NOT NULL DEFAULT 1,
		window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		PRIMARY KEY (user_id, endpoint)
	);

	-- Audit logs table
	CREATE TABLE IF NOT EXISTS audit_logs (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID REFERENCES users(id) ON DELETE SET NULL,
		action VARCHAR(100) NOT NULL,
		resource_type VARCHAR(50) NOT NULL,
		resource_id UUID,
		metadata JSONB,
		ip_address INET,
		user_agent TEXT,
		timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	);

	-- Indexes for performance
	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
	CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token);

	CREATE INDEX IF NOT EXISTS idx_file_contents_hash ON file_contents(content_hash);

	CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
	CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

	CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
	CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
	CREATE INDEX IF NOT EXISTS idx_files_content_hash ON files(content_hash);
	CREATE INDEX IF NOT EXISTS idx_files_visibility ON files(visibility);
	CREATE INDEX IF NOT EXISTS idx_files_share_token ON files(share_token);
	CREATE INDEX IF NOT EXISTS idx_files_upload_date ON files(upload_date);
	CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type);
	CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING GIN (tags);

	CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
	CREATE INDEX IF NOT EXISTS idx_file_shares_shared_by ON file_shares(shared_by_user_id);
	CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with_user_id);

	CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

	CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

	-- Trigger to update updated_at columns
	CREATE OR REPLACE FUNCTION update_updated_at_column()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = NOW();
		RETURN NEW;
	END;
	$$ language 'plpgsql';

	CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
		FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

	CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
		FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

	CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
		FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
	`

	// Migration 2: Add enterprises
	migration2 := `
	-- Enterprises table
	CREATE TABLE IF NOT EXISTS enterprises (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL UNIQUE,
		slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly identifier
		domain VARCHAR(255), -- Optional domain for SSO
		storage_quota BIGINT NOT NULL DEFAULT 107374182400, -- 100GB default
		storage_used BIGINT NOT NULL DEFAULT 0,
		max_users INTEGER NOT NULL DEFAULT 100,
		current_users INTEGER NOT NULL DEFAULT 0,
		settings JSONB NOT NULL DEFAULT '{}', -- Enterprise-specific settings
		subscription_plan VARCHAR(50) NOT NULL DEFAULT 'BASIC' CHECK (subscription_plan IN ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE')),
		subscription_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),
		subscription_expires_at TIMESTAMP WITH TIME ZONE,
		billing_email VARCHAR(255),
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	);

	-- Add enterprise_id to users table
	ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL;
	ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_role VARCHAR(50) DEFAULT 'MEMBER' CHECK (enterprise_role IN ('OWNER', 'ADMIN', 'MEMBER'));

	-- Update file_contents to include enterprise context
	ALTER TABLE file_contents ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE;

	-- Enterprise invitations table
	CREATE TABLE IF NOT EXISTS enterprise_invitations (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
		email VARCHAR(255) NOT NULL,
		invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		role VARCHAR(50) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
		token VARCHAR(255) NOT NULL UNIQUE,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		accepted_at TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
		UNIQUE(enterprise_id, email) -- Prevent duplicate invitations
	);

	-- Indexes for enterprises
	CREATE INDEX IF NOT EXISTS idx_enterprises_slug ON enterprises(slug);
	CREATE INDEX IF NOT EXISTS idx_enterprises_domain ON enterprises(domain);
	CREATE INDEX IF NOT EXISTS idx_enterprises_subscription_status ON enterprises(subscription_status);

	CREATE INDEX IF NOT EXISTS idx_users_enterprise_id ON users(enterprise_id);
	CREATE INDEX IF NOT EXISTS idx_users_enterprise_role ON users(enterprise_role);

	CREATE INDEX IF NOT EXISTS idx_file_contents_enterprise_id ON file_contents(enterprise_id);

	CREATE INDEX IF NOT EXISTS idx_enterprise_invitations_token ON enterprise_invitations(token);
	CREATE INDEX IF NOT EXISTS idx_enterprise_invitations_email ON enterprise_invitations(email);
	CREATE INDEX IF NOT EXISTS idx_enterprise_invitations_expires_at ON enterprise_invitations(expires_at);

	-- Update trigger for enterprises
	CREATE TRIGGER update_enterprises_updated_at BEFORE UPDATE ON enterprises
		FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
	`

	logger.Info("Running migration 1: Initial schema")
	_, err := db.Exec(ctx, migration1)
	if err != nil {
		return fmt.Errorf("failed to run migration 1: %w", err)
	}

	logger.Info("Running migration 2: Add enterprises")
	_, err = db.Exec(ctx, migration2)
	if err != nil {
		return fmt.Errorf("failed to run migration 2: %w", err)
	}

	return nil
}