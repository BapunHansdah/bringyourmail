"use client"

import React, { useState, useMemo } from "react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts"
import { 
  Download, Mail, Eye, Target, 
  TrendingUp, Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, subDays, isWithinInterval } from "date-fns"
import * as XLSX from "xlsx"
import { createClient } from "@/lib/supabase/client"

// --- Types & Interfaces ---

interface Template {
  name: string;
}

interface AnalyticsItem {
  id?: string | number;
  last_sent_at: string | null;
  email_opened: boolean;
  email_status: 'sent' | 'opened' | 'converted' | string;
  template_used: Template[] | null;
  [key: string]: any; // For other dynamic Supabase fields
}

interface TemplateStat {
  name: string;
  sent: number;
  opened: number;
  converted: number;
}

interface AggregatedStats {
  totalSent: number;
  totalOpened: number;
  totalConverted: number;
  openRate: string | number;
  convRate: string | number;
  templateStats: TemplateStat[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

// --- Main Component ---

export default function AnalyticsSection() {
  const [tableName, setTableName] = useState<string>("contacts")
  const [data, setData] = useState<AnalyticsItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [dateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  })

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true)
    try {
      const supabase = await createClient()
      const { data: result, error } = await supabase
        .from(tableName)
        .select("*")
        .order("last_sent_at", { ascending: true })

      if (error) throw error
      setData((result as AnalyticsItem[]) || [])
    } catch (err) {
      console.error("Error fetching analytics:", err)
    } finally {
      setLoading(false)
    }
  }

  // 2. Process Analytics
  const stats = useMemo<AggregatedStats>(() => {
    const filtered = data.filter(item => {
      if (!item.last_sent_at) return false
      const sentDate = new Date(item.last_sent_at)
      return isWithinInterval(sentDate, { start: dateRange.start, end: dateRange.end })
    })

    const totalSent = filtered.length
    const totalOpened = filtered.filter(item => item.email_opened).length
    const totalConverted = filtered.filter(item => item.email_status === 'converted').length
    
    const templateMap: Record<string, TemplateStat> = {}
    
    filtered.forEach(item => {
      const templates = item.template_used || []
      templates.forEach(t => {
        if (!templateMap[t.name]) {
          templateMap[t.name] = { name: t.name, sent: 0, opened: 0, converted: 0 }
        }
        templateMap[t.name].sent += 1
        if (item.email_opened) templateMap[t.name].opened += 1
        if (item.email_status === 'converted') templateMap[t.name].converted += 1
      })
    })

    const templateStats = Object.values(templateMap)
      .sort((a, b) => b.converted - a.converted)
      .slice(0, 5)

    return {
      totalSent,
      totalOpened,
      totalConverted,
      openRate: totalSent ? ((totalOpened / totalSent) * 100).toFixed(1) : 0,
      convRate: totalSent ? ((totalConverted / totalSent) * 100).toFixed(1) : 0,
      templateStats
    }
  }, [data, dateRange])

  // 3. Export to Excel
  const exportReport = () => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Outreach Report")
    XLSX.writeFile(wb, `email_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-card p-4 rounded-lg border">
        <div className="flex flex-col gap-2 w-full md:w-64">
          <label className="text-xs font-medium text-muted-foreground uppercase">Target Table</label>
          <div className="flex gap-2">
            <Input 
              value={tableName} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTableName(e.target.value)}
              placeholder="contacts"
              className="bg-background"
            />
            <Button onClick={fetchData} disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Sync"}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport} className="flex gap-2">
            <Download className="h-4 w-4" /> Export CSV/Excel
          </Button>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Sent" value={stats.totalSent} icon={<Mail className="h-4 w-4" />} color="text-blue-500" />
        <MetricCard title="Open Rate" value={`${stats.openRate}%`} icon={<Eye className="h-4 w-4" />} color="text-emerald-500" />
        <MetricCard title="Conversions" value={stats.totalConverted} icon={<Target className="h-4 w-4" />} color="text-purple-500" />
        <MetricCard title="Conv. Rate" value={`${stats.convRate}%`} icon={<TrendingUp className="h-4 w-4" />} color="text-orange-500" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Template Performance Chart */}
       <Card className="border-border bg-black text-white">
  <CardHeader>
    <CardTitle className="text-sm font-medium">
      Best Performing Templates (by Conversion)
    </CardTitle>
  </CardHeader>

  <CardContent className="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={stats.templateStats} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis type="number" tick={{ fill: "#aaa" }} />
        <YAxis dataKey="name" type="category" tick={{ fill: "#fff" }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#000", color: "green" }}
        />
        <Bar dataKey="converted" fill="hsl(var(--primary))" />
        <Bar dataKey="opened" fill="hsl(var(--muted-foreground))" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>


        {/* Funnel Visualization */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Outreach Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center ">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Sent (No Action)', value: stats.totalSent - stats.totalOpened },
                    { name: 'Opened', value: stats.totalOpened - stats.totalConverted },
                    { name: 'Converted', value: stats.totalConverted },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#94a3b8" />
                  <Cell fill="#10b981" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-full bg-secondary ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}