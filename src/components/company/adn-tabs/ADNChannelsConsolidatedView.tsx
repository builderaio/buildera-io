import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useCompanySchedule } from '@/hooks/useCompanySchedule';
import { useCommunicationSettings } from '@/hooks/useCommunicationSettings';
import { ChevronDown, Instagram, Facebook, Linkedin, Youtube, Twitter, Loader2, CheckCircle2, Circle, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ADNChannelsConsolidatedViewProps {
  companyId: string;
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: () => <span className="text-lg">📱</span>,
};

const TONE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Amigable' },
  { value: 'professional', label: 'Profesional' },
  { value: 'fun', label: 'Divertido' },
  { value: 'conversational', label: 'Conversacional' },
  { value: 'formal', label: 'Formal' },
];

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter', 'youtube'];

export const ADNChannelsConsolidatedView = ({ companyId }: ADNChannelsConsolidatedViewProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, loading: loadingPlatforms, savePlatformSetting } = usePlatformSettings(companyId);
  const { config: scheduleConfig, saveConfig: saveSchedule, loading: loadingSchedule } = useCompanySchedule(companyId);
  const { settings: commSettings, saveSettings: saveComm, loading: loadingComm } = useCommunicationSettings(companyId);
  
  const [openPlatforms, setOpenPlatforms] = useState<string[]>([]);

  const togglePlatform = (platform: string) => {
    setOpenPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const getPlatformSetting = (platform: string) => settings.find(s => s.platform === platform);
  const getPlatformTone = (platform: string) => commSettings?.tone_by_platform?.[platform] || 'professional';
  const getPlatformFrequency = (platform: string) => scheduleConfig?.content_frequency?.[platform] || 0;

  const handleToggleActive = async (platform: string, isActive: boolean) => {
    try {
      await savePlatformSetting(platform, { is_active: isActive });
    } catch {
      toast({ title: t('common:error'), variant: 'destructive' });
    }
  };

  const handleToneChange = async (platform: string, tone: string) => {
    try {
      await saveComm({ 
        tone_by_platform: { 
          ...commSettings?.tone_by_platform, 
          [platform]: tone 
        } 
      });
    } catch {
      toast({ title: t('common:error'), variant: 'destructive' });
    }
  };

  const handleFrequencyChange = async (platform: string, frequency: number) => {
    try {
      await saveSchedule({ 
        content_frequency: { 
          ...scheduleConfig?.content_frequency, 
          [platform]: frequency 
        } 
      });
    } catch {
      toast({ title: t('common:error'), variant: 'destructive' });
    }
  };

  const handleSettingChange = async (platform: string, field: string, value: any) => {
    try {
      await savePlatformSetting(platform, { [field]: value });
    } catch {
      toast({ title: t('common:error'), variant: 'destructive' });
    }
  };

  if (loadingPlatforms || loadingSchedule || loadingComm) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        {t('company.channels.desc', 'Configura cada plataforma de manera individual')}
      </p>
      
      {PLATFORMS.map(platform => {
        const Icon = PLATFORM_ICONS[platform];
        const platformSetting = getPlatformSetting(platform);
        const isActive = platformSetting?.is_active || false;
        const isOpen = openPlatforms.includes(platform);
        
        return (
          <Card key={platform} className={`transition-colors ${isActive ? 'border-primary/30' : 'opacity-60'}`}>
            <Collapsible open={isOpen} onOpenChange={() => togglePlatform(platform)}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2">
                      {typeof Icon === 'function' && Icon.prototype ? <Icon className="h-5 w-5" /> : Icon && <Icon />}
                      <span className="font-medium capitalize">{platform}</span>
                    </div>
                    {isActive && (
                      <Badge variant="outline" className="text-xs">
                        {getPlatformFrequency(platform)} posts/sem
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isActive}
                      onCheckedChange={(v) => handleToggleActive(platform, v)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <CollapsibleTrigger asChild>
                      <button className="p-1 hover:bg-muted rounded">
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 px-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('company.channels.tone', 'Tono')}</Label>
                      <Select 
                        value={getPlatformTone(platform)} 
                        onValueChange={(v) => handleToneChange(platform, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">{t('company.channels.frequency', 'Posts/semana')}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        className="h-8 text-xs"
                        value={getPlatformFrequency(platform)}
                        onChange={(e) => handleFrequencyChange(platform, parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">{t('company.channels.max_posts', 'Máx posts/día')}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        className="h-8 text-xs"
                        value={platformSetting?.max_posts_per_day || 3}
                        onChange={(e) => handleSettingChange(platform, 'max_posts_per_day', parseInt(e.target.value) || 3)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">{t('company.channels.hashtag_limit', 'Límite hashtags')}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        className="h-8 text-xs"
                        value={platformSetting?.hashtag_limit || 10}
                        onChange={(e) => handleSettingChange(platform, 'hashtag_limit', parseInt(e.target.value) || 10)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${platform}-auto-publish`}
                        checked={platformSetting?.auto_publish || false}
                        onCheckedChange={(v) => handleSettingChange(platform, 'auto_publish', v)}
                      />
                      <Label htmlFor={`${platform}-auto-publish`} className="text-xs">
                        {t('company.channels.auto_publish', 'Auto-publicar')}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${platform}-approval`}
                        checked={platformSetting?.require_approval || true}
                        onCheckedChange={(v) => handleSettingChange(platform, 'require_approval', v)}
                      />
                      <Label htmlFor={`${platform}-approval`} className="text-xs">
                        {t('company.channels.require_approval', 'Requiere aprobación')}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${platform}-analytics`}
                        checked={platformSetting?.analytics_tracking || true}
                        onCheckedChange={(v) => handleSettingChange(platform, 'analytics_tracking', v)}
                      />
                      <Label htmlFor={`${platform}-analytics`} className="text-xs">
                        {t('company.channels.analytics', 'Rastrear métricas')}
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};
