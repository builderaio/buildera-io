import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Mail, 
  Bot, 
  AlertTriangle,
  Save,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettings {
  emailSummary: boolean;
  agentAlerts: boolean;
  creditAlerts: boolean;
  weeklyReports: boolean;
  summaryFrequency: "daily" | "weekly" | "monthly";
  creditThreshold: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  emailSummary: true,
  agentAlerts: true,
  creditAlerts: true,
  weeklyReports: true,
  summaryFrequency: "weekly",
  creditThreshold: 20,
};

const NotificationPreferences = () => {
  const { t } = useTranslation("common");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...(data.settings as Partial<NotificationSettings>) });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          { user_id: user.id, settings: settings as any, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      toast.success(t("config.notifications.saved"));
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(t("config.notifications.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("config.notifications.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("config.notifications.description")}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t("common.save")}
        </Button>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-5 h-5 text-primary" />
            {t("config.notifications.emailSection")}
          </CardTitle>
          <CardDescription>
            {t("config.notifications.emailDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("config.notifications.emailSummary")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("config.notifications.emailSummaryDesc")}
              </p>
            </div>
            <Switch
              checked={settings.emailSummary}
              onCheckedChange={(checked) => updateSetting("emailSummary", checked)}
            />
          </div>

          {settings.emailSummary && (
            <div className="ml-4 pl-4 border-l-2 border-muted">
              <Label className="text-sm">{t("config.notifications.frequency")}</Label>
              <Select
                value={settings.summaryFrequency}
                onValueChange={(value: "daily" | "weekly" | "monthly") => 
                  updateSetting("summaryFrequency", value)
                }
              >
                <SelectTrigger className="w-48 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("config.notifications.daily")}</SelectItem>
                  <SelectItem value="weekly">{t("config.notifications.weekly")}</SelectItem>
                  <SelectItem value="monthly">{t("config.notifications.monthly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("config.notifications.weeklyReports")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("config.notifications.weeklyReportsDesc")}
              </p>
            </div>
            <Switch
              checked={settings.weeklyReports}
              onCheckedChange={(checked) => updateSetting("weeklyReports", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Agent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="w-5 h-5 text-primary" />
            {t("config.notifications.agentSection")}
          </CardTitle>
          <CardDescription>
            {t("config.notifications.agentDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("config.notifications.agentAlerts")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("config.notifications.agentAlertsDesc")}
              </p>
            </div>
            <Switch
              checked={settings.agentAlerts}
              onCheckedChange={(checked) => updateSetting("agentAlerts", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Usage Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t("config.notifications.usageSection")}
          </CardTitle>
          <CardDescription>
            {t("config.notifications.usageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("config.notifications.creditAlerts")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("config.notifications.creditAlertsDesc")}
              </p>
            </div>
            <Switch
              checked={settings.creditAlerts}
              onCheckedChange={(checked) => updateSetting("creditAlerts", checked)}
            />
          </div>

          {settings.creditAlerts && (
            <div className="ml-4 pl-4 border-l-2 border-muted">
              <Label className="text-sm">{t("config.notifications.creditThreshold")}</Label>
              <Select
                value={settings.creditThreshold.toString()}
                onValueChange={(value) => updateSetting("creditThreshold", parseInt(value))}
              >
                <SelectTrigger className="w-48 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10% {t("config.notifications.remaining")}</SelectItem>
                  <SelectItem value="20">20% {t("config.notifications.remaining")}</SelectItem>
                  <SelectItem value="30">30% {t("config.notifications.remaining")}</SelectItem>
                  <SelectItem value="50">50% {t("config.notifications.remaining")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
