import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Ear, Megaphone, MessageCircle, TrendingUp, AlertTriangle,
  ThumbsUp, ThumbsDown, Minus, Loader2, RefreshCw, Bell,
  Search, ExternalLink, Eye, Calendar, BarChart3, Shield
} from "lucide-react";

interface SocialListeningPanelProps {
  profile: any;
  companyId?: string;
}

interface MentionItem {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  sentiment: "positive" | "negative" | "neutral";
  platform: string;
  engagement: number;
  url?: string;
  _feedType?: string;
}

interface AdItem {
  id: string;
  text: string;
  advertiser: string;
  platform: string;
  startDate?: string;
  impressions?: number;
  url?: string;
  image?: string;
  _feedType?: string;
}

interface AlertConfig {
  negativeMentions: boolean;
  competitorAds: boolean;
  volumeSpike: boolean;
  keywords: string;
}

const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
  switch (sentiment) {
    case "positive":
      return <ThumbsUp className="h-4 w-4 text-green-600" />;
    case "negative":
      return <ThumbsDown className="h-4 w-4 text-destructive" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const sentimentColor = (s: string) => {
  switch (s) {
    case "positive": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "negative": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default: return "bg-muted text-muted-foreground";
  }
};

// Simple client-side sentiment analysis using keyword matching
function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positiveWords = [
    "love", "great", "amazing", "awesome", "excellent", "best", "perfect", "fantastic",
    "recommend", "happy", "beautiful", "wonderful", "genial", "increíble", "excelente",
    "mejor", "perfecto", "fantástico", "recomiendo", "feliz", "hermoso", "maravilloso",
    "ótimo", "incrível", "perfeito", "recomendo", "lindo", "maravilhoso", "👍", "❤️", "🔥", "💪"
  ];
  const negativeWords = [
    "hate", "terrible", "worst", "awful", "bad", "horrible", "disappointed", "scam",
    "never", "waste", "poor", "ugly", "odio", "terrible", "peor", "horrible", "malo",
    "decepcionado", "estafa", "nunca", "basura", "pobre", "feo", "odeio", "péssimo",
    "horrível", "decepcionado", "golpe", "lixo", "👎", "😡", "💩"
  ];

  let score = 0;
  positiveWords.forEach((w) => { if (lower.includes(w)) score++; });
  negativeWords.forEach((w) => { if (lower.includes(w)) score--; });

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export const SocialListeningPanel = ({ profile, companyId }: SocialListeningPanelProps) => {
  const { t } = useTranslation("marketing");
  const [activeTab, setActiveTab] = useState("mentions");
  const [loading, setLoading] = useState(false);
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    negativeMentions: true,
    competitorAds: true,
    volumeSpike: false,
    keywords: "",
  });

  const fetchMentions = useCallback(async () => {
    if (!profile?.instagram_url && !companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-social-content", {
        body: {
          url: profile?.instagram_url || "",
          type: "mentions",
          userId: profile?.user_id,
        },
      });

      if (error) throw error;

      const rawPosts = data?.posts || data?.data?.posts || [];
      const processedMentions: MentionItem[] = rawPosts.map((post: any, idx: number) => ({
        id: post.id || `mention-${idx}`,
        text: post.text || post.caption || post.description || "",
        username: post.username || post.owner_username || post.author || "unknown",
        timestamp: post.timestamp || post.created_at || post.taken_at || new Date().toISOString(),
        sentiment: analyzeSentiment(post.text || post.caption || ""),
        platform: "instagram",
        engagement: (post.like_count || 0) + (post.comment_count || 0),
        url: post.url || post.shortcode ? `https://instagram.com/p/${post.shortcode}` : undefined,
        _feedType: post._feedType || "mentions",
      }));

      setMentions(processedMentions);

      // Check alerts
      const negativeCount = processedMentions.filter((m) => m.sentiment === "negative").length;
      if (alertConfig.negativeMentions && negativeCount > 0) {
        toast.warning(
          t("socialListening.alerts.negativeDetected", { count: negativeCount }),
          { duration: 5000 }
        );
      }
    } catch (e) {
      console.error("Error fetching mentions:", e);
      toast.error(t("socialListening.errorFetching"));
    } finally {
      setLoading(false);
    }
  }, [profile, companyId, alertConfig.negativeMentions, t]);

  const fetchAds = useCallback(async () => {
    if (!profile?.instagram_url && !companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-social-content", {
        body: {
          url: profile?.instagram_url || "",
          type: "ads",
          userId: profile?.user_id,
        },
      });

      if (error) throw error;

      const rawPosts = data?.posts || data?.data?.posts || [];
      const processedAds: AdItem[] = rawPosts.map((post: any, idx: number) => ({
        id: post.id || `ad-${idx}`,
        text: post.text || post.caption || post.description || "",
        advertiser: post.username || post.owner_username || post.author || "unknown",
        platform: "instagram",
        startDate: post.timestamp || post.created_at || "",
        impressions: post.view_count || post.play_count || post.reach || 0,
        url: post.url || (post.shortcode ? `https://instagram.com/p/${post.shortcode}` : undefined),
        image: post.image_url || post.media_url || post.thumbnail_url || "",
        _feedType: "ads",
      }));

      setAds(processedAds);

      if (alertConfig.competitorAds && processedAds.length > 0) {
        toast.info(
          t("socialListening.alerts.newAdsDetected", { count: processedAds.length }),
          { duration: 5000 }
        );
      }
    } catch (e) {
      console.error("Error fetching ads:", e);
      toast.error(t("socialListening.errorFetching"));
    } finally {
      setLoading(false);
    }
  }, [profile, companyId, alertConfig.competitorAds, t]);

  const handleRefresh = () => {
    if (activeTab === "mentions") fetchMentions();
    else if (activeTab === "ads") fetchAds();
    else {
      fetchMentions();
      fetchAds();
    }
  };

  // Sentiment stats
  const sentimentStats = {
    positive: mentions.filter((m) => m.sentiment === "positive").length,
    negative: mentions.filter((m) => m.sentiment === "negative").length,
    neutral: mentions.filter((m) => m.sentiment === "neutral").length,
    total: mentions.length,
  };

  const filteredMentions = searchQuery
    ? mentions.filter(
        (m) =>
          m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mentions;

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ear className="w-5 h-5" />
              {t("socialListening.title")}
            </CardTitle>
            <CardDescription className="text-indigo-100">
              {t("socialListening.subtitle")}
            </CardDescription>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {t("socialListening.refresh")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Sentiment Overview Cards */}
        {mentions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{sentimentStats.total}</p>
                <p className="text-xs text-muted-foreground">{t("socialListening.totalMentions")}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{sentimentStats.positive}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("socialListening.positive")}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{sentimentStats.neutral}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("socialListening.neutral")}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <ThumbsDown className="h-4 w-4 text-destructive" />
                  <p className="text-2xl font-bold text-destructive">{sentimentStats.negative}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("socialListening.negative")}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="mentions" className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {t("socialListening.mentions")}
              {mentions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{mentions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-1">
              <Megaphone className="h-4 w-4" />
              {t("socialListening.competitorAds")}
              {ads.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{ads.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              {t("socialListening.alertsTab")}
            </TabsTrigger>
          </TabsList>

          {/* MENTIONS TAB */}
          <TabsContent value="mentions" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("socialListening.searchMentions")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={fetchMentions} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("socialListening.fetch")}
              </Button>
            </div>

            {filteredMentions.length === 0 && !loading ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t("socialListening.noMentions")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("socialListening.clickFetch")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredMentions.map((mention) => (
                  <Card key={mention.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">@{mention.username}</span>
                            <Badge className={`text-xs ${sentimentColor(mention.sentiment)}`}>
                              <SentimentIcon sentiment={mention.sentiment} />
                              <span className="ml-1">{t(`socialListening.${mention.sentiment}`)}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(mention.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-3">{mention.text}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> {mention.engagement}
                            </span>
                            <Badge variant="outline" className="text-xs">📷 {mention.platform}</Badge>
                          </div>
                        </div>
                        {mention.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(mention.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ADS TAB */}
          <TabsContent value="ads" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{t("socialListening.adsDescription")}</p>
              <Button onClick={fetchAds} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("socialListening.fetch")}
              </Button>
            </div>

            {ads.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t("socialListening.noAds")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("socialListening.clickFetchAds")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                {ads.map((ad) => (
                  <Card key={ad.id} className="border hover:shadow-md transition-shadow overflow-hidden">
                    {ad.image && (
                      <div className="h-32 bg-muted">
                        <img
                          src={ad.image}
                          alt={ad.advertiser}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">{ad.advertiser}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          <Megaphone className="h-3 w-3 mr-1" />
                          {t("socialListening.adLabel")}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-3 text-muted-foreground">{ad.text}</p>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        {ad.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ad.startDate).toLocaleDateString()}
                          </span>
                        )}
                        {ad.impressions !== undefined && ad.impressions > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {ad.impressions.toLocaleString()}
                          </span>
                        )}
                        {ad.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => window.open(ad.url, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ALERTS TAB */}
          <TabsContent value="alerts" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  {t("socialListening.alertConfig")}
                </CardTitle>
                <CardDescription>{t("socialListening.alertConfigDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t("socialListening.alertNegative")}</Label>
                    <p className="text-xs text-muted-foreground">{t("socialListening.alertNegativeDesc")}</p>
                  </div>
                  <Switch
                    checked={alertConfig.negativeMentions}
                    onCheckedChange={(v) => setAlertConfig({ ...alertConfig, negativeMentions: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t("socialListening.alertCompetitorAds")}</Label>
                    <p className="text-xs text-muted-foreground">{t("socialListening.alertCompetitorAdsDesc")}</p>
                  </div>
                  <Switch
                    checked={alertConfig.competitorAds}
                    onCheckedChange={(v) => setAlertConfig({ ...alertConfig, competitorAds: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t("socialListening.alertVolumeSpike")}</Label>
                    <p className="text-xs text-muted-foreground">{t("socialListening.alertVolumeSpikeDesc")}</p>
                  </div>
                  <Switch
                    checked={alertConfig.volumeSpike}
                    onCheckedChange={(v) => setAlertConfig({ ...alertConfig, volumeSpike: v })}
                  />
                </div>
                <div>
                  <Label className="font-medium">{t("socialListening.alertKeywords")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">{t("socialListening.alertKeywordsDesc")}</p>
                  <Textarea
                    placeholder={t("socialListening.alertKeywordsPlaceholder")}
                    value={alertConfig.keywords}
                    onChange={(e) => setAlertConfig({ ...alertConfig, keywords: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => toast.success(t("socialListening.alertsSaved"))}
                  className="w-full"
                >
                  {t("socialListening.saveAlerts")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
