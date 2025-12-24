"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FileCode,
  Pencil,
  Trash2,
  Code,
  Eye,
  Save,
  X,
  Copy,
  Database,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/sidebar";

// Types
interface TableSchema {
  [key: string]: any;
}

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  html_content: string;
  table_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Schema Fetcher Component
const SchemaFetcher = ({
  onSchemaFetched,
  initialTableName,
}: {
  onSchemaFetched: (tableName: string, schema: TableSchema) => void;
  initialTableName?: string;
}) => {
  const [tableName, setTableName] = useState(initialTableName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSchema = async () => {
    if (!tableName.trim()) {
      setError("Please enter a table name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // In real implementation, replace with your Supabase client
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1)
        .single();

      if (error) {
        setError(
          `Failed to fetch schema from table "${tableName}". Please check the table name.`
        );
        return;
      }

      const mockSchema: TableSchema = {};

      if (data) {
        for (const column of Object.keys(data)) {
          if (typeof data[column] === "object" && data[column] !== null) {
            mockSchema[column] = Object.fromEntries(
              Object.entries(data[column]).map(([key, value]) => [
                key,
                { type: typeof value },
              ])
            );
          } else {
            mockSchema[column] = { type: typeof data[column] };
          }
        }
      }

      onSchemaFetched(tableName, mockSchema);
      setError("");
    } catch (err) {
      setError(
        `Failed to fetch schema from table "${tableName}". Please check the table name.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configure Data Source
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="table-name">Table Name</Label>
          <div className="flex flex-col gap-2">
            <Input
              id="table-name"
              placeholder="e.g., contacts, users, leads"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchSchema()}
            />
            <Button onClick={fetchSchema} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span className="ml-2">Fetch Schema</span>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Enter your table name and click "Fetch Schema" to detect available
            fields for variable suggestions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Variable Selector Component
const VariableSelector = ({
  schema,
  onInsert,
}: {
  schema?: TableSchema;
  onInsert: (variable: string) => void;
}) => {
  if (!schema) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Fetch table schema to see available variables
        </p>
      </div>
    );
  }

  // Extract top-level fields
  const topLevelFields = Object.entries(schema)
    .filter(([key]) => key !== "data")
    .map(([key, value]) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      example: String(value),
      type: typeof value,
    }));

  // Extract data fields if present
  const dataFields =
    schema.data && typeof schema.data === "object"
      ? Object.entries(schema.data).map(([key, value]) => ({
          key: `data.${key}`,
          label: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          example: String(value),
          type: typeof value,
        }))
      : [];

  const allFields = [...topLevelFields, ...dataFields];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Code className="h-4 w-4" />
        <h3 className="font-semibold text-sm">Available Variables</h3>
        <span className="text-xs text-muted-foreground">
          ({allFields.length} fields)
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-2">
        {allFields.map((field) => (
          <div
            key={field.key}
            className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer group transition-all"
            onClick={() => onInsert(`{{${field.key}}}`)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{field.label}</span>
                <span className="text-xs px-1.5 py-0.5 bg-secondary rounded">
                  {field.type}
                </span>
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1">
                {`{{${field.key}}}`}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                Example: <span className="font-medium">{field.example}</span>
              </div>
            </div>
            <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Template Preview Component
const TemplatePreview = ({
  template,
  schema,
}: {
  template: string;
  schema?: TableSchema;
}) => {
  const populateTemplate = (content: string, data?: TableSchema) => {
    if (!data) return content;

    let result = content;

    // Replace all top-level fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "data") {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        result = result.replace(placeholder, String(value));
      }
    });

    // Replace data fields if present
    if (data.data && typeof data.data === "object") {
      Object.entries(data.data).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{data\\.${key}\\}\\}`, "g");
        result = result.replace(placeholder, String(value));
      });
    }

    return result;
  };

  const previewContent = populateTemplate(template, schema);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="h-4 w-4" />
        <h3 className="font-semibold text-sm">Preview with Sample Data</h3>
      </div>
      <div
        className="border rounded-lg p-4 bg-background min-h-[200px] prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />
    </div>
  );
};

// Template Editor Component
const TemplateEditor = ({
  template,
  onSave,
  onCancel,
}: {
  template: EmailTemplate | null;
  onSave: (template: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [content, setContent] = useState(template?.html_content || "");
  const [tableName, setTableName] = useState(template?.table_name || "");
  const [schema, setSchema] = useState<TableSchema | undefined>();
  const [schemaFetched, setSchemaFetched] = useState(false);

  const handleSchemaFetched = (table: string, fetchedSchema: TableSchema) => {
    setTableName(table);
    setSchema(fetchedSchema);
    setSchemaFetched(true);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(
      "content-editor"
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + variable + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length
        );
      }, 0);
    }
  };

  const insertVariableInSubject = (variable: string) => {
    const input = document.getElementById(
      "template-subject"
    ) as HTMLInputElement;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newSubject =
        subject.substring(0, start) + variable + subject.substring(end);
      setSubject(newSubject);

      setTimeout(() => {
        input.focus();
        input.setSelectionRange(
          start + variable.length,
          start + variable.length
        );
      }, 0);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !subject.trim()) {
      alert("Please fill in template name and subject");
      return;
    }

    if (!schemaFetched) {
      alert("Please fetch table schema first to ensure variables are valid");
      return;
    }

    onSave({
      id: template?.id,
      name: name.trim(),
      subject: subject.trim(),
      html_content: content,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {template ? "Edit Template" : "Create New Template"}
            </CardTitle>
            {schemaFetched && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSchemaFetched(false)}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Change Table
              </Button>
            )}
          </div>
          {schemaFetched && tableName && (
            <p className="text-sm text-muted-foreground">
              Using schema from:{" "}
              <span className="font-mono font-medium">{tableName}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Welcome Email"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template-subject">Email Subject</Label>
              <span className="text-xs text-muted-foreground">
                Click variables to insert →
              </span>
            </div>
            <Input
              id="template-subject"
              placeholder="e.g., Welcome {{name}}!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="content-editor">Email Content (HTML)</Label>
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-2">
                  <Textarea
                    id="content-editor"
                    placeholder="Enter your email content here. Click variables from the sidebar to insert them."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[450px] font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-2">
                  <TemplatePreview template={content} schema={schema} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              {!schemaFetched && (
                <SchemaFetcher
                  onSchemaFetched={handleSchemaFetched}
                  initialTableName={template?.table_name}
                />
              )}
              <Label>Insert Variables</Label>
              <VariableSelector schema={schema} onInsert={insertVariable} />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Page Component
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // In real implementation, replace with your Supabase client
      const supabase = createClient();
      const { data, error } = await supabase
        .from("email_templates")
        .select("*");
      if (error) throw error;
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSave = async (template: Partial<EmailTemplate>) => {
 
  if(!template.name || !template.subject || !template.html_content) {
      alert("Template name, subject, and content are required.");
      return;
  }

    if (template.id) {
      try {
        const supabase = createClient();
        await supabase
          .from("email_templates")
          .update(template)
          .eq("id", template.id);
        setTemplates(
          templates.map((t) =>
            t.id === template.id
              ? ({
                  ...t,
                  ...template,
                  updated_at: new Date().toISOString(),
                } as EmailTemplate)
              : t
          )
        );
      } catch (error) {
        console.error("Error updating template:", error);
      }
    } else {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("email_templates")
          .insert(template);

        console.log(data);
        console.log(error);

        if (error) throw error;

        const newTemplate: EmailTemplate = {
          ...template,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as EmailTemplate;

        setTemplates([newTemplate, ...templates]);
      } catch (error) {
        console.error("Error saving template:", error);
      }
    }

    setEditing(false);
    setSelectedTemplate(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    // setTemplates(templates.filter((t) => t.id !== id));
    try {
      const supabase = createClient();
      await supabase.from("email_templates").delete().eq("id", id);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="p-4 pt-18 md:ml-64 md:p-8 md:pt-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Email Templates</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Create templates with dynamic variables from any database table
            </p>
          </div>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          )}
        </div>

        {editing ? (
          <TemplateEditor
            template={selectedTemplate}
            onSave={handleSave}
            onCancel={() => {
              setEditing(false);
              setSelectedTemplate(null);
            }}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : templates.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4 text-center">
                    No templates yet. Create your first one!
                  </p>
                  <Button onClick={() => setEditing(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="group">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <CardTitle className="text-lg truncate">
                        {template.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {template.subject}
                      </p>
                      {template.table_name && (
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          Table: {template.table_name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setEditing(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Updated{" "}
                      {new Date(template.updated_at!).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
