-- Add enterprise system tables and update existing tables

-- Enterprises table
CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    storage_quota BIGINT NOT NULL DEFAULT 107374182400, -- 100GB default
    storage_used BIGINT NOT NULL DEFAULT 0,
    max_users INTEGER NOT NULL DEFAULT 100,
    current_users INTEGER NOT NULL DEFAULT 0,
    settings JSONB NOT NULL DEFAULT '{}',
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'BASIC' CHECK (subscription_plan IN ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE')),
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    billing_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enterprise invitations table
CREATE TABLE IF NOT EXISTS enterprise_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(enterprise_id, email) -- Prevent duplicate invitations
);

-- Add enterprise fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_role VARCHAR(50) CHECK (enterprise_role IN ('OWNER', 'ADMIN', 'MEMBER'));

-- Add enterprise_id to file_contents for scoping
ALTER TABLE file_contents ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enterprises_slug ON enterprises(slug);
CREATE INDEX IF NOT EXISTS idx_enterprises_domain ON enterprises(domain);

CREATE INDEX IF NOT EXISTS idx_users_enterprise_id ON users(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_users_enterprise_role ON users(enterprise_role);

CREATE INDEX IF NOT EXISTS idx_enterprise_invitations_enterprise_id ON enterprise_invitations(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_invitations_email ON enterprise_invitations(email);
CREATE INDEX IF NOT EXISTS idx_enterprise_invitations_token ON enterprise_invitations(token);

CREATE INDEX IF NOT EXISTS idx_file_contents_enterprise_id ON file_contents(enterprise_id);

-- Update triggers for enterprises
CREATE TRIGGER update_enterprises_updated_at BEFORE UPDATE ON enterprises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a default enterprise for existing users
INSERT INTO enterprises (name, slug, domain, storage_quota, max_users, subscription_plan, subscription_status)
VALUES ('Default Enterprise', 'default', 'lokr.com', 1073741824000, 1000, 'ENTERPRISE', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Assign all existing users to the default enterprise as members
UPDATE users
SET enterprise_id = (SELECT id FROM enterprises WHERE slug = 'default' LIMIT 1),
    enterprise_role = 'MEMBER'
WHERE enterprise_id IS NULL;

-- Make the first user an enterprise owner
UPDATE users
SET enterprise_role = 'OWNER'
WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);