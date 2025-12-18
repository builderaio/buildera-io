import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyCompetitors, CompanyCompetitor } from '@/hooks/useCompanyCompetitors';
import { Users, Plus, Trash2, Globe, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ADNCompetitorsTabProps {
  companyId: string;
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Alta' },
  { value: 2, label: 'Media' },
  { value: 3, label: 'Baja' },
];

export const ADNCompetitorsTab = ({ companyId }: ADNCompetitorsTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { competitors, loading, saving, addCompetitor, updateCompetitor, deleteCompetitor } = useCompanyCompetitors(companyId);

  const handleAdd = async () => {
    try {
      await addCompetitor({ competitor_name: 'Nuevo Competidor' });
      toast({ title: t('company.competitors.added', 'Competidor agregado') });
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  const handleUpdate = async (id: string, updates: Partial<CompanyCompetitor>) => {
    try {
      await updateCompetitor(id, updates);
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompetitor(id);
      toast({ title: t('company.competitors.deleted', 'Competidor eliminado') });
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('company.competitors.title', 'Competidores')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('company.competitors.desc', 'Los agentes de inteligencia competitiva monitorearán estos competidores')}
          </p>
        </div>
        <Button onClick={handleAdd} disabled={saving}>
          <Plus className="h-4 w-4 mr-2" />
          {t('company.competitors.add', 'Agregar')}
        </Button>
      </div>

      {competitors.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('company.competitors.empty', 'No hay competidores configurados')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {competitors.map(competitor => (
            <Card key={competitor.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={competitor.competitor_name}
                      onChange={(e) => handleUpdate(competitor.id, { competitor_name: e.target.value })}
                      className="font-semibold text-lg border-none px-0 focus-visible:ring-0"
                      placeholder={t('company.competitors.name', 'Nombre del competidor')}
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">{t('company.competitors.direct', 'Competidor directo')}</Label>
                        <Switch
                          checked={competitor.is_direct_competitor}
                          onCheckedChange={(v) => handleUpdate(competitor.id, { is_direct_competitor: v })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">{t('company.competitors.priority', 'Prioridad')}</Label>
                        <Select
                          value={String(competitor.priority_level)}
                          onValueChange={(v) => handleUpdate(competitor.id, { priority_level: parseInt(v) })}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(competitor.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('company.competitors.website', 'Sitio web')}
                    </Label>
                    <Input
                      value={competitor.website_url || ''}
                      onChange={(e) => handleUpdate(competitor.id, { website_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company.competitors.instagram', 'Instagram')}</Label>
                    <Input
                      value={competitor.instagram_url || ''}
                      onChange={(e) => handleUpdate(competitor.id, { instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company.competitors.linkedin', 'LinkedIn')}</Label>
                    <Input
                      value={competitor.linkedin_url || ''}
                      onChange={(e) => handleUpdate(competitor.id, { linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company.competitors.facebook', 'Facebook')}</Label>
                    <Input
                      value={competitor.facebook_url || ''}
                      onChange={(e) => handleUpdate(competitor.id, { facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('company.competitors.notes', 'Notas')}</Label>
                  <Textarea
                    value={competitor.notes || ''}
                    onChange={(e) => handleUpdate(competitor.id, { notes: e.target.value })}
                    placeholder={t('company.competitors.notes_placeholder', 'Información adicional sobre este competidor...')}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={competitor.monitor_pricing}
                      onCheckedChange={(v) => handleUpdate(competitor.id, { monitor_pricing: v })}
                    />
                    <Label className="text-sm">{t('company.competitors.monitor_pricing', 'Monitorear precios')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={competitor.monitor_content}
                      onCheckedChange={(v) => handleUpdate(competitor.id, { monitor_content: v })}
                    />
                    <Label className="text-sm">{t('company.competitors.monitor_content', 'Monitorear contenido')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={competitor.monitor_campaigns}
                      onCheckedChange={(v) => handleUpdate(competitor.id, { monitor_campaigns: v })}
                    />
                    <Label className="text-sm">{t('company.competitors.monitor_campaigns', 'Monitorear campañas')}</Label>
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
