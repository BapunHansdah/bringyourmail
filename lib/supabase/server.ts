import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient(customUrl?: string, customKey?: string) {
  const cookieStore = await cookies()

  // Use custom credentials if provided, otherwise use env vars
  const url = customUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = customKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignore errors from Server Components
        }
      },
    },
  })
}
