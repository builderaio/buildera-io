import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanySchedule } from '@/hooks/useCompanySchedule';
import { Clock, Globe, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ADNScheduleSimplifiedProps {
  companyId: string;
}

const TIMEZONE_KEYS = [
  'America/Mexico_City', 'America/New_York', 'America/Los_Angeles',
  'America/Bogota', 'America/Lima', 'America/Buenos_Aires',
  'America/Sao_Paulo', 'Europe/Madrid', 'Europe/London',
];

const DAY_KEYS = [
  { value: 1, key: 'mon' },
  { value: 2, key: 'tue' },
  { value: 3, key: 'wed' },
  { value: 4, key: 'thu' },
  { value: 5, key: 'fri' },
  { value: 6, key: 'sat' },
  { value: 0, key: 'sun' },
];

export const ADNScheduleSimplified = ({ companyId }: ADNScheduleSimplifiedProps) => {
  const { t } = useTranslation(['company']);
  const { toast } = useToast();
  const { config, loading, saveConfig } = useCompanySchedule(companyId);

  const handleSaveField = async (field: string, value: any) => {
    try {
      await saveConfig({ [field]: value });
    } catch {
      toast({ title: t('common:error'), variant: 'destructive' });
    }
  };

  const toggleDay = async (day: number) => {
    const currentDays = config?.working_days || [1, 2, 3, 4, 5];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    await handleSaveField('working_days', newDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('company:schedule.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {t('company:schedule.timezone')}
            </Label>
            <Select 
              value={config?.timezone || 'America/Mexico_City'} 
              onValueChange={(v) => handleSaveField('timezone', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_KEYS.map(tz => (
                  <SelectItem key={tz} value={tz}>{t(`company:schedule.timezones.${tz.replace(/\//g, '_')}`, tz)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('company:schedule.start_time')}</Label>
            <Input
              type="time"
              className="h-8 text-xs"
              value={config?.business_hours_start || '09:00'}
              onChange={(e) => handleSaveField('business_hours_start', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('company:schedule.end_time')}</Label>
            <Input
              type="time"
              className="h-8 text-xs"
              value={config?.business_hours_end || '18:00'}
              onChange={(e) => handleSaveField('business_hours_end', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">{t('company:schedule.working_days')}</Label>
          <div className="flex gap-1">
            {DAY_KEYS.map(day => (
              <Badge
                key={day.value}
                variant={(config?.working_days || [1,2,3,4,5]).includes(day.value) ? 'default' : 'outline'}
                className="cursor-pointer w-8 h-8 flex items-center justify-center text-xs"
                onClick={() => toggleDay(day.value)}
              >
                {t(`company:schedule.days.${day.key}`)}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
