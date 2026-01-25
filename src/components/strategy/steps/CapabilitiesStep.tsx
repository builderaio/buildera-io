import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, Plus, Trash2, Sparkles, Cpu, Users, Cog, Handshake, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayToWinStrategy, RequiredCapability, CapabilityMilestone, CapabilityCategory } from '@/types/playToWin';
import { cn } from '@/lib/utils';

interface CapabilitiesStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
}

const categoryConfig: Record<CapabilityCategory, { label: string; icon: React.ReactNode; color: string }> = {
  technology: { label: 'Tecnología', icon: <Cpu className="h-4 w-4" />, color: 'bg-blue-500' },
  talent: { label: 'Talento', icon: <Users className="h-4 w-4" />, color: 'bg-green-500' },
  processes: { label: 'Procesos', icon: <Cog className="h-4 w-4" />, color: 'bg-purple-500' },
  alliances: { label: 'Alianzas', icon: <Handshake className="h-4 w-4" />, color: 'bg-orange-500' }
};

export default function CapabilitiesStep({ strategy, onUpdate, isSaving }: CapabilitiesStepProps) {
  const { t } = useTranslation();
  const [capabilities, setCapabilities] = useState<RequiredCapability[]>(strategy.requiredCapabilities || []);
  const [roadmap, setRoadmap] = useState<CapabilityMilestone[]>(strategy.capabilityRoadmap || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    
    await onUpdate({
      requiredCapabilities: capabilities,
      capabilityRoadmap: roadmap
    });
    setHasChanges(false);
  }, [capabilities, roadmap, hasChanges, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasChanges) saveChanges();
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  // Capability handlers
  const addCapability = (category: CapabilityCategory) => {
    setCapabilities([...capabilities, {
      id: crypto.randomUUID(),
      name: '',
      category,
      currentLevel: 2,
      targetLevel: 4,
      gap: 2,
      actions: []
    }]);
    setHasChanges(true);
  };

  const updateCapability = (id: string, field: keyof RequiredCapability, value: any) => {
    setCapabilities(capabilities.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      // Recalculate gap
      if (field === 'currentLevel' || field === 'targetLevel') {
        updated.gap = updated.targetLevel - updated.currentLevel;
      }
      return updated;
    }));
    setHasChanges(true);
  };

  const addCapabilityAction = (id: string, action: string) => {
    if (!action.trim()) return;
    setCapabilities(capabilities.map(c => 
      c.id === id ? { ...c, actions: [...c.actions, action.trim()] } : c
    ));
    setHasChanges(true);
  };

  const removeCapabilityAction = (id: string, actionIndex: number) => {
    setCapabilities(capabilities.map(c => 
      c.id === id ? { ...c, actions: c.actions.filter((_, i) => i !== actionIndex) } : c
    ));
    setHasChanges(true);
  };

  const removeCapability = (id: string) => {
    setCapabilities(capabilities.filter(c => c.id !== id));
    setRoadmap(roadmap.filter(r => r.capabilityId !== id));
    setHasChanges(true);
  };

  // Roadmap handlers
  const addMilestone = (capabilityId: string) => {
    setRoadmap([...roadmap, {
      id: crypto.randomUUID(),
      capabilityId,
      milestone: '',
      targetDate: '',
      status: 'pending'
    }]);
    setHasChanges(true);
  };

  const updateMilestone = (id: string, field: keyof CapabilityMilestone, value: any) => {
    setRoadmap(roadmap.map(r => r.id === id ? { ...r, [field]: value } : r));
    setHasChanges(true);
  };

  const removeMilestone = (id: string) => {
    setRoadmap(roadmap.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const getLevelLabel = (level: number) => {
    const labels = ['', 'Básico', 'En Desarrollo', 'Competente', 'Avanzado', 'Experto'];
    return labels[level] || '';
  };

  const getGapColor = (gap: number) => {
    if (gap <= 0) return 'text-green-600';
    if (gap === 1) return 'text-yellow-600';
    if (gap === 2) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Wrench className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Paso 4: Capabilities</CardTitle>
              <CardDescription className="text-base mt-1">
                Identifica las capacidades que necesitas desarrollar para ejecutar 
                tu estrategia y ganar en los mercados elegidos.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar con IA
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="matrix" className="gap-2">
            <Wrench className="h-4 w-4" />
            Matriz de Capacidades
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2">
            <Calendar className="h-4 w-4" />
            Roadmap
          </TabsTrigger>
        </TabsList>

        {/* Capabilities Matrix Tab */}
        <TabsContent value="matrix" className="space-y-6">
          {/* Add capability buttons */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Añadir Capacidad por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(categoryConfig) as CapabilityCategory[]).map((cat) => (
                  <Button
                    key={cat}
                    variant="outline"
                    size="sm"
                    onClick={() => addCapability(cat)}
                    className="gap-2"
                  >
                    {categoryConfig[cat].icon}
                    {categoryConfig[cat].label}
                    <Plus className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Capabilities by category */}
          {(Object.keys(categoryConfig) as CapabilityCategory[]).map((category) => {
            const categoryCapabilities = capabilities.filter(c => c.category === category);
            if (categoryCapabilities.length === 0) return null;

            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={cn("p-1.5 rounded", categoryConfig[category].color, "text-white")}>
                      {categoryConfig[category].icon}
                    </div>
                    {categoryConfig[category].label}
                    <Badge variant="secondary" className="ml-2">
                      {categoryCapabilities.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryCapabilities.map((cap) => (
                    <div key={cap.id} className="p-4 bg-muted/30 rounded-lg space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Label className="text-xs">Nombre de la Capacidad</Label>
                          <Input
                            value={cap.name}
                            onChange={(e) => updateCapability(cap.id, 'name', e.target.value)}
                            placeholder="Ej: Machine Learning aplicado"
                            className="mt-1"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCapability(cap.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Level sliders */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <Label className="text-xs">Nivel Actual</Label>
                            <span className="text-xs font-medium">{getLevelLabel(cap.currentLevel)}</span>
                          </div>
                          <Slider
                            value={[cap.currentLevel]}
                            onValueChange={([v]) => updateCapability(cap.id, 'currentLevel', v)}
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1</span>
                            <span>2</span>
                            <span>3</span>
                            <span>4</span>
                            <span>5</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <Label className="text-xs">Nivel Objetivo</Label>
                            <span className="text-xs font-medium">{getLevelLabel(cap.targetLevel)}</span>
                          </div>
                          <Slider
                            value={[cap.targetLevel]}
                            onValueChange={([v]) => updateCapability(cap.id, 'targetLevel', v)}
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1</span>
                            <span>2</span>
                            <span>3</span>
                            <span>4</span>
                            <span>5</span>
                          </div>
                        </div>
                      </div>

                      {/* Gap indicator */}
                      <div className="flex items-center gap-2 p-2 bg-background rounded">
                        <span className="text-sm text-muted-foreground">Gap:</span>
                        <span className={cn("font-bold", getGapColor(cap.gap))}>
                          {cap.gap > 0 ? `+${cap.gap} niveles` : cap.gap === 0 ? 'Sin gap ✓' : 'Excede objetivo'}
                        </span>
                      </div>

                      {/* Actions to close gap */}
                      <div className="space-y-2">
                        <Label className="text-xs">Acciones para cerrar el gap</Label>
                        <div className="flex flex-wrap gap-2">
                          {cap.actions.map((action, i) => (
                            <Badge key={i} variant="secondary" className="gap-1">
                              {action}
                              <button
                                onClick={() => removeCapabilityAction(cap.id, i)}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ej: Contratar 2 ingenieros ML"
                            className="text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addCapabilityAction(cap.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {capabilities.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aún no has definido capacidades requeridas</p>
                  <p className="text-sm mt-1">Usa los botones arriba para añadir por categoría</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          {capabilities.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Primero define capacidades en la pestaña anterior</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            capabilities.map((cap) => {
              const capMilestones = roadmap.filter(r => r.capabilityId === cap.id);
              
              return (
                <Card key={cap.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded", categoryConfig[cap.category].color, "text-white")}>
                          {categoryConfig[cap.category].icon}
                        </div>
                        <CardTitle className="text-lg">{cap.name || 'Sin nombre'}</CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addMilestone(cap.id)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Hito
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {capMilestones.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Sin hitos definidos
                      </p>
                    ) : (
                      capMilestones.map((milestone, index) => (
                        <div key={milestone.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input
                              value={milestone.milestone}
                              onChange={(e) => updateMilestone(milestone.id, 'milestone', e.target.value)}
                              placeholder="Descripción del hito"
                              className="col-span-1 sm:col-span-2"
                            />
                            <Input
                              type="date"
                              value={milestone.targetDate}
                              onChange={(e) => updateMilestone(milestone.id, 'targetDate', e.target.value)}
                            />
                          </div>
                          <Select
                            value={milestone.status}
                            onValueChange={(v) => updateMilestone(milestone.id, 'status', v)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏳ Pendiente</SelectItem>
                              <SelectItem value="in_progress">🔄 En progreso</SelectItem>
                              <SelectItem value="completed">✅ Completado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
