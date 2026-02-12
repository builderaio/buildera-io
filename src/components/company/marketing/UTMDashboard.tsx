import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Link2, MousePointerClick, TrendingUp, Globe, BarChart3,
  RefreshCw, Filter, ExternalLink, Copy, Smartphone, Monitor
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface UTMDashboardProps {
  companyId?: string;
}

interface UTMEvent {
  id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
  clicked_at: string;
  referrer_url?: string;
  user_agent?: string;
  country?: string;
  device_type?: string;
  smart_link_id?: string;
}

interface AggregatedData {
  name: string;
  clicks: number;
  leads: number;
  conversion: number;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 280 65% 60%))",
  "hsl(var(--chart-4, 30 80% 55%))",
  "hsl(var(--chart-5, 160 60% 45%))",
];

export const UTMDashboard = ({ companyId }: UTMDashboardProps) => {
  const { t } = useTranslation("marketing");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<UTMEvent[]>([]);
  const [period, setPeriod] = useState("30d");
  const [groupBy, setGroupBy] = useState<"source" | "medium" | "campaign">("source");

  const [bySource, setBySource] = useState<AggregatedData[]>([]);
  const [byMedium, setByMedium] = useState<AggregatedData[]>([]);
  const [byCampaign, setByCampaign] = useState<AggregatedData[]>([]);
  const [dailyClicks, setDailyClicks] = useState<{ date: string; clicks: number }[]>([]);
  const [deviceData, setDeviceData] = useState<{ name: string; value: number }[]>([]);

  const [totalClicks, setTotalClicks] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [topSource, setTopSource] = useState("-");

  useEffect(() => {
    loadData();
  }, [companyId, period]);

  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [clicksRes, leadsRes] = await Promise.all([
        supabase
          .from("utm_click_events")
          .select("*")
          .eq("company_id", companyId)
          .gte("clicked_at", since)
          .order("clicked_at", { ascending: false }),
        supabase
          .from("smart_link_leads")
          .select("*, smart_links!inner(company_id)")
          .eq("smart_links.company_id", companyId)
          .gte("captured_at", since),
      ]);

      const clicks = (clicksRes.data || []) as UTMEvent[];
      const leads = leadsRes.data || [];

      setEvents(clicks);
      setTotalClicks(clicks.length);
      setTotalLeads(leads.length);

      // Aggregate by source
      const sourceMap = new Map<string, { clicks: number; leads: number }>();
      clicks.forEach((e) => {
        const src = e.utm_source || "direct";
        const cur = sourceMap.get(src) || { clicks: 0, leads: 0 };
        cur.clicks++;
        sourceMap.set(src, cur);
      });
      leads.forEach((l: any) => {
        const src = l.source_platform || "direct";
        const cur = sourceMap.get(src) || { clicks: 0, leads: 0 };
        cur.leads++;
        sourceMap.set(src, cur);
      });
      const sourceArr = Array.from(sourceMap.entries())
        .map(([name, d]) => ({
          name,
          clicks: d.clicks,
          leads: d.leads,
          conversion: d.clicks > 0 ? Math.round((d.leads / d.clicks) * 100) : 0,
        }))
        .sort((a, b) => b.clicks - a.clicks);
      setBySource(sourceArr);
      setTopSource(sourceArr[0]?.name || "-");

      // Aggregate by medium
      const mediumMap = new Map<string, number>();
      clicks.forEach((e) => {
        const m = e.utm_medium || "unknown";
        mediumMap.set(m, (mediumMap.get(m) || 0) + 1);
      });
      setByMedium(
        Array.from(mediumMap.entries())
          .map(([name, clicks]) => ({ name, clicks, leads: 0, conversion: 0 }))
          .sort((a, b) => b.clicks - a.clicks)
      );

      // Aggregate by campaign
      const campaignMap = new Map<string, number>();
      clicks.forEach((e) => {
        const c = e.utm_campaign || "none";
        campaignMap.set(c, (campaignMap.get(c) || 0) + 1);
      });
      setByCampaign(
        Array.from(campaignMap.entries())
          .map(([name, clicks]) => ({ name, clicks, leads: 0, conversion: 0 }))
          .sort((a, b) => b.clicks - a.clicks)
      );

      // Daily clicks
      const dailyMap = new Map<string, number>();
      clicks.forEach((e) => {
        const day = e.clicked_at.substring(0, 10);
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      });
      setDailyClicks(
        Array.from(dailyMap.entries())
          .map(([date, clicks]) => ({ date, clicks }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );

      // Device breakdown
      const deviceMap = new Map<string, number>();
      clicks.forEach((e) => {
        const d = e.device_type || "unknown";
        deviceMap.set(d, (deviceMap.get(d) || 0) + 1);
      });
      setDeviceData(
        Array.from(deviceMap.entries()).map(([name, value]) => ({ name, value }))
      );
    } catch (err) {
      console.error("Error loading UTM data:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeData = groupBy === "source" ? bySource : groupBy === "medium" ? byMedium : byCampaign;
  const conversionRate = totalClicks > 0 ? ((totalLeads / totalClicks) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            {t("utm.title")}
          </h2>
          <p className="text-muted-foreground mt-1">{t("utm.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t("utm.last7d")}</SelectItem>
              <SelectItem value="30d">{t("utm.last30d")}</SelectItem>
              <SelectItem value="90d">{t("utm.last90d")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <MousePointerClick className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("utm.totalClicks")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLeads}</p>
                <p className="text-xs text-muted-foreground">{t("utm.totalLeadsConverted")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">{t("utm.conversionRate")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold truncate max-w-[120px]">{topSource}</p>
                <p className="text-xs text-muted-foreground">{t("utm.topSource")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Clicks Chart */}
      {dailyClicks.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">{t("utm.clicksOverTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyClicks}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Attribution by Source/Medium/Campaign */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("utm.attribution")}</CardTitle>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="source">{t("utm.bySource")}</SelectItem>
                <SelectItem value="medium">{t("utm.byMedium")}</SelectItem>
                <SelectItem value="campaign">{t("utm.byCampaign")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {activeData.length > 0 ? (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activeData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t("utm.clicks")} />
                  {groupBy === "source" && (
                    <Bar dataKey="leads" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4, 4, 0, 0]} name={t("utm.leads")} />
                  )}
                </BarChart>
              </ResponsiveContainer>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">{t("utm.source")}</th>
                      <th className="text-right p-3 font-medium">{t("utm.clicks")}</th>
                      {groupBy === "source" && (
                        <>
                          <th className="text-right p-3 font-medium">{t("utm.leads")}</th>
                          <th className="text-right p-3 font-medium">{t("utm.conv")}</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeData.map((row, i) => (
                      <tr key={i} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{row.name}</td>
                        <td className="p-3 text-right">{row.clicks.toLocaleString()}</td>
                        {groupBy === "source" && (
                          <>
                            <td className="p-3 text-right">{row.leads}</td>
                            <td className="p-3 text-right">
                              <Badge variant={row.conversion > 5 ? "default" : "secondary"}>
                                {row.conversion}%
                              </Badge>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MousePointerClick className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("utm.noData")}</p>
              <p className="text-sm mt-1">{t("utm.noDataHint")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      {deviceData.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">{t("utm.deviceBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
