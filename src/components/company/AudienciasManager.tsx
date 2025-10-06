import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Brain, 
  Target, 
  TrendingUp, 
  Eye,
  Settings,
  X,
  Plus,
  ArrowRight,
  Lightbulb,
  BarChart3
} from "lucide-react";

interface AudienciasManagerProps {
  profile: any;
}

interface AudienceSegment {
  id: string;
  name: string;
  description?: string;
  estimated_size?: number;
  confidence_score?: number;
  conversion_potential?: number;
  lifetime_value_estimate?: number;
  acquisition_cost_estimate?: number;
  goals?: string[];
  pain_points?: string[];
  ai_insights?: any;
  created_at: string;
}

const AudienciasManager = ({ profile }: AudienciasManagerProps) => {
  const { t } = useTranslation('marketing');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(profile?.user_id || null);
  const [audiences, setAudiences] = useState<AudienceSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<AudienceSegment | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        let uid = profile?.user_id || userId;
        if (!uid) {
          const { data: { session } } = await supabase.auth.getSession();
          uid = session?.user?.id || null;
          if (uid) setUserId(uid);
        }
        
        if (uid) {
          await loadAudiences(uid);
        }
      } catch (e) {
        console.error('Error inicializando:', e);
      }
    };
    init();
  }, [profile?.user_id, userId]);

  const loadAudiences = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_audiences')
        .select('*')
        .eq('user_id', resolvedUid)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudiences(data || []);
    } catch (error) {
      console.error('Error loading audiences:', error);
      toast({
        title: t('common:status.error'),
        description: t('audiences.error'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAudience = async (audienceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta audiencia?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('company_audiences')
        .delete()
        .eq('id', audienceId)
        .eq('user_id', userId);

      if (error) throw error;

      setAudiences(audiences.filter(a => a.id !== audienceId));
      toast({
        title: "Audiencia Eliminada",
        description: "La audiencia se eliminó exitosamente",
      });
    } catch (error) {
      console.error('Error deleting audience:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la audiencia",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">🎯 Gestor de Audiencias</h2>
          <p className="text-muted-foreground mt-1">
            Administra y crea segmentos de audiencia para tus campañas de marketing
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/company-dashboard?view=audiencias-analysis')}
            variant="outline"
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Análisis de Audiencias
          </Button>
          
          <Button 
            onClick={() => navigate('/company-dashboard?view=audiencias-create')}
            className="gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4" />
            Nueva Audiencia
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Audiencias</p>
                <p className="text-2xl font-bold">{audiences.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alcance Total Estimado</p>
                <p className="text-2xl font-bold">
                  {(audiences.reduce((acc, a) => acc + (a.estimated_size || 0), 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor de Vida Promedio</p>
                <p className="text-2xl font-bold">
                  ${audiences.length > 0 ? (audiences.reduce((acc, a) => acc + (a.lifetime_value_estimate || 0), 0) / audiences.length).toFixed(0) : 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : audiences.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Crea tu Primera Audiencia</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Define segmentos de audiencia para personalizar tus campañas de marketing y aumentar la efectividad de tu mensaje.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button 
                onClick={() => navigate('/company-dashboard?view=audiencias-analysis')}
                variant="outline"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analizar Audiencias Primero
              </Button>
              <Button 
                onClick={() => navigate('/company-dashboard?view=audiencias-create')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Audiencia
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tus Audiencias ({audiences.length})</h3>
          
          <div className="grid gap-4">
            {audiences.map((audience) => (
              <Card key={audience.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold">{audience.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {audience.estimated_size && (
                                <span>{audience.estimated_size.toLocaleString()} usuarios estimados</span>
                              )}
                              {audience.confidence_score && (
                                <span>Confianza: {Math.round(audience.confidence_score * 100)}%</span>
                              )}
                              <span>Creado: {new Date(audience.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {audience.description && (
                        <p className="text-muted-foreground mb-4">{audience.description}</p>
                      )}
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {audience.goals?.map((goal, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            🎯 {goal}
                          </Badge>
                        ))}
                        {audience.pain_points?.slice(0, 2).map((point, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            ⚠️ {point}
                          </Badge>
                        ))}
                        {audience.ai_insights?.generatedFrom && (
                          <Badge variant="default" className="text-xs">
                            🤖 Generado por IA
                          </Badge>
                        )}
                      </div>
                      
                      {/* Performance Indicators */}
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-green-600">
                            {audience.conversion_potential ? Math.round(audience.conversion_potential * 100) : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">Potencial de Conversión</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-blue-600">
                            ${(audience.lifetime_value_estimate || 0).toFixed(0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Valor de Vida Estimado</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-orange-600">
                            ${(audience.acquisition_cost_estimate || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Costo de Adquisición</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-6">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAudience(audience)}
                        className="gap-2 whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteAudience(audience.id)}
                        className="gap-2 whitespace-nowrap"
                      >
                        <X className="w-4 h-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {selectedAudience && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAudience(null)}>
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedAudience.name}</h3>
                  <p className="text-muted-foreground mt-1">{selectedAudience.description}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAudience(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {selectedAudience.goals && selectedAudience.goals.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Objetivos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAudience.goals.map((goal, idx) => (
                        <Badge key={idx} variant="secondary">🎯 {goal}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedAudience.pain_points && selectedAudience.pain_points.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Puntos de Dolor</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAudience.pain_points.map((point, idx) => (
                        <Badge key={idx} variant="outline">⚠️ {point}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedAudience.ai_insights && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Información de IA
                    </h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedAudience.ai_insights, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AudienciasManager;
