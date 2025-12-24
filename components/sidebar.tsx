"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Mail, FileCode, Users, Settings, Send, Menu, X, LogOut, Database, ChartArea } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient, canCreateClient } from "@/lib/supabase/client"
import { ProfileSwitcher } from "@/components/profile-switcher"
import { useConfig } from "@/hooks/use-config"

const navigation = [
  { name: "Dashboard", href: "/", icon: Mail },
  { name: "Analytics", href: "/analytics", icon: ChartArea},
  { name: "Templates", href: "/templates", icon: FileCode },
  { name: "Send Emails", href: "/send", icon: Send },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { supabaseConfig, disconnectSupabase } = useConfig()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      if (canCreateClient()) {
        const supabase = createClient()
        await supabase.auth.signOut()
      }
    } catch {
      // Ignore errors
    }
    router.push("/login")
    router.refresh()
  }

  const handleDisconnectDatabase = () => {
    if (confirm("Are you sure you want to disconnect from this database? You will need to set up credentials again.")) {
      disconnectSupabase()
      router.push("/setup")
    }
  }
// https://supabase.com/dashboard/project/mzepvhuelfhmlzxiyyxz/settings/api
// https://supabase.com/dashboard/project/mzepvhuelfhmlzxiyyxz/settings/api-keys/legacy

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <span className="font-semibold">Email Sender</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card transition-transform duration-300 md:translate-x-0 flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-6 md:h-16">
          <Mail className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Email Sender</span>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border-b border-border p-3">
          <ProfileSwitcher />
        </div>

        <nav className="flex flex-col gap-1 p-4 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4 space-y-2">
          {supabaseConfig && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
              <Database className="h-3 w-3 shrink-0" />
              <span className="truncate">{supabaseConfig.url.replace("https://", "").replace(".supabase.co", "")}</span>
              <Button variant="ghost" size="sm" className="h-5 px-1 ml-auto text-xs" onClick={handleDisconnectDatabase}>
                Change
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </aside>
    </>
  )
}
