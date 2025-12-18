import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useCompanySchedule } from '@/hooks/useCompanySchedule';
import { Clock, Globe, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface ADNScheduleTabProps {
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
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter'];

export const ADNScheduleTab = ({ companyId }: ADNScheduleTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { config, loading, saving, saveConfig } = useCompanySchedule(companyId);

  const [localConfig, setLocalConfig] = useState({
    timezone: 'America/Mexico_City',
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
    preferred_posting_times: {} as Record<string, string[]>,
    content_frequency: {} as Record<string, number>,
  });

  useEffect(() => {
    if (config) {
      setLocalConfig({
        timezone: config.timezone || 'America/Mexico_City',
        business_hours_start: config.business_hours_start || '09:00',
        business_hours_end: config.business_hours_end || '18:00',
        working_days: config.working_days || [1, 2, 3, 4, 5],
        preferred_posting_times: config.preferred_posting_times || {},
        content_frequency: config.content_frequency || {},
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await saveConfig(localConfig);
      toast({ title: t('company.email.saved') });
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  const toggleDay = (day: number) => {
    const newDays = localConfig.working_days.includes(day)
      ? localConfig.working_days.filter(d => d !== day)
      : [...localConfig.working_days, day];
    setLocalConfig(prev => ({ ...prev, working_days: newDays }));
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
            <Globe className="h-5 w-5" />
            {t('company.schedule.timezone_title', 'Zona Horaria')}
          </CardTitle>
          <CardDescription>
            {t('company.schedule.timezone_desc', 'Configura la zona horaria para la programación de contenido')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('company.schedule.timezone', 'Zona horaria')}</Label>
            <Select 
              value={localConfig.timezone} 
              onValueChange={(v) => setLocalConfig(prev => ({ ...prev, timezone: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('company.schedule.business_hours', 'Horario Laboral')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('company.schedule.start_time', 'Hora inicio')}</Label>
              <Input
                type="time"
                value={localConfig.business_hours_start}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, business_hours_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('company.schedule.end_time', 'Hora fin')}</Label>
              <Input
                type="time"
                value={localConfig.business_hours_end}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, business_hours_end: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('company.schedule.working_days', 'Días laborales')}</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <Badge
                  key={day.value}
                  variant={localConfig.working_days.includes(day.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('company.schedule.frequency', 'Frecuencia de Contenido')}
          </CardTitle>
          <CardDescription>
            {t('company.schedule.frequency_desc', 'Posts por semana en cada plataforma')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PLATFORMS.map(platform => (
              <div key={platform} className="space-y-2">
                <Label className="capitalize">{platform}</Label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={localConfig.content_frequency[platform] || 0}
                  onChange={(e) => setLocalConfig(prev => ({
                    ...prev,
                    content_frequency: {
                      ...prev.content_frequency,
                      [platform]: parseInt(e.target.value) || 0
                    }
                  }))}
                />
              </div>
            ))}
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
