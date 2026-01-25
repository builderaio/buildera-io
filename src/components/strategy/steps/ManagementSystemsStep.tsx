import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Plus, Trash2, Sparkles, Target, BarChart3, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PlayToWinStrategy, OKR, KeyResult, KPIDefinition, GovernanceModel, ReviewCadence } from '@/types/playToWin';
import { cn } from '@/lib/utils';

interface ManagementSystemsStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
}

const cadenceOptions: { value: ReviewCadence; label: string; description: string }[] = [
  { value: 'weekly', label: 'Semanal', description: 'Para equipos ágiles con ciclos cortos' },
  { value: 'biweekly', label: 'Quincenal', description: 'Balance entre agilidad y profundidad' },
  { value: 'monthly', label: 'Mensual', description: 'Revisiones profundas con tiempo de ejecución' },
  { value: 'quarterly', label: 'Trimestral', description: 'Ciclos estratégicos tradicionales' }
];

const frequencyOptions = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' }
];

export default function ManagementSystemsStep({ strategy, onUpdate, isSaving }: ManagementSystemsStepProps) {
  const { t } = useTranslation();
  const [cadence, setCadence] = useState<ReviewCadence>(strategy.reviewCadence || 'monthly');
  const [okrs, setOkrs] = useState<OKR[]>(strategy.okrs || []);
  const [kpis, setKpis] = useState<KPIDefinition[]>(strategy.kpiDefinitions || []);
  const [governance, setGovernance] = useState<GovernanceModel>(strategy.governanceModel || {
    decisionRights: '',
    escalationPath: '',
    reviewMeetings: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    
    await onUpdate({
      reviewCadence: cadence,
      okrs,
      kpiDefinitions: kpis,
      governanceModel: governance
    });
    setHasChanges(false);
  }, [cadence, okrs, kpis, governance, hasChanges, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasChanges) saveChanges();
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  // Cadence handler
  const handleCadenceChange = (value: ReviewCadence) => {
    setCadence(value);
    setHasChanges(true);
  };

  // OKR handlers
  const addOKR = () => {
    setOkrs([...okrs, {
      id: crypto.randomUUID(),
      objective: '',
      keyResults: []
    }]);
    setHasChanges(true);
  };

  const updateOKR = (id: string, objective: string) => {
    setOkrs(okrs.map(o => o.id === id ? { ...o, objective } : o));
    setHasChanges(true);
  };

  const removeOKR = (id: string) => {
    setOkrs(okrs.filter(o => o.id !== id));
    setHasChanges(true);
  };

  const addKeyResult = (okrId: string) => {
    setOkrs(okrs.map(o => o.id === okrId ? {
      ...o,
      keyResults: [...o.keyResults, {
        id: crypto.randomUUID(),
        result: '',
        target: '',
        current: '0',
        status: 'on_track' as const
      }]
    } : o));
    setHasChanges(true);
  };

  const updateKeyResult = (okrId: string, krId: string, field: keyof KeyResult, value: any) => {
    setOkrs(okrs.map(o => o.id === okrId ? {
      ...o,
      keyResults: o.keyResults.map(kr => kr.id === krId ? { ...kr, [field]: value } : kr)
    } : o));
    setHasChanges(true);
  };

  const removeKeyResult = (okrId: string, krId: string) => {
    setOkrs(okrs.map(o => o.id === okrId ? {
      ...o,
      keyResults: o.keyResults.filter(kr => kr.id !== krId)
    } : o));
    setHasChanges(true);
  };

  // KPI handlers
  const addKPI = () => {
    setKpis([...kpis, {
      id: crypto.randomUUID(),
      name: '',
      formula: '',
      target: '',
      frequency: 'monthly',
      owner: ''
    }]);
    setHasChanges(true);
  };

  const updateKPI = (id: string, field: keyof KPIDefinition, value: any) => {
    setKpis(kpis.map(k => k.id === id ? { ...k, [field]: value } : k));
    setHasChanges(true);
  };

  const removeKPI = (id: string) => {
    setKpis(kpis.filter(k => k.id !== id));
    setHasChanges(true);
  };

  // Governance handler
  const updateGovernance = (field: keyof GovernanceModel, value: string) => {
    setGovernance({ ...governance, [field]: value });
    setHasChanges(true);
  };

  const getStatusColor = (status: KeyResult['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'on_track': return 'bg-blue-500';
      case 'at_risk': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateProgress = (current: string, target: string): number => {
    const c = parseFloat(current) || 0;
    const t = parseFloat(target) || 1;
    return Math.min(100, Math.round((c / t) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Settings className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Paso 5: Management Systems</CardTitle>
              <CardDescription className="text-base mt-1">
                Establece los sistemas de gestión, OKRs y métricas que 
                usarás para ejecutar y medir el progreso de tu estrategia.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar con IA
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="cadence" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="cadence" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Cadencia</span>
          </TabsTrigger>
          <TabsTrigger value="okrs" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">OKRs</span>
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="governance" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Gobernanza</span>
          </TabsTrigger>
        </TabsList>

        {/* Cadence Tab */}
        <TabsContent value="cadence">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cadencia de Revisión</CardTitle>
              <CardDescription>
                ¿Con qué frecuencia revisarás el progreso de tu estrategia?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cadenceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleCadenceChange(option.value)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      cadence === option.value
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OKRs Tab */}
        <TabsContent value="okrs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Objectives & Key Results</CardTitle>
                  <CardDescription>
                    Define objetivos ambiciosos con resultados clave medibles
                  </CardDescription>
                </div>
                <Button onClick={addOKR} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir OKR
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {okrs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aún no has definido OKRs</p>
                  <Button onClick={addOKR} variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir tu primer OKR
                  </Button>
                </div>
              ) : (
                okrs.map((okr, index) => (
                  <div key={okr.id} className="border rounded-lg overflow-hidden">
                    {/* Objective */}
                    <div className="bg-muted/50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          O{index + 1}
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Objetivo</Label>
                          <Textarea
                            value={okr.objective}
                            onChange={(e) => updateOKR(okr.id, e.target.value)}
                            placeholder="Ej: Convertirnos en el líder del mercado en nuestro segmento"
                            className="mt-1 min-h-[60px] bg-background"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOKR(okr.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Key Results */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Key Results</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addKeyResult(okr.id)}
                          className="gap-1 h-7 text-xs"
                        >
                          <Plus className="h-3 w-3" />
                          KR
                        </Button>
                      </div>

                      {okr.keyResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Añade Key Results para este objetivo
                        </p>
                      ) : (
                        okr.keyResults.map((kr, krIndex) => (
                          <div key={kr.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 rounded bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-medium">
                              {krIndex + 1}
                            </div>
                            <div className="flex-1 space-y-2">
                              <Input
                                value={kr.result}
                                onChange={(e) => updateKeyResult(okr.id, kr.id, 'result', e.target.value)}
                                placeholder="Resultado clave medible"
                                className="text-sm"
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Actual</Label>
                                  <Input
                                    value={kr.current}
                                    onChange={(e) => updateKeyResult(okr.id, kr.id, 'current', e.target.value)}
                                    placeholder="0"
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Meta</Label>
                                  <Input
                                    value={kr.target}
                                    onChange={(e) => updateKeyResult(okr.id, kr.id, 'target', e.target.value)}
                                    placeholder="100"
                                    className="mt-1 h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Estado</Label>
                                  <Select
                                    value={kr.status}
                                    onValueChange={(v) => updateKeyResult(okr.id, kr.id, 'status', v)}
                                  >
                                    <SelectTrigger className="mt-1 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="on_track">🟢 En camino</SelectItem>
                                      <SelectItem value="at_risk">🔴 En riesgo</SelectItem>
                                      <SelectItem value="completed">✅ Completado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={calculateProgress(kr.current, kr.target)} 
                                  className="h-2 flex-1"
                                />
                                <span className="text-xs font-medium w-12 text-right">
                                  {calculateProgress(kr.current, kr.target)}%
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeKeyResult(okr.id, kr.id)}
                              className="text-destructive h-6 w-6"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">KPIs Operativos</CardTitle>
                  <CardDescription>
                    Indicadores clave de rendimiento para monitoreo continuo
                  </CardDescription>
                </div>
                <Button onClick={addKPI} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir KPI
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {kpis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aún no has definido KPIs</p>
                  <Button onClick={addKPI} variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir tu primer KPI
                  </Button>
                </div>
              ) : (
                kpis.map((kpi) => (
                  <div key={kpi.id} className="grid grid-cols-12 gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        value={kpi.name}
                        onChange={(e) => updateKPI(kpi.id, 'name', e.target.value)}
                        placeholder="Ej: CAC"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Fórmula / Cómo se mide</Label>
                      <Input
                        value={kpi.formula}
                        onChange={(e) => updateKPI(kpi.id, 'formula', e.target.value)}
                        placeholder="Gasto marketing / Nuevos clientes"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs">Meta</Label>
                      <Input
                        value={kpi.target}
                        onChange={(e) => updateKPI(kpi.id, 'target', e.target.value)}
                        placeholder="$50"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs">Frecuencia</Label>
                      <Select
                        value={kpi.frequency}
                        onValueChange={(v) => updateKPI(kpi.id, 'frequency', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map(f => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <Label className="text-xs">Responsable</Label>
                      <Input
                        value={kpi.owner}
                        onChange={(e) => updateKPI(kpi.id, 'owner', e.target.value)}
                        placeholder="CMO"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeKPI(kpi.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modelo de Gobernanza</CardTitle>
              <CardDescription>
                Define cómo se tomarán las decisiones y se gestionará la ejecución
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Derechos de Decisión</Label>
                <Textarea
                  value={governance.decisionRights}
                  onChange={(e) => updateGovernance('decisionRights', e.target.value)}
                  placeholder="¿Quién puede tomar decisiones estratégicas? ¿Quién aprueba cambios?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Ruta de Escalación</Label>
                <Textarea
                  value={governance.escalationPath}
                  onChange={(e) => updateGovernance('escalationPath', e.target.value)}
                  placeholder="¿Cómo se escalan los problemas? ¿A quién y en qué plazo?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Reuniones de Revisión</Label>
                <Textarea
                  value={governance.reviewMeetings}
                  onChange={(e) => updateGovernance('reviewMeetings', e.target.value)}
                  placeholder="Describe las reuniones de revisión estratégica: frecuencia, participantes, agenda..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
