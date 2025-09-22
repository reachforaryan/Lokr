-- Create audit logs table for real-time activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NULL,
    resource_name TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id) WHERE resource_id IS NOT NULL;

-- Add constraint for status values
ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_status
    CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING'));

-- Add constraint for common action values (more can be added as needed)
ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_action
    CHECK (action IN (
        'FILE_UPLOAD', 'FILE_DOWNLOAD', 'FILE_PREVIEW', 'FILE_DELETE', 'FILE_MOVE', 'FILE_RENAME',
        'FILE_SHARE', 'FILE_UNSHARE', 'PUBLIC_SHARE', 'PUBLIC_UNSHARE',
        'FOLDER_CREATE', 'FOLDER_DELETE', 'FOLDER_MOVE', 'FOLDER_RENAME',
        'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER'
    ));