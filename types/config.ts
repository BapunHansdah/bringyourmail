// Master configuration types for local-first email app

// Email provider types - extensible for future providers
export type EmailProviderType = "smtp" | "aws_ses" | "gmail_api" | "zepto_mail"; 

// Base email provider configuration
export interface BaseEmailProvider {
  id: string
  name: string
  type: EmailProviderType
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// SMTP configuration (Gmail, custom SMTP servers)
export interface SmtpProvider extends BaseEmailProvider {
  type: "smtp"
  config: {
    host: string
    port: string
    secure: boolean
    user: string
    pass: string
    from: string
  }
}

// AWS SES configuration (for future implementation)
export interface AwsSesProvider extends BaseEmailProvider {
  type: "aws_ses"
  config: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    from: string
  }
}

// Gmail API configuration (for future implementation)
export interface GmailApiProvider extends BaseEmailProvider {
  type: "gmail_api"
  config: {
    client_email: string
    private_key: string
    from: string
  }
}

// ZeptoMail configuration (for future implementation)
export interface ZeptoMailProvider extends BaseEmailProvider {
  type: "zepto_mail"
  config: {
    url: string
    apiKey: string
    from: string
    fromName: string
  }
}

// Union type for all email providers
export type EmailProvider = SmtpProvider | AwsSesProvider | GmailApiProvider | ZeptoMailProvider

// Profile configuration - contains all settings for a specific use case
export interface Profile {
  id: string
  name: string
  description?: string
  emailProviders: EmailProvider[]
  defaultProviderId?: string
  contactsTableName: string
  createdAt: string
  updatedAt: string
}

// Supabase connection configuration
export interface SupabaseConfig {
  url: string
  anonKey: string
  isConnected: boolean
  connectedAt?: string
}

// Template usage tracking for contacts
export interface TemplateUsage {
  name: string
  used: number
  lastUsedAt?: string
}

// Master configuration stored in localStorage
export interface MasterConfig {
  version: string
  supabase: SupabaseConfig | null
  profiles: Profile[]
  activeProfileId: string | null
  theme: "dark" | "light" | "system"
  createdAt: string
  updatedAt: string
}

// Initial/empty configuration
export const DEFAULT_CONFIG: MasterConfig = {
  version: "1.0.0",
  supabase: null,
  profiles: [],
  activeProfileId: null,
  theme: "dark",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Default SMTP provider template
export const DEFAULT_SMTP_PROVIDER: Omit<SmtpProvider, "id" | "createdAt" | "updatedAt"> = {
  name: "Gmail SMTP",
  type: "smtp",
  isDefault: true,
  config: {
    host: "smtp.gmail.com",
    port: "587",
    secure: false,
    user: "",
    pass: "",
    from: "",
  },
}
