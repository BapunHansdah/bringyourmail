"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { ContactsTable } from "@/components/contacts-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Database, AlertCircle, CheckCircle, Filter, X, Server } from "lucide-react"
import { createClient, canCreateClient } from "@/lib/supabase/client"
import { useConfig } from "@/hooks/use-config"
import type { EmailTemplate, Contact, TemplateUsage } from "@/types/email"
import type { SmtpProvider } from "@/types/config"

function updateTemplateUsage(existing: TemplateUsage[] | undefined, templateName: string): TemplateUsage[] {
  const usage = existing || []
  const existingIndex = usage.findIndex((t) => t.name === templateName)

  if (existingIndex >= 0) {
    // Update existing template usage
    const updated = [...usage]
    updated[existingIndex] = {
      ...updated[existingIndex],
      used: updated[existingIndex].used + 1,
      last_used_at: new Date().toISOString(),
    }
    return updated
  } else {
    // Add new template usage
    return [
      ...usage,
      {
        name: templateName,
        used: 1,
        last_used_at: new Date().toISOString(),
      },
    ]
  }
}

export default function SendPage() {
  const { activeProfile, loading: configLoading, defaultProvider } = useConfig()
  const defaultTable = activeProfile?.contactsTableName || "contacts"
  const [tableName, setTableName] = useState(defaultTable)
  const [inputValue, setInputValue] = useState(defaultTable)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 })
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle")

  // Filter states
  const [filters, setFilters] = useState({
    emailOpened: "all",
    emailStatus: "all",
    timeSent: "all",
    customDateFrom: "",
    customDateTo: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (activeProfile?.contactsTableName) {
      setTableName(activeProfile.contactsTableName)
      setInputValue(activeProfile.contactsTableName)
    }
  }, [activeProfile?.contactsTableName])

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!canCreateClient()) return
      try {
        const supabase = createClient()
        const { data } = await supabase.from("email_templates").select("*").order("name")
        if (data) setTemplates(data as EmailTemplate[])
      } catch {
        // Ignore errors
      }
    }
    fetchTemplates()
  }, [])

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids)
  }, [])

  const replaceVariables = (template: string, contact: Contact): string => {
    let result = template

    // Replace top-level fields
    Object.keys(contact).forEach((key) => {
      if (key !== "data" && key !== "template_used") {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g")
        const value = contact[key as keyof Contact]
        result = result.replace(regex, value != null ? String(value) : "")
      }
    })

    // Replace data.* fields (nested JSONB fields)
    if (contact.data && typeof contact.data === "object") {
      Object.keys(contact.data).forEach((key) => {
        const regex = new RegExp(`\\{\\{data\\.${key}\\}\\}`, "g")
        const value = contact.data[key]
        result = result.replace(regex, value != null ? String(value) : "")
      })
    }

    // Remove any remaining unreplaced variables
    result = result.replace(/\{\{[^}]+\}\}/g, "")

    return result
  }

  const handleSendEmails = async () => {
    if (!selectedTemplate || selectedIds.length === 0) return
    if (!canCreateClient()) return

    const emailProvider = defaultProvider as SmtpProvider | null

    console.log(emailProvider)

    if (!emailProvider?.type) {
      alert("No email provider configured. Please add an SMTP provider in Settings.")
      return
    }

    setSending(true)
    setStatus("sending")
    setProgress({ sent: 0, failed: 0, total: selectedIds.length })

    const supabase = createClient()

    const { data: contacts } = await supabase.from(tableName).select("*").in("id", selectedIds)
    const { data: template } = await supabase.from("email_templates").select("*").eq("id", selectedTemplate).single()

    if (!contacts || !template) {
      setSending(false)
      setStatus("idle")
      return
    }

    let sent = 0
    let failed = 0

    for (const contact of contacts as Contact[]) {
      try {
        const htmlContent = replaceVariables(template.html_content, contact)
        const emailSubject = replaceVariables(template.subject, contact)

        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-smtp-config": JSON.stringify(emailProvider),
          },
          body: JSON.stringify({
            to: contact.email_id,
            subject: emailSubject,
            html: htmlContent,
          }),
        })

        if (response.ok) {
          const updatedTemplateUsage = updateTemplateUsage(contact.template_used, template.name)

          await supabase
            .from(tableName)
            .update({
              email_status: "sent",
              last_sent_at: new Date().toISOString(),
              no_of_time_sent: (contact.no_of_time_sent || 0) + 1,
              template_used: updatedTemplateUsage,
              updated_at: new Date().toISOString(),
            })
            .eq("id", contact.id)
          sent++
        } else {
          const errorData = await response.json()
          await supabase
            .from(tableName)
            .update({
              email_status: "failed",
              failure_reason: errorData.error || "Unknown error",
              updated_at: new Date().toISOString(),
            })
            .eq("id", contact.id)
          failed++
        }
      } catch {
        await supabase
          .from(tableName)
          .update({
            email_status: "failed",
            failure_reason: "Network error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", contact.id)
        failed++
      }

      setProgress({ sent, failed, total: selectedIds.length })
    }

    setSending(false)
    setStatus("done")
  }

  const resetFilters = () => {
    setFilters({
      emailOpened: "all",
      emailStatus: "all",
      timeSent: "all",
      customDateFrom: "",
      customDateTo: "",
    })
  }

  const activeFilterCount = () => {
    let count = 0
    if (filters.emailOpened !== "all") count++
    if (filters.emailStatus !== "all") count++
    if (filters.timeSent !== "all") count++
    return count
  }

  if (configLoading) {
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
          <h1 className="text-2xl font-bold md:text-3xl">Send Emails</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">Select contacts and send bulk emails</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-6 order-2 lg:order-1">
            {/* Table Name Input */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="table-name" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Table Name
                  </Label>
                  <Input
                    id="table-name"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter table name"
                    className="bg-secondary border-border"
                  />
                </div>
                <Button onClick={() => setTableName(inputValue)} className="w-full sm:w-auto">
                  Load Table
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                    {activeFilterCount() > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {activeFilterCount()}
                      </span>
                    )}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    {showFilters ? "Hide" : "Show"}
                  </Button>
                </div>
              </CardHeader>

              {showFilters && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Email Opened Filter */}
                    <div className="space-y-2">
                      <Label>Email Opened</Label>
                      <Select
                        value={filters.emailOpened}
                        onValueChange={(value) => setFilters({ ...filters, emailOpened: value })}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="opened">Opened</SelectItem>
                          <SelectItem value="not_opened">Not Opened</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Email Status Filter */}
                    <div className="space-y-2">
                      <Label>Email Status</Label>
                      <Select
                        value={filters.emailStatus}
                        onValueChange={(value) => setFilters({ ...filters, emailStatus: value })}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="null">Not Sent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time Sent Filter */}
                    <div className="space-y-2">
                      <Label>Time Sent</Label>
                      <Select
                        value={filters.timeSent}
                        onValueChange={(value) => setFilters({ ...filters, timeSent: value })}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="last_24h">Last 24 Hours</SelectItem>
                          <SelectItem value="last_7d">Last 7 Days</SelectItem>
                          <SelectItem value="last_30d">Last 30 Days</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Custom Date Range */}
                  {filters.timeSent === "custom" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>From Date</Label>
                        <Input
                          type="date"
                          value={filters.customDateFrom}
                          onChange={(e) => setFilters({ ...filters, customDateFrom: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>To Date</Label>
                        <Input
                          type="date"
                          value={filters.customDateTo}
                          onChange={(e) => setFilters({ ...filters, customDateTo: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>
                    </div>
                  )}

                  {/* Reset Filters Button */}
                  {activeFilterCount() > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reset Filters
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Contacts Table */}
            <ContactsTable
              tableName={tableName}
              selectable
              onSelectionChange={handleSelectionChange}
              filters={filters}
            />
          </div>

          {/* Send Configuration Sidebar */}
          <div className="w-full lg:w-80 order-1 lg:order-2">
            <Card className="border-border bg-card lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {defaultProvider ? (
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                    <Server className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{defaultProvider.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {defaultProvider.type === "smtp" ? defaultProvider.config.user : defaultProvider.type}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    No email provider configured
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Email Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Selected contacts</p>
                  <p className="text-2xl font-bold">{selectedIds.length}</p>
                </div>

                {status === "sending" && (
                  <div className="rounded-lg bg-secondary p-4 space-y-2">
                    <p className="text-sm font-medium">Sending in progress...</p>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${((progress.sent + progress.failed) / progress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {progress.sent + progress.failed} / {progress.total} processed
                    </p>
                  </div>
                )}

                {status === "done" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{progress.sent} emails sent successfully</span>
                    </div>
                    {progress.failed > 0 && (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{progress.failed} emails failed</span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleSendEmails}
                  disabled={sending || !selectedTemplate || selectedIds.length === 0 || !defaultProvider}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? "Sending..." : `Send to ${selectedIds.length} contacts`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
