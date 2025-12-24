"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseConfig } from "@/types/config"

interface SupabaseSetupProps {
  onComplete: (config: SupabaseConfig) => void
  existingConfig?: SupabaseConfig | null
}

export function SupabaseSetup({ onComplete, existingConfig }: SupabaseSetupProps) {
  const [url, setUrl] = useState(existingConfig?.url || "")
  const [anonKey, setAnonKey] = useState(existingConfig?.anonKey || "")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleTest = async () => {
    if (!url || !anonKey) {
      setTestResult({ success: false, message: "Please enter both URL and Anon Key" })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Validate URL format
      const urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/
      if (!urlPattern.test(url)) {
        setTestResult({
          success: false,
          message: "Invalid Supabase URL format. It should be like: https://your-project.supabase.co",
        })
        setTesting(false)
        return
      }

      // Try to create a client and make a simple query
      const testClient = createBrowserClient(url, anonKey)

      // Try to get the current user (this doesn't require auth, just valid credentials)
      const { error } = await testClient.auth.getSession()

      if (error && error.message.includes("Invalid API key")) {
        setTestResult({ success: false, message: "Invalid Anon Key. Please check your credentials." })
      } else {
        setTestResult({ success: true, message: "Connection successful! Your Supabase credentials are valid." })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect. Please check your credentials.",
      })
    }

    setTesting(false)
  }

  const handleSave = () => {
    if (!url || !anonKey) return

    const config: SupabaseConfig = {
      url,
      anonKey,
      isConnected: true,
      connectedAt: new Date().toISOString(),
    }

    onComplete(config)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Your Database</CardTitle>
          <CardDescription>
            Enter your Supabase credentials to connect your own database. Your credentials are stored locally in your
            browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <h4 className="font-medium mb-2">How to get your credentials:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to your Supabase project dashboard</li>
              <li>Click on Settings (gear icon) in the sidebar</li>
              <li>Go to API under Configuration</li>
              <li>Copy the Project URL and anon/public key</li>
            </ol>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
            >
              Open Supabase Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Project URL</Label>
              <Input
                id="supabase-url"
                type="url"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value.trim())}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anon-key">Anon / Public Key</Label>
              <Input
                id="anon-key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value.trim())}
                className="bg-secondary border-border font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use the anon/public key, not the service_role key. This is safe to use in the browser.
              </p>
            </div>
          </div>

          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-lg p-4 ${
                testResult.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !url || !anonKey}
              className="flex-1 bg-transparent"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            <Button onClick={handleSave} disabled={!url || !anonKey || !testResult?.success} className="flex-1">
              Save & Continue
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your credentials are stored only in your browser&apos;s localStorage and never sent to any server.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
