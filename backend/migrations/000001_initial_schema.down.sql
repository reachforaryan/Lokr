-- Drop triggers
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes (will be automatically dropped with tables, but explicit for clarity)
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_user_id;

DROP INDEX IF EXISTS idx_rate_limits_window;

DROP INDEX IF EXISTS idx_file_shares_shared_with;
DROP INDEX IF EXISTS idx_file_shares_shared_by;
DROP INDEX IF EXISTS idx_file_shares_file_id;

DROP INDEX IF EXISTS idx_files_tags;
DROP INDEX IF EXISTS idx_files_mime_type;
DROP INDEX IF EXISTS idx_files_upload_date;
DROP INDEX IF EXISTS idx_files_share_token;
DROP INDEX IF EXISTS idx_files_visibility;
DROP INDEX IF EXISTS idx_files_content_hash;
DROP INDEX IF EXISTS idx_files_folder_id;
DROP INDEX IF EXISTS idx_files_user_id;

DROP INDEX IF EXISTS idx_folders_parent_id;
DROP INDEX IF EXISTS idx_folders_user_id;

DROP INDEX IF EXISTS idx_file_contents_hash;

DROP INDEX IF EXISTS idx_users_reset_password_token;
DROP INDEX IF EXISTS idx_users_email_verification_token;
DROP INDEX IF EXISTS idx_users_google_id;
DROP INDEX IF EXISTS idx_users_email;

-- Drop tables (order matters due to foreign key constraints)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS file_shares;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS folders;
DROP TABLE IF EXISTS file_contents;
DROP TABLE IF EXISTS users;

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp";