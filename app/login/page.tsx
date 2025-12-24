"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient, canCreateClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Loader2, Eye, EyeOff, Database } from "lucide-react"
import { useConfig } from "@/hooks/use-config"

export default function LoginPage() {
  const router = useRouter()
  const { loading: configLoading, isSupabaseConfigured, supabaseConfig, disconnectSupabase } = useConfig()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // If Supabase not configured, redirect to setup
    if (mounted && !configLoading && !isSupabaseConfigured) {
      router.push("/setup")
    }
  }, [mounted, configLoading, isSupabaseConfigured, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (!canCreateClient()) {
        setError("Supabase not configured. Please set up your credentials first.")
        router.push("/setup")
        return
      }

      const supabase = createClient()

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          },
        })

        if (error) {
          setError(error.message)
        } else {
          setMessage("Check your email to confirm your account")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else {
          router.push("/")
          router.refresh()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }

    setLoading(false)
  }

  const handleDisconnect = () => {
    disconnectSupabase()
    router.push("/setup")
  }

  if (!mounted || configLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Email Sender</CardTitle>
          <CardDescription>
            {isSignUp ? "Create an account to get started" : "Sign in to access your dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supabaseConfig && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{supabaseConfig.url}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 text-xs">
                Change
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            {message && <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{message}</div>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setMessage(null)
                }}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
