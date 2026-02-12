import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2, ExternalLink } from "lucide-react";
import { createAvatarVideo, checkAvatarStatus, getAvatars, getVoices } from "@/lib/api/creatify";
import { useCreatifyJob } from "@/hooks/useCreatifyJob";
import { GenerationStatusTracker } from "./GenerationStatusTracker";
import { useToast } from "@/hooks/use-toast";

interface AvatarVideoFormProps {
  companyId: string;
  campaignId?: string;
  initialScript?: string;
}

export const AvatarVideoForm = ({ companyId, campaignId, initialScript }: AvatarVideoFormProps) => {
  const { t } = useTranslation("creatify");
  const { toast } = useToast();
  const [script, setScript] = useState(initialScript || "");
  const [avatarId, setAvatarId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9x16");
  const [avatars, setAvatars] = useState<any[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [creating, setCreating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const job = useCreatifyJob(jobId, checkAvatarStatus);

  useEffect(() => {
    const load = async () => {
      try {
        const [avatarData, voiceData] = await Promise.all([getAvatars(), getVoices()]);
        const avatarList = Array.isArray(avatarData) ? avatarData : avatarData?.results || [];
        const voiceList = Array.isArray(voiceData) ? voiceData : voiceData?.results || [];
        setAvatars(avatarList.slice(0, 50));
        setVoices(voiceList.slice(0, 30));
        if (avatarList.length > 0) setAvatarId(avatarList[0].id || avatarList[0].avatar_id || "");
        if (voiceList.length > 0) setVoiceId(voiceList[0].id || voiceList[0].voice_id || "");
      } catch (err) {
        console.error("Error loading resources:", err);
      } finally {
        setLoadingResources(false);
      }
    };
    load();
  }, []);

  const handleGenerate = async () => {
    if (!script.trim() || !avatarId) {
      toast({ title: t("errors.scriptRequired"), variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const result = await createAvatarVideo({
        avatar_id: avatarId,
        script,
        voice_id: voiceId || undefined,
        aspect_ratio: aspectRatio,
        company_id: companyId,
        campaign_id: campaignId,
      });
      setJobId(result.id);
      toast({ title: t("status.jobCreated") });
    } catch (err: any) {
      toast({ title: t("errors.generationFailed"), description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  if (loadingResources) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-muted-foreground">{t("status.loadingResources")}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            {t("avatar.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("avatar.selectAvatar")}</Label>
              <Select value={avatarId} onValueChange={setAvatarId} disabled={creating || job.isLoading}>
                <SelectTrigger><SelectValue placeholder={t("avatar.selectAvatar")} /></SelectTrigger>
                <SelectContent>
                  {avatars.map((a) => (
                    <SelectItem key={a.id || a.avatar_id} value={a.id || a.avatar_id}>
                      {a.name || a.display_name || `Avatar ${a.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("avatar.selectVoice")}</Label>
              <Select value={voiceId} onValueChange={setVoiceId} disabled={creating || job.isLoading}>
                <SelectTrigger><SelectValue placeholder={t("avatar.selectVoice")} /></SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.id || v.voice_id} value={v.id || v.voice_id}>
                      {v.name || v.display_name || `Voice ${v.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("avatar.script")}</Label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder={t("avatar.scriptPlaceholder")}
              rows={5}
              disabled={creating || job.isLoading}
            />
          </div>

          <div className="space-y-2 max-w-[200px]">
            <Label>{t("videoAd.aspectRatio")}</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={creating || job.isLoading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="9x16">9:16</SelectItem>
                <SelectItem value="16x9">16:9</SelectItem>
                <SelectItem value="1x1">1:1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!jobId && (
            <Button onClick={handleGenerate} disabled={creating || !script.trim() || !avatarId} className="w-full">
              {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("actions.creating")}</> : <><User className="h-4 w-4 mr-2" /> {t("actions.generateAvatar")}</>}
            </Button>
          )}
        </CardContent>
      </Card>

      {jobId && (
        <GenerationStatusTracker status={job.status} progress={job.progress} error={job.error} onRetry={() => setJobId(null)}>
          {job.output?.output && (
            <div className="space-y-3">
              <video src={job.output.output} controls className="w-full rounded-lg max-h-[400px]" />
              <Button variant="outline" size="sm" asChild>
                <a href={job.output.output} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> {t("actions.download")}
                </a>
              </Button>
            </div>
          )}
        </GenerationStatusTracker>
      )}
    </div>
  );
};
