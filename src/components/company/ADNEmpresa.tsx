import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Target, 
  Palette, 
  Globe, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Bot,
  Lightbulb,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music,
  Linkedin,
  RefreshCw,
  Save,
  Edit3,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const ADNEmpresa = ({ profile, onProfileUpdate }: ADNEmpresaProps) => {
  const { toast } = useToast();
  
  // Estados para el onboarding
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  
  // Estados para los datos
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [strategyData, setStrategyData] = useState({
    vision: "",
    mission: "",
    propuesta_valor: ""
  });
  const [brandingData, setBrandingData] = useState({
    primary_color: "",
    secondary_color: "",
    complementary_color_1: "",
    complementary_color_2: "",
    visual_identity: ""
  });
  const [objectives, setObjectives] = useState<any[]>([]);
  const [socialConnections, setSocialConnections] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: ""
  });

  // Estados para edición
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [generatingObjectives, setGeneratingObjectives] = useState(false);
  const [generatedObjectives, setGeneratedObjectives] = useState<any[]>([]);
  const [showGeneratedObjectives, setShowGeneratedObjectives] = useState(false);

  const totalSteps = 6;

  useEffect(() => {
    if (profile?.user_id) {
      fetchAllData();
      checkOnboardingStatus();
    }
  }, [profile?.user_id]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchCompanyData(),
      fetchStrategy(),
      fetchBranding(),
      fetchObjectives(),
      fetchSocialConnections()
    ]);
  };

  const fetchCompanyData = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (companies && companies.length > 0) {
        setCompanyData(companies[0]);
        setTempDescription(companies[0].descripcion_empresa || "");
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
    }
  };

  const fetchStrategy = async () => {
    try {
      const { data, error } = await supabase
        .from('company_strategy')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const strategy = data[0];
        setStrategyData({
          vision: strategy.vision || "",
          mission: strategy.mision || "",
          propuesta_valor: strategy.propuesta_valor || ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching strategy:', error);
    }
  };

  const fetchBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('user_id', profile?.user_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBrandingData({
          primary_color: data.primary_color || "",
          secondary_color: data.secondary_color || "",
          complementary_color_1: data.complementary_color_1 || "",
          complementary_color_2: data.complementary_color_2 || "",
          visual_identity: data.visual_identity || ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching branding:', error);
    }
  };

  const fetchObjectives = async () => {
    try {
      const { data, error } = await supabase
        .from('company_objectives')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setObjectives(data || []);
    } catch (error: any) {
      console.error('Error fetching objectives:', error);
    }
  };

  const fetchSocialConnections = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (companies && companies.length > 0) {
        const company = companies[0];
        setSocialConnections({
          facebook: company.facebook_url || "",
          instagram: company.instagram_url || "",
          twitter: company.twitter_url || "",
          youtube: company.youtube_url || "",
          tiktok: company.tiktok_url || "",
          linkedin: company.linkedin_url || ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching social connections:', error);
    }
  };

  const checkOnboardingStatus = () => {
    // Verificar qué pasos están completos
    const completed = [];
    
    // Paso 1: Siempre completado (bienvenida)
    completed.push(1);
    
    // Paso 2: Descripción del negocio
    if (companyData?.descripcion_empresa) completed.push(2);
    
    // Paso 3: Estrategia
    if (strategyData.vision && strategyData.mission && strategyData.propuesta_valor) completed.push(3);
    
    // Paso 4: Objetivos
    if (objectives.length > 0) completed.push(4);
    
    // Paso 5: Branding
    if (brandingData.primary_color || brandingData.visual_identity) completed.push(5);
    
    // Paso 6: Redes sociales
    if (Object.values(socialConnections).some(url => url.trim())) completed.push(6);
    
    setCompletedSteps(completed);
    setIsOnboardingComplete(completed.length === totalSteps);
    
    // Si no se ha completado el onboarding, ir al primer paso incompleto
    if (!isOnboardingComplete) {
      const nextIncompleteStep = Array.from({length: totalSteps}, (_, i) => i + 1)
        .find(step => !completed.includes(step));
      if (nextIncompleteStep) setCurrentStep(nextIncompleteStep);
    }
  };

  const generateStrategyWithAI = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-company-content', {
        body: {
          companyName: profile?.company_name || companyData?.name,
          industryType: profile?.industry_sector || companyData?.industry_sector,
          companySize: profile?.company_size || companyData?.company_size,
          websiteUrl: profile?.website_url || companyData?.website_url,
          description: companyData?.descripcion_empresa
        }
      });

      if (error) throw error;

      if (data?.strategy) {
        setStrategyData({
          vision: data.strategy.vision || "",
          mission: data.strategy.mission || "",
          propuesta_valor: data.strategy.value_proposition || ""
        });

        // Guardar en la base de datos
        await saveStrategy({
          vision: data.strategy.vision || "",
          mission: data.strategy.mission || "",
          propuesta_valor: data.strategy.value_proposition || ""
        });

        toast({
          title: "Estrategia generada",
          description: "ERA ha generado automáticamente tu estrategia empresarial.",
        });
      }
    } catch (error: any) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la estrategia automáticamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateObjectivesWithAI = async () => {
    setGeneratingObjectives(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-company-content', {
        body: {
          companyName: profile?.company_name || companyData?.name,
          industryType: profile?.industry_sector || companyData?.industry_sector,
          companySize: profile?.company_size || companyData?.company_size,
          websiteUrl: profile?.website_url || companyData?.website_url,
          description: companyData?.descripcion_empresa,
          mission: strategyData.mission,
          vision: strategyData.vision,
          valueProposition: strategyData.propuesta_valor,
          generateObjectives: true
        }
      });

      if (error) throw error;

      if (data?.objectives) {
        setGeneratedObjectives(data.objectives);
        setShowGeneratedObjectives(true);

        toast({
          title: "Objetivos generados",
          description: "ERA ha identificado objetivos fundamentales para el crecimiento de tu negocio.",
        });
      }
    } catch (error: any) {
      console.error('Error generating objectives:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar objetivos automáticamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingObjectives(false);
    }
  };

  const generateBrandingWithAI = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-company-content', {
        body: {
          companyName: profile?.company_name || companyData?.name,
          industryType: profile?.industry_sector || companyData?.industry_sector,
          description: companyData?.descripcion_empresa,
          mission: strategyData.mission,
          vision: strategyData.vision,
          valueProposition: strategyData.propuesta_valor,
          generateBranding: true
        }
      });

      if (error) throw error;

      if (data?.branding) {
        setBrandingData({
          primary_color: data.branding.primary_color || "",
          secondary_color: data.branding.secondary_color || "",
          complementary_color_1: data.branding.complementary_color_1 || "",
          complementary_color_2: data.branding.complementary_color_2 || "",
          visual_identity: data.branding.visual_identity || ""
        });

        // Guardar en la base de datos
        await saveBranding(data.branding);

        toast({
          title: "Identidad de marca generada",
          description: "ERA ha definido automáticamente tu identidad visual.",
        });
      }
    } catch (error: any) {
      console.error('Error generating branding:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la identidad de marca automáticamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDescription = async () => {
    if (!companyData?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ descripcion_empresa: tempDescription })
        .eq('id', companyData.id);

      if (error) throw error;

      setCompanyData(prev => ({ ...prev, descripcion_empresa: tempDescription }));
      setEditingDescription(false);
      
      if (!completedSteps.includes(2)) {
        setCompletedSteps(prev => [...prev, 2]);
      }

      toast({
        title: "Descripción guardada",
        description: "La descripción de tu negocio ha sido actualizada.",
      });
    } catch (error: any) {
      console.error('Error saving description:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la descripción.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async (data = strategyData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('company_strategy')
        .upsert({
          user_id: profile?.user_id,
          vision: data.vision,
          mision: data.mission,
          propuesta_valor: data.propuesta_valor,
          generated_with_ai: true
        });

      if (error) throw error;

      if (!completedSteps.includes(3)) {
        setCompletedSteps(prev => [...prev, 3]);
      }

      toast({
        title: "Estrategia guardada",
        description: "Los fundamentos estratégicos han sido guardados.",
      });
    } catch (error: any) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la estrategia.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBranding = async (data = brandingData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('company_branding')
        .upsert({
          user_id: profile?.user_id,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          complementary_color_1: data.complementary_color_1,
          complementary_color_2: data.complementary_color_2,
          visual_identity: data.visual_identity
        });

      if (error) throw error;

      if (!completedSteps.includes(5)) {
        setCompletedSteps(prev => [...prev, 5]);
      }

      toast({
        title: "Identidad de marca guardada",
        description: "La información de tu marca ha sido guardada.",
      });
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información de marca.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptGeneratedObjectives = async () => {
    setLoading(true);
    try {
      const objectivesToSave = generatedObjectives.map(obj => ({
        user_id: profile?.user_id,
        title: obj.title,
        description: obj.description,
        objective_type: obj.type,
        priority: obj.priority,
        status: 'active'
      }));

      const { error } = await supabase
        .from('company_objectives')
        .insert(objectivesToSave);

      if (error) throw error;

      await fetchObjectives();
      setShowGeneratedObjectives(false);
      
      if (!completedSteps.includes(4)) {
        setCompletedSteps(prev => [...prev, 4]);
      }

      toast({
        title: "Objetivos guardados",
        description: "Los objetivos de negocio han sido guardados exitosamente.",
      });
    } catch (error: any) {
      console.error('Error saving objectives:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los objetivos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSocialConnections = async () => {
    if (!companyData?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          facebook_url: socialConnections.facebook,
          instagram_url: socialConnections.instagram,
          twitter_url: socialConnections.twitter,
          youtube_url: socialConnections.youtube,
          tiktok_url: socialConnections.tiktok,
          linkedin_url: socialConnections.linkedin
        })
        .eq('id', companyData.id);

      if (error) throw error;

      if (!completedSteps.includes(6)) {
        setCompletedSteps(prev => [...prev, 6]);
      }

      toast({
        title: "Redes sociales guardadas",
        description: "La configuración de redes sociales ha sido actualizada.",
      });
    } catch (error: any) {
      console.error('Error saving social connections:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de redes sociales.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Función para obtener el contenido del paso actual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Building2 className="w-16 h-16 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                ¡Hola {profile?.full_name?.split(' ')[0] || 'emprendedor'}! 👋
              </CardTitle>
              <p className="text-muted-foreground">
                Vamos a configurar el ADN de tu negocio paso a paso para que ERA pueda ayudarte mejor
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <Lightbulb className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">¿Por qué es importante?</h3>
                <p className="text-sm text-muted-foreground">
                  Al configurar correctamente tu información empresarial, ERA podrá generar contenido más relevante, 
                  estrategias personalizadas y recomendaciones precisas para hacer crecer tu negocio.
                </p>
              </div>
              <Button onClick={nextStep} className="w-full" size="lg">
                Comenzar configuración
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-6 h-6 mr-2 text-primary" />
                Descripción de tu negocio
              </CardTitle>
              <p className="text-muted-foreground">
                {companyData?.descripcion_empresa 
                  ? "Encontramos esta descripción de tu negocio. Revísala y ajústala si es necesario."
                  : "Cuéntanos sobre tu negocio para que ERA pueda entender mejor tu industria y objetivos."
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!editingDescription ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      {companyData?.descripcion_empresa || "No hay descripción disponible"}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setEditingDescription(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {companyData?.descripcion_empresa ? "Editar descripción" : "Agregar descripción"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción del negocio</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      placeholder="Describe tu negocio, los productos o servicios que ofreces, tu público objetivo y lo que te hace único..."
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={saveDescription}
                      disabled={loading || !tempDescription.trim()}
                      className="flex-1"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                    <Button 
                      onClick={() => {
                        setEditingDescription(false);
                        setTempDescription(companyData?.descripcion_empresa || "");
                      }}
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      ¿Por qué es relevante?
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Una descripción clara ayuda a ERA a generar contenido específico para tu industria, 
                      identificar oportunidades de mercado y crear estrategias de comunicación efectivas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!companyData?.descripcion_empresa}
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-6 h-6 mr-2 text-primary" />
                Tu estrategia es clave
              </CardTitle>
              <p className="text-muted-foreground">
                Definimos automáticamente los fundamentos estratégicos de tu negocio
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!strategyData.vision && !strategyData.mission && !strategyData.propuesta_valor ? (
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      ERA puede generar automáticamente tu estrategia empresarial basada en la información de tu negocio
                    </p>
                    <Button onClick={generateStrategyWithAI} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Bot className="w-4 h-4 mr-2" />
                      )}
                      Generar estrategia con ERA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <h3 className="font-medium text-green-900 dark:text-green-100">
                          Misión
                        </h3>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {strategyData.mission}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                          Visión
                        </h3>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {strategyData.vision}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                        <h3 className="font-medium text-purple-900 dark:text-purple-100">
                          Propuesta de Valor
                        </h3>
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {strategyData.propuesta_valor}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={generateStrategyWithAI} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar con ERA
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                      ¿Por qué es relevante?
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Los fundamentos estratégicos guían todas las decisiones de tu negocio y permiten a ERA 
                      alinear sus recomendaciones con tus objetivos a largo plazo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!strategyData.vision || !strategyData.mission || !strategyData.propuesta_valor}
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-6 h-6 mr-2 text-primary" />
                Objetivos de crecimiento
              </CardTitle>
              <p className="text-muted-foreground">
                Definamos los objetivos fundamentales para hacer crecer tu negocio
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showGeneratedObjectives && objectives.length === 0 ? (
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      ERA puede identificar objetivos estratégicos específicos para el crecimiento de tu negocio
                    </p>
                    <Button onClick={generateObjectivesWithAI} disabled={generatingObjectives}>
                      {generatingObjectives ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Bot className="w-4 h-4 mr-2" />
                      )}
                      Generar objetivos con ERA
                    </Button>
                  </div>
                </div>
              ) : showGeneratedObjectives ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Objetivos identificados por ERA
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      Revisa estos objetivos y confirma si son apropiados para tu negocio
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {generatedObjectives.map((objective, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{objective.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {objective.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {objective.type === 'short_term' ? 'Corto plazo' : 
                                 objective.type === 'medium_term' ? 'Mediano plazo' : 'Largo plazo'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Prioridad {objective.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={acceptGeneratedObjectives} disabled={loading} className="flex-1">
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Aceptar objetivos
                    </Button>
                    <Button 
                      onClick={() => setShowGeneratedObjectives(false)} 
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h3 className="font-medium text-green-900 dark:text-green-100">
                        Objetivos definidos ({objectives.length})
                      </h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {objectives.slice(0, 3).map((objective, index) => (
                      <div key={objective.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{objective.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {objective.description}
                        </p>
                      </div>
                    ))}
                    {objectives.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Y {objectives.length - 3} objetivos más...
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={generateObjectivesWithAI} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar objetivos
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">
                      ¿Por qué es relevante?
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Los objetivos claros y medibles permiten enfocar todos los esfuerzos de marketing y 
                      desarrollo del negocio hacia resultados específicos y alcanzables.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={objectives.length === 0 && !showGeneratedObjectives}
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-6 h-6 mr-2 text-primary" />
                Tu marca es tu ADN
              </CardTitle>
              <p className="text-muted-foreground">
                Definamos la identidad visual que representará tu negocio
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!brandingData.visual_identity && !brandingData.primary_color ? (
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      ERA puede crear automáticamente tu identidad de marca basada en tu industria y valores
                    </p>
                    <Button onClick={generateBrandingWithAI} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Bot className="w-4 h-4 mr-2" />
                      )}
                      Generar identidad de marca con ERA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {brandingData.visual_identity && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                        <h3 className="font-medium text-purple-900 dark:text-purple-100">
                          Identidad Visual
                        </h3>
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {brandingData.visual_identity}
                      </p>
                    </div>
                  )}

                  {(brandingData.primary_color || brandingData.secondary_color) && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                          Paleta de Colores
                        </h3>
                      </div>
                      <div className="flex gap-3">
                        {brandingData.primary_color && (
                          <div className="text-center">
                            <div 
                              className="w-12 h-12 rounded-lg border mb-2"
                              style={{ backgroundColor: brandingData.primary_color }}
                            />
                            <p className="text-xs text-blue-700 dark:text-blue-300">Primario</p>
                          </div>
                        )}
                        {brandingData.secondary_color && (
                          <div className="text-center">
                            <div 
                              className="w-12 h-12 rounded-lg border mb-2"
                              style={{ backgroundColor: brandingData.secondary_color }}
                            />
                            <p className="text-xs text-blue-700 dark:text-blue-300">Secundario</p>
                          </div>
                        )}
                        {brandingData.complementary_color_1 && (
                          <div className="text-center">
                            <div 
                              className="w-12 h-12 rounded-lg border mb-2"
                              style={{ backgroundColor: brandingData.complementary_color_1 }}
                            />
                            <p className="text-xs text-blue-700 dark:text-blue-300">Comp. 1</p>
                          </div>
                        )}
                        {brandingData.complementary_color_2 && (
                          <div className="text-center">
                            <div 
                              className="w-12 h-12 rounded-lg border mb-2"
                              style={{ backgroundColor: brandingData.complementary_color_2 }}
                            />
                            <p className="text-xs text-blue-700 dark:text-blue-300">Comp. 2</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button onClick={generateBrandingWithAI} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar identidad
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                      ¿Por qué es relevante?
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Una identidad de marca coherente genera confianza, reconocimiento y diferenciación. 
                      ERA usará esta información para crear contenido visual consistente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!brandingData.visual_identity && !brandingData.primary_color}
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-6 h-6 mr-2 text-primary" />
                Configuración de redes sociales
              </CardTitle>
              <p className="text-muted-foreground">
                Conecta tus redes sociales para una presencia digital integrada
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={socialConnections.facebook}
                      onChange={(e) => setSocialConnections(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="https://facebook.com/tu-empresa"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <div className="flex-1">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={socialConnections.instagram}
                      onChange={(e) => setSocialConnections(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="https://instagram.com/tu-empresa"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  <div className="flex-1">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={socialConnections.linkedin}
                      onChange={(e) => setSocialConnections(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/company/tu-empresa"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-sky-500" />
                  <div className="flex-1">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={socialConnections.twitter}
                      onChange={(e) => setSocialConnections(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="https://twitter.com/tu-empresa"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Youtube className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={socialConnections.youtube}
                      onChange={(e) => setSocialConnections(prev => ({ ...prev, youtube: e.target.value }))}
                      placeholder="https://youtube.com/@tu-empresa"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-black dark:text-white" />
                  <div className="flex-1">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      value={socialConnections.tiktok}
                      onChange={(e) => setSocialConnections(prev => ({ ...prev, tiktok: e.target.value }))}
                      placeholder="https://tiktok.com/@tu-empresa"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-cyan-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-cyan-900 dark:text-cyan-100 mb-1">
                      ¿Por qué es relevante?
                    </h3>
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">
                      Conectar tus redes sociales permite a ERA analizar tu presencia digital, generar contenido 
                      específico para cada plataforma y coordinar estrategias de marketing integradas.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={saveSocialConnections} disabled={loading} className="w-full">
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar configuración
              </Button>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button 
                  onClick={() => {
                    setIsOnboardingComplete(true);
                    toast({
                      title: "¡Configuración completada!",
                      description: "Has configurado exitosamente el ADN de tu negocio.",
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header con progreso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">ADN de tu Empresa</h1>
            <Badge variant="outline" className="text-sm">
              Paso {currentStep} de {totalSteps}
            </Badge>
          </div>
          
          {/* Barra de progreso */}
          <div className="space-y-2">
            <Progress value={(completedSteps.length / totalSteps) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {completedSteps.length} de {totalSteps} pasos completados
            </p>
          </div>

          {/* Navegación de pasos */}
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              {Array.from({length: totalSteps}, (_, i) => i + 1).map((step) => (
                <button
                  key={step}
                  onClick={() => goToStep(step)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step === currentStep 
                      ? "bg-primary text-primary-foreground" 
                      : completedSteps.includes(step)
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {completedSteps.includes(step) && step !== currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido del paso actual */}
        <div className="animate-fade-in">
          {renderStepContent()}
        </div>

        {/* Resumen al completar */}
        {isOnboardingComplete && (
          <Card className="max-w-2xl mx-auto mt-8 border-green-200 dark:border-green-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-700 dark:text-green-300">
                ¡Configuración completada!
              </CardTitle>
              <p className="text-muted-foreground">
                Has configurado exitosamente el ADN de tu negocio. ERA ya puede trabajar con esta información.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="font-medium">Descripción</p>
                  <p className="text-muted-foreground">Definida</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="font-medium">Estrategia</p>
                  <p className="text-muted-foreground">Configurada</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="font-medium">Objetivos</p>
                  <p className="text-muted-foreground">{objectives.length} definidos</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="font-medium">Marca</p>
                  <p className="text-muted-foreground">Establecida</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ADNEmpresa;