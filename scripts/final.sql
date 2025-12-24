-- =========================
-- Email Templates Table
-- =========================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================
-- Contacts Table
-- =========================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_status TEXT DEFAULT 'pending',
  last_sent_at TIMESTAMP WITH TIME ZONE,
  email_opened BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  failure_reason TEXT,
  data JSONB,
  subscribe_status TEXT,
  no_of_time_sent BIGINT DEFAULT 0,

  -- Track template usage per contact
  template_used JSONB DEFAULT '[]'::jsonb
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_contacts_template_used
ON contacts
USING GIN (template_used);

-- =========================
-- Documentation
-- =========================
COMMENT ON COLUMN contacts.template_used IS
'Array of template usage records: [{name: string, used: number, last_used_at?: string}]';

-- =========================
-- Row Level Security
-- =========================
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- =========================
-- Admin Policies (Allow All)
-- =========================
CREATE POLICY "Allow all operations on email_templates"
ON email_templates
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on contacts"
ON contacts
FOR ALL
USING (true)
WITH CHECK (true);
