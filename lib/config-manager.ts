import type { MasterConfig, Profile, EmailProvider, SupabaseConfig, SmtpProvider } from "@/types/config"
import { DEFAULT_CONFIG } from "@/types/config"

const CONFIG_KEY = "email_app_master_config"

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Get the master configuration from localStorage
export function getConfig(): MasterConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (!stored) {
      return DEFAULT_CONFIG
    }
    return JSON.parse(stored) as MasterConfig
  } catch {
    return DEFAULT_CONFIG
  }
}

// Save the master configuration to localStorage
export function saveConfig(config: MasterConfig): void {
  if (typeof window === "undefined") return

  const updated: MasterConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(updated))
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  const config = getConfig()
  return !!(config.supabase?.url && config.supabase?.anonKey)
}

// Get Supabase configuration
export function getSupabaseConfig(): SupabaseConfig | null {
  const config = getConfig()
  return config.supabase
}

// Save Supabase configuration
export function saveSupabaseConfig(supabaseConfig: SupabaseConfig): void {
  const config = getConfig()
  saveConfig({
    ...config,
    supabase: supabaseConfig,
  })
}

// Clear Supabase configuration
export function clearSupabaseConfig(): void {
  const config = getConfig()
  saveConfig({
    ...config,
    supabase: null,
  })
}

// Get all profiles
export function getProfiles(): Profile[] {
  const config = getConfig()
  return config.profiles
}

// Get active profile
export function getActiveProfile(): Profile | null {
  const config = getConfig()
  if (!config.activeProfileId) return null
  return config.profiles.find((p) => p.id === config.activeProfileId) || null
}

// Set active profile
export function setActiveProfile(profileId: string): void {
  const config = getConfig()
  if (config.profiles.some((p) => p.id === profileId)) {
    saveConfig({
      ...config,
      activeProfileId: profileId,
    })
  }
}

// Create a new profile
export function createProfile(name: string, description?: string, contactsTableName = "contacts"): Profile {
  const config = getConfig()

  const newProfile: Profile = {
    id: generateId(),
    name,
    description,
    emailProviders: [],
    contactsTableName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updatedConfig = {
    ...config,
    profiles: [...config.profiles, newProfile],
    // Auto-set as active if it's the first profile
    activeProfileId: config.profiles.length === 0 ? newProfile.id : config.activeProfileId,
  }

  saveConfig(updatedConfig)
  return newProfile
}

// Update a profile
export function updateProfile(profileId: string, updates: Partial<Omit<Profile, "id" | "createdAt">>): Profile | null {
  const config = getConfig()
  const profileIndex = config.profiles.findIndex((p) => p.id === profileId)

  if (profileIndex === -1) return null

  const updatedProfile: Profile = {
    ...config.profiles[profileIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  const updatedProfiles = [...config.profiles]
  updatedProfiles[profileIndex] = updatedProfile

  saveConfig({
    ...config,
    profiles: updatedProfiles,
  })

  return updatedProfile
}

// Delete a profile
export function deleteProfile(profileId: string): boolean {
  const config = getConfig()
  const filtered = config.profiles.filter((p) => p.id !== profileId)

  if (filtered.length === config.profiles.length) return false

  saveConfig({
    ...config,
    profiles: filtered,
    activeProfileId: config.activeProfileId === profileId ? filtered[0]?.id || null : config.activeProfileId,
  })

  return true
}

// Add email provider to a profile
export function addEmailProvider(
  profileId: string,
  provider: Omit<EmailProvider, "id" | "createdAt" | "updatedAt">,
): EmailProvider | null {
  const config = getConfig()
  const profile = config.profiles.find((p) => p.id === profileId)

  if (!profile) return null

  const newProvider: EmailProvider = {
    ...provider,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as EmailProvider

  // If this is the first provider or marked as default, set it as default
  if (profile.emailProviders.length === 0 || newProvider.isDefault) {
    // Unset other defaults if this one is default
    profile.emailProviders.forEach((p) => (p.isDefault = false))
    newProvider.isDefault = true
  }

  updateProfile(profileId, {
    emailProviders: [...profile.emailProviders, newProvider],
    defaultProviderId: newProvider.isDefault ? newProvider.id : profile.defaultProviderId,
  })

  return newProvider
}

// Update email provider in a profile
export function updateEmailProvider(
  profileId: string,
  providerId: string,
  updates: Partial<Omit<EmailProvider, "id" | "createdAt">>,
): EmailProvider | null {
  const config = getConfig()
  const profile = config.profiles.find((p) => p.id === profileId)

  if (!profile) return null

  const providerIndex = profile.emailProviders.findIndex((p) => p.id === providerId)
  if (providerIndex === -1) return null

  const updatedProvider: EmailProvider = {
    ...profile.emailProviders[providerIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  } as EmailProvider

  // Handle default provider changes
  if (updates.isDefault) {
    profile.emailProviders.forEach((p) => (p.isDefault = false))
  }

  const updatedProviders = [...profile.emailProviders]
  updatedProviders[providerIndex] = updatedProvider

  updateProfile(profileId, {
    emailProviders: updatedProviders,
    defaultProviderId: updatedProvider.isDefault ? updatedProvider.id : profile.defaultProviderId,
  })

  return updatedProvider
}

// Delete email provider from a profile
export function deleteEmailProvider(profileId: string, providerId: string): boolean {
  const config = getConfig()
  const profile = config.profiles.find((p) => p.id === profileId)

  if (!profile) return false

  const filtered = profile.emailProviders.filter((p) => p.id !== providerId)
  if (filtered.length === profile.emailProviders.length) return false

  // If we deleted the default, set first remaining as default
  const wasDefault = profile.defaultProviderId === providerId
  if (wasDefault && filtered.length > 0) {
    filtered[0].isDefault = true
  }

  updateProfile(profileId, {
    emailProviders: filtered,
    defaultProviderId: wasDefault ? filtered[0]?.id || undefined : profile.defaultProviderId,
  })

  return true
}

// Set default email provider
export function setDefaultEmailProvider(profileId: string, providerId: string): boolean {
  const config = getConfig()
  const profile = config.profiles.find((p) => p.id === profileId)

  if (!profile) return false

  const provider = profile.emailProviders.find((p) => p.id === providerId)
  if (!provider) return false

  // Unset all other defaults
  profile.emailProviders.forEach((p) => (p.isDefault = false))
  provider.isDefault = true

  updateProfile(profileId, {
    emailProviders: profile.emailProviders,
    defaultProviderId: providerId,
  })

  return true
}

export function getDefaultEmailProvider(): EmailProvider | null {
  const profile = getActiveProfile()
  if (!profile) return null

  if (profile.defaultProviderId) {
    return profile.emailProviders.find((p) => p.id === profile.defaultProviderId) || null
  }

  return profile.emailProviders.find((p) => p.isDefault) || profile.emailProviders[0] || null
}

// Migrate old SMTP config to new format
export function migrateOldConfig(): void {
  if (typeof window === "undefined") return

  const oldSmtpConfig = localStorage.getItem("smtp_config")
  if (!oldSmtpConfig) return

  try {
    const smtpConfig = JSON.parse(oldSmtpConfig)
    const config = getConfig()

    // Only migrate if we don't have any profiles yet
    if (config.profiles.length === 0) {
      const profile = createProfile("Default Profile", "Migrated from previous configuration")

      const smtpProvider: Omit<SmtpProvider, "id" | "createdAt" | "updatedAt"> = {
        name: "Gmail SMTP (Migrated)",
        type: "smtp",
        isDefault: true,
        config: {
          host: smtpConfig.host || "smtp.gmail.com",
          port: smtpConfig.port || "587",
          secure: smtpConfig.secure || false,
          user: smtpConfig.user || "",
          pass: smtpConfig.pass || "",
          from: smtpConfig.from || "",
        },
      }

      addEmailProvider(profile.id, smtpProvider)

      // Remove old config after migration
      localStorage.removeItem("smtp_config")
    }
  } catch {
    // Ignore migration errors
  }
}

// Reset all configuration
export function resetConfig(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CONFIG_KEY)
  localStorage.removeItem("smtp_config")
}
