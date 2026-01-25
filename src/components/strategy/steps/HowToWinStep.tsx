import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Plus, Trash2, Sparkles, HelpCircle, Shield, Star, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayToWinStrategy, DifferentiationFactor, MoatType, ValuePropositionCanvas } from '@/types/playToWin';
import { cn } from '@/lib/utils';

interface HowToWinStepProps {
  strategy: PlayToWinStrategy;
  companyId: string;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
}

const moatTypes: { id: MoatType; label: string; description: string; icon: string }[] = [
  { 
    id: 'cost', 
    label: 'Liderazgo en Costos', 
    description: 'Ofrecer el precio más bajo del mercado con economías de escala',
    icon: '💰'
  },
  { 
    id: 'differentiation', 
    label: 'Diferenciación', 
    description: 'Producto o servicio único que los clientes valoran y pagan premium',
    icon: '✨'
  },
  { 
    id: 'focus', 
    label: 'Enfoque / Nicho', 
    description: 'Especialización profunda en un segmento específico del mercado',
    icon: '🎯'
  },
  { 
    id: 'network_effects', 
    label: 'Efectos de Red', 
    description: 'El producto se vuelve más valioso mientras más usuarios lo usan',
    icon: '🌐'
  }
];

const emptyCanvas: ValuePropositionCanvas = {
  customerJobs: [],
  pains: [],
  gains: [],
  products: [],
  painRelievers: [],
  gainCreators: []
};

export default function HowToWinStep({ strategy, companyId, onUpdate, isSaving }: HowToWinStepProps) {
  const { t } = useTranslation();
  const [advantage, setAdvantage] = useState(strategy.competitiveAdvantage || '');
  const [factors, setFactors] = useState<DifferentiationFactor[]>(strategy.differentiationFactors || []);
  const [moatType, setMoatType] = useState<MoatType | null>(strategy.moatType);
  const [canvas, setCanvas] = useState<ValuePropositionCanvas>(strategy.valuePropositionCanvas || emptyCanvas);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    
    await onUpdate({
      competitiveAdvantage: advantage,
      differentiationFactors: factors,
      moatType,
      valuePropositionCanvas: canvas
    });
    setHasChanges(false);
  }, [advantage, factors, moatType, canvas, hasChanges, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasChanges) saveChanges();
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleAdvantageChange = (value: string) => {
    setAdvantage(value);
    setHasChanges(true);
  };

  const handleMoatChange = (value: MoatType) => {
    setMoatType(value);
    setHasChanges(true);
  };

  // Factor handlers
  const addFactor = () => {
    setFactors([...factors, {
      id: crypto.randomUUID(),
      factor: '',
      description: '',
      evidence: ''
    }]);
    setHasChanges(true);
  };

  const updateFactor = (id: string, field: keyof DifferentiationFactor, value: string) => {
    setFactors(factors.map(f => f.id === id ? { ...f, [field]: value } : f));
    setHasChanges(true);
  };

  const removeFactor = (id: string) => {
    setFactors(factors.filter(f => f.id !== id));
    setHasChanges(true);
  };

  // Canvas handlers
  const addCanvasItem = (field: keyof ValuePropositionCanvas, value: string) => {
    if (!value.trim()) return;
    setCanvas({
      ...canvas,
      [field]: [...canvas[field], value.trim()]
    });
    setHasChanges(true);
  };

  const removeCanvasItem = (field: keyof ValuePropositionCanvas, index: number) => {
    setCanvas({
      ...canvas,
      [field]: canvas[field].filter((_, i) => i !== index)
    });
    setHasChanges(true);
  };

  const CanvasSection = ({ 
    field, 
    label, 
    placeholder,
    color 
  }: { 
    field: keyof ValuePropositionCanvas; 
    label: string; 
    placeholder: string;
    color: string;
  }) => {
    const [inputValue, setInputValue] = useState('');
    
    return (
      <div className={cn("p-3 rounded-lg", color)}>
        <Label className="text-xs font-medium">{label}</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="text-sm h-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addCanvasItem(field, inputValue);
                setInputValue('');
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => {
              addCanvasItem(field, inputValue);
              setInputValue('');
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {canvas[field].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs bg-background/50 px-2 py-1 rounded"
            >
              {item}
              <button
                onClick={() => removeCanvasItem(field, i)}
                className="hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Paso 3: How to Win</CardTitle>
              <CardDescription className="text-base mt-1">
                Define tu ventaja competitiva sostenible. ¿Por qué los clientes 
                te elegirán a ti sobre la competencia?
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar con IA
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="advantage" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="advantage" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Ventaja</span>
          </TabsTrigger>
          <TabsTrigger value="differentiation" className="gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Diferenciación</span>
          </TabsTrigger>
          <TabsTrigger value="canvas" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Value Canvas</span>
          </TabsTrigger>
        </TabsList>

        {/* Competitive Advantage Tab */}
        <TabsContent value="advantage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Tu Ventaja Competitiva
              </CardTitle>
              <CardDescription>
                Articula claramente por qué los clientes te elegirán
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={advantage}
                onChange={(e) => handleAdvantageChange(e.target.value)}
                placeholder="Nuestra ventaja competitiva radica en... lo que nos hace únicos es... los clientes nos eligen porque..."
                className="min-h-[120px]"
              />
              <div className="flex items-center justify-between text-sm">
                <span className={cn(
                  advantage.length >= 50 ? "text-green-600" : "text-muted-foreground"
                )}>
                  {advantage.length}/50 caracteres mínimos
                </span>
                {isSaving && <span className="text-muted-foreground">Guardando...</span>}
              </div>
            </CardContent>
          </Card>

          {/* Moat Type */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Tipo de Moat (Foso Defensivo)</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>El "moat" es la barrera que protege tu negocio de la competencia. 
                         Según Michael Porter, hay 3 estrategias genéricas más los efectos de red.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                ¿Cuál es tu estrategia competitiva principal?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moatTypes.map((moat) => (
                  <button
                    key={moat.id}
                    onClick={() => handleMoatChange(moat.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      moatType === moat.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{moat.icon}</span>
                      <div>
                        <div className="font-semibold">{moat.label}</div>
                        <div className="text-sm text-muted-foreground">{moat.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Differentiation Factors Tab */}
        <TabsContent value="differentiation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Factores de Diferenciación</CardTitle>
                  <CardDescription>
                    ¿Qué te hace único? Lista los factores clave con evidencia
                  </CardDescription>
                </div>
                <Button onClick={addFactor} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Factor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {factors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Añade los factores que te diferencian</p>
                  <Button onClick={addFactor} variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir tu primer factor
                  </Button>
                </div>
              ) : (
                factors.map((factor) => (
                  <div key={factor.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-xs">Factor Diferenciador</Label>
                          <Input
                            value={factor.factor}
                            onChange={(e) => updateFactor(factor.id, 'factor', e.target.value)}
                            placeholder="Ej: Tecnología propietaria de IA"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Descripción</Label>
                          <Textarea
                            value={factor.description}
                            onChange={(e) => updateFactor(factor.id, 'description', e.target.value)}
                            placeholder="Describe cómo este factor te diferencia..."
                            className="mt-1 min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Evidencia / Prueba</Label>
                          <Input
                            value={factor.evidence}
                            onChange={(e) => updateFactor(factor.id, 'evidence', e.target.value)}
                            placeholder="Ej: 3 patentes registradas, 95% satisfacción cliente"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFactor(factor.id)}
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

        {/* Value Proposition Canvas Tab */}
        <TabsContent value="canvas">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Value Proposition Canvas</CardTitle>
              <CardDescription>
                Mapea cómo tu producto/servicio resuelve problemas y crea valor para el cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Profile */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    👤 Perfil del Cliente
                  </h4>
                  <CanvasSection
                    field="customerJobs"
                    label="Tareas del Cliente"
                    placeholder="¿Qué intenta lograr?"
                    color="bg-blue-50 dark:bg-blue-950/30"
                  />
                  <CanvasSection
                    field="pains"
                    label="Dolores / Frustraciones"
                    placeholder="¿Qué le molesta?"
                    color="bg-red-50 dark:bg-red-950/30"
                  />
                  <CanvasSection
                    field="gains"
                    label="Ganancias Deseadas"
                    placeholder="¿Qué quiere lograr?"
                    color="bg-green-50 dark:bg-green-950/30"
                  />
                </div>

                {/* Value Map */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    📦 Mapa de Valor
                  </h4>
                  <CanvasSection
                    field="products"
                    label="Productos / Servicios"
                    placeholder="¿Qué ofreces?"
                    color="bg-purple-50 dark:bg-purple-950/30"
                  />
                  <CanvasSection
                    field="painRelievers"
                    label="Aliviadores de Dolor"
                    placeholder="¿Cómo eliminas frustraciones?"
                    color="bg-orange-50 dark:bg-orange-950/30"
                  />
                  <CanvasSection
                    field="gainCreators"
                    label="Creadores de Ganancia"
                    placeholder="¿Cómo generas beneficios?"
                    color="bg-teal-50 dark:bg-teal-950/30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
