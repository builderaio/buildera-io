import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Loader2, Film, Image, Trash2 } from "lucide-react";

interface CreatifyGalleryProps {
  companyId: string;
}

export const CreatifyGallery = ({ companyId }: CreatifyGalleryProps) => {
  const { t } = useTranslation("creatify");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      let query = supabase
        .from("creatify_jobs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== "all") {
        query = query.eq("job_type", filter);
      }

      const { data, error } = await query;
      if (!error && data) setJobs(data);
      setLoading(false);
    };
    fetchJobs();
  }, [companyId, filter]);

  const jobTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      url_to_video: t("tabs.videoAd"),
      avatar: t("tabs.avatar"),
      ad_clone: t("tabs.adClone"),
      iab_images: t("tabs.banners"),
      asset_generator: t("gallery.assetGenerator"),
      ai_script: t("gallery.aiScript"),
      text_to_speech: t("gallery.tts"),
    };
    return map[type] || type;
  };

  const statusColor = (status: string) => {
    if (status === "done") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  };

  const handleDelete = async (id: string) => {
    await supabase.from("creatify_jobs").delete().eq("id", id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-muted-foreground">{t("gallery.loading")}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("gallery.title")}</h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("gallery.filterAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("gallery.filterAll")}</SelectItem>
            <SelectItem value="url_to_video">{t("tabs.videoAd")}</SelectItem>
            <SelectItem value="avatar">{t("tabs.avatar")}</SelectItem>
            <SelectItem value="ad_clone">{t("tabs.adClone")}</SelectItem>
            <SelectItem value="iab_images">{t("tabs.banners")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("gallery.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {job.job_type.includes("video") || job.job_type === "avatar" || job.job_type === "ad_clone" ? (
                      <Film className="h-4 w-4 text-primary" />
                    ) : (
                      <Image className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-sm font-medium">{jobTypeLabel(job.job_type)}</span>
                  </div>
                  <Badge variant={statusColor(job.status)}>{job.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(job.created_at).toLocaleDateString()}
                </p>

                {job.status === "done" && job.output_data?.output && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={job.output_data.output} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" /> {t("actions.view")}
                    </a>
                  </Button>
                )}

                <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => handleDelete(job.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> {t("actions.delete")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
