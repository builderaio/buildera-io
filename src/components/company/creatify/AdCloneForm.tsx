import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, ExternalLink } from "lucide-react";
import { createLink, createAdClone, checkCloneStatus } from "@/lib/api/creatify";
import { useCreatifyJob } from "@/hooks/useCreatifyJob";
import { GenerationStatusTracker } from "./GenerationStatusTracker";
import { useToast } from "@/hooks/use-toast";

interface AdCloneFormProps {
  companyId: string;
  websiteUrl?: string;
  campaignId?: string;
}

export const AdCloneForm = ({ companyId, websiteUrl, campaignId }: AdCloneFormProps) => {
  const { t } = useTranslation("creatify");
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState("");
  const [companyUrl, setCompanyUrl] = useState(websiteUrl || "");
  const [creating, setCreating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const job = useCreatifyJob(jobId, checkCloneStatus);

  const handleGenerate = async () => {
    if (!videoUrl.trim() || !companyUrl.trim()) {
      toast({ title: t("errors.urlRequired"), variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const link = await createLink(companyUrl);
      const result = await createAdClone({
        video_url: videoUrl,
        link_id: link.id,
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Copy className="h-5 w-5 text-primary" />
            {t("adClone.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("adClone.competitorVideoUrl")}</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." disabled={creating || job.isLoading} />
          </div>
          <div className="space-y-2">
            <Label>{t("adClone.yourProductUrl")}</Label>
            <Input value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} placeholder="https://..." disabled={creating || job.isLoading} />
          </div>
          {!jobId && (
            <Button onClick={handleGenerate} disabled={creating || !videoUrl.trim() || !companyUrl.trim()} className="w-full">
              {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("actions.creating")}</> : <><Copy className="h-4 w-4 mr-2" /> {t("actions.cloneAd")}</>}
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
