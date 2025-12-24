"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {  
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Check, Mail, Server, Cloud } from "lucide-react";
import { useConfig } from "@/hooks/use-config";
import type {
  Profile,
  EmailProvider,
  SmtpProvider,
  AwsSesProvider,
  GmailApiProvider,
  ZeptoMailProvider,
  EmailProviderType,
} from "@/types/config";

const providerIcons: Record<EmailProviderType, typeof Mail> = {
  smtp: Server,
  aws_ses: Cloud,
  gmail_api: Mail,
  zepto_mail: Mail,
};

const providerLabels: Record<EmailProviderType, string> = {
  smtp: "SMTP",
  aws_ses: "AWS SES",
  gmail_api: "Gmail API",
  zepto_mail: "Zepto Mail",
};

export function ProfileManager() {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    editProfile,
    removeProfile,
    addProvider,
    editProvider,
    removeProvider,
    setDefaultProvider,
  } = useConfig();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editingProvider, setEditingProvider] = useState<EmailProvider | null>(
    null
  );

  // New profile form state
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDescription, setNewProfileDescription] = useState("");
  const [newProfileTableName, setNewProfileTableName] = useState("contacts");

  // Provider form state
  const [providerName, setProviderName] = useState("");
  const [providerType, setProviderType] = useState<EmailProviderType>("smtp");
  
  // SMTP
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  
  // AWS SES
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsFrom, setAwsFrom] = useState("");
  
  // Gmail API
  const [gmailClientEmail, setGmailClientEmail] = useState("");
  const [gmailPrivateKey, setGmailPrivateKey] = useState("");
  const [gmailFrom, setGmailFrom] = useState("");
  
  // Zepto Mail
  const [zeptoUrl, setZeptoUrl] = useState("https://api.zeptomail.com/v1.1/email");
  const [zeptoApiKey, setZeptoApiKey] = useState("");
  const [zeptoFrom, setZeptoFrom] = useState("");
  const [zeptoFromName, setZeptoFromName] = useState("");

  const resetProfileForm = () => {
    setNewProfileName("");
    setNewProfileDescription("");
    setNewProfileTableName("contacts");
  };

  const resetProviderForm = () => {
    setProviderName("");
    setProviderType("smtp");
    // SMTP
    setSmtpHost("smtp.gmail.com");
    setSmtpPort("587");
    setSmtpSecure(false);
    setSmtpUser("");
    setSmtpPass("");
    setSmtpFrom("");
    // AWS SES
    setAwsAccessKey("");
    setAwsSecretKey("");
    setAwsRegion("us-east-1");
    setAwsFrom("");
    // Gmail API
    setGmailClientEmail("");
    setGmailPrivateKey("");
    setGmailFrom("");
    // Zepto Mail
    setZeptoUrl("https://api.zeptomail.com/v1.1/email");
    setZeptoApiKey("");
    setZeptoFrom("");
    setZeptoFromName("")
    setEditingProvider(null);
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    addProfile(
      newProfileName.trim(),
      newProfileDescription.trim() || undefined,
      newProfileTableName.trim()
    );
    resetProfileForm();
    setCreateDialogOpen(false);
  };

  const handleEditProfile = () => {
    if (!editingProfile || !newProfileName.trim()) return;
    editProfile(editingProfile.id, {
      name: newProfileName.trim(),
      description: newProfileDescription.trim() || undefined,
      contactsTableName: newProfileTableName.trim(),
    });
    resetProfileForm();
    setEditingProfile(null);
    setEditDialogOpen(false);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this profile? This cannot be undone."
      )
    ) {
      removeProfile(profileId);
    }
  };

  const openEditProfileDialog = (profile: Profile) => {
    setEditingProfile(profile);
    setNewProfileName(profile.name);
    setNewProfileDescription(profile.description || "");
    setNewProfileTableName(profile.contactsTableName);
    setEditDialogOpen(true);
  };

  const handleSaveProvider = () => {
    if (!activeProfileId || !providerName.trim()) return;

    let providerData: any = {
      name: providerName.trim(),
      type: providerType,
      isDefault: activeProfile?.emailProviders.length === 0,
    };

    switch (providerType) {
      case "smtp":
        providerData.config = {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom,
        };
        break;
      case "aws_ses":
        providerData.config = {
          accessKeyId: awsAccessKey,
          secretAccessKey: awsSecretKey,
          region: awsRegion,
          from: awsFrom,
        };
        break;
      case "gmail_api":
        providerData.config = {
          client_email: gmailClientEmail,
          private_key: gmailPrivateKey,
          from: gmailFrom,
        };
        break;
      case "zepto_mail":
        providerData.config = {
          url: zeptoUrl,
          apiKey: zeptoApiKey,
          from: zeptoFrom,
          fromName:zeptoFromName
        };
        break;
    }

    if (editingProvider) {
      editProvider(activeProfileId, editingProvider.id, providerData);
    } else {
      addProvider(activeProfileId, providerData);
    }

    resetProviderForm();
    setProviderDialogOpen(false);
  };

  const openEditProviderDialog = (provider: EmailProvider) => {
    setEditingProvider(provider);
    setProviderName(provider.name);
    setProviderType(provider.type);
    
    if (provider.type === "smtp") {
      const p = provider as SmtpProvider;
      setSmtpHost(p.config.host);
      setSmtpPort(p.config.port);
      setSmtpSecure(p.config.secure);
      setSmtpUser(p.config.user);
      setSmtpPass(p.config.pass);
      setSmtpFrom(p.config.from);
    } else if (provider.type === "aws_ses") {
      const p = provider as AwsSesProvider;
      setAwsAccessKey(p.config.accessKeyId);
      setAwsSecretKey(p.config.secretAccessKey);
      setAwsRegion(p.config.region);
      setAwsFrom(p.config.from);
    } else if (provider.type === "gmail_api") {
      const p = provider as GmailApiProvider;
      setGmailClientEmail(p.config.client_email);
      setGmailPrivateKey(p.config.private_key);
      setGmailFrom(p.config.from);
    } else if (provider.type === "zepto_mail") {
      const p = provider as ZeptoMailProvider;
      setZeptoUrl(p.config.url);
      setZeptoApiKey(p.config.apiKey);
      setZeptoFrom(p.config.from);
      setZeptoFromName(p.config.fromName)
    }
    
    setProviderDialogOpen(true);
  };

  const handleDeleteProvider = (providerId: string) => {
    if (!activeProfileId) return;
    if (confirm("Are you sure you want to delete this email provider?")) {
      removeProvider(activeProfileId, providerId);
    }
  };

  const getProviderDisplayInfo = (provider: EmailProvider) => {
    switch (provider.type) {
      case "smtp":
        return (provider as SmtpProvider).config.user || "Not configured";
      case "aws_ses":
        return `${(provider as AwsSesProvider).config.region}`;
      case "gmail_api":
        return (provider as GmailApiProvider).config.client_email || "Not configured";
      case "zepto_mail":
        return "API configured";
      default:
        return "Configured";
    }
  };

  return (
    <div className="space-y-6 flex lg:flex-row flex-col gap-3">
      {/* Profile Selection */}
      <Card className="flex-1 border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profiles</CardTitle>
              <CardDescription>
                Manage profiles
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Profile</DialogTitle>
                  <DialogDescription>
                    Create a profile to store different email configurations and
                    settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Profile Name</Label>
                    <Input
                      id="profile-name"
                      placeholder="e.g., Marketing Campaigns"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-description">
                      Description (optional)
                    </Label>
                    <Input
                      id="profile-description"
                      placeholder="e.g., For sending marketing newsletters"
                      value={newProfileDescription}
                      onChange={(e) => setNewProfileDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-table">Contacts Table Name</Label>
                    <Input
                      id="profile-table"
                      placeholder="contacts"
                      value={newProfileTableName}
                      onChange={(e) => setNewProfileTableName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The Supabase table to use for contacts in this profile
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProfile}
                    disabled={!newProfileName.trim()}
                  >
                    Create Profile
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No profiles yet. Create your first profile to get started.</p>
            </div>
          ) : (
            <div className="space-y-2 h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:hidden ">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    profile.id === activeProfileId
                      ? "bg-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setActiveProfileId(profile.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setActiveProfileId(profile.id)
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{profile.name}</span>
                      {profile.id === activeProfileId && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    {profile.description && (
                      <p className="text-sm text-muted-background mt-1">
                        {profile.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-background mt-1">
                      Table: {profile.contactsTableName} |{" "}
                      {profile.emailProviders.length} provider(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditProfileDialog(profile)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProfile(profile.id)}
                      disabled={profiles.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-profile-name">Profile Name</Label>
              <Input
                id="edit-profile-name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-profile-description">Description</Label>
              <Input
                id="edit-profile-description"
                value={newProfileDescription}
                onChange={(e) => setNewProfileDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-profile-table">Contacts Table Name</Label>
              <Input
                id="edit-profile-table"
                value={newProfileTableName}
                onChange={(e) => setNewProfileTableName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Providers for Active Profile */}
      {activeProfile && (
        <Card className="border-border bg-card flex-2  h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Email Providers</CardTitle>
                <CardDescription>
                  Configure email sending methods for &quot;{activeProfile.name}
                  &quot;
                </CardDescription>
              </div>
              <Dialog
                open={providerDialogOpen}
                onOpenChange={(open) => {
                  setProviderDialogOpen(open);
                  if (!open) resetProviderForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProvider ? "Edit Provider" : "Add Email Provider"}
                    </DialogTitle>
                    <DialogDescription>
                      Configure an email provider for sending emails.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="provider-name">Provider Name</Label>
                      <Input
                        id="provider-name"
                        placeholder="e.g., Gmail SMTP"
                        value={providerName}
                        onChange={(e) => setProviderName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provider Type</Label>
                      <Select
                        value={providerType}
                        onValueChange={(v) =>
                          setProviderType(v as EmailProviderType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smtp">
                            SMTP (Gmail, Custom)
                          </SelectItem>
                          <SelectItem value="aws_ses">AWS SES</SelectItem>
                          <SelectItem value="gmail_api">
                            Gmail API (Google Workspace)
                          </SelectItem>
                          <SelectItem value="zepto_mail">Zepto Mail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* SMTP Configuration */}
                    {providerType === "smtp" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="smtp-host">SMTP Host</Label>
                            <Input
                              id="smtp-host"
                              value={smtpHost}
                              onChange={(e) => setSmtpHost(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtp-port">Port</Label>
                            <Input
                              id="smtp-port"
                              value={smtpPort}
                              onChange={(e) => setSmtpPort(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-user">Username / Email</Label>
                          <Input
                            id="smtp-user"
                            type="email"
                            placeholder="your-email@gmail.com"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-pass">
                            Password / App Password
                          </Label>
                          <Input
                            id="smtp-pass"
                            type="password"
                            placeholder="App password for Gmail"
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-from">From Address</Label>
                          <Input
                            id="smtp-from"
                            placeholder="Your Name <email@example.com>"
                            value={smtpFrom}
                            onChange={(e) => setSmtpFrom(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* AWS SES Configuration */}
                    {providerType === "aws_ses" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="aws-access-key">Access Key ID</Label>
                          <Input
                            id="aws-access-key"
                            placeholder="AKIAIOSFODNN7EXAMPLE"
                            value={awsAccessKey}
                            onChange={(e) => setAwsAccessKey(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="aws-secret-key">Secret Access Key</Label>
                          <Input
                            id="aws-secret-key"
                            type="password"
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                            value={awsSecretKey}
                            onChange={(e) => setAwsSecretKey(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="aws-region">AWS Region</Label>
                          <Select
                            value={awsRegion}
                            onValueChange={setAwsRegion}
                          >
                            <SelectTrigger id="aws-region">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                              <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                              <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                              <SelectItem value="eu-central-1">EU (Frankfurt)</SelectItem>
                              <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                              <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                              <SelectItem value="ap-southeast-2">Asia Pacific (Sydney)</SelectItem>
                              <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="aws-from">From Address</Label>
                          <Input
                            id="aws-from"
                            placeholder="Your Name <email@example.com>"
                            value={awsFrom}
                            onChange={(e) => setAwsFrom(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Make sure this email is verified in AWS SES
                          </p>
                        </div>
                      </>
                    )}

                    {/* Gmail API Configuration */}
                    {providerType === "gmail_api" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="gmail-client-email">Service Account Email</Label>
                          <Input
                            id="gmail-client-email"
                            type="email"
                            placeholder="your-service@project.iam.gserviceaccount.com"
                            value={gmailClientEmail}
                            onChange={(e) => setGmailClientEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gmail-private-key">Private Key</Label>
                          <Textarea
                            id="gmail-private-key"
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                            value={gmailPrivateKey}
                            onChange={(e) => setGmailPrivateKey(e.target.value)}
                            rows={6}
                            className="font-mono text-xs"
                          />
                          <p className="text-xs text-muted-foreground">
                            From your Google Cloud service account JSON key file
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gmail-from">From Address</Label>
                          <Input
                            id="gmail-from"
                            placeholder="Your Name <email@yourdomain.com>"
                            value={gmailFrom}
                            onChange={(e) => setGmailFrom(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Must be a valid email in your Google Workspace domain
                          </p>
                        </div>
                      </>
                    )}

                    {/* Zepto Mail Configuration */}
                    {providerType === "zepto_mail" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="zepto-url">API URL</Label>
                          <Input
                            id="zepto-url"
                            value={zeptoUrl}
                            onChange={(e) => setZeptoUrl(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zepto-api-key">API Key</Label>
                          <Input
                            id="zepto-api-key"
                            type="password"
                            placeholder="Your Zepto Mail API key"
                            value={zeptoApiKey}
                            onChange={(e) => setZeptoApiKey(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Get your API key from Zepto Mail dashboard
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zepto-from">From Address</Label>
                          <Input
                            id="zepto-from"
                            placeholder="email@example.com"
                            value={zeptoFrom}
                            onChange={(e) => setZeptoFrom(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Make sure this email is verified in Zepto Mail
                          </p>
                        </div>
                         <div className="space-y-2">
                          <Label htmlFor="zepto-from">From Name</Label>
                          <Input
                            id="zepto-from"
                            placeholder="John Doe"
                            value={zeptoFromName}
                            onChange={(e) => setZeptoFromName(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Make sure this email is verified in Zepto Mail
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setProviderDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProvider}
                      disabled={!providerName.trim()}
                    >
                      {editingProvider ? "Save Changes" : "Add Provider"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="">
            {activeProfile.emailProviders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No email providers configured. Add one to start sending
                  emails.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[55vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                {activeProfile.emailProviders.map((provider) => {
                  const Icon = providerIcons[provider.type];
                  return (
                    <div
                      key={provider.id}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        provider.isDefault
                          ? ""
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{provider.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {providerLabels[provider.type]}
                            </Badge>
                            {provider.isDefault && (
                              <Badge className="text-xs text-foreground">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-background">
                            {getProviderDisplayInfo(provider)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!provider.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDefaultProvider(activeProfile.id, provider.id)
                            }
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditProviderDialog(provider)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProvider(provider.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}