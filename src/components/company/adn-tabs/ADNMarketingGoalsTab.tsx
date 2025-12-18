import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketingGoals } from '@/hooks/useMarketingGoals';
import { Target, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface ADNMarketingGoalsTabProps {
  companyId: string;
}

const GOAL_OPTIONS = [
  'Aumentar ventas',
  'Generar leads',
  'Aumentar reconocimiento de marca',
  'Aumentar engagement',
  'Fidelizar clientes',
  'Expandir mercado',
  'Lanzar producto',
];

const TIMELINE_OPTIONS = [
  { value: '3_months', label: '3 meses' },
  { value: '6_months', label: '6 meses' },
  { value: '12_months', label: '1 año' },
  { value: '24_months', label: '2 años' },
];

export const ADNMarketingGoalsTab = ({ companyId }: ADNMarketingGoalsTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { goals, loading, saving, saveGoals } = useMarketingGoals(companyId);

  const [localGoals, setLocalGoals] = useState({
    primary_goal: '',
    secondary_goals: [] as string[],
    target_audience_size: 0,
    monthly_lead_target: 0,
    monthly_conversion_target: 0,
    brand_awareness_target: 0,
    engagement_rate_target: 0,
    campaign_budget_monthly: 0,
    growth_timeline: '',
  });

  useEffect(() => {
    if (goals) {
      setLocalGoals({
        primary_goal: goals.primary_goal || '',
        secondary_goals: goals.secondary_goals || [],
        target_audience_size: goals.target_audience_size || 0,
        monthly_lead_target: goals.monthly_lead_target || 0,
        monthly_conversion_target: goals.monthly_conversion_target || 0,
        brand_awareness_target: goals.brand_awareness_target || 0,
        engagement_rate_target: goals.engagement_rate_target || 0,
        campaign_budget_monthly: goals.campaign_budget_monthly || 0,
        growth_timeline: goals.growth_timeline || '',
      });
    }
  }, [goals]);

  const handleSave = async () => {
    try {
      await saveGoals(localGoals);
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
            <Target className="h-5 w-5" />
            {t('company.marketing.goals_title', 'Objetivos de Marketing')}
          </CardTitle>
          <CardDescription>
            {t('company.marketing.goals_desc', 'Define tus metas de marketing para guiar a los agentes')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('company.marketing.primary_goal', 'Objetivo principal')}</Label>
            <Select 
              value={localGoals.primary_goal} 
              onValueChange={(v) => setLocalGoals(prev => ({ ...prev, primary_goal: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('company.marketing.select_goal', 'Selecciona un objetivo')} />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map(goal => (
                  <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('company.marketing.timeline', 'Horizonte de tiempo')}</Label>
            <Select 
              value={localGoals.growth_timeline} 
              onValueChange={(v) => setLocalGoals(prev => ({ ...prev, growth_timeline: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('company.marketing.select_timeline', 'Selecciona horizonte')} />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('company.marketing.kpis', 'KPIs y Metas')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('company.marketing.audience_size', 'Tamaño audiencia objetivo')}</Label>
              <Input
                type="number"
                value={localGoals.target_audience_size}
                onChange={(e) => setLocalGoals(prev => ({ ...prev, target_audience_size: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('company.marketing.lead_target', 'Leads mensuales objetivo')}</Label>
              <Input
                type="number"
                value={localGoals.monthly_lead_target}
                onChange={(e) => setLocalGoals(prev => ({ ...prev, monthly_lead_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('company.marketing.conversion_target', 'Tasa conversión objetivo (%)')}</Label>
              <Input
                type="number"
                step="0.1"
                value={localGoals.monthly_conversion_target}
                onChange={(e) => setLocalGoals(prev => ({ ...prev, monthly_conversion_target: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('company.marketing.engagement_target', 'Engagement objetivo (%)')}</Label>
              <Input
                type="number"
                step="0.1"
                value={localGoals.engagement_rate_target}
                onChange={(e) => setLocalGoals(prev => ({ ...prev, engagement_rate_target: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('company.marketing.budget', 'Presupuesto')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{t('company.marketing.monthly_budget', 'Presupuesto mensual de campañas')}</Label>
            <Input
              type="number"
              value={localGoals.campaign_budget_monthly}
              onChange={(e) => setLocalGoals(prev => ({ ...prev, campaign_budget_monthly: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {t('company.email.save', 'Guardar Configuración')}
      </Button>
    </div>
  );
};
