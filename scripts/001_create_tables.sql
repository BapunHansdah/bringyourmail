-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create default contacts table (users can change the table name dynamically)
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
  no_of_time_sent BIGINT DEFAULT 0
);

-- Enable RLS (but allow all operations for this admin tool)
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for email_templates (admin tool)
CREATE POLICY "Allow all operations on email_templates" ON email_templates FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for contacts (admin tool)
CREATE POLICY "Allow all operations on contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);
