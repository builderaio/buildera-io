import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Share2, Plus, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ADNPlatformSettingsTabProps {
  companyId: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  linkedin: '💼',
  tiktok: '🎵',
  twitter: '🐦',
  youtube: '📺',
};

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Público' },
  { value: 'private', label: 'Privado' },
  { value: 'followers', label: 'Solo seguidores' },
];

export const ADNPlatformSettingsTab = ({ companyId }: ADNPlatformSettingsTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, loading, saving, savePlatformSetting, availablePlatforms, getSettingForPlatform } = usePlatformSettings(companyId);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handleAddPlatform = async (platform: string) => {
    try {
      await savePlatformSetting(platform, { is_active: true });
      toast({ title: t('company.platforms.added', 'Plataforma agregada') });
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  const handleUpdateSetting = async (platform: string, updates: any) => {
    try {
      await savePlatformSetting(platform, updates);
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  const configuredPlatforms = settings.map(s => s.platform);
  const unconfiguredPlatforms = availablePlatforms.filter(p => !configuredPlatforms.includes(p));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          {t('company.platforms.title', 'Configuración de Plataformas')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('company.platforms.desc', 'Configura los parámetros de publicación para cada red social')}
        </p>
      </div>

      {unconfiguredPlatforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('company.platforms.add_platform', 'Agregar plataforma')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unconfiguredPlatforms.map(platform => (
                <Button
                  key={platform}
                  variant="outline"
                  onClick={() => handleAddPlatform(platform)}
                  disabled={saving}
                >
                  <span className="mr-2">{PLATFORM_ICONS[platform]}</span>
                  <span className="capitalize">{platform}</span>
                  <Plus className="h-4 w-4 ml-2" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {settings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('company.platforms.empty', 'No hay plataformas configuradas')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {settings.map(setting => (
            <Card key={setting.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{PLATFORM_ICONS[setting.platform]}</span>
                    <span className="capitalize">{setting.platform}</span>
                    {setting.is_active && <Badge variant="secondary" className="ml-2">{t('company.platforms.active', 'Activo')}</Badge>}
                  </CardTitle>
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={(v) => handleUpdateSetting(setting.platform, { is_active: v })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('company.platforms.max_posts', 'Posts/día máx')}</Label>
                    <Input
                      type="number"
                      value={setting.max_posts_per_day}
                      onChange={(e) => handleUpdateSetting(setting.platform, { max_posts_per_day: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company.platforms.hashtag_limit', 'Límite hashtags')}</Label>
                    <Input
                      type="number"
                      value={setting.hashtag_limit || ''}
                      onChange={(e) => handleUpdateSetting(setting.platform, { hashtag_limit: parseInt(e.target.value) || null })}
                      placeholder="Sin límite"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company.platforms.visibility', 'Visibilidad')}</Label>
                    <Select
                      value={setting.default_visibility}
                      onValueChange={(v) => handleUpdateSetting(setting.platform, { default_visibility: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={setting.auto_publish}
                      onCheckedChange={(v) => handleUpdateSetting(setting.platform, { auto_publish: v })}
                    />
                    <Label className="text-sm">{t('company.platforms.auto_publish', 'Auto-publicar')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={setting.require_approval}
                      onCheckedChange={(v) => handleUpdateSetting(setting.platform, { require_approval: v })}
                    />
                    <Label className="text-sm">{t('company.platforms.require_approval', 'Requiere aprobación')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={setting.scheduling_enabled}
                      onCheckedChange={(v) => handleUpdateSetting(setting.platform, { scheduling_enabled: v })}
                    />
                    <Label className="text-sm">{t('company.platforms.scheduling', 'Programación')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={setting.analytics_tracking}
                      onCheckedChange={(v) => handleUpdateSetting(setting.platform, { analytics_tracking: v })}
                    />
                    <Label className="text-sm">{t('company.platforms.analytics', 'Analytics')}</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
