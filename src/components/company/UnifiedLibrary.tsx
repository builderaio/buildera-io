import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoader } from "@/components/ui/smart-loader";
import { 
  FolderOpen, Image, Video, FileText, RefreshCw, Copy, 
  Trash2, ExternalLink, Download
} from "lucide-react";

interface UnifiedLibraryProps {
  profile: { user_id?: string };
}

interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  type: "text" | "image" | "video" | "banner";
  source: "library" | "creatify" | "upload";
  url?: string;
  created_at: string;
  metadata?: any;
}

export const UnifiedLibrary = ({ profile }: UnifiedLibraryProps) => {
  const { t } = useTranslation("marketing");
  const { toast } = useToast();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (profile?.user_id) loadAll();
  }, [profile?.user_id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [libraryRes, creatifyRes, uploadsRes] = await Promise.all([
        supabase.from("content_library").select("*").eq("user_id", profile.user_id!).order("created_at", { ascending: false }),
        supabase.from("creatify_jobs").select("*").eq("user_id", profile.user_id!).eq("status", "done").order("created_at", { ascending: false }),
        supabase.from("scheduled_posts").select("*").eq("user_id", profile.user_id!).eq("status", "published").order("scheduled_for", { ascending: false }).limit(50),
      ]);

      const mapped: LibraryItem[] = [];

      (libraryRes.data || []).forEach((item: any) => {
        mapped.push({
          id: item.id,
          title: item.title || t("hub.library.untitled"),
          description: item.description,
          type: item.file_type === "video" ? "video" : item.file_type === "image" ? "image" : "text",
          source: "library",
          url: item.file_url,
          created_at: item.created_at,
          metadata: item.metadata,
        });
      });

      (creatifyRes.data || []).forEach((job: any) => {
        mapped.push({
          id: job.id,
          title: job.job_name || `Creatify - ${job.job_type}`,
          description: job.job_type,
          type: job.job_type === "iab_images" ? "banner" : "video",
          source: "creatify",
          url: job.result_url,
          created_at: job.created_at,
          metadata: job.result_data,
        });
      });

      (uploadsRes.data || []).forEach((post: any) => {
        const content = typeof post.content === "string" ? post.content : post.content?.content || "";
        mapped.push({
          id: post.id,
          title: content.substring(0, 60) || t("hub.library.publishedPost"),
          description: post.platform,
          type: "text",
          source: "upload",
          created_at: post.published_at || post.scheduled_for,
        });
      });

      setItems(mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      console.error("Error loading unified library:", e);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (item: LibraryItem) => {
    try {
      if (item.source === "library") {
        await supabase.from("content_library").delete().eq("id", item.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast({ title: t("hub.library.deleted") });
    } catch {
      toast({ title: t("hub.library.deleteError"), variant: "destructive" });
    }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />;
      case "image": return <Image className="h-4 w-4" />;
      case "banner": return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <SmartLoader isVisible type="generic" message={t("hub.library.loading")} size="md" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            {t("hub.library.title")}
          </h2>
          <p className="text-muted-foreground">{t("hub.library.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("hub.library.refresh")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "text", "image", "video", "banner"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {t(`hub.library.filters.${f}`)}
          </Button>
        ))}
        <Badge variant="secondary" className="ml-auto self-center">
          {filtered.length} {t("hub.library.items")}
        </Badge>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("hub.library.empty")}</h3>
            <p className="text-muted-foreground">{t("hub.library.emptyHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {typeIcon(item.type)}
                    <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">{item.source}</Badge>
                </div>

                {item.url && (item.type === "image" || item.type === "banner") && (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-32 object-cover rounded-md"
                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                  />
                )}

                {item.url && item.type === "video" && (
                  <video
                    src={item.url}
                    className="w-full h-32 object-cover rounded-md"
                    controls={false}
                    muted
                    preload="metadata"
                  />
                )}

                <div>
                  <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.url && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(item.url!);
                          toast({ title: t("hub.library.copied") });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(item.url!, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {item.source === "library" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteItem(item)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
