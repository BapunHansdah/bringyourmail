import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseConfig } from "@/lib/config-manager"

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null
let lastUrl: string | null = null
let lastKey: string | null = null

export function createClient() {
  // First try to get from localStorage config
  const localConfig = getSupabaseConfig()

  // Use localStorage config if available, otherwise fall back to env vars
  const url = localConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const anonKey = localConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // If no credentials available, throw an error
  if (!url || !anonKey) {
    throw new Error("Supabase not configured. Please set up your Supabase credentials.")
  }

  // Return cached instance if credentials haven't changed
  if (supabaseInstance && lastUrl === url && lastKey === anonKey) {
    return supabaseInstance
  }

  // Create new instance with current credentials
  supabaseInstance = createBrowserClient(url, anonKey)
  lastUrl = url
  lastKey = anonKey

  return supabaseInstance
}

// Check if Supabase can be created (has credentials)
export function canCreateClient(): boolean {
  const localConfig = getSupabaseConfig()
  const url = localConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = localConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && anonKey)
}

// Reset the cached instance (call when credentials change)
export function resetClient(): void {
  supabaseInstance = null
  lastUrl = null
  lastKey = null
}
