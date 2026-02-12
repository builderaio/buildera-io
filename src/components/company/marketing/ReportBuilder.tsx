import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Download, Mail, Calendar, BarChart3, TrendingUp,
  Users, Heart, Rocket, Globe, RefreshCw, Eye, Send
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportBuilderProps {
  profile: any;
  companyId?: string;
}

interface ReportConfig {
  title: string;
  period: "weekly" | "monthly" | "campaign";
  dateRange: { start: string; end: string };
  sections: string[];
  includeCharts: boolean;
  emailSchedule: "none" | "weekly" | "monthly";
  emailRecipient: string;
}

export const ReportBuilder = ({ profile, companyId }: ReportBuilderProps) => {
  const { t } = useTranslation("marketing");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [config, setConfig] = useState<ReportConfig>({
    title: "",
    period: "monthly",
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      end: new Date().toISOString().substring(0, 10),
    },
    sections: ["social", "engagement", "campaigns", "audience"],
    includeCharts: true,
    emailSchedule: "none",
    emailRecipient: "",
  });

  const [metrics, setMetrics] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const sectionOptions = [
    { id: "social", label: t("reports.sections.social"), icon: Globe },
    { id: "engagement", label: t("reports.sections.engagement"), icon: Heart },
    { id: "campaigns", label: t("reports.sections.campaigns"), icon: Rocket },
    { id: "audience", label: t("reports.sections.audience"), icon: Users },
    { id: "utm", label: t("reports.sections.utm"), icon: TrendingUp },
    { id: "smartlinks", label: t("reports.sections.smartlinks"), icon: BarChart3 },
  ];

  const templateOptions = [
    { id: "weekly", label: t("reports.templates.weekly"), desc: t("reports.templates.weeklyDesc") },
    { id: "monthly", label: t("reports.templates.monthly"), desc: t("reports.templates.monthlyDesc") },
    { id: "campaign", label: t("reports.templates.campaign"), desc: t("reports.templates.campaignDesc") },
  ];

  const toggleSection = (sectionId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter((s) => s !== sectionId)
        : [...prev.sections, sectionId],
    }));
  };

  const loadMetrics = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const userId = profile?.user_id || (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      const [postsRes, campaignsRes, insightsRes, smartLinksRes, utmRes] = await Promise.all([
        Promise.all([
          supabase.from("instagram_posts").select("like_count, comment_count, reach").eq("user_id", userId).gte("created_at", config.dateRange.start),
          supabase.from("linkedin_posts").select("likes_count, comments_count, views_count").eq("user_id", userId).gte("created_at", config.dateRange.start),
          supabase.from("facebook_posts").select("likes_count, comments_count").eq("user_id", userId).gte("created_at", config.dateRange.start),
          supabase.from("tiktok_posts").select("digg_count, comment_count, play_count").eq("user_id", userId).gte("created_at", config.dateRange.start),
        ]),
        supabase.from("marketing_campaigns").select("*").eq("user_id", userId).gte("created_at", config.dateRange.start),
        supabase.from("marketing_insights").select("*").eq("user_id", userId).gte("created_at", config.dateRange.start),
        supabase.from("smart_links").select("*, smart_link_leads(id)").eq("company_id", companyId),
        supabase.from("utm_click_events").select("utm_source, utm_medium").eq("company_id", companyId).gte("clicked_at", config.dateRange.start),
      ]);

      const igPosts = postsRes[0].data || [];
      const liPosts = postsRes[1].data || [];
      const fbPosts = postsRes[2].data || [];
      const tkPosts = postsRes[3].data || [];

      const totalPosts = igPosts.length + liPosts.length + fbPosts.length + tkPosts.length;
      const totalEngagement =
        igPosts.reduce((s: number, p: any) => s + (p.like_count || 0) + (p.comment_count || 0), 0) +
        liPosts.reduce((s: number, p: any) => s + (p.likes_count || 0) + (p.comments_count || 0), 0) +
        fbPosts.reduce((s: number, p: any) => s + (p.likes_count || 0) + (p.comments_count || 0), 0) +
        tkPosts.reduce((s: number, p: any) => s + (p.digg_count || 0) + (p.comment_count || 0), 0);
      const totalReach = igPosts.reduce((s: number, p: any) => s + (p.reach || 0), 0) +
        tkPosts.reduce((s: number, p: any) => s + (p.play_count || 0), 0) +
        liPosts.reduce((s: number, p: any) => s + (p.views_count || 0), 0);

      const smartLinks = smartLinksRes.data || [];
      const totalLeads = smartLinks.reduce((s: number, l: any) => s + (l.smart_link_leads?.length || 0), 0);
      const utmEvents = utmRes.data || [];

      setMetrics({
        totalPosts,
        totalEngagement,
        totalReach,
        engagementRate: totalPosts > 0 ? (totalEngagement / totalPosts).toFixed(1) : "0",
        activeCampaigns: campaignsRes.data?.length || 0,
        insightsGenerated: insightsRes.data?.length || 0,
        smartLinksCreated: smartLinks.length,
        totalLeads,
        utmClicks: utmEvents.length,
        platforms: {
          instagram: igPosts.length,
          linkedin: liPosts.length,
          facebook: fbPosts.length,
          tiktok: tkPosts.length,
        },
      });

      setPreviewData({ loaded: true });
    } catch (err) {
      console.error("Error loading report metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [companyId, config.dateRange.start, config.dateRange.end]);

  const generatePDF = async () => {
    if (!metrics) return;
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(60, 70, 178);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text(config.title || t("reports.defaultTitle"), 15, 22);
      doc.setFontSize(10);
      doc.text(`${config.dateRange.start} → ${config.dateRange.end}`, 15, 32);
      doc.text("Powered by Buildera", pageWidth - 15, 32, { align: "right" });

      let y = 55;
      doc.setTextColor(0, 0, 0);

      // Summary section
      doc.setFontSize(14);
      doc.text(t("reports.pdf.summary"), 15, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [[t("reports.pdf.metric"), t("reports.pdf.value")]],
        body: [
          [t("reports.pdf.totalPosts"), String(metrics.totalPosts)],
          [t("reports.pdf.totalEngagement"), metrics.totalEngagement.toLocaleString()],
          [t("reports.pdf.totalReach"), metrics.totalReach.toLocaleString()],
          [t("reports.pdf.engRate"), `${metrics.engagementRate} avg/post`],
          [t("reports.pdf.campaigns"), String(metrics.activeCampaigns)],
          [t("reports.pdf.smartLinks"), String(metrics.smartLinksCreated)],
          [t("reports.pdf.leads"), String(metrics.totalLeads)],
          [t("reports.pdf.utmClicks"), String(metrics.utmClicks)],
        ],
        theme: "striped",
        headStyles: { fillColor: [60, 70, 178] },
      });

      y = (doc as any).lastAutoTable.finalY + 15;

      // Platform breakdown
      if (config.sections.includes("social")) {
        doc.setFontSize(14);
        doc.text(t("reports.pdf.platformBreakdown"), 15, y);
        y += 8;
        autoTable(doc, {
          startY: y,
          head: [[t("reports.pdf.platform"), t("reports.pdf.posts")]],
          body: [
            ["Instagram", String(metrics.platforms.instagram)],
            ["LinkedIn", String(metrics.platforms.linkedin)],
            ["Facebook", String(metrics.platforms.facebook)],
            ["TikTok", String(metrics.platforms.tiktok)],
          ],
          theme: "striped",
          headStyles: { fillColor: [60, 70, 178] },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `${t("reports.pdf.generatedBy")} | ${new Date().toLocaleDateString()} | ${t("reports.pdf.page")} ${i}/${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`${config.title || "marketing-report"}-${config.dateRange.start}.pdf`);

      toast({
        title: t("reports.pdfGenerated"),
        description: t("reports.pdfGeneratedDesc"),
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({ title: t("reports.pdfError"), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          {t("reports.title")}
        </h2>
        <p className="text-muted-foreground mt-1">{t("reports.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">{t("reports.configure")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("reports.reportTitle")}</Label>
                <Input
                  value={config.title}
                  onChange={(e) => setConfig((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t("reports.titlePlaceholder")}
                />
              </div>

              <div>
                <Label>{t("reports.template")}</Label>
                <Select
                  value={config.period}
                  onValueChange={(v) => {
                    const days = v === "weekly" ? 7 : v === "monthly" ? 30 : 90;
                    setConfig((p) => ({
                      ...p,
                      period: v as any,
                      dateRange: {
                        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
                        end: new Date().toISOString().substring(0, 10),
                      },
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {templateOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{t("reports.from")}</Label>
                  <Input
                    type="date"
                    value={config.dateRange.start}
                    onChange={(e) => setConfig((p) => ({ ...p, dateRange: { ...p.dateRange, start: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label>{t("reports.to")}</Label>
                  <Input
                    type="date"
                    value={config.dateRange.end}
                    onChange={(e) => setConfig((p) => ({ ...p, dateRange: { ...p.dateRange, end: e.target.value } }))}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t("reports.includeSections")}</Label>
                <div className="space-y-2">
                  {sectionOptions.map((sec) => (
                    <div key={sec.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={config.sections.includes(sec.id)}
                        onCheckedChange={() => toggleSection(sec.id)}
                      />
                      <sec.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{sec.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={generatePDF} disabled={generating || !metrics} className="w-full gap-2">
            <Download className="h-4 w-4" />
            {generating ? t("reports.generating") : t("reports.downloadPDF")}
          </Button>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t("reports.preview")}
              </CardTitle>
              <CardDescription className="text-white/80">
                {config.dateRange.start} → {config.dateRange.end}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t("reports.loadingMetrics")}</p>
                </div>
              ) : metrics ? (
                <div className="space-y-6">
                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{metrics.totalPosts}</p>
                      <p className="text-xs text-muted-foreground">{t("reports.pdf.totalPosts")}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{metrics.totalEngagement.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t("reports.pdf.totalEngagement")}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{metrics.totalReach.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t("reports.pdf.totalReach")}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{metrics.totalLeads}</p>
                      <p className="text-xs text-muted-foreground">{t("reports.pdf.leads")}</p>
                    </div>
                  </div>

                  {/* Platform Breakdown */}
                  {config.sections.includes("social") && (
                    <div>
                      <h4 className="font-semibold mb-3">{t("reports.pdf.platformBreakdown")}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(metrics.platforms).map(([platform, count]) => (
                          <div key={platform} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                            <span className="text-lg">
                              {platform === "instagram" ? "📷" : platform === "linkedin" ? "💼" : platform === "facebook" ? "📘" : "🎵"}
                            </span>
                            <div>
                              <p className="font-semibold capitalize">{platform}</p>
                              <p className="text-xs text-muted-foreground">{String(count)} posts</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional sections */}
                  {config.sections.includes("campaigns") && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-1">{t("reports.sections.campaigns")}</h4>
                      <p className="text-2xl font-bold text-primary">{metrics.activeCampaigns}</p>
                      <p className="text-xs text-muted-foreground">{t("reports.campaignsInPeriod")}</p>
                    </div>
                  )}

                  {config.sections.includes("smartlinks") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-semibold mb-1">Smart Links</h4>
                        <p className="text-2xl font-bold text-primary">{metrics.smartLinksCreated}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-semibold mb-1">{t("reports.sections.utm")}</h4>
                        <p className="text-2xl font-bold text-primary">{metrics.utmClicks}</p>
                        <p className="text-xs text-muted-foreground">clicks</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{t("reports.noMetrics")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
