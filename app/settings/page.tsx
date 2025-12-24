"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, User, AlertTriangle } from "lucide-react"
import { ProfileManager } from "@/components/profile-manager"
import { useConfig } from "@/hooks/use-config"
import { useRouter } from "next/navigation"
import { resetConfig } from "@/lib/config-manager"

export default function SettingsPage() {
  const router = useRouter()
  const { loading, supabaseConfig, disconnectSupabase } = useConfig()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleResetAll = () => {
    if (
      confirm(
        "Are you sure you want to reset all settings? This will remove your database connection, all profiles, and email providers. This cannot be undone.",
      )
    ) {
      resetConfig()
      router.push("/setup")
    }
  }

  const handleDisconnectDatabase = () => {
    if (confirm("Are you sure you want to disconnect from this database?")) {
      disconnectSupabase()
      router.push("/setup")
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <main className="p-4 pt-18 md:ml-64 md:p-8 md:pt-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="h-4 w-96 bg-secondary rounded" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="p-4 pt-18 md:ml-64 md:p-8 md:pt-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Manage your profiles, email providers, and database connection
          </p>
        </div>

        <Tabs defaultValue="profiles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profiles" className="gap-2">
              <User className="h-4 w-4" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <ProfileManager />
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Connection
                </CardTitle>
                <CardDescription>Your Supabase database connection details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supabaseConfig ? (
                  <>
                    <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Project URL</span>
                        <span className="text-sm font-mono">{supabaseConfig.url}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Connected At</span>
                        <span className="text-sm">
                          {supabaseConfig.connectedAt
                            ? new Date(supabaseConfig.connectedAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Anon Key</span>
                        <span className="text-sm font-mono">{supabaseConfig.anonKey.slice(0, 20)}...</span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleDisconnectDatabase}>
                      Disconnect Database
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">No database connected.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-destructive/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions that affect all your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                  <div>
                    <p className="font-medium">Reset All Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Remove all profiles, providers, and database connection
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleResetAll}>
                    Reset Everything
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
