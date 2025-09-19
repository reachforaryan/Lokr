-- Drop triggers first
DROP TRIGGER IF EXISTS update_enterprise_user_count_trigger ON users;
DROP TRIGGER IF EXISTS update_enterprise_storage_trigger ON files;
DROP TRIGGER IF EXISTS update_enterprises_updated_at ON enterprises;

-- Drop functions
DROP FUNCTION IF EXISTS update_enterprise_user_count();
DROP FUNCTION IF EXISTS update_enterprise_storage();

-- Drop indexes
DROP INDEX IF EXISTS idx_enterprise_invitations_expires_at;
DROP INDEX IF EXISTS idx_enterprise_invitations_email;
DROP INDEX IF EXISTS idx_enterprise_invitations_token;
DROP INDEX IF EXISTS idx_file_contents_enterprise_id;
DROP INDEX IF EXISTS idx_users_enterprise_role;
DROP INDEX IF EXISTS idx_users_enterprise_id;
DROP INDEX IF EXISTS idx_enterprises_subscription_status;
DROP INDEX IF EXISTS idx_enterprises_domain;
DROP INDEX IF EXISTS idx_enterprises_slug;

-- Drop tables
DROP TABLE IF EXISTS enterprise_invitations;

-- Remove columns from existing tables
ALTER TABLE file_contents DROP COLUMN IF EXISTS enterprise_id;
ALTER TABLE users DROP COLUMN IF EXISTS enterprise_role;
ALTER TABLE users DROP COLUMN IF EXISTS enterprise_id;

-- Drop enterprises table
DROP TABLE IF EXISTS enterprises;