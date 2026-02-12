import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Loader2, ExternalLink } from "lucide-react";
import { createLink, createUrlToVideo, checkVideoStatus, PLATFORM_ASPECT_RATIO, OBJECTIVE_SCRIPT_STYLE } from "@/lib/api/creatify";
import { useCreatifyJob } from "@/hooks/useCreatifyJob";
import { GenerationStatusTracker } from "./GenerationStatusTracker";
import { useToast } from "@/hooks/use-toast";

interface VideoGenerationFormProps {
  companyId: string;
  websiteUrl?: string;
  campaignId?: string;
  campaignObjective?: string;
  targetPlatform?: string;
  language?: string;
}

export const VideoGenerationForm = ({
  companyId,
  websiteUrl,
  campaignId,
  campaignObjective,
  targetPlatform,
  language = "es",
}: VideoGenerationFormProps) => {
  const { t } = useTranslation("creatify");
  const { toast } = useToast();
  const [url, setUrl] = useState(websiteUrl || "");
  const [aspectRatio, setAspectRatio] = useState(
    targetPlatform ? PLATFORM_ASPECT_RATIO[targetPlatform] || "16x9" : "16x9"
  );
  const [scriptStyle, setScriptStyle] = useState(
    campaignObjective ? OBJECTIVE_SCRIPT_STYLE[campaignObjective] || "BrandStoryV2" : "BrandStoryV2"
  );
  const [platform, setPlatform] = useState(targetPlatform || "instagram_feed");
  const [creating, setCreating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const job = useCreatifyJob(jobId, checkVideoStatus);

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast({ title: t("errors.urlRequired"), variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      // Step 1: Create link from URL
      const link = await createLink(url);

      // Step 2: Generate video
      const video = await createUrlToVideo({
        link_id: link.id,
        visual_style: "modern",
        script_style: scriptStyle,
        aspect_ratio: aspectRatio,
        target_platform: platform,
        language,
        company_id: companyId,
        campaign_id: campaignId,
      });

      setJobId(video.id);
      toast({ title: t("status.jobCreated") });
    } catch (err: any) {
      toast({ title: t("errors.generationFailed"), description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-primary" />
            {t("videoAd.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("videoAd.productUrl")}</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              disabled={creating || job.isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("videoAd.platform")}</Label>
              <Select value={platform} onValueChange={(v) => {
                setPlatform(v);
                setAspectRatio(PLATFORM_ASPECT_RATIO[v] || "16x9");
              }} disabled={creating || job.isLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram_reels">Instagram Reels</SelectItem>
                  <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="instagram_feed">Instagram Feed</SelectItem>
                  <SelectItem value="facebook_feed">Facebook Feed</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("videoAd.scriptStyle")}</Label>
              <Select value={scriptStyle} onValueChange={setScriptStyle} disabled={creating || job.isLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BrandStoryV2">{t("scriptStyles.brandStory")}</SelectItem>
                  <SelectItem value="CallToActionV2">{t("scriptStyles.callToAction")}</SelectItem>
                  <SelectItem value="SpecialOffersV2">{t("scriptStyles.specialOffers")}</SelectItem>
                  <SelectItem value="DiscoveryWriter">{t("scriptStyles.discovery")}</SelectItem>
                  <SelectItem value="HowToV2">{t("scriptStyles.howTo")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("videoAd.aspectRatio")}</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={creating || job.isLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="9x16">9:16 (Vertical)</SelectItem>
                  <SelectItem value="16x9">16:9 (Horizontal)</SelectItem>
                  <SelectItem value="1x1">1:1 (Cuadrado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!jobId && (
            <Button onClick={handleGenerate} disabled={creating || !url.trim()} className="w-full">
              {creating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("actions.creating")}</>
              ) : (
                <><Video className="h-4 w-4 mr-2" /> {t("actions.generateVideo")}</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {jobId && (
        <GenerationStatusTracker
          status={job.status}
          progress={job.progress}
          error={job.error}
          onRetry={() => { setJobId(null); }}
        >
          {job.output && (
            <div className="space-y-3">
              {job.output.output && (
                <video
                  src={job.output.output}
                  controls
                  className="w-full rounded-lg max-h-[400px]"
                />
              )}
              {job.output.output && (
                <Button variant="outline" size="sm" asChild>
                  <a href={job.output.output} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("actions.download")}
                  </a>
                </Button>
              )}
            </div>
          )}
        </GenerationStatusTracker>
      )}
    </div>
  );
};
