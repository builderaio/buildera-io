import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgentPreferences } from '@/hooks/useAgentPreferences';
import { Bot, Sparkles, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ADNAgentPrefsSimplifiedProps {
  companyId: string;
}

const CONTENT_LENGTH_OPTIONS = [
  { value: 'short', label: 'Corto' },
  { value: 'medium', label: 'Medio' },
  { value: 'long', label: 'Largo' },
];

export const ADNAgentPrefsSimplified = ({ companyId }: ADNAgentPrefsSimplifiedProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { preferences, loading, savePreferences } = useAgentPreferences(companyId);

  const handleSaveField = async (field: string, value: any) => {
    try {
      await savePreferences({ [field]: value });
    } catch {
      toast({ title: t('common:error'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const creativityLevel = preferences?.default_creativity_level || 0.7;
  const qualityThreshold = preferences?.quality_threshold || 0.8;

  return (
    <div className="space-y-4">
      {/* Creativity & Style */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('company.agent_prefs.creativity_title', 'Creatividad y Estilo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('company.agent_prefs.creativity_level', 'Nivel de creatividad')}</Label>
              <span className="text-xs text-muted-foreground">{Math.round(creativityLevel * 100)}%</span>
            </div>
            <Slider
              value={[creativityLevel]}
              onValueCommit={([v]) => handleSaveField('default_creativity_level', v)}
              min={0}
              max={1}
              step={0.05}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              {creativityLevel < 0.4 ? 'Conservador' : creativityLevel < 0.7 ? 'Balanceado' : 'Creativo'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('company.agent_prefs.content_length', 'Longitud')}</Label>
              <Select 
                value={preferences?.default_content_length || 'medium'} 
                onValueChange={(v) => handleSaveField('default_content_length', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_LENGTH_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('company.agent_prefs.max_executions', 'Máx/día')}</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={preferences?.max_daily_executions || 50}
                onChange={(e) => handleSaveField('max_daily_executions', parseInt(e.target.value) || 50)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control & Review */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('company.agent_prefs.review_title', 'Control y Revisión')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">{t('company.agent_prefs.require_review', 'Requiere revisión humana')}</Label>
            </div>
            <Switch
              checked={preferences?.require_human_review ?? true}
              onCheckedChange={(v) => handleSaveField('require_human_review', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">{t('company.agent_prefs.auto_approve', 'Auto-aprobar contenido')}</Label>
            </div>
            <Switch
              checked={preferences?.auto_approve_content || false}
              onCheckedChange={(v) => handleSaveField('auto_approve_content', v)}
            />
          </div>
          
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('company.agent_prefs.quality_threshold', 'Umbral de calidad')}</Label>
              <span className="text-xs text-muted-foreground">{Math.round(qualityThreshold * 100)}%</span>
            </div>
            <Slider
              value={[qualityThreshold]}
              onValueCommit={([v]) => handleSaveField('quality_threshold', v)}
              min={0.5}
              max={1}
              step={0.05}
              className="py-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {t('company.agent_prefs.guidelines_title', 'Guías para Agentes')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <Textarea
            value={preferences?.content_guidelines || ''}
            onChange={(e) => handleSaveField('content_guidelines', e.target.value)}
            placeholder={t('company.agent_prefs.guidelines_placeholder', 'Instrucciones adicionales para todos los agentes...')}
            rows={3}
            className="text-xs resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
};
