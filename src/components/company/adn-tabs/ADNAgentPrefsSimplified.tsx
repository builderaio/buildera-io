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

const CONTENT_LENGTH_KEYS = ['short', 'medium', 'long'] as const;

export const ADNAgentPrefsSimplified = ({ companyId }: ADNAgentPrefsSimplifiedProps) => {
  const { t } = useTranslation(['company', 'common']);
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

  const getCreativityLabel = (level: number) => {
    if (level < 0.4) return t('company:agent_prefs.creativity_conservative');
    if (level < 0.7) return t('company:agent_prefs.creativity_balanced');
    return t('company:agent_prefs.creativity_creative');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('company:agent_prefs.creativity_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('company:agent_prefs.creativity_level')}</Label>
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
              {getCreativityLabel(creativityLevel)}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('company:agent_prefs.content_length')}</Label>
              <Select 
                value={preferences?.default_content_length || 'medium'} 
                onValueChange={(v) => handleSaveField('default_content_length', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_LENGTH_KEYS.map(key => (
                    <SelectItem key={key} value={key}>{t(`company:agent_prefs.content_length_${key}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('company:agent_prefs.max_executions')}</Label>
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

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('company:agent_prefs.review_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">{t('company:agent_prefs.require_review')}</Label>
            </div>
            <Switch
              checked={preferences?.require_human_review ?? true}
              onCheckedChange={(v) => handleSaveField('require_human_review', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">{t('company:agent_prefs.auto_approve')}</Label>
            </div>
            <Switch
              checked={preferences?.auto_approve_content || false}
              onCheckedChange={(v) => handleSaveField('auto_approve_content', v)}
            />
          </div>
          
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('company:agent_prefs.quality_threshold')}</Label>
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

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {t('company:agent_prefs.guidelines_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <Textarea
            value={preferences?.content_guidelines || ''}
            onChange={(e) => handleSaveField('content_guidelines', e.target.value)}
            placeholder={t('company:agent_prefs.guidelines_placeholder')}
            rows={3}
            className="text-xs resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
};