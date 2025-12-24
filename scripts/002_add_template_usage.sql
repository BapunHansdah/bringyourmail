-- Add template_used column to contacts table
-- This tracks which templates were used and how many times for each contact
-- Format: [{name:'template_1',used:2,last_used_at:'2024-01-01T00:00:00Z'},{name:'template_2',used:3}]

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS template_used JSONB DEFAULT '[]'::jsonb;

-- Create an index for faster queries on template usage
CREATE INDEX IF NOT EXISTS idx_contacts_template_used ON contacts USING GIN (template_used);

-- Add a comment to document the column
COMMENT ON COLUMN contacts.template_used IS 'Array of template usage records: [{name: string, used: number, last_used_at?: string}]';
