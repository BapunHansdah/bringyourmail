"use client"

import { useState, useEffect, useCallback } from "react"
import type { MasterConfig, Profile, EmailProvider, SupabaseConfig } from "@/types/config"
import {
  getConfig,
  saveConfig,
  getActiveProfile,
  setActiveProfile as setActiveProfileUtil,
  createProfile,
  updateProfile,
  deleteProfile,
  addEmailProvider,
  updateEmailProvider,
  deleteEmailProvider,
  setDefaultEmailProvider,
  getDefaultEmailProvider,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  migrateOldConfig,
} from "@/lib/config-manager"

export function useConfig() {
  const [config, setConfigState] = useState<MasterConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshConfig = useCallback(() => {
    const currentConfig = getConfig()
    setConfigState(currentConfig)
  }, [])

  useEffect(() => {
    migrateOldConfig()
    refreshConfig()
    setLoading(false)
  }, [refreshConfig])

  const updateConfigState = useCallback((updater: (prev: MasterConfig) => MasterConfig) => {
    setConfigState((prev) => {
      if (!prev) return prev
      const updated = updater(prev)
      saveConfig(updated)
      return updated
    })
  }, [])

  // Supabase configuration
  const setSupabaseConfig = useCallback(
    (supabaseConfig: SupabaseConfig) => {
      saveSupabaseConfig(supabaseConfig)
      refreshConfig()
    },
    [refreshConfig],
  )

  const disconnectSupabase = useCallback(() => {
    clearSupabaseConfig()
    refreshConfig()
  }, [refreshConfig])

  // Profile management
  const activeProfile = config ? getActiveProfile() : null

  const setActiveProfileId = useCallback(
    (profileId: string) => {
      setActiveProfileUtil(profileId)
      refreshConfig()
    },
    [refreshConfig],
  )

  const addProfile = useCallback(
    (name: string, description?: string, contactsTableName?: string) => {
      const profile = createProfile(name, description, contactsTableName)
      refreshConfig()
      return profile
    },
    [refreshConfig],
  )

  const editProfile = useCallback(
    (profileId: string, updates: Partial<Omit<Profile, "id" | "createdAt">>) => {
      const updated = updateProfile(profileId, updates)
      refreshConfig()
      return updated
    },
    [refreshConfig],
  )

  const removeProfile = useCallback(
    (profileId: string) => {
      const result = deleteProfile(profileId)
      refreshConfig()
      return result
    },
    [refreshConfig],
  )

  // Email provider management
  const addProvider = useCallback(
    (profileId: string, provider: Omit<EmailProvider, "id" | "createdAt" | "updatedAt">) => {
      const added = addEmailProvider(profileId, provider)
      refreshConfig()
      return added
    },
    [refreshConfig],
  )

  const editProvider = useCallback(
    (profileId: string, providerId: string, updates: Partial<Omit<EmailProvider, "id" | "createdAt">>) => {
      const updated = updateEmailProvider(profileId, providerId, updates)
      refreshConfig()
      return updated
    },
    [refreshConfig],
  )

  const removeProvider = useCallback(
    (profileId: string, providerId: string) => {
      const result = deleteEmailProvider(profileId, providerId)
      refreshConfig()
      return result
    },
    [refreshConfig],
  )

  const setDefaultProvider = useCallback(
    (profileId: string, providerId: string) => {
      const result = setDefaultEmailProvider(profileId, providerId)
      refreshConfig()
      return result
    },
    [refreshConfig],
  )

  const defaultProvider = getDefaultEmailProvider()

  return {
    config,
    loading,
    refreshConfig,

    // Supabase
    isSupabaseConfigured: config ? isSupabaseConfigured() : false,
    supabaseConfig: config?.supabase || null,
    setSupabaseConfig,
    disconnectSupabase,

    // Profiles
    profiles: config?.profiles || [],
    activeProfile,
    activeProfileId: config?.activeProfileId || null,
    setActiveProfileId,
    addProfile,
    editProfile,
    removeProfile,

    // Email providers
    addProvider,
    editProvider,
    removeProvider,
    setDefaultProvider,
    defaultProvider,
  }
}
