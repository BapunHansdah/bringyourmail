"use client"

import { ChevronDown, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useConfig } from "@/hooks/use-config"
import { useRouter } from "next/navigation"

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId } = useConfig()
  const router = useRouter()

  if (profiles.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between gap-2 px-3 py-2 h-auto">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <User className="h-3 w-3 text-primary" />
            </div>
            <span className="truncate text-sm font-medium">{activeProfile?.name || "Select Profile"}</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => setActiveProfileId(profile.id)}
            className={profile.id === activeProfile?.id ? "bg-primary/10" : ""}
          >
            <User className="mr-2 h-4 w-4" />
            <span className="truncate">{profile.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Plus className="mr-2 h-4 w-4" />
          Manage Profiles
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
