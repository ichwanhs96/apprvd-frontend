-- User table
CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- Folder table
CREATE TABLE IF NOT EXISTS folder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folder(id), -- for nested folders, nullable for root
  owner_id UUID REFERENCES "user"(id),
  soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- Document table
CREATE TABLE IF NOT EXISTS document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  content TEXT,
  created_by UUID REFERENCES "user"(id),
  language TEXT,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'FINAL')),
  soft_delete BOOLEAN NOT NULL DEFAULT FALSE,
  folder_id UUID REFERENCES folder(id) -- new: document can belong to a folder
);

-- Document Ownership table
CREATE TABLE IF NOT EXISTS document_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  document_id UUID REFERENCES document(id),
  user_id UUID REFERENCES "user"(id),
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit')),
  shared_by UUID REFERENCES "user"(id),
  soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add comment table for TinyMCE comments (matching the provided schema)
CREATE TABLE IF NOT EXISTS comment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conversation_uid VARCHAR(255) NOT NULL,
    comment_uid VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255),
    author_avatar TEXT,
    document_id UUID REFERENCES document(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
    soft_delete BOOLEAN DEFAULT FALSE
);

-- Add notification table for mentions and other notifications
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'mention', 'comment', 'status_change', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_id UUID REFERENCES "user"(id),
    sender_id UUID REFERENCES "user"(id),
    document_id UUID REFERENCES document(id),
    conversation_uid VARCHAR(255),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_document_id ON comment(document_id);
CREATE INDEX IF NOT EXISTS idx_comment_conversation_uid ON comment(conversation_uid);
CREATE INDEX IF NOT EXISTS idx_comment_user_id ON comment(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_soft_delete ON comment(soft_delete);

CREATE INDEX IF NOT EXISTS idx_notification_recipient_id ON notification(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
CREATE INDEX IF NOT EXISTS idx_notification_read_at ON notification(read_at);
CREATE INDEX IF NOT EXISTS idx_notification_document_id ON notification(document_id); 