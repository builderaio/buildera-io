import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Video, Loader2, ExternalLink, ChevronDown, Settings2 } from "lucide-react";
import {
  createLink, createUrlToVideo, checkVideoStatus,
  PLATFORM_ASPECT_RATIO, OBJECTIVE_SCRIPT_STYLE,
  VISUAL_STYLES, SCRIPT_STYLES, VIDEO_LENGTHS, MODEL_VERSIONS,
} from "@/lib/api/creatify";
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
  const [visualStyle, setVisualStyle] = useState("AvatarBubbleTemplate");
  const [platform, setPlatform] = useState(targetPlatform || "instagram_feed");
  const [videoLength, setVideoLength] = useState<number>(30);
  const [targetAudience, setTargetAudience] = useState("");
  const [overrideScript, setOverrideScript] = useState("");
  const [noBackgroundMusic, setNoBackgroundMusic] = useState(false);
  const [noCaption, setNoCaption] = useState(false);
  const [noCta, setNoCta] = useState(false);
  const [modelVersion, setModelVersion] = useState("standard");
  const [advancedOpen, setAdvancedOpen] = useState(false);
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
      const link = await createLink(url);

      const video = await createUrlToVideo({
        link_id: link.id,
        visual_style: visualStyle,
        script_style: scriptStyle,
        aspect_ratio: aspectRatio,
        target_platform: platform,
        target_audience: targetAudience || undefined,
        language,
        video_length: videoLength,
        override_script: overrideScript || undefined,
        no_background_music: noBackgroundMusic || undefined,
        no_caption: noCaption || undefined,
        no_cta: noCta || undefined,
        model_version: modelVersion !== "standard" ? modelVersion : undefined,
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

  const isDisabled = creating || job.isLoading;

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
              disabled={isDisabled}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t("videoAd.platform")}</Label>
              <Select value={platform} onValueChange={(v) => {
                setPlatform(v);
                setAspectRatio(PLATFORM_ASPECT_RATIO[v] || "16x9");
              }} disabled={isDisabled}>
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
              <Select value={scriptStyle} onValueChange={setScriptStyle} disabled={isDisabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCRIPT_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {t(s.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("videoAd.visualStyle")}</Label>
              <Select value={visualStyle} onValueChange={setVisualStyle} disabled={isDisabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISUAL_STYLES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {t(v.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("videoAd.videoLength")}</Label>
              <Select value={String(videoLength)} onValueChange={(v) => setVideoLength(Number(v))} disabled={isDisabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_LENGTHS.map((l) => (
                    <SelectItem key={l} value={String(l)}>{l}s</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("videoAd.targetAudience")}</Label>
            <Input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder={t("videoAd.targetAudiencePlaceholder")}
              disabled={isDisabled}
            />
          </div>

          {/* Advanced Options */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <Settings2 className="h-4 w-4" />
                {t("videoAd.advancedOptions")}
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label>{t("videoAd.overrideScript")}</Label>
                <Textarea
                  value={overrideScript}
                  onChange={(e) => setOverrideScript(e.target.value)}
                  placeholder={t("videoAd.overrideScriptPlaceholder")}
                  disabled={isDisabled}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("videoAd.aspectRatio")}</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isDisabled}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9x16">9:16 (Vertical)</SelectItem>
                      <SelectItem value="16x9">16:9 (Horizontal)</SelectItem>
                      <SelectItem value="1x1">1:1 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("videoAd.modelVersion")}</Label>
                  <Select value={modelVersion} onValueChange={setModelVersion} disabled={isDisabled}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODEL_VERSIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {t(m.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={noBackgroundMusic} onCheckedChange={setNoBackgroundMusic} disabled={isDisabled} />
                  <Label className="text-sm">{t("videoAd.noBackgroundMusic")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={noCaption} onCheckedChange={setNoCaption} disabled={isDisabled} />
                  <Label className="text-sm">{t("videoAd.noCaption")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={noCta} onCheckedChange={setNoCta} disabled={isDisabled} />
                  <Label className="text-sm">{t("videoAd.noCta")}</Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
          creditsUsed={job.creditsUsed}
          duration={job.duration}
          thumbnailUrl={job.thumbnailUrl}
        >
          {job.output && (
            <div className="space-y-3">
              {job.videoUrl && (
                <video
                  src={job.videoUrl}
                  controls
                  poster={job.thumbnailUrl || undefined}
                  className="w-full rounded-lg max-h-[400px]"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {job.videoUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={job.videoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t("actions.download")}
                    </a>
                  </Button>
                )}
                {job.editorUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={job.editorUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t("actions.openEditor")}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </GenerationStatusTracker>
      )}
    </div>
  );
};
