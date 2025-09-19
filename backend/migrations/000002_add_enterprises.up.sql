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
ALTER TABLE users ADD COLUMN enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN enterprise_role VARCHAR(50) DEFAULT 'MEMBER' CHECK (enterprise_role IN ('OWNER', 'ADMIN', 'MEMBER'));

-- Update file_contents to include enterprise context
ALTER TABLE file_contents ADD COLUMN enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE;

-- Update S3 path structure: enterprise_id/user_id/content_hash
-- This will be handled in the application logic

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

-- Function to update enterprise storage usage
CREATE OR REPLACE FUNCTION update_enterprise_storage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Add storage usage
        UPDATE enterprises
        SET storage_used = storage_used + NEW.file_size
        WHERE id = (SELECT enterprise_id FROM users WHERE id = NEW.user_id);

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Subtract storage usage
        UPDATE enterprises
        SET storage_used = storage_used - OLD.file_size
        WHERE id = (SELECT enterprise_id FROM users WHERE id = OLD.user_id);

        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update storage usage if file size changed
        IF NEW.file_size != OLD.file_size THEN
            UPDATE enterprises
            SET storage_used = storage_used + (NEW.file_size - OLD.file_size)
            WHERE id = (SELECT enterprise_id FROM users WHERE id = NEW.user_id);
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update enterprise storage
CREATE TRIGGER update_enterprise_storage_trigger
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW EXECUTE FUNCTION update_enterprise_storage();

-- Function to update enterprise user count
CREATE OR REPLACE FUNCTION update_enterprise_user_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.enterprise_id IS NOT NULL THEN
        -- Add user count
        UPDATE enterprises
        SET current_users = current_users + 1
        WHERE id = NEW.enterprise_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.enterprise_id IS NOT NULL THEN
        -- Subtract user count
        UPDATE enterprises
        SET current_users = current_users - 1
        WHERE id = OLD.enterprise_id;

        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle enterprise changes
        IF OLD.enterprise_id IS DISTINCT FROM NEW.enterprise_id THEN
            -- Remove from old enterprise
            IF OLD.enterprise_id IS NOT NULL THEN
                UPDATE enterprises
                SET current_users = current_users - 1
                WHERE id = OLD.enterprise_id;
            END IF;

            -- Add to new enterprise
            IF NEW.enterprise_id IS NOT NULL THEN
                UPDATE enterprises
                SET current_users = current_users + 1
                WHERE id = NEW.enterprise_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update enterprise user count
CREATE TRIGGER update_enterprise_user_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION update_enterprise_user_count();