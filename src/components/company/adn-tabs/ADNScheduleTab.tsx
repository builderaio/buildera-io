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

const TIMEZONE_KEYS = [
  'America/Mexico_City', 'America/New_York', 'America/Los_Angeles',
  'America/Bogota', 'America/Lima', 'America/Buenos_Aires',
  'America/Sao_Paulo', 'Europe/Madrid', 'Europe/London',
];

const DAY_KEYS = [
  { value: 1, key: 'monday' },
  { value: 2, key: 'tuesday' },
  { value: 3, key: 'wednesday' },
  { value: 4, key: 'thursday' },
  { value: 5, key: 'friday' },
  { value: 6, key: 'saturday' },
  { value: 0, key: 'sunday' },
];

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter'];

export const ADNScheduleTab = ({ companyId }: ADNScheduleTabProps) => {
  const { t } = useTranslation(['company']);
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
      toast({ title: t('company:email.saved') });
    } catch {
      toast({ title: t('company:email.save_error'), variant: 'destructive' });
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
            {t('company:schedule.timezone_title')}
          </CardTitle>
          <CardDescription>
            {t('company:schedule.timezone_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('company:schedule.timezone')}</Label>
            <Select 
              value={localConfig.timezone} 
              onValueChange={(v) => setLocalConfig(prev => ({ ...prev, timezone: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_KEYS.map(tz => (
                  <SelectItem key={tz} value={tz}>{t(`company:schedule.timezones.${tz.replace(/\//g, '_')}`, tz)}</SelectItem>
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
            {t('company:schedule.business_hours')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('company:schedule.start_time')}</Label>
              <Input
                type="time"
                value={localConfig.business_hours_start}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, business_hours_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('company:schedule.end_time')}</Label>
              <Input
                type="time"
                value={localConfig.business_hours_end}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, business_hours_end: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('company:schedule.working_days')}</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_KEYS.map(day => (
                <Badge
                  key={day.value}
                  variant={localConfig.working_days.includes(day.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleDay(day.value)}
                >
                  {t(`company:schedule.days.${day.key}`)}
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
            {t('company:schedule.frequency')}
          </CardTitle>
          <CardDescription>
            {t('company:schedule.frequency_desc')}
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
        {t('company:email.save')}
      </Button>
    </div>
  );
};
