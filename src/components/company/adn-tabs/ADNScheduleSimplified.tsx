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

const TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
];

const DAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

export const ADNScheduleSimplified = ({ companyId }: ADNScheduleSimplifiedProps) => {
  const { t } = useTranslation();
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
          {t('company.schedule.title', 'Horarios y Zona Horaria')}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {t('company.schedule.timezone', 'Zona horaria')}
            </Label>
            <Select 
              value={config?.timezone || 'America/Mexico_City'} 
              onValueChange={(v) => handleSaveField('timezone', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('company.schedule.start_time', 'Hora inicio')}</Label>
            <Input
              type="time"
              className="h-8 text-xs"
              value={config?.business_hours_start || '09:00'}
              onChange={(e) => handleSaveField('business_hours_start', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('company.schedule.end_time', 'Hora fin')}</Label>
            <Input
              type="time"
              className="h-8 text-xs"
              value={config?.business_hours_end || '18:00'}
              onChange={(e) => handleSaveField('business_hours_end', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">{t('company.schedule.working_days', 'Días activos')}</Label>
          <div className="flex gap-1">
            {DAYS.map(day => (
              <Badge
                key={day.value}
                variant={(config?.working_days || [1,2,3,4,5]).includes(day.value) ? 'default' : 'outline'}
                className="cursor-pointer w-8 h-8 flex items-center justify-center text-xs"
                onClick={() => toggleDay(day.value)}
              >
                {day.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
