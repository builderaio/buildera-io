import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Brain, Wrench, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ADNWorkforceProfilesTabProps {
  companyId: string | null;
}

type WorkforceProfile = 'm_shaped' | 't_shaped' | 'frontline' | 'unassigned';

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  full_name?: string;
  email?: string;
  workforce_profile: WorkforceProfile;
}

const profileConfig: Record<Exclude<WorkforceProfile, 'unassigned'>, { 
  icon: typeof Brain; labelKey: string; descKey: string; color: string 
}> = {
  m_shaped: {
    icon: Brain,
    labelKey: 'workforceProfiles.mShaped',
    descKey: 'workforceProfiles.mShapedDesc',
    color: 'text-primary border-primary/30 bg-primary/5',
  },
  t_shaped: {
    icon: Wrench,
    labelKey: 'workforceProfiles.tShaped',
    descKey: 'workforceProfiles.tShapedDesc',
    color: 'text-amber-600 border-amber-500/30 bg-amber-500/5',
  },
  frontline: {
    icon: Zap,
    labelKey: 'workforceProfiles.frontline',
    descKey: 'workforceProfiles.frontlineDesc',
    color: 'text-emerald-600 border-emerald-500/30 bg-emerald-500/5',
  },
};

export const ADNWorkforceProfilesTab = ({ companyId }: ADNWorkforceProfilesTabProps) => {
  const { t } = useTranslation(['company', 'common']);
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    loadMembers();
  }, [companyId]);

  const loadMembers = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from('company_members')
      .select('id, user_id, role')
      .eq('company_id', companyId);

    if (data) {
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setMembers(data.map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        full_name: profileMap.get(m.user_id)?.full_name || '',
        email: profileMap.get(m.user_id)?.email || '',
        workforce_profile: ((m as any).workforce_profile || 'unassigned') as WorkforceProfile,
      })));
    }
    setLoading(false);
  };

  const updateProfile = useCallback(async (memberId: string, profile: WorkforceProfile) => {
    const { error } = await supabase
      .from('company_members')
      .update({ workforce_profile: profile } as any)
      .eq('id', memberId);

    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, workforce_profile: profile } : m));
      toast({ title: '✓', description: t('common:adn.saved'), duration: 1500 });
    }
  }, [toast, t]);

  const counts = {
    m_shaped: members.filter(m => m.workforce_profile === 'm_shaped').length,
    t_shaped: members.filter(m => m.workforce_profile === 't_shaped').length,
    frontline: members.filter(m => m.workforce_profile === 'frontline').length,
    unassigned: members.filter(m => m.workforce_profile === 'unassigned').length,
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          {t('company:workforceProfiles.title', 'Perfiles de Fuerza Laboral Agéntica')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('company:workforceProfiles.subtitle', 'Clasifica a tu equipo según el framework McKinsey para la era agéntica')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(profileConfig) as Array<keyof typeof profileConfig>).map(key => {
            const cfg = profileConfig[key];
            const Icon = cfg.icon;
            return (
              <div key={key} className={cn('p-3 rounded-lg border', cfg.color)}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{t(cfg.labelKey, key)}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{counts[key]}</Badge>
                </div>
                <p className="text-[11px] opacity-70">{t(cfg.descKey, '')}</p>
              </div>
            );
          })}
        </div>

        {/* Info box */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">
            {t('company:workforceProfiles.info', 'M-shaped: generalistas que orquestan agentes IA. T-shaped: especialistas de dominio profundo. Frontline: operativos empoderados con herramientas IA.')}
          </p>
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-background/60">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.full_name || member.email || t('common:unknown', 'Sin nombre')}
                </p>
                <p className="text-[11px] text-muted-foreground">{member.role}</p>
              </div>
              <Select
                value={member.workforce_profile}
                onValueChange={(val) => updateProfile(member.id, val as WorkforceProfile)}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('company:workforceProfiles.unassigned', 'Sin asignar')}</SelectItem>
                  <SelectItem value="m_shaped">{t('company:workforceProfiles.mShaped', 'M-Shaped')}</SelectItem>
                  <SelectItem value="t_shaped">{t('company:workforceProfiles.tShaped', 'T-Shaped')}</SelectItem>
                  <SelectItem value="frontline">{t('company:workforceProfiles.frontline', 'Frontline IA')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('company:workforceProfiles.noMembers', 'Agrega miembros a tu equipo primero.')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
