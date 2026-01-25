import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Trash2, HelpCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PlayToWinStrategy, TargetSegment } from '@/types/playToWin';
import { cn } from '@/lib/utils';

interface FounderTargetCustomerStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
}

const customerTemplates = [
  { name: 'Pequeñas empresas', description: 'Negocios con 1-10 empleados que buscan crecer' },
  { name: 'Profesionales independientes', description: 'Freelancers y consultores que necesitan herramientas' },
  { name: 'Startups en etapa temprana', description: 'Equipos de fundadores construyendo su primer producto' },
  { name: 'Comercios locales', description: 'Tiendas, restaurantes y servicios de barrio' },
  { name: 'Creadores de contenido', description: 'Influencers, bloggers y creadores digitales' }
];

export default function FounderTargetCustomerStep({ strategy, onUpdate, isSaving }: FounderTargetCustomerStepProps) {
  const { t } = useTranslation();
  const [segments, setSegments] = useState<TargetSegment[]>(strategy.targetSegments || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    
    await onUpdate({
      targetSegments: segments
    });
    setHasChanges(false);
  }, [segments, hasChanges, onUpdate]);

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasChanges) {
        saveChanges();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const addSegment = (template?: typeof customerTemplates[0]) => {
    const newSegment: TargetSegment = {
      id: crypto.randomUUID(),
      name: template?.name || '',
      description: template?.description || '',
      size: '',
      growthPotential: 'medium'
    };
    setSegments([...segments, newSegment]);
    setHasChanges(true);
  };

  const updateSegment = (id: string, field: keyof TargetSegment, value: string) => {
    setSegments(segments.map(s => s.id === id ? { ...s, [field]: value } : s));
    setHasChanges(true);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const hasValidSegment = segments.some(s => s.name.length > 0 && s.description.length > 0);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl">
                {t('journey.founder.step2Title', 'Paso 2: Tu Cliente Ideal')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {t('journey.founder.step2Description', 'Define quién es la persona o empresa que más se beneficiará de lo que ofreces. Es mejor empezar con un segmento muy específico.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Templates */}
      {segments.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-muted-foreground" />
              {t('journey.founder.templatesTitle', 'Elige un tipo de cliente o crea el tuyo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customerTemplates.map((template, i) => (
                <button
                  key={i}
                  onClick={() => addSegment(template)}
                  className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 text-left transition-all"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{template.description}</div>
                </button>
              ))}
              <button
                onClick={() => addSegment()}
                className="p-4 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-left transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">
                  {t('journey.founder.createCustom', 'Crear personalizado')}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segments List */}
      {segments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {t('journey.founder.segmentsTitle', 'Tus Clientes Ideales')}
                </CardTitle>
                <CardDescription>
                  {t('journey.founder.segmentsHint', 'Define 1-2 segmentos para empezar enfocado')}
                </CardDescription>
              </div>
              {segments.length < 2 && (
                <Button onClick={() => addSegment()} size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('common.add', 'Añadir')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className="p-4 bg-muted/30 rounded-lg space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <Badge variant="secondary" className="shrink-0">
                    {t('journey.founder.segment', 'Segmento')} {index + 1}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSegment(segment.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm">{t('journey.founder.segmentName', '¿Quiénes son?')}</Label>
                    <Input
                      value={segment.name}
                      onChange={(e) => updateSegment(segment.id, 'name', e.target.value)}
                      placeholder={t('journey.founder.segmentNamePlaceholder', 'Ej: Pequeños restaurantes familiares')}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">{t('journey.founder.segmentDesc', '¿Qué problema tienen?')}</Label>
                    <Textarea
                      value={segment.description}
                      onChange={(e) => updateSegment(segment.id, 'description', e.target.value)}
                      placeholder={t('journey.founder.segmentDescPlaceholder', 'Ej: Les cuesta gestionar pedidos y no tienen tiempo para marketing digital')}
                      className="mt-1 min-h-[80px] resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">{t('journey.founder.segmentSize', '¿Cuántos hay aproximadamente?')}</Label>
                    <Input
                      value={segment.size}
                      onChange={(e) => updateSegment(segment.id, 'size', e.target.value)}
                      placeholder={t('journey.founder.segmentSizePlaceholder', 'Ej: 500 en mi ciudad, 10,000 en el país')}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between text-sm pt-2">
              <span className={cn(
                "transition-colors",
                hasValidSegment ? "text-green-600" : "text-muted-foreground"
              )}>
                {hasValidSegment ? '✓ ' : ''}{segments.length}/2 {t('journey.founder.segmentsCount', 'segmentos definidos')}
              </span>
              {isSaving && (
                <span className="text-muted-foreground">{t('common.saving', 'Guardando...')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg h-fit">
              <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                {t('journey.founder.customerTips', 'Consejos para elegir tu cliente ideal')}
              </h4>
              <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• {t('journey.founder.customerTip1', 'Empieza con UN segmento muy específico')}</li>
                <li>• {t('journey.founder.customerTip2', 'Piensa en personas que conoces y podrían comprarte')}</li>
                <li>• {t('journey.founder.customerTip3', 'El problema debe ser urgente y valioso de resolver')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
