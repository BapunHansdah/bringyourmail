"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Users, FileCode, Send, Loader2 } from "lucide-react"
import Link from "next/link"
import { useConfig } from "@/hooks/use-config"

export default function DashboardPage() {
  const router = useRouter()
  const { loading, isSupabaseConfigured, profiles, activeProfile } = useConfig()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // If not configured, redirect to setup
    if (mounted && !loading && !isSupabaseConfigured) {
      router.push("/setup")
    }
  }, [mounted, loading, isSupabaseConfigured, router])

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="p-4 pt-18 md:ml-64 md:p-8 md:pt-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">Manage your email campaigns and contacts</p>
        </div>

        {profiles.length === 0 && (
          <div className="mb-6 rounded-lg border border-primary/50 bg-primary/10 p-4">
            <p className="font-medium">Welcome! Let&apos;s get you started.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first profile to configure email settings and start sending.
            </p>
            <Link href="/settings" className="inline-block mt-3 text-sm text-primary hover:underline">
              Go to Settings to create a profile
            </Link>
          </div>
        )}

        {activeProfile && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Active Profile</p>
            <p className="font-medium">{activeProfile.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeProfile.emailProviders.length} email provider(s) | Table: {activeProfile.contactsTableName}
            </p>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          <Link href="/templates">
            <Card className="border-border bg-card transition-colors hover:bg-secondary cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Templates</CardTitle>
                <FileCode className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold md:text-2xl">Create & Edit</p>
                <p className="text-xs text-muted-foreground mt-1">Design email templates with live preview</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/contacts">
            <Card className="border-border bg-card transition-colors hover:bg-secondary cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contacts</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold md:text-2xl">View & Manage</p>
                <p className="text-xs text-muted-foreground mt-1">Browse contacts from any table</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/send">
            <Card className="border-border bg-card transition-colors hover:bg-secondary cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Send Emails</CardTitle>
                <Send className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold md:text-2xl">Bulk Send</p>
                <p className="text-xs text-muted-foreground mt-1">Send emails to selected contacts</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="border-border bg-card transition-colors hover:bg-secondary cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Settings</CardTitle>
                <Mail className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold md:text-2xl">Profiles & Config</p>
                <p className="text-xs text-muted-foreground mt-1">Manage profiles and email providers</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card p-4 md:mt-8 md:p-6">
          <h2 className="text-base font-semibold mb-4 md:text-lg">Quick Start Guide</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Create a Profile</p>
                <p className="text-sm text-muted-foreground">Set up a profile with your email provider settings</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Create Templates</p>
                <p className="text-sm text-muted-foreground">Design your email templates with variables</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Send Emails</p>
                <p className="text-sm text-muted-foreground">Select contacts and send bulk emails</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
