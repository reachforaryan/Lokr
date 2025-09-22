-- Rollback enterprise system

-- Drop indexes
DROP INDEX IF EXISTS idx_file_contents_enterprise_id;
DROP INDEX IF EXISTS idx_enterprise_invitations_token;
DROP INDEX IF EXISTS idx_enterprise_invitations_email;
DROP INDEX IF EXISTS idx_enterprise_invitations_enterprise_id;
DROP INDEX IF EXISTS idx_users_enterprise_role;
DROP INDEX IF EXISTS idx_users_enterprise_id;
DROP INDEX IF EXISTS idx_enterprises_domain;
DROP INDEX IF EXISTS idx_enterprises_slug;

-- Remove enterprise columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS enterprise_role;
ALTER TABLE users DROP COLUMN IF EXISTS enterprise_id;

-- Remove enterprise column from file_contents table
ALTER TABLE file_contents DROP COLUMN IF EXISTS enterprise_id;

-- Drop tables
DROP TRIGGER IF EXISTS update_enterprises_updated_at ON enterprises;
DROP TABLE IF EXISTS enterprise_invitations;
DROP TABLE IF EXISTS enterprises;