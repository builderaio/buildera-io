import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgentPreferences } from '@/hooks/useAgentPreferences';
import { Bot, Sparkles, Shield, Bell, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface ADNAgentPreferencesTabProps {
  companyId: string;
}

const CONTENT_LENGTH_OPTIONS = [
  { value: 'short', label: 'Corto' },
  { value: 'medium', label: 'Medio' },
  { value: 'long', label: 'Largo' },
];

export const ADNAgentPreferencesTab = ({ companyId }: ADNAgentPreferencesTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { preferences, loading, saving, savePreferences } = useAgentPreferences(companyId);

  const [localPrefs, setLocalPrefs] = useState({
    default_creativity_level: 0.7,
    default_content_length: 'medium',
    auto_approve_content: false,
    require_human_review: true,
    max_daily_executions: 50,
    notification_preferences: { on_completion: true, on_error: true, daily_summary: true },
    content_guidelines: '',
    quality_threshold: 0.8,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        default_creativity_level: preferences.default_creativity_level || 0.7,
        default_content_length: preferences.default_content_length || 'medium',
        auto_approve_content: preferences.auto_approve_content || false,
        require_human_review: preferences.require_human_review ?? true,
        max_daily_executions: preferences.max_daily_executions || 50,
        notification_preferences: preferences.notification_preferences || { on_completion: true, on_error: true, daily_summary: true },
        content_guidelines: preferences.content_guidelines || '',
        quality_threshold: preferences.quality_threshold || 0.8,
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      await savePreferences(localPrefs);
      toast({ title: t('company.email.saved') });
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('company.agent_prefs.creativity_title', 'Creatividad y Estilo')}
          </CardTitle>
          <CardDescription>
            {t('company.agent_prefs.creativity_desc', 'Configura cómo los agentes generan contenido')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('company.agent_prefs.creativity_level', 'Nivel de creatividad')}</Label>
              <span className="text-sm text-muted-foreground">{Math.round(localPrefs.default_creativity_level * 100)}%</span>
            </div>
            <Slider
              value={[localPrefs.default_creativity_level]}
              onValueChange={([v]) => setLocalPrefs(prev => ({ ...prev, default_creativity_level: v }))}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              {localPrefs.default_creativity_level < 0.4 ? t('company.agent_prefs.conservative', 'Conservador - Contenido predecible y seguro') :
               localPrefs.default_creativity_level < 0.7 ? t('company.agent_prefs.balanced', 'Balanceado - Mezcla de creatividad y consistencia') :
               t('company.agent_prefs.creative', 'Creativo - Contenido más arriesgado e innovador')}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t('company.agent_prefs.content_length', 'Longitud de contenido por defecto')}</Label>
            <Select 
              value={localPrefs.default_content_length} 
              onValueChange={(v) => setLocalPrefs(prev => ({ ...prev, default_content_length: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_LENGTH_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('company.agent_prefs.quality_threshold', 'Umbral de calidad mínimo')}</Label>
              <span className="text-sm text-muted-foreground">{Math.round(localPrefs.quality_threshold * 100)}%</span>
            </div>
            <Slider
              value={[localPrefs.quality_threshold]}
              onValueChange={([v]) => setLocalPrefs(prev => ({ ...prev, quality_threshold: v }))}
              min={0.5}
              max={1}
              step={0.05}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('company.agent_prefs.review_title', 'Control y Revisión')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('company.agent_prefs.require_review', 'Requiere revisión humana')}</Label>
              <p className="text-sm text-muted-foreground">{t('company.agent_prefs.require_review_desc', 'El contenido debe aprobarse antes de publicar')}</p>
            </div>
            <Switch
              checked={localPrefs.require_human_review}
              onCheckedChange={(v) => setLocalPrefs(prev => ({ ...prev, require_human_review: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('company.agent_prefs.auto_approve', 'Auto-aprobar contenido')}</Label>
              <p className="text-sm text-muted-foreground">{t('company.agent_prefs.auto_approve_desc', 'Publicar automáticamente si pasa el umbral de calidad')}</p>
            </div>
            <Switch
              checked={localPrefs.auto_approve_content}
              onCheckedChange={(v) => setLocalPrefs(prev => ({ ...prev, auto_approve_content: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('company.agent_prefs.max_executions', 'Máximo ejecuciones diarias')}</Label>
            <Input
              type="number"
              value={localPrefs.max_daily_executions}
              onChange={(e) => setLocalPrefs(prev => ({ ...prev, max_daily_executions: parseInt(e.target.value) || 50 }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('company.agent_prefs.notifications_title', 'Notificaciones')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t('company.agent_prefs.notify_completion', 'Notificar al completar')}</Label>
            <Switch
              checked={localPrefs.notification_preferences.on_completion}
              onCheckedChange={(v) => setLocalPrefs(prev => ({ 
                ...prev, 
                notification_preferences: { ...prev.notification_preferences, on_completion: v } 
              }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('company.agent_prefs.notify_error', 'Notificar errores')}</Label>
            <Switch
              checked={localPrefs.notification_preferences.on_error}
              onCheckedChange={(v) => setLocalPrefs(prev => ({ 
                ...prev, 
                notification_preferences: { ...prev.notification_preferences, on_error: v } 
              }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('company.agent_prefs.daily_summary', 'Resumen diario')}</Label>
            <Switch
              checked={localPrefs.notification_preferences.daily_summary}
              onCheckedChange={(v) => setLocalPrefs(prev => ({ 
                ...prev, 
                notification_preferences: { ...prev.notification_preferences, daily_summary: v } 
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t('company.agent_prefs.guidelines_title', 'Guías de Contenido')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={localPrefs.content_guidelines}
            onChange={(e) => setLocalPrefs(prev => ({ ...prev, content_guidelines: e.target.value }))}
            placeholder={t('company.agent_prefs.guidelines_placeholder', 'Instrucciones adicionales para todos los agentes...')}
            rows={4}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {t('company.email.save', 'Guardar Configuración')}
      </Button>
    </div>
  );
};
