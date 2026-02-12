import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutGrid, Loader2, Download } from "lucide-react";
import { createIABImages, checkIABStatus } from "@/lib/api/creatify";
import { useCreatifyJob } from "@/hooks/useCreatifyJob";
import { GenerationStatusTracker } from "./GenerationStatusTracker";
import { useToast } from "@/hooks/use-toast";

interface IABBannerFormProps {
  companyId: string;
  campaignId?: string;
  brandName?: string;
}

export const IABBannerForm = ({ companyId, campaignId, brandName }: IABBannerFormProps) => {
  const { t } = useTranslation("creatify");
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [creating, setCreating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const job = useCreatifyJob(jobId, checkIABStatus);

  const handleGenerate = async () => {
    if (!imageUrl.trim()) {
      toast({ title: t("errors.imageRequired"), variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const result = await createIABImages({
        image_url: imageUrl,
        brand_name: brandName || "",
        tagline: tagline || undefined,
        cta_text: ctaText || undefined,
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
            <LayoutGrid className="h-5 w-5 text-primary" />
            {t("banners.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("banners.productImageUrl")}</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." disabled={creating || job.isLoading} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("banners.tagline")}</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder={t("banners.taglinePlaceholder")} disabled={creating || job.isLoading} />
            </div>
            <div className="space-y-2">
              <Label>{t("banners.ctaText")}</Label>
              <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder={t("banners.ctaPlaceholder")} disabled={creating || job.isLoading} />
            </div>
          </div>
          {!jobId && (
            <Button onClick={handleGenerate} disabled={creating || !imageUrl.trim()} className="w-full">
              {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("actions.creating")}</> : <><LayoutGrid className="h-4 w-4 mr-2" /> {t("actions.generateBanners")}</>}
            </Button>
          )}
        </CardContent>
      </Card>

      {jobId && (
        <GenerationStatusTracker status={job.status} progress={job.progress} error={job.error} onRetry={() => setJobId(null)}>
          {job.output?.creatives && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Array.isArray(job.output.creatives) ? job.output.creatives : []).map((creative: any, i: number) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border">
                  <img src={creative.url || creative.image_url} alt={`Banner ${creative.width}x${creative.height}`} className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" asChild>
                      <a href={creative.url || creative.image_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4 mr-1" /> {creative.width}x{creative.height}
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-center py-1 text-muted-foreground">{creative.width}x{creative.height}</p>
                </div>
              ))}
            </div>
          )}
        </GenerationStatusTracker>
      )}
    </div>
  );
};
