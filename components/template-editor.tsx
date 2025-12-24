"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Eye, Code } from "lucide-react"
import type { EmailTemplate } from "@/types/email"

interface TemplateEditorProps {
  template?: EmailTemplate | null
  onSave: (template: Partial<EmailTemplate>) => void
  onCancel: () => void
}

const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
    h1 { color: #333; margin-bottom: 20px; }
    p { color: #666; line-height: 1.6; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello {{name}}</h1>
    <p>This is a sample email template. You can customize this content to fit your needs.</p>
    <p>Use variables like {{aname}} and {{email_id}} to personalize your emails.</p>
    <a href="#" class="button">Learn More</a>
    <div class="footer">
      <p>Best regards,<br>Your Company</p>
    </div>
  </div>
</body>
</html>`

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || "")
  const [subject, setSubject] = useState(template?.subject || "")
  const [htmlContent, setHtmlContent] = useState(template?.html_content || defaultTemplate)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      id: template?.id,
      name,
      subject,
      html_content: htmlContent,
    })
    setSaving(false)
  }

  const previewHtml = htmlContent
    .replace(/\{\{name\}\}/g, "Acme Corp")
    .replace(/\{\{email_id\}\}/g, "example@acme.com")

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Welcome Email"
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Welcome to {{name}}"
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <Tabs defaultValue="code" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="code" className="gap-2">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Code</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="mt-4">
          <div className="relative">
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="h-[350px] w-full rounded-lg border border-border bg-secondary p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary md:h-[500px]"
              spellCheck={false}
            />
          </div>
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Subject: {subject.replace(/\{\{name\}\}/g, "Acme Corp")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                srcDoc={previewHtml}
                className="h-[350px] w-full rounded-b-lg bg-white md:h-[500px]"
                title="Email Preview"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto bg-transparent">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !name || !subject} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </div>
  )
}
