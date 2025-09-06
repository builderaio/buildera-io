import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Edit3, 
  Sparkles, 
  Target, 
  Zap,
  CheckCircle,
  Loader2,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

interface MarketingStrategyProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

export const MarketingStrategy = ({ campaignData, onComplete, loading }: MarketingStrategyProps) => {
  const [strategy, setStrategy] = useState(null);
  const [editedStrategy, setEditedStrategy] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const generateStrategy = async () => {
    if (!campaignData.company || !campaignData.audience) {
      toast({
        title: "Datos insuficientes",
        description: "Necesitamos la información de empresa y audiencia para generar la estrategia",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const strategyInput = {
        ...campaignData.company,
        objetivo_campana: campaignData.objective?.goal || '',
        audiencia_objetivo: {
          buyer_personas: campaignData.audience?.buyer_personas || []
        }
      };

      const { data, error } = await supabase.functions.invoke('marketing-hub-marketing-strategy', {
        body: { input: strategyInput }
      });

      if (error) throw error;

      setStrategy(data);
      setEditedStrategy(
        typeof data.estrategia === 'string' 
          ? data.estrategia 
          : JSON.stringify(data.estrategia, null, 2)
      );
      
      toast({
        title: "¡Estrategia generada!",
        description: "Tu estrategia de marketing personalizada está lista",
      });
    } catch (error: any) {
      toast({
        title: "Error al generar estrategia",
        description: error.message || "No se pudo generar la estrategia",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = () => {
    if (!strategy) {
      toast({
        title: "Estrategia requerida",
        description: "Primero debes generar la estrategia de marketing",
        variant: "destructive"
      });
      return;
    }

    const strategyData = {
      ...strategy,
      edited_strategy: isEditing ? editedStrategy : undefined,
      final_strategy: isEditing ? editedStrategy : (
        typeof strategy.estrategia === 'string' 
          ? strategy.estrategia 
          : JSON.stringify(strategy.estrategia, null, 2)
      )
    };

    onComplete(strategyData);
  };

  const canProceed = strategy && !generating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-purple-800">
            <BarChart3 className="h-6 w-6" />
            Estrategia de Marketing Personalizada
          </CardTitle>
          <p className="text-purple-600">
            Genera una estrategia basada en tu audiencia y objetivos, personalízala según tus necesidades
          </p>
        </CardHeader>
      </Card>

      {/* Campaign Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Resumen de tu Campaña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">OBJETIVO</h4>
              <p className="text-sm">{campaignData.objective?.goal || 'No definido'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">EMPRESA</h4>
              <p className="text-sm">{campaignData.company?.nombre_empresa || 'No definido'}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">AUDIENCIAS IDENTIFICADAS</h4>
              <div className="flex flex-wrap gap-2">
                {campaignData.audience?.buyer_personas?.slice(0, 3).map((persona: any, index: number) => (
                  <Badge key={index} variant="outline">
                    {persona.nombre_ficticio}
                  </Badge>
                )) || <span className="text-sm text-muted-foreground">No identificadas</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Strategy */}
      {!strategy && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Genera tu Estrategia con IA</h3>
              <p className="text-muted-foreground">
                Basándose en tu audiencia objetivo y objetivos, crearemos una estrategia de marketing personalizada y efectiva.
              </p>
              <Button 
                onClick={generateStrategy}
                disabled={generating || loading}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generando Estrategia...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generar Estrategia con IA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Strategy */}
      {strategy && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <CheckCircle className="h-5 w-5" />
                Estrategia Generada
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                {isEditing ? 'Vista Previa' : 'Editar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Strategy Content */}
            <div>
              {isEditing ? (
                <div>
                  <Label htmlFor="strategy-edit">Personaliza tu Estrategia</Label>
                  <Textarea
                    id="strategy-edit"
                    value={editedStrategy}
                    onChange={(e) => setEditedStrategy(e.target.value)}
                    className="mt-2 min-h-[400px] font-mono text-sm"
                    placeholder="Edita tu estrategia aquí..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Personaliza la estrategia según tus necesidades específicas
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {isEditing ? editedStrategy : (
                        typeof strategy.estrategia === 'string' 
                          ? strategy.estrategia 
                          : JSON.stringify(strategy.estrategia, null, 2)
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Key Tactics */}
            {strategy.funnel_tactics && (
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tácticas del Funnel
                </h4>
                <div className="grid gap-3">
                  {strategy.funnel_tactics.slice(0, 5).map((tactic: any, index: number) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-1 rounded">
                          <Lightbulb className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h5 className="font-medium">{tactic.fase || `Táctica ${index + 1}`}</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            {tactic.descripcion || tactic}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Complete Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!canProceed || loading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8"
          size="lg"
        >
          {loading ? 'Guardando...' : 'Continuar con Calendario de Contenido'}
        </Button>
      </div>
    </div>
  );
};