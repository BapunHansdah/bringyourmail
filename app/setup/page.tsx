"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SupabaseSetup } from "@/components/supabase-setup"
import { useConfig } from "@/hooks/use-config"
import type { SupabaseConfig } from "@/types/config"
import { Loader2 } from "lucide-react"

export default function SetupPage() {
  const router = useRouter()
  const { loading, isSupabaseConfigured, setSupabaseConfig, supabaseConfig } = useConfig()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // If already configured, redirect to login
    if (mounted && !loading && isSupabaseConfigured) {
      router.push("/login")
    }
  }, [mounted, loading, isSupabaseConfigured, router])

  const handleComplete = (config: SupabaseConfig) => {
    setSupabaseConfig(config)
    router.push("/login")
  }

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <SupabaseSetup onComplete={handleComplete} existingConfig={supabaseConfig} />
}
