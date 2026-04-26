import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Webhook } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface WebhookEventsLogProps {
  companyId: string;
}

interface EventRow {
  id: string;
  event_type: string;
  job_id: string | null;
  platform: string | null;
  account_name: string | null;
  status: string | null;
  reason: string | null;
  received_at: string;
  processed: boolean;
}

const EVENT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  upload_completed: "default",
  social_account_connected: "default",
  social_account_disconnected: "destructive",
  social_account_reauth_required: "destructive",
};

export const WebhookEventsLog = ({ companyId }: WebhookEventsLogProps) => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("upload_post_webhook_events")
      .select("id,event_type,job_id,platform,account_name,status,reason,received_at,processed")
      .eq("company_id", companyId)
      .order("received_at", { ascending: false })
      .limit(50);
    setEvents((data as EventRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Eventos en tiempo real (Upload-Post)
          </CardTitle>
          <CardDescription>
            Publicaciones completadas, desconexiones de cuentas y avisos de reautenticación.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aún no se han recibido eventos. Configura el webhook en Upload-Post apuntando a:
            <code className="block mt-2 text-xs bg-muted p-2 rounded break-all">
              {`${import.meta.env.VITE_SUPABASE_URL || "https://<project>.supabase.co"}/functions/v1/upload-post-webhook`}
            </code>
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((e) => (
              <div key={e.id} className="border rounded-md p-2 text-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <Badge variant={EVENT_VARIANT[e.event_type] || "outline"}>{e.event_type}</Badge>
                  {e.platform && <span className="text-xs text-muted-foreground">{e.platform}</span>}
                  {e.account_name && <span className="text-xs">· {e.account_name}</span>}
                  {e.reason && <span className="text-xs text-destructive truncate">· {e.reason}</span>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(e.received_at), { addSuffix: true, locale: es })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
