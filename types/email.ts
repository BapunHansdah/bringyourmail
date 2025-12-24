export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_content: string
  created_at: string
  updated_at: string
}

export interface TemplateUsage {
  name: string
  used: number
  last_used_at?: string
}

export interface Contact {
  id: string
  name: string
  email_id: string
  created_at: string
  email_status: string
  last_sent_at: string | null
  email_opened: boolean
  updated_at: string
  data: Record<string, unknown>
  failure_reason: string | null
  subscribe_status: string | null
  no_of_time_sent: number
  template_used?: TemplateUsage[]
}

export interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}