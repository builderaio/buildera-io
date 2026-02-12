import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Link2, Plus, Trash2, Eye, Copy, BarChart3, Users,
  MousePointer, ArrowLeft, Mail, Download, CalendarDays, Gift,
  ExternalLink, Loader2
} from "lucide-react";

interface SmartLinkBuilderProps {
  companyId: string;
  onBack?: () => void;
}

interface SmartLink {
  id: string;
  slug: string;
  title: string;
  description: string;
  destination_url: string;
  template_type: string;
  form_fields: any[];
  page_config: any;
  utm_params: any;
  total_clicks: number;
  total_leads: number;
  is_active: boolean;
  created_at: string;
}

interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

const TEMPLATE_TYPES = [
  { id: "email_capture", icon: Mail, labelKey: "smartLinks.templates.emailCapture" },
  { id: "resource_download", icon: Download, labelKey: "smartLinks.templates.resourceDownload" },
  { id: "appointment", icon: CalendarDays, labelKey: "smartLinks.templates.appointment" },
  { id: "coupon", icon: Gift, labelKey: "smartLinks.templates.coupon" },
];

export const SmartLinkBuilder = ({ companyId, onBack }: SmartLinkBuilderProps) => {
  const { t } = useTranslation("marketing");
  const [activeTab, setActiveTab] = useState("list");
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [templateType, setTemplateType] = useState("email_capture");
  const [formFields, setFormFields] = useState<FormField[]>([
    { name: "email", type: "email", label: "Email", required: true },
  ]);
  const [selectedLink, setSelectedLink] = useState<SmartLink | null>(null);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    loadLinks();
    loadAnalytics();
  }, [companyId]);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("smart-link-manager", {
        body: { action: "list", data: { company_id: companyId } },
      });
      if (error) throw error;
      setLinks(data?.links || []);
    } catch (e) {
      console.error("Error loading smart links:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data } = await supabase.functions.invoke("smart-link-manager", {
        body: { action: "analytics", data: { company_id: companyId } },
      });
      setAnalytics(data?.analytics);
    } catch (e) {
      console.error("Error loading analytics:", e);
    }
  };

  const loadLeads = async (linkId: string) => {
    try {
      const { data } = await supabase.functions.invoke("smart-link-manager", {
        body: { action: "get_leads", data: { link_id: linkId } },
      });
      setLeads(data?.leads || []);
    } catch (e) {
      console.error("Error loading leads:", e);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-link-manager", {
        body: {
          action: "create",
          data: {
            company_id: companyId,
            title,
            description,
            destination_url: destinationUrl,
            template_type: templateType,
            form_fields: formFields,
            page_config: { theme: "default" },
          },
        },
      });
      if (error) throw error;
      toast.success(t("smartLinks.created"));
      setTitle("");
      setDescription("");
      setDestinationUrl("");
      setFormFields([{ name: "email", type: "email", label: "Email", required: true }]);
      setActiveTab("list");
      loadLinks();
      loadAnalytics();
    } catch (e: any) {
      toast.error(e.message || t("smartLinks.createError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.functions.invoke("smart-link-manager", {
        body: { action: "delete", data: { id } },
      });
      toast.success(t("smartLinks.deleted"));
      loadLinks();
      loadAnalytics();
    } catch (e) {
      toast.error(t("smartLinks.deleteError"));
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/sl/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success(t("smartLinks.copied"));
  };

  const addField = () => {
    setFormFields([...formFields, { name: `field_${formFields.length}`, type: "text", label: "", required: false }]);
  };

  const removeField = (idx: number) => {
    setFormFields(formFields.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    setFormFields(formFields.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("hub.crear.back")}
        </Button>
      )}

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MousePointer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalClicks}</p>
                <p className="text-xs text-muted-foreground">{t("smartLinks.totalClicks")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalLeads}</p>
                <p className="text-xs text-muted-foreground">{t("smartLinks.totalLeads")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">{t("smartLinks.conversionRate")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">
            <Link2 className="h-4 w-4 mr-2" />
            {t("smartLinks.myLinks")}
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            {t("smartLinks.createNew")}
          </TabsTrigger>
          {selectedLink && (
            <TabsTrigger value="leads">
              <Users className="h-4 w-4 mr-2" />
              {t("smartLinks.leads")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* LIST TAB */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">{t("smartLinks.empty")}</p>
                <Button onClick={() => setActiveTab("create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("smartLinks.createFirst")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            links.map((link) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{link.title}</h3>
                        <Badge variant={link.is_active ? "default" : "secondary"}>
                          {link.is_active ? t("smartLinks.active") : t("smartLinks.inactive")}
                        </Badge>
                        <Badge variant="outline">{t(`smartLinks.templates.${link.template_type}`)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {baseUrl}/sl/{link.slug}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" /> {link.total_clicks} {t("smartLinks.clicks")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {link.total_leads} {t("smartLinks.leadsCount")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(link.slug)}
                        title={t("smartLinks.copyLink")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/sl/${link.slug}`, "_blank")}
                        title={t("smartLinks.preview")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedLink(link);
                          loadLeads(link.id);
                          setActiveTab("leads");
                        }}
                        title={t("smartLinks.viewLeads")}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* CREATE TAB */}
        <TabsContent value="create" className="space-y-6">
          {/* Template Selection */}
          <div>
            <Label className="mb-3 block">{t("smartLinks.selectTemplate")}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TEMPLATE_TYPES.map((tmpl) => {
                const Icon = tmpl.icon;
                return (
                  <Card
                    key={tmpl.id}
                    className={`cursor-pointer transition-all ${
                      templateType === tmpl.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"
                    }`}
                    onClick={() => setTemplateType(tmpl.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">{t(tmpl.labelKey)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("smartLinks.title")}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("smartLinks.titlePlaceholder")}
              />
            </div>
            <div>
              <Label>{t("smartLinks.destinationUrl")}</Label>
              <Input
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <Label>{t("smartLinks.description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("smartLinks.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          {/* Form Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("smartLinks.formFields")}</CardTitle>
              <CardDescription>{t("smartLinks.formFieldsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                    placeholder={t("smartLinks.fieldLabel")}
                    className="flex-1"
                  />
                  <Select value={field.type} onValueChange={(v) => updateField(idx, { type: v })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Phone</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(v) => updateField(idx, { required: v })}
                    />
                    <span className="text-xs text-muted-foreground">{t("smartLinks.required")}</span>
                  </div>
                  {formFields.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeField(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-1" /> {t("smartLinks.addField")}
              </Button>
            </CardContent>
          </Card>

          <Button onClick={handleCreate} disabled={saving || !title.trim()} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
            {t("smartLinks.createLink")}
          </Button>
        </TabsContent>

        {/* LEADS TAB */}
        <TabsContent value="leads" className="space-y-4">
          {selectedLink && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{selectedLink.title} — {t("smartLinks.leads")}</CardTitle>
                  <CardDescription>
                    {leads.length} {t("smartLinks.leadsCapture")}
                  </CardDescription>
                </CardHeader>
              </Card>
              {leads.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t("smartLinks.noLeads")}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <Card key={lead.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{lead.name || lead.email}</p>
                          {lead.email && <p className="text-sm text-muted-foreground">{lead.email}</p>}
                          {lead.phone && <p className="text-sm text-muted-foreground">{lead.phone}</p>}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{new Date(lead.captured_at).toLocaleDateString()}</p>
                          {lead.source_platform && <Badge variant="outline">{lead.source_platform}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
