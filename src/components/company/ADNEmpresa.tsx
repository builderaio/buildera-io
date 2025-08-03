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
  X,
  Check
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
  
  // Estados para revisión de estrategia generada
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);
  const [showGeneratedStrategy, setShowGeneratedStrategy] = useState(false);
  const [tempStrategyData, setTempStrategyData] = useState({
    vision: "",
    mission: "",
    propuesta_valor: ""
  });

  const totalSteps = 6;

  useEffect(() => {
    if (profile?.user_id) {
      fetchAllData();
    }
  }, [profile?.user_id]);

  // Separar useEffect para checkOnboardingStatus para evitar loops
  useEffect(() => {
    checkOnboardingStatus();
  }, [companyData, strategyData, objectives, brandingData, socialConnections]);

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
      if (nextIncompleteStep && nextIncompleteStep !== currentStep) {
        setCurrentStep(nextIncompleteStep);
      }
    }
  };

  // Auto-generar estrategia cuando se entre al paso 3
  useEffect(() => {
    if (currentStep === 3 && !strategyData.vision && !strategyData.mission && !strategyData.propuesta_valor && companyData?.descripcion_empresa && !loading) {
      generateStrategyWithAI();
    }
  }, [currentStep, strategyData.vision, strategyData.mission, strategyData.propuesta_valor, companyData?.descripcion_empresa]);

  // Auto-generar objetivos cuando se entre al paso 4
  useEffect(() => {
    if (currentStep === 4 && objectives.length === 0 && !showGeneratedObjectives && !generatingObjectives && 
        strategyData.vision && strategyData.mission && strategyData.propuesta_valor && !loading) {
      generateObjectivesWithAI();
    }
  }, [currentStep, objectives.length, showGeneratedObjectives, generatingObjectives, strategyData.vision, strategyData.mission, strategyData.propuesta_valor]);

  // Auto-generar branding cuando se entre al paso 5
  useEffect(() => {
    console.log('🎨 Checking branding auto-generation:', {
      currentStep,
      hasVisualIdentity: !!brandingData.visual_identity,
      hasPrimaryColor: !!brandingData.primary_color,
      hasVision: !!strategyData.vision,
      hasMission: !!strategyData.mission,
      hasValueProp: !!strategyData.propuesta_valor,
      isLoading: loading
    });
    
    if (currentStep === 5 && !brandingData.visual_identity && !brandingData.primary_color && 
        strategyData.vision && strategyData.mission && strategyData.propuesta_valor && !loading) {
      console.log('🚀 Iniciando generación automática de branding...');
      generateBrandingWithAI();
    }
  }, [currentStep, brandingData.visual_identity, brandingData.primary_color, strategyData.vision, strategyData.mission, strategyData.propuesta_valor]);

  const generateStrategyWithAI = async () => {
    setLoading(true);
    try {
      // Preparar información de la empresa para el webhook
      const companyInfo = {
        company_name: profile?.company_name || companyData?.name,
        industry_sector: profile?.industry_sector || companyData?.industry_sector,
        company_size: profile?.company_size || companyData?.company_size,
        website_url: profile?.website_url || companyData?.website_url,
        description: companyData?.descripcion_empresa
      };

      const { data, error } = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
        body: {
          KEY: 'STRATEGY',
          COMPANY_INFO: JSON.stringify(companyInfo)
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        console.log('Respuesta del webhook STRATEGY:', data.data);
        
        // Procesar la respuesta dependiendo del formato
        let strategyResponse = data.data;
        
        // Si la respuesta es un string, intentar parsearlo
        if (typeof strategyResponse === 'string') {
          try {
            strategyResponse = JSON.parse(strategyResponse);
          } catch (parseError) {
            console.error('Error parsing strategy response:', parseError);
            throw new Error('Error procesando la respuesta de estrategia');
          }
        }

        // Actualizar el estado con la estrategia generada para revisión
        if (strategyResponse && Array.isArray(strategyResponse) && strategyResponse.length > 0) {
          const firstResponse = strategyResponse[0];
          const responseArray = firstResponse.response;
          
          if (responseArray && Array.isArray(responseArray)) {
            // Convertir el array de objetos {key, value} a un objeto plano
            const strategyObject: any = {};
            responseArray.forEach((item: any) => {
              if (item.key && item.value) {
                strategyObject[item.key] = item.value;
              }
            });

            const newGeneratedStrategy = {
              vision: strategyObject.vision || "",
              mission: strategyObject.mision || strategyObject.mission || "",
              propuesta_valor: strategyObject.propuesta_valor || strategyObject.value_proposition || ""
            };

            setGeneratedStrategy(newGeneratedStrategy);
            setTempStrategyData(newGeneratedStrategy);
            setShowGeneratedStrategy(true);

            toast({
              title: "Estrategia generada",
              description: "ERA ha generado tu estrategia empresarial. Revísala y ajústala si es necesario.",
            });
          } else {
            throw new Error('Formato de respuesta inesperado - response array no encontrado');
          }
        } else {
          throw new Error('Respuesta de estrategia vacía o inválida');
        }
      } else {
        throw new Error(data?.message || 'Error en la generación de estrategia');
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

  const acceptGeneratedStrategy = async () => {
    setLoading(true);
    try {
      // Actualizar el estado principal con la estrategia temporal
      setStrategyData(tempStrategyData);
      
      // Guardar en la base de datos
      await saveStrategy(tempStrategyData);
      
      // Limpiar estados temporales
      setShowGeneratedStrategy(false);
      setGeneratedStrategy(null);
      
      toast({
        title: "Estrategia aceptada",
        description: "La estrategia empresarial ha sido guardada exitosamente.",
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

  const rejectGeneratedStrategy = () => {
    setShowGeneratedStrategy(false);
    setGeneratedStrategy(null);
    setTempStrategyData({
      vision: "",
      mission: "",
      propuesta_valor: ""
    });
  };

  const regenerateStrategy = async () => {
    setShowGeneratedStrategy(false);
    setGeneratedStrategy(null);
    await generateStrategyWithAI();
  };
  const generateObjectivesWithAI = async () => {
    setGeneratingObjectives(true);
    try {
      // Preparar la información de la empresa y estrategia
      const companyInfo = {
        name: companyData?.name || profile?.company_name || 'Empresa',
        industry_sector: companyData?.industry_sector || companyData?.industria_principal || profile?.industry_sector,
        company_size: companyData?.company_size || profile?.company_size || 'No especificado',
        website_url: companyData?.website_url || profile?.website_url || '',
        description: companyData?.descripcion_empresa || companyData?.description || ''
      };

      const { data, error } = await supabase.functions.invoke('get-company-objetivos', {
        body: {
          companyInfo: companyInfo,
          strategyData: strategyData
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
      // Preparar información de la empresa para el webhook
      const companyInfo = {
        company_name: profile?.company_name || companyData?.name,
        industry_sector: profile?.industry_sector || companyData?.industry_sector,
        company_size: profile?.company_size || companyData?.company_size,
        website_url: profile?.website_url || companyData?.website_url,
        description: companyData?.descripcion_empresa,
        mission: strategyData.mission,
        vision: strategyData.vision,
        value_proposition: strategyData.propuesta_valor
      };

      const { data, error } = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
        body: {
          KEY: 'BRAND',
          COMPANY_INFO: JSON.stringify(companyInfo)
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        console.log('Respuesta del webhook BRAND:', data.data);
        
        // Procesar la respuesta del branding
        let brandingResponse = data.data;
        
        if (typeof brandingResponse === 'string') {
          try {
            brandingResponse = JSON.parse(brandingResponse);
          } catch (parseError) {
            console.error('Error parsing branding response:', parseError);
            throw new Error('Error procesando la respuesta de branding');
          }
        }

        if (brandingResponse && Array.isArray(brandingResponse) && brandingResponse.length > 0) {
          const firstResponse = brandingResponse[0];
          const responseArray = firstResponse.response;
          
          console.log('📊 Procesando respuesta BRAND:', {
            brandingResponse,
            firstResponse,
            responseArray
          });
          
          if (responseArray && Array.isArray(responseArray)) {
            const brandingObject: any = {};
            responseArray.forEach((item: any) => {
              if (item.key && item.value) {
                brandingObject[item.key] = item.value;
              }
            });

            console.log('🎨 Objeto de branding procesado:', brandingObject);

            const newBrandingData = {
              primary_color: brandingObject.primary_color || brandingObject.color_primario || "",
              secondary_color: brandingObject.secondary_color || brandingObject.color_secundario || "",
              complementary_color_1: brandingObject.complementary_color_1 || brandingObject.color_complementario_1 || "",
              complementary_color_2: brandingObject.complementary_color_2 || brandingObject.color_complementario_2 || "",
              visual_identity: brandingObject.visual_identity || brandingObject.identidad_visual || ""
            };

            console.log('🎯 Datos finales de branding:', newBrandingData);
            setBrandingData(newBrandingData);
            console.log('✅ Branding data actualizado:', newBrandingData);
            
            // Solo guardar si hay datos válidos
            if (newBrandingData.visual_identity || newBrandingData.primary_color) {
              await saveBranding(newBrandingData);
            } else {
              console.warn('⚠️ No se encontraron datos válidos de branding en la respuesta');
            }

            toast({
              title: "Identidad de marca generada",
              description: "ERA ha definido automáticamente tu identidad visual.",
            });
          } else {
            console.error('❌ Estructura de respuesta inesperada - response array no encontrado');
            throw new Error('Formato de respuesta inesperado - response array no encontrado');
          }
        } else {
          console.error('❌ Respuesta de branding vacía o inválida:', brandingResponse);
          throw new Error('Respuesta de branding vacía o inválida');
        }
      } else {
        throw new Error(data?.message || 'Error en la generación de branding');
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

  const saveObjectives = async () => {
    setLoading(true);
    try {
      // Primero eliminar objetivos existentes
      const { error: deleteError } = await supabase
        .from('company_objectives')
        .delete()
        .eq('user_id', profile?.user_id);

      if (deleteError) throw deleteError;

      // Función para convertir prioridad a número
      const getPriorityNumber = (priority: string) => {
        switch(priority) {
          case 'alta': return 1;
          case 'media': return 2;
          case 'baja': return 3;
          default: return 2;
        }
      };

      // Luego insertar los objetivos actualizados
      const objectivesToSave = objectives
        .filter(obj => obj.title && obj.description) // Solo guardar objetivos completos
        .map(obj => ({
          user_id: profile?.user_id,
          title: obj.title,
          description: obj.description,
          objective_type: obj.type,
          priority: getPriorityNumber(obj.priority),
          status: 'active'
        }));

      if (objectivesToSave.length > 0) {
        const { error } = await supabase
          .from('company_objectives')
          .insert(objectivesToSave);

        if (error) throw error;
      }

      await fetchObjectives();
      
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

  const acceptGeneratedObjectives = async () => {
    setLoading(true);
    try {
      // Función para convertir prioridad a número
      const getPriorityNumber = (priority: string) => {
        switch(priority) {
          case 'alta': return 1;
          case 'media': return 2;
          case 'baja': return 3;
          default: return 2;
        }
      };

      const objectivesToSave = generatedObjectives.map(obj => ({
        user_id: profile?.user_id,
        title: obj.title,
        description: obj.description,
        objective_type: obj.type,
        priority: getPriorityNumber(obj.priority),
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

  const nextStep = async () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Auto-generar objetivos cuando se llega al paso 4 y no hay objetivos existentes
      if (newStep === 4 && objectives.length === 0 && !showGeneratedObjectives && !generatingObjectives) {
        // Pequeña pausa para que se renderice el nuevo paso
        setTimeout(() => {
          generateObjectivesWithAI();
        }, 500);
      }
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
              {showGeneratedStrategy ? (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-5 h-5 text-blue-500" />
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">
                        Estrategia generada por ERA
                      </h3>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      Revisa la estrategia generada y ajústala si es necesario antes de continuar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Misión</label>
                      <textarea
                        className="w-full p-3 border rounded-lg resize-none"
                        rows={3}
                        value={tempStrategyData.mission}
                        onChange={(e) => setTempStrategyData(prev => ({
                          ...prev,
                          mission: e.target.value
                        }))}
                        placeholder="Misión de la empresa..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Visión</label>
                      <textarea
                        className="w-full p-3 border rounded-lg resize-none"
                        rows={3}
                        value={tempStrategyData.vision}
                        onChange={(e) => setTempStrategyData(prev => ({
                          ...prev,
                          vision: e.target.value
                        }))}
                        placeholder="Visión de la empresa..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Propuesta de Valor</label>
                      <textarea
                        className="w-full p-3 border rounded-lg resize-none"
                        rows={3}
                        value={tempStrategyData.propuesta_valor}
                        onChange={(e) => setTempStrategyData(prev => ({
                          ...prev,
                          propuesta_valor: e.target.value
                        }))}
                        placeholder="Propuesta de valor..."
                      />
                    </div>
                  </div>

                </div>
              ) : !strategyData.vision && !strategyData.mission && !strategyData.propuesta_valor ? (
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    {loading ? (
                      <>
                        <RefreshCw className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
                        <p className="text-muted-foreground">
                          ERA está generando automáticamente tu estrategia empresarial...
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        Generando estrategia automáticamente con ERA
                      </p>
                    )}
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
                  onClick={async () => {
                    // Si hay estrategia generada sin guardar, guardarla primero
                    if (showGeneratedStrategy && tempStrategyData) {
                      await acceptGeneratedStrategy();
                    }
                    nextStep();
                  }} 
                  disabled={
                    !showGeneratedStrategy && 
                    (!strategyData.vision || !strategyData.mission || !strategyData.propuesta_valor)
                  }
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
              {generatingObjectives ? (
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground mb-4">
                      ERA está analizando tu estrategia empresarial para generar objetivos específicos de crecimiento...
                    </p>
                  </div>
                </div>
              ) : !showGeneratedObjectives && objectives.length === 0 ? (
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      ERA generará automáticamente 3 objetivos de crecimiento basados en tu estrategia empresarial
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Objetivos de crecimiento
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      Ajusta los objetivos existentes o agrega nuevos. Recomendación: máximo 3 objetivos.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {(showGeneratedObjectives ? generatedObjectives : objectives).map((objective, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div>
                          <label className="text-sm font-medium">Título del objetivo</label>
                          <input
                            type="text"
                            value={objective.title}
                            onChange={(e) => {
                              if (showGeneratedObjectives) {
                                const updated = [...generatedObjectives];
                                updated[index].title = e.target.value;
                                setGeneratedObjectives(updated);
                              } else {
                                const updated = [...objectives];
                                updated[index].title = e.target.value;
                                setObjectives(updated);
                              }
                            }}
                            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                            placeholder="Título del objetivo..."
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Descripción</label>
                          <textarea
                            value={objective.description}
                            onChange={(e) => {
                              if (showGeneratedObjectives) {
                                const updated = [...generatedObjectives];
                                updated[index].description = e.target.value;
                                setGeneratedObjectives(updated);
                              } else {
                                const updated = [...objectives];
                                updated[index].description = e.target.value;
                                setObjectives(updated);
                              }
                            }}
                            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                            rows={3}
                            placeholder="Descripción detallada del objetivo..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium">Plazo</label>
                            <select
                              value={objective.type}
                              onChange={(e) => {
                                if (showGeneratedObjectives) {
                                  const updated = [...generatedObjectives];
                                  updated[index].type = e.target.value;
                                  setGeneratedObjectives(updated);
                                } else {
                                  const updated = [...objectives];
                                  updated[index].type = e.target.value;
                                  setObjectives(updated);
                                }
                              }}
                              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="short_term">Corto plazo</option>
                              <option value="medium_term">Mediano plazo</option>
                              <option value="long_term">Largo plazo</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Prioridad</label>
                            <select
                              value={objective.priority}
                              onChange={(e) => {
                                if (showGeneratedObjectives) {
                                  const updated = [...generatedObjectives];
                                  updated[index].priority = e.target.value;
                                  setGeneratedObjectives(updated);
                                } else {
                                  const updated = [...objectives];
                                  updated[index].priority = e.target.value;
                                  setObjectives(updated);
                                }
                              }}
                              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="alta">Alta</option>
                              <option value="media">Media</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <Button
                              onClick={() => {
                                if (showGeneratedObjectives) {
                                  const updated = generatedObjectives.filter((_, i) => i !== index);
                                  setGeneratedObjectives(updated);
                                } else {
                                  const updated = objectives.filter((_, i) => i !== index);
                                  setObjectives(updated);
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {objective.type === 'short_term' ? 'Corto plazo' : 
                             objective.type === 'medium_term' ? 'Mediano plazo' : 'Largo plazo'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Prioridad {objective.priority}
                          </Badge>
                          {objective.timeframe && (
                            <Badge variant="default" className="text-xs">
                              {objective.timeframe}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(showGeneratedObjectives ? generatedObjectives.length : objectives.length) < 3 && (
                    <Button
                      onClick={() => {
                        const newObjective = {
                          title: "",
                          description: "",
                          type: "short_term",
                          priority: "media",
                          metric: "",
                          target: "",
                          timeframe: ""
                        };
                        
                        if (showGeneratedObjectives) {
                          setGeneratedObjectives([...generatedObjectives, newObjective]);
                        } else {
                          setObjectives([...objectives, newObjective]);
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Agregar objetivo
                    </Button>
                  )}
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
                  onClick={async () => {
                    if (showGeneratedObjectives) {
                      await acceptGeneratedObjectives();
                    } else {
                      await saveObjectives();
                    }
                    nextStep();
                  }} 
                  disabled={(showGeneratedObjectives ? generatedObjectives.length : objectives.length) === 0}
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
              {loading ? (
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground mb-4">
                      ERA está generando automáticamente tu identidad de marca basada en tu estrategia empresarial...
                    </p>
                  </div>
                </div>
              ) : !brandingData.visual_identity && !brandingData.primary_color ? (
                <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      ERA generará automáticamente tu identidad de marca basada en tu estrategia empresarial
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Identidad de marca
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      Ajusta la identidad visual y paleta de colores de tu marca.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Identidad Visual</label>
                      <textarea
                        value={brandingData.visual_identity}
                        onChange={(e) => setBrandingData(prev => ({
                          ...prev,
                          visual_identity: e.target.value
                        }))}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        rows={4}
                        placeholder="Describe la identidad visual de tu marca..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Color Primario</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            value={brandingData.primary_color || "#000000"}
                            onChange={(e) => setBrandingData(prev => ({
                              ...prev,
                              primary_color: e.target.value
                            }))}
                            className="w-12 h-10 border rounded"
                          />
                          <input
                            type="text"
                            value={brandingData.primary_color}
                            onChange={(e) => setBrandingData(prev => ({
                              ...prev,
                              primary_color: e.target.value
                            }))}
                            className="flex-1 px-3 py-2 border rounded-md text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Color Secundario</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            value={brandingData.secondary_color || "#000000"}
                            onChange={(e) => setBrandingData(prev => ({
                              ...prev,
                              secondary_color: e.target.value
                            }))}
                            className="w-12 h-10 border rounded"
                          />
                          <input
                            type="text"
                            value={brandingData.secondary_color}
                            onChange={(e) => setBrandingData(prev => ({
                              ...prev,
                              secondary_color: e.target.value
                            }))}
                            className="flex-1 px-3 py-2 border rounded-md text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Color Complementario 1</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            value={brandingData.complementary_color_1 || "#000000"}
                            onChange={(e) => setBrandingData(prev => ({
                              ...prev,
                              complementary_color_1: e.target.value
                            }))}
                            className="w-12 h-10 border rounded"
                          />
                          <input
                            type="text"
                            value={brandingData.complementary_color_1}
                            onChange={(e) => setBrandingData(prev => ({
                              ...prev,
                              complementary_color_1: e.target.value
                            }))}
                            className="flex-1 px-3 py-2 border rounded-md text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Color Complementario 2</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            value={brandingData.complementary_color_2 || "#000000"}
                            onChange={(e) => setBrandingData(prev => ({
                              ...prev,
                              complementary_color_2: e.target.value
                            }))}
                            className="w-12 h-10 border rounded"
                          />
                          <input
                            type="text"
                            value={brandingData.complementary_color_2}
                            onChange={(e) => setBrandingData(prev => ({
                              ...prev,
                              complementary_color_2: e.target.value
                            }))}
                            className="flex-1 px-3 py-2 border rounded-md text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button onClick={generateBrandingWithAI} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerar con ERA
                      </Button>
                    </div>
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
                  onClick={async () => {
                    await saveBranding(brandingData);
                    nextStep();
                  }} 
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