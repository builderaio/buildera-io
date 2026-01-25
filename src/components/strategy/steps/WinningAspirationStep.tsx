import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Plus, Trash2, Sparkles, HelpCircle, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PlayToWinStrategy, AspirationMetric } from '@/types/playToWin';
import { cn } from '@/lib/utils';

interface WinningAspirationStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
}

const timelineOptions = [
  { value: '1_year', label: '1 Año', description: 'Corto plazo - objetivos inmediatos' },
  { value: '3_years', label: '3 Años', description: 'Mediano plazo - crecimiento sostenido' },
  { value: '5_years', label: '5 Años', description: 'Largo plazo - visión transformadora' }
];

const metricTemplates = [
  { metric: 'Ingresos anuales', unit: '$', example: '1,000,000' },
  { metric: 'Clientes activos', unit: 'cantidad', example: '500' },
  { metric: 'Cuota de mercado', unit: '%', example: '15' },
  { metric: 'NPS (Net Promoter Score)', unit: 'puntos', example: '70' },
  { metric: 'Margen de ganancia', unit: '%', example: '25' }
];

export default function WinningAspirationStep({ strategy, onUpdate, isSaving }: WinningAspirationStepProps) {
  const { t } = useTranslation();
  const [aspiration, setAspiration] = useState(strategy.winningAspiration || '');
  const [metrics, setMetrics] = useState<AspirationMetric[]>(strategy.aspirationMetrics || []);
  const [timeline, setTimeline] = useState<'1_year' | '3_years' | '5_years'>(strategy.aspirationTimeline || '3_years');
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    
    await onUpdate({
      winningAspiration: aspiration,
      aspirationMetrics: metrics,
      aspirationTimeline: timeline as '1_year' | '3_years' | '5_years'
    });
    setHasChanges(false);
  }, [aspiration, metrics, timeline, hasChanges, onUpdate]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasChanges) {
        saveChanges();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleAspirationChange = (value: string) => {
    setAspiration(value);
    setHasChanges(true);
  };

  const handleTimelineChange = (value: '1_year' | '3_years' | '5_years') => {
    setTimeline(value);
    setHasChanges(true);
  };

  const addMetric = () => {
    const newMetric: AspirationMetric = {
      id: crypto.randomUUID(),
      metric: '',
      target: '',
      current: '',
      unit: ''
    };
    setMetrics([...metrics, newMetric]);
    setHasChanges(true);
  };

  const updateMetric = (id: string, field: keyof AspirationMetric, value: string) => {
    setMetrics(metrics.map(m => m.id === id ? { ...m, [field]: value } : m));
    setHasChanges(true);
  };

  const removeMetric = (id: string) => {
    setMetrics(metrics.filter(m => m.id !== id));
    setHasChanges(true);
  };

  const addTemplateMetric = (template: typeof metricTemplates[0]) => {
    const newMetric: AspirationMetric = {
      id: crypto.randomUUID(),
      metric: template.metric,
      target: '',
      current: '',
      unit: template.unit
    };
    setMetrics([...metrics, newMetric]);
    setHasChanges(true);
  };

  const aspirationLength = aspiration.length;
  const isAspirationValid = aspirationLength >= 50;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Paso 1: Winning Aspiration</CardTitle>
              <CardDescription className="text-base mt-1">
                Define qué significa "ganar" para tu negocio. Esta aspiración debe ser inspiradora 
                pero específica, con métricas claras que puedas medir.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar con IA
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Aspiration Statement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Tu Aspiración de Victoria</CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-medium mb-1">Ejemplo:</p>
                  <p className="text-sm text-muted-foreground">
                    "Ser el proveedor de software #1 en Latinoamérica para PYMEs del sector retail, 
                    alcanzando 10,000 clientes activos y $5M en ingresos recurrentes para 2027."
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            ¿Qué quieres lograr? ¿Cómo se ve el éxito para tu negocio?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={aspiration}
              onChange={(e) => handleAspirationChange(e.target.value)}
              placeholder="Queremos ser la empresa líder en... alcanzando... para el año..."
              className="min-h-[120px] resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "transition-colors",
                isAspirationValid ? "text-green-600" : "text-muted-foreground"
              )}>
                {aspirationLength}/50 caracteres mínimos
                {isAspirationValid && " ✓"}
              </span>
              {isSaving && (
                <span className="text-muted-foreground">Guardando...</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Horizonte Temporal
          </CardTitle>
          <CardDescription>
            ¿En cuánto tiempo esperas alcanzar esta aspiración?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timelineOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimelineChange(option.value as '1_year' | '3_years' | '5_years')}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  timeline === option.value
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <div className="font-semibold text-lg">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Métricas de Éxito</CardTitle>
              <CardDescription>
                Define indicadores medibles para saber si estás ganando
              </CardDescription>
            </div>
            <Button onClick={addMetric} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir Métrica
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick add templates */}
          {metrics.length === 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Sugerencias de métricas comunes:
              </p>
              <div className="flex flex-wrap gap-2">
                {metricTemplates.map((template, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => addTemplateMetric(template)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {template.metric}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metrics list */}
          <div className="space-y-3">
            {metrics.map((metric, index) => (
              <div
                key={metric.id}
                className="grid grid-cols-12 gap-3 items-start p-4 bg-muted/30 rounded-lg"
              >
                <div className="col-span-12 sm:col-span-4">
                  <Label className="text-xs text-muted-foreground">Métrica</Label>
                  <Input
                    value={metric.metric}
                    onChange={(e) => updateMetric(metric.id, 'metric', e.target.value)}
                    placeholder="Ej: Ingresos anuales"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Actual</Label>
                  <Input
                    value={metric.current}
                    onChange={(e) => updateMetric(metric.id, 'current', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Objetivo</Label>
                  <Input
                    value={metric.target}
                    onChange={(e) => updateMetric(metric.id, 'target', e.target.value)}
                    placeholder="100"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-3 sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">Unidad</Label>
                  <Select
                    value={metric.unit}
                    onValueChange={(value) => updateMetric(metric.id, 'unit', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ (Dólares)</SelectItem>
                      <SelectItem value="%">% (Porcentaje)</SelectItem>
                      <SelectItem value="cantidad">Cantidad</SelectItem>
                      <SelectItem value="puntos">Puntos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex items-end justify-end pb-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMetric(metric.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {metrics.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {metricTemplates
                .filter(t => !metrics.some(m => m.metric === t.metric))
                .slice(0, 3)
                .map((template, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                    onClick={() => addTemplateMetric(template)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {template.metric}
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg h-fit">
              <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                Consejos para una buena Winning Aspiration
              </h4>
              <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Sé específico sobre qué mercado o segmento quieres dominar</li>
                <li>• Incluye números y fechas concretas</li>
                <li>• Asegúrate de que sea ambiciosa pero alcanzable</li>
                <li>• Conecta la aspiración con el impacto en tus clientes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
