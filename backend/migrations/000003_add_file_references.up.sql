-- Add file_references table
CREATE TABLE IF NOT EXISTS file_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL,
    file_id UUID NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(255), -- Optional custom name for the reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique file references per folder (one file can only have one reference per folder)
    UNIQUE(folder_id, file_id),

    -- Add foreign key constraints with proper cascade behavior
    CONSTRAINT fk_file_references_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    CONSTRAINT fk_file_references_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    CONSTRAINT fk_file_references_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_references_folder_id ON file_references(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_references_file_id ON file_references(file_id);
CREATE INDEX IF NOT EXISTS idx_file_references_user_id ON file_references(user_id);
CREATE INDEX IF NOT EXISTS idx_file_references_created_at ON file_references(created_at);