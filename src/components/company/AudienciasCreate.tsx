import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Target, ArrowRight, Sparkles, Loader2 } from "lucide-react";

interface AudienciasCreateProps {
  profile: any;
  onSuccess?: () => void;
}

const AudienciasCreate = ({ profile, onSuccess }: AudienciasCreateProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(profile?.user_id || null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [socialStats, setSocialStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

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
          await Promise.all([
            loadCompanyData(uid),
            loadSocialStats(uid),
          ]);
        }
      } catch (e) {
        console.error('Error inicializando:', e);
      }
    };
    init();
  }, [profile?.user_id, userId]);

  const loadCompanyData = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;

    try {
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', resolvedUid)
        .single();

      if (memberData) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', memberData.company_id)
          .single();
        
        setCompanyData(company);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const loadSocialStats = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;
    
    try {
      const { data: existingAnalyses, error } = await supabase
        .from('social_analysis')
        .select('*')
        .eq('user_id', resolvedUid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (existingAnalyses && existingAnalyses.length > 0) {
        setSocialStats(existingAnalyses);
      }
    } catch (error) {
      console.error('Error loading social stats:', error);
    }
  };

  const handleGenerateAIAudiences = async () => {
    if (!userId || !companyData?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información de la empresa",
        variant: "destructive"
      });
      return;
    }

    setAiGenerating(true);
    try {
      console.log('🤖 Iniciando generación de audiencias con IA...');
      
      const { data, error } = await supabase.functions.invoke('ai-audience-generator', {
        body: {
          user_id: userId,
          company_id: companyData.id
        }
      });

      if (error) {
        console.error('Error en la función de IA:', error);
        throw error;
      }

      console.log('✅ Respuesta de la IA:', data);

      if (data.success && data.audiences?.length > 0) {
        toast({
          title: "Audiencias Generadas con IA",
          description: `Se crearon ${data.generated_count} audiencias basadas en tu análisis`,
        });
        
        // Navigate back to manager to see the new audiences
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/company-dashboard?view=audiencias-manager');
        }
      } else {
        throw new Error(data.error || 'No se pudieron generar audiencias');
      }

    } catch (error) {
      console.error('Error generando audiencias con IA:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar audiencias con IA. Verifica que tengas análisis de audiencias disponibles.",
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setLoading(true);
    try {
      const audienceData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        user_id: userId,
        company_id: companyData?.id,
        estimated_size: parseInt(formData.get('estimatedSize') as string) || 0,
        goals: (formData.get('goals') as string)?.split(',').map(g => g.trim()).filter(Boolean) || [],
        pain_points: (formData.get('painPoints') as string)?.split(',').map(p => p.trim()).filter(Boolean) || [],
        ai_insights: {
          createdManually: true,
          basedOnRadiography: socialStats.length > 0,
          sourceData: socialStats.map(s => s.social_type),
          createdAt: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('company_audiences')
        .insert(audienceData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Audiencia Creada",
        description: `Se creó la audiencia "${audienceData.name}" exitosamente`,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate back to main view
        navigate('/company-dashboard?view=audiencias-manager');
      }
    } catch (error) {
      console.error('Error creating audience:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la audiencia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const mainProfile = socialStats[0] || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/company-dashboard?view=audiencias-manager')}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold">Crear Nueva Audiencia</h2>
        </div>
        
        <Button
          onClick={handleGenerateAIAudiences}
          disabled={aiGenerating || !companyData}
          size="lg"
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          {aiGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-semibold">Generando con IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">✨ Generar con IA</span>
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nombre de la Audiencia</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Ej: Emprendedores Tecnológicos" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="estimatedSize">Tamaño Estimado</Label>
                <Input 
                  id="estimatedSize" 
                  name="estimatedSize" 
                  type="number" 
                  placeholder="1000" 
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe las características principales de esta audiencia..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="goals">Objetivos (separados por comas)</Label>
                <Textarea 
                  id="goals" 
                  name="goals" 
                  placeholder="Innovación, Productividad, Crecimiento..."
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="painPoints">Puntos de Dolor (separados por comas)</Label>
                <Textarea 
                  id="painPoints" 
                  name="painPoints" 
                  placeholder="Falta de tiempo, Recursos limitados..."
                  rows={2}
                />
              </div>
            </div>

            {socialStats.length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Datos Disponibles del Análisis
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tienes análisis de {socialStats.length} red{socialStats.length > 1 ? 'es' : ''} social{socialStats.length > 1 ? 'es' : ''} que puedes usar como referencia:
                  </p>
                  <div className="space-y-2 text-sm">
                    {mainProfile.countries && mainProfile.countries.length > 0 && (
                      <p>• <strong>Países principales:</strong> {mainProfile.countries.slice(0, 3).map((c: any) => c.name).join(', ')}</p>
                    )}
                    {mainProfile.genders && mainProfile.genders.length > 0 && (
                      <p>• <strong>Género predominante:</strong> {mainProfile.genders[0].code === 'MALE' ? 'Masculino' : 'Femenino'} ({mainProfile.genders[0].percentage?.toFixed(1)}%)</p>
                    )}
                    {mainProfile.interests && mainProfile.interests.length > 0 && (
                      <p>• <strong>Intereses:</strong> {mainProfile.interests.slice(0, 5).map((i: any) => i.name).join(', ')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    Crear Audiencia
                  </>
                )}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => navigate('/company-dashboard?view=audiencias-manager')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudienciasCreate;
