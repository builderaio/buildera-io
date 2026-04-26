import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Play, Pause, Square, Plus, RefreshCw, MessageSquare } from "lucide-react";

interface AutoDMMonitorsProps {
  companyId: string;
}

interface Monitor {
  id: string;
  monitor_id: string;
  post_url: string;
  reply_message: string;
  trigger_keywords: string[];
  status: string;
  dms_sent_total: number;
  dms_sent_today: number;
  last_check_at: string | null;
  last_dm_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "secondary",
  stopped: "outline",
  expired: "outline",
  failed: "destructive",
};

export const AutoDMMonitors = ({ companyId }: AutoDMMonitorsProps) => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [postUrl, setPostUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("autodm_monitors")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) toast.error("No se pudieron cargar monitores");
    else setMonitors((data as Monitor[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleCreate = async () => {
    if (!postUrl.trim() || !replyMessage.trim() || !keywords.trim()) {
      toast.error("Completa URL, palabras clave y mensaje");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("upload-post-manager", {
      body: {
        action: "start_autodm_monitor",
        data: {
          company_id: companyId,
          post_url: postUrl.trim(),
          trigger_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          reply_message: replyMessage.trim(),
        },
      },
    });
    setCreating(false);
    if (error || !data?.success) {
      toast.error(data?.error || error?.message || "No se pudo crear el monitor");
      return;
    }
    toast.success("Monitor AutoDM iniciado");
    setDialogOpen(false);
    setPostUrl("");
    setKeywords("");
    setReplyMessage("");
    load();
  };

  const changeStatus = async (m: Monitor, newStatus: "paused" | "active" | "stopped") => {
    const action =
      newStatus === "paused" ? "pause_autodm_monitor" :
      newStatus === "active" ? "resume_autodm_monitor" :
      "stop_autodm_monitor";
    const { data, error } = await supabase.functions.invoke("upload-post-manager", {
      body: { action, data: { monitor_id: m.monitor_id } },
    });
    if (error || !data?.success) {
      toast.error(data?.error || error?.message || "No se pudo actualizar el monitor");
      return;
    }
    toast.success(`Monitor ${newStatus}`);
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            AutoDM Monitors (Instagram)
          </CardTitle>
          <CardDescription>
            Captura leads 24/7. Cuando alguien comente con una palabra clave, se le envía un DM automático.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Nuevo monitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear monitor AutoDM</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>URL del post de Instagram</Label>
                  <Input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://www.instagram.com/p/..." />
                </div>
                <div>
                  <Label>Palabras clave (separadas por coma)</Label>
                  <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="GUIA, INFO, DEMO" />
                </div>
                <div>
                  <Label>Mensaje DM</Label>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                    placeholder="¡Hola! Aquí tienes la guía: https://..."
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Creando..." : "Iniciar monitor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {monitors.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No hay monitores activos. Crea uno para empezar a capturar leads automáticamente.
          </p>
        ) : (
          <div className="space-y-3">
            {monitors.map((m) => (
              <div key={m.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANTS[m.status] || "outline"}>{m.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      DMs: {m.dms_sent_today} hoy / {m.dms_sent_total} total
                    </span>
                  </div>
                  <a
                    href={m.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline truncate block mt-1"
                  >
                    {m.post_url}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keywords: {m.trigger_keywords?.join(", ") || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    💬 {m.reply_message}
                  </p>
                </div>
                <div className="flex gap-1">
                  {m.status === "active" && (
                    <Button variant="outline" size="icon" onClick={() => changeStatus(m, "paused")} title="Pausar">
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {m.status === "paused" && (
                    <Button variant="outline" size="icon" onClick={() => changeStatus(m, "active")} title="Reanudar">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {m.status !== "stopped" && (
                    <Button variant="outline" size="icon" onClick={() => changeStatus(m, "stopped")} title="Detener">
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
