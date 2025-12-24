"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, RefreshCw, Search, Check, X, AlertCircle } from "lucide-react"
import { createClient, canCreateClient } from "@/lib/supabase/client"
import type { Contact } from "@/types/email"

interface FilterOptions {
  emailOpened: string
  emailStatus: string
  timeSent: string
  customDateFrom: string
  customDateTo: string
}

interface ContactsTableProps {
  tableName: string
  onSelectionChange?: (selectedIds: string[]) => void
  selectable?: boolean
  filters?: FilterOptions
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500, 1000]

export function ContactsTable({ tableName, onSelectionChange, selectable = false, filters }: ContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const totalPages = Math.ceil(totalCount / pageSize)

  const fetchContacts = async () => {
    if (!canCreateClient()) {
      setError("Database not configured. Please set up your Supabase credentials in Settings.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      let query = supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,email_id.ilike.%${search}%`)
      }

      // Apply advanced filters
      if (filters) {
        // Email opened filter
        if (filters.emailOpened === "opened") {
          query = query.eq("email_opened", true)
        } else if (filters.emailOpened === "not_opened") {
          query = query.eq("email_opened", false)
        }

        // Email status filter
        if (filters.emailStatus !== "all") {
          if (filters.emailStatus === "null") {
            query = query.is("email_status", null)
          } else {
            query = query.eq("email_status", filters.emailStatus)
          }
        }

        // Time sent filter
        if (filters.timeSent !== "all") {
          const now = new Date()

          if (filters.timeSent === "last_24h") {
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            query = query.gte("last_sent_at", yesterday.toISOString()).not("last_sent_at", "is", null)
          } else if (filters.timeSent === "last_7d") {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            query = query.gte("last_sent_at", weekAgo.toISOString()).not("last_sent_at", "is", null)
          } else if (filters.timeSent === "last_30d") {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            query = query.gte("last_sent_at", monthAgo.toISOString()).not("last_sent_at", "is", null)
          } else if (filters.timeSent === "custom" && filters.customDateFrom && filters.customDateTo) {
            const fromDate = new Date(filters.customDateFrom)
            const toDate = new Date(filters.customDateTo)
            toDate.setHours(23, 59, 59, 999) // Include the entire end date

            query = query
              .gte("last_sent_at", fromDate.toISOString())
              .lte("last_sent_at", toDate.toISOString())
              .not("last_sent_at", "is", null)
          }
        }
      }

      const { data, count, error: queryError } = await query

      if (queryError) {
        setError(queryError.message)
        setContacts([])
        setTotalCount(0)
      } else if (data) {
        setContacts(data as Contact[])
        setTotalCount(count || 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts")
      setContacts([])
      setTotalCount(0)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchContacts()
  }, [tableName, page, pageSize, search, filters])

  useEffect(() => {
    // Reset to page 1 when filters or page size changes
    setPage(1)
  }, [filters, pageSize])

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds))
  }, [selectedIds, onSelectionChange])

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)))
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return <Badge variant="secondary">Not Sent</Badge>
    }

    switch (status) {
      case "sent":
        return <Badge className="bg-primary/20 text-primary">Sent</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="bg-secondary border-border pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchContacts}
          className="shrink-0 self-end sm:self-auto bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {selectable && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === contacts.length && contacts.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-border bg-secondary"
                  />
                </TableHead>
              )}
              <TableHead className="min-w-[120px]">Name</TableHead>
              <TableHead className="min-w-[180px]">Email</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="min-w-[100px]">Last Sent</TableHead>
              <TableHead className="min-w-[70px]">Opened</TableHead>
              <TableHead className="min-w-[90px]">Times Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={selectable ? 7 : 6} className="h-32 text-center">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectable ? 7 : 6} className="h-32 text-center text-muted-foreground">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id} className="border-border">
                  {selectable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="h-4 w-4 rounded border-border bg-secondary"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.email_id}</TableCell>
                  <TableCell>{getStatusBadge(contact.email_status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.last_sent_at ? new Date(contact.last_sent_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {contact.email_opened ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.no_of_time_sent || 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <p className="text-sm text-muted-foreground">
            Showing {contacts.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of{" "}
            {totalCount} contacts
          </p>
          <span className="text-muted-foreground">|</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}