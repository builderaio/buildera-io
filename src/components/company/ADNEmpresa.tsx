import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Building2, Target, Palette, Globe, CheckCircle, ArrowRight, ArrowLeft, Bot, Lightbulb, Facebook, Instagram, Twitter, Youtube, Music, Linkedin, RefreshCw, Save, Edit3, X, Check, Download, AlertCircle, Info, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirstTimeSave } from "@/hooks/useFirstTimeSave";
interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}
const ADNEmpresa = ({
  profile,
  onProfileUpdate
}: ADNEmpresaProps) => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  // Estados para el onboarding
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true); // Nueva variable para controlar primera vez
  const [user, setUser] = useState<any>(null);

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

  // Estados para carga de datos de redes sociales
  const [loadingData, setLoadingData] = useState(false);
  const [currentLoading, setCurrentLoading] = useState('');
  const [dataResults, setDataResults] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalyzing, setCurrentAnalyzing] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

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

  // Hook para manejar webhook de primera vez
  const {
    isFirstSave,
    triggerWebhookOnFirstSave,
    markAsNotFirstSave
  } = useFirstTimeSave(user?.id);
  const totalSteps = 7;
  useEffect(() => {
    if (profile?.user_id) {
      fetchAllData();
    }
  }, [profile?.user_id]);

  // Separar el checkIfFirstTime para ejecutar después de cargar datos
  useEffect(() => {
    if (profile?.user_id && companyData) {
      checkIfFirstTime(); // Verificar si es primera vez
    }
  }, [profile?.user_id, companyData?.id]);

  // Obtener usuario actual
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    getCurrentUser();
  }, []);

  // Separar useEffect para checkOnboardingStatus para evitar loops
  useEffect(() => {
    checkOnboardingStatus();
  }, [companyData, strategyData, objectives, brandingData, socialConnections]);
  const fetchAllData = async () => {
    await Promise.all([fetchCompanyData(), fetchStrategy(), fetchBranding(), fetchObjectives(), fetchSocialConnections()]);
  };

  // Función para verificar si es primera vez del usuario
  const checkIfFirstTime = async () => {
    try {
      // Verificar el estado del onboarding del usuario
      const {
        data: onboardingStatus,
        error
      } = await supabase.from('user_onboarding_status').select('dna_empresarial_completed').eq('user_id', profile?.user_id).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', error);
        return;
      }

      // Si no existe registro o no ha completado el DNA empresarial, es primera vez
      const isFirstTimeUser = !onboardingStatus || !onboardingStatus.dna_empresarial_completed;
      setIsFirstTime(isFirstTimeUser);

      // Si es primera vez y hay un website_url, intentar cargar información automáticamente
      if (isFirstTimeUser && (profile?.website_url || companyData?.website_url)) {
        await loadCompanyInfoFromWebhook();
      }

      // Si no es primera vez, saltar al modo de edición
      if (!isFirstTimeUser) {
        setIsOnboardingComplete(true);
        setCurrentStep(totalSteps); // Ir al último paso para mostrar resumen
      } else {
        // Si es primera vez y no hay descripción, activar modo de edición automáticamente
        if (!companyData?.descripcion_empresa) {
          setEditingDescription(true);
        }
      }
    } catch (error) {
      console.error('Error checking first time status:', error);
    }
  };

  // Función para cargar información de la empresa desde el webhook
  const loadCompanyInfoFromWebhook = async () => {
    if (!user?.id || !companyData?.id) return;
    console.log('🔍 Verificando si hay información de webhook disponible...');
    try {
      // Verificar si ya hay datos del webhook
      if (companyData?.webhook_data && companyData?.descripcion_empresa) {
        console.log('✅ Información ya disponible desde webhook');
        return;
      }

      // Si no hay descripción pero hay webhook_data, procesarla
      if (companyData?.webhook_data && !companyData?.descripcion_empresa) {
        console.log('📊 Procesando datos existentes del webhook...');
        const webhookData = companyData.webhook_data;
        if (webhookData && Array.isArray(webhookData) && webhookData.length > 0) {
          const responseArray = webhookData[0]?.response || [];
          const descripcionItem = responseArray.find((item: any) => item.key === 'descripcion_empresa');
          if (descripcionItem && descripcionItem.value && descripcionItem.value !== 'No se encontró información' && !descripcionItem.value.includes('No se encontró información específica') && !descripcionItem.value.includes('No se pudo determinar')) {
            setTempDescription(descripcionItem.value);
            // Actualizar la empresa con la descripción encontrada
            const {
              error
            } = await supabase.from('companies').update({
              description: descripcionItem.value
            }).eq('id', companyData.id);
            if (!error) {
              setCompanyData(prev => ({
                ...prev,
                description: descripcionItem.value,
                descripcion_empresa: descripcionItem.value // Mantener ambos campos sincronizados
              }));
              console.log('✅ Descripción actualizada desde webhook existente');
            }
          }
        }
      } else if (!companyData?.webhook_data) {
        // Si no hay datos de webhook, intentar obtenerlos
        console.log('🚀 Ejecutando webhook para obtener información de la empresa...');
        await triggerWebhookOnFirstSave(profile?.company_name || companyData?.name || '', profile?.website_url || companyData?.website_url, profile?.country);

        // Esperar un momento y refrescar los datos
        setTimeout(() => {
          fetchCompanyData();
        }, 3000);
      }
    } catch (error) {
      console.error('Error cargando información desde webhook:', error);
    }
  };
  const fetchCompanyData = async () => {
    try {
      // Obtener la empresa principal (id) desde company_members y luego hacer SELECT en companies
      if (!profile?.user_id && !user?.id) {
        console.warn('No se puede obtener empresa: user_id no disponible en profile ni user');
        setCompanyData(null);
        return;
      }
      const userId = profile?.user_id || user?.id;
      const {
        data: membership,
        error: memberError
      } = await supabase.from('company_members').select('company_id').eq('user_id', userId).eq('is_primary', true).maybeSingle();
      if (memberError) throw memberError;
      const companyId = membership?.company_id;
      if (!companyId) {
        console.warn('No se encontró empresa principal para el usuario');
        setCompanyData(null);
        return;
      }
      const {
        data: company,
        error: companyError
      } = await supabase.from('companies').select('id,name,description,website_url,industry_sector,company_size,country,location,facebook_url,twitter_url,linkedin_url,instagram_url,youtube_url,tiktok_url,created_at,updated_at,webhook_data').eq('id', companyId).maybeSingle();
      if (companyError) throw companyError;
      if (company) {
        setCompanyData({
          id: company.id,
          name: company.name,
          description: company.description,
          descripcion_empresa: company.description || '',
          website_url: company.website_url,
          industry_sector: company.industry_sector,
          company_size: company.company_size,
          country: company.country,
          location: company.location,
          facebook_url: company.facebook_url,
          twitter_url: company.twitter_url,
          linkedin_url: company.linkedin_url,
          instagram_url: company.instagram_url,
          youtube_url: company.youtube_url,
          tiktok_url: company.tiktok_url,
          created_at: company.created_at,
          updated_at: company.updated_at,
          webhook_data: company.webhook_data
        });
        setTempDescription(company.description || '');
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
    }
  };
  const fetchStrategy = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('company_strategy').select('*').eq('user_id', profile.user_id).order('created_at', {
        ascending: false
      }).limit(1);
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
      const {
        data,
        error
      } = await supabase.from('company_branding').select('*').eq('user_id', profile?.user_id).maybeSingle();
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
      const {
        data,
        error
      } = await supabase.from('company_objectives').select('*').eq('user_id', profile?.user_id).order('priority', {
        ascending: true
      });
      if (error) throw error;
      setObjectives(data || []);
    } catch (error: any) {
      console.error('Error fetching objectives:', error);
    }
  };
  const fetchSocialConnections = async () => {
    try {
      const {
        data: companies,
        error
      } = await supabase.from('companies').select('*').eq('created_by', profile?.user_id).order('created_at', {
        ascending: false
      }).limit(1);
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

    // Paso 2: Descripción del negocio (completado si tiene nombre y website válidos)
    if (companyData?.name && companyData?.website_url) completed.push(2);

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

    // Solo inicializar en paso 1 si currentStep no está definido (primera carga)
    // NO hacer redirecciones automáticas para evitar interrumpir al usuario
    if (currentStep === 0) {
      setCurrentStep(1);
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
    if (currentStep === 4 && objectives.length === 0 && !showGeneratedObjectives && !generatingObjectives && strategyData.vision && strategyData.mission && strategyData.propuesta_valor && !loading) {
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
    if (currentStep === 5 && !brandingData.visual_identity && !brandingData.primary_color && strategyData.vision && strategyData.mission && strategyData.propuesta_valor && !loading) {
      console.log('🚀 Iniciando generación automática de branding...');
      generateBrandingWithAI();
    }
  }, [currentStep, brandingData.visual_identity, brandingData.primary_color, strategyData.vision, strategyData.mission, strategyData.propuesta_valor]);

  // Auto-cargar datos de redes sociales cuando se entre al paso 7
  useEffect(() => {
    console.log('📥 Checking social data auto-loading:', {
      currentStep,
      dataResultsLength: dataResults.length,
      loadingData,
      analyzing,
      hasSocialConnections: Object.values(socialConnections).some(url => url.trim() !== '')
    });
    if (currentStep === 7 && !loadingData && !analyzing && dataResults.length === 0 && Object.values(socialConnections).some(url => url.trim() !== '')) {
      console.log('🚀 Iniciando carga automática de datos de redes sociales...');
      loadSocialData();
    }
  }, [currentStep, loadingData, analyzing, dataResults.length, socialConnections]);

  // Auto-ejecutar análisis inteligente después de cargar datos
  useEffect(() => {
    if (currentStep === 7 && !loadingData && !analyzing && dataResults.length > 0 && analysisResults.length === 0) {
      console.log('🧠 Iniciando análisis inteligente automático...');
      runAnalysis();
    }
  }, [currentStep, loadingData, analyzing, dataResults.length, analysisResults.length]);
  const generateStrategyWithAI = async () => {
    setLoading(true);
    try {
      // Verificar datos mínimos requeridos
      if (!companyData?.name || !companyData?.descripcion_empresa) {
        throw new Error('Faltan datos de la empresa para generar la estrategia');
      }

      // Preparar información de la empresa para el webhook
      const companyInfo = {
        company_name: companyData.name,
        industry_sector: companyData.industry_sector || 'No especificado',
        company_size: companyData.company_size || 'No especificado',
        website_url: companyData.website_url || '',
        description: companyData.descripcion_empresa
      };
      console.log('🤖 Generando estrategia con datos:', companyInfo);

      // Intentar usar el webhook primero
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
          body: {
            KEY: 'STRATEGY',
            COMPANY_INFO: JSON.stringify(companyInfo)
          }
        });
        if (error) throw error;
        if (data?.success && data?.data) {
          console.log('✅ Respuesta del webhook STRATEGY:', data.data);

          // Procesar la respuesta dependiendo del formato
          let strategyResponse = data.data;

          // Si la respuesta es un string, intentar parsearlo
          if (typeof strategyResponse === 'string') {
            try {
              strategyResponse = JSON.parse(strategyResponse);
            } catch (parseError) {
              console.error('❌ Error parsing strategy response:', parseError);
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

              // Validar que se generó contenido útil
              if (newGeneratedStrategy.vision || newGeneratedStrategy.mission || newGeneratedStrategy.propuesta_valor) {
                setGeneratedStrategy(newGeneratedStrategy);
                setTempStrategyData(newGeneratedStrategy);
                setShowGeneratedStrategy(true);
                toast({
                  title: "Estrategia generada",
                  description: "ERA ha generado tu estrategia empresarial. Revísala y ajústala si es necesario."
                });
                return;
              } else {
                console.warn('⚠️ Webhook respondió pero sin contenido útil');
                throw new Error('Respuesta sin contenido útil');
              }
            } else {
              throw new Error('Formato de respuesta inesperado - response array no encontrado');
            }
          } else {
            throw new Error('Respuesta de estrategia vacía o inválida');
          }
        } else {
          throw new Error(data?.message || 'Error en la generación de estrategia');
        }
      } catch (webhookError) {
        console.warn('⚠️ Webhook falló, usando generación directa con OpenAI:', webhookError);

        // Fallback: usar generate-company-content directamente
        const {
          data: fallbackData,
          error: fallbackError
        } = await supabase.functions.invoke('generate-company-content', {
          body: {
            companyName: companyInfo.company_name,
            industryType: companyInfo.industry_sector,
            companySize: companyInfo.company_size,
            websiteUrl: companyInfo.website_url,
            description: companyInfo.description
          }
        });
        if (fallbackError) throw fallbackError;
        if (fallbackData?.success && fallbackData?.strategy) {
          const newGeneratedStrategy = {
            vision: fallbackData.strategy.vision || "",
            mission: fallbackData.strategy.mission || "",
            propuesta_valor: fallbackData.strategy.value_proposition || ""
          };
          setGeneratedStrategy(newGeneratedStrategy);
          setTempStrategyData(newGeneratedStrategy);
          setShowGeneratedStrategy(true);
          toast({
            title: "Estrategia generada",
            description: "ERA ha generado tu estrategia empresarial. Revísala y ajústala si es necesario."
          });
        } else {
          throw new Error('Error en ambos métodos de generación');
        }
      }
    } catch (error: any) {
      console.error('❌ Error generating strategy:', error);
      toast({
        title: "Error",
        description: `No se pudo generar la estrategia automáticamente: ${error.message}`,
        variant: "destructive"
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
        description: "La estrategia empresarial ha sido guardada exitosamente."
      });
    } catch (error: any) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la estrategia.",
        variant: "destructive"
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
      const {
        data,
        error
      } = await supabase.functions.invoke('get-company-objetivos', {
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
          description: "ERA ha identificado objetivos fundamentales para el crecimiento de tu negocio."
        });
      }
    } catch (error: any) {
      console.error('Error generating objectives:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar objetivos automáticamente.",
        variant: "destructive"
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
        company_name: companyData?.name,
        industry_sector: companyData?.industry_sector,
        company_size: companyData?.company_size,
        website_url: companyData?.website_url,
        description: companyData?.descripcion_empresa,
        mission: strategyData.mission,
        vision: strategyData.vision,
        value_proposition: strategyData.propuesta_valor
      };
      const {
        data,
        error
      } = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
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
              primary_color: brandingObject.primary_color || brandingObject.color_principal || "",
              secondary_color: brandingObject.secondary_color || brandingObject.color_secundario || "",
              complementary_color_1: brandingObject.complementary_color_1 || brandingObject.color_complementario1 || "",
              complementary_color_2: brandingObject.complementary_color_2 || brandingObject.color_complementario2 || "",
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
              description: "ERA ha definido automáticamente tu identidad visual."
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const saveDescription = async () => {
    if (!companyData?.id) return;
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('companies').update({
        description: tempDescription
      }).eq('id', companyData.id);
      if (error) throw error;
      setCompanyData(prev => ({
        ...prev,
        description: tempDescription,
        descripcion_empresa: tempDescription // Mantener ambos campos sincronizados
      }));
      setEditingDescription(false);
      if (!completedSteps.includes(2)) {
        setCompletedSteps(prev => [...prev, 2]);
      }

      // Ejecutar webhook de primera vez si aplica
      if (isFirstSave && user?.id) {
        await triggerWebhookOnFirstSave(profile?.company_name || companyData?.name || '', profile?.website_url || companyData?.website_url, profile?.country);
      }
      toast({
        title: "Descripción guardada",
        description: "La descripción de tu negocio ha sido actualizada."
      });
    } catch (error: any) {
      console.error('Error saving description:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la descripción.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const saveStrategy = async (data = strategyData) => {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('company_strategy').upsert({
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
        description: "Los fundamentos estratégicos han sido guardados."
      });
    } catch (error: any) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la estrategia.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const saveBranding = async (data = brandingData) => {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('company_branding').upsert({
        user_id: profile?.user_id,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        complementary_color_1: data.complementary_color_1,
        complementary_color_2: data.complementary_color_2,
        visual_identity: data.visual_identity
      }, {
        onConflict: 'user_id'
      });
      if (error) throw error;
      if (!completedSteps.includes(5)) {
        setCompletedSteps(prev => [...prev, 5]);
      }
      toast({
        title: "Identidad de marca guardada",
        description: "La información de tu marca ha sido guardada."
      });
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información de marca.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const saveObjectives = async () => {
    setLoading(true);
    try {
      // Primero eliminar objetivos existentes
      const {
        error: deleteError
      } = await supabase.from('company_objectives').delete().eq('user_id', profile?.user_id);
      if (deleteError) throw deleteError;

      // Función para convertir prioridad a número
      const getPriorityNumber = (priority: string) => {
        switch (priority) {
          case 'alta':
            return 1;
          case 'media':
            return 2;
          case 'baja':
            return 3;
          default:
            return 2;
        }
      };

      // Luego insertar los objetivos actualizados
      const objectivesToSave = objectives.filter(obj => obj.title && obj.description) // Solo guardar objetivos completos
      .map(obj => ({
        user_id: profile?.user_id,
        title: obj.title,
        description: obj.description,
        objective_type: obj.type,
        priority: getPriorityNumber(obj.priority),
        status: 'active'
      }));
      if (objectivesToSave.length > 0) {
        const {
          error
        } = await supabase.from('company_objectives').insert(objectivesToSave);
        if (error) throw error;
      }
      await fetchObjectives();
      if (!completedSteps.includes(4)) {
        setCompletedSteps(prev => [...prev, 4]);
      }
      toast({
        title: "Objetivos guardados",
        description: "Los objetivos de negocio han sido guardados exitosamente."
      });
    } catch (error: any) {
      console.error('Error saving objectives:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los objetivos.",
        variant: "destructive"
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
        switch (priority) {
          case 'alta':
            return 1;
          case 'media':
            return 2;
          case 'baja':
            return 3;
          default:
            return 2;
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
      const {
        error
      } = await supabase.from('company_objectives').insert(objectivesToSave);
      if (error) throw error;
      await fetchObjectives();
      setShowGeneratedObjectives(false);
      if (!completedSteps.includes(4)) {
        setCompletedSteps(prev => [...prev, 4]);
      }
      toast({
        title: "Objetivos guardados",
        description: "Los objetivos de negocio han sido guardados exitosamente."
      });
    } catch (error: any) {
      console.error('Error saving objectives:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los objetivos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones para carga de datos de redes sociales
  const loadSocialData = async () => {
    setLoadingData(true);
    setDataResults([]);
    setCurrentLoading('');

    // Convertir socialConnections a formato de plataformas
    const platforms = [{
      id: 'instagram',
      name: 'Instagram',
      url: socialConnections.instagram,
      connected: !!socialConnections.instagram
    }, {
      id: 'facebook',
      name: 'Facebook',
      url: socialConnections.facebook,
      connected: !!socialConnections.facebook
    }, {
      id: 'linkedin',
      name: 'LinkedIn',
      url: socialConnections.linkedin,
      connected: !!socialConnections.linkedin
    }, {
      id: 'tiktok',
      name: 'TikTok',
      url: socialConnections.tiktok,
      connected: !!socialConnections.tiktok
    }];
    const connectedPlatforms = platforms.filter(p => p.connected);
    for (const platform of connectedPlatforms) {
      setCurrentLoading(platform.name);
      try {
        console.log(`📥 Loading data from ${platform.name}...`);
        let result: any;
        switch (platform.id) {
          case 'instagram':
            console.log(`📸 Loading Instagram data: ${platform.url}`);
            const {
              data: instagramData,
              error: instagramError
            } = await supabase.functions.invoke('instagram-scraper', {
              body: {
                action: 'get_posts',
                username_or_url: platform.url
              }
            });
            if (instagramError) {
              console.error('Instagram scraper error:', instagramError);
              throw new Error(`Error cargando datos: ${instagramError.message}`);
            }
            result = {
              platform: platform.name,
              success: true,
              postsFound: instagramData?.data?.posts?.length || 0,
              profileData: instagramData?.data?.profile || null
            };
            break;
          case 'facebook':
            console.log(`📘 Loading Facebook data: ${platform.url}`);
            const {
              data: fbPageData,
              error: fbPageError
            } = await supabase.functions.invoke('facebook-scraper', {
              body: {
                action: 'get_page_details',
                page_url: platform.url
              }
            });
            if (fbPageError) {
              console.error('Facebook scraper error:', fbPageError);
              throw new Error(`Error cargando datos: ${fbPageError.message}`);
            }
            let fbPostsCount = 0;
            if (fbPageData?.success && fbPageData?.data?.page_details?.page_id) {
              const {
                data: fbPostsData
              } = await supabase.functions.invoke('facebook-scraper', {
                body: {
                  action: 'get_page_posts',
                  page_id: fbPageData.data.page_details.page_id
                }
              });
              fbPostsCount = fbPostsData?.data?.posts?.length || 0;
            }
            result = {
              platform: platform.name,
              success: true,
              postsFound: fbPostsCount,
              profileData: fbPageData?.data?.page_details || null
            };
            break;
          case 'linkedin':
            const identifier = platform.url.match(/linkedin\.com\/company\/([a-zA-Z0-9-_]+)/)?.[1];
            if (identifier) {
              console.log(`💼 Loading LinkedIn data: ${identifier}`);
              const {
                data: linkedinData,
                error: linkedinError
              } = await supabase.functions.invoke('linkedin-scraper', {
                body: {
                  action: 'get_company_posts',
                  company_identifier: identifier
                }
              });
              if (linkedinError) {
                console.error('LinkedIn scraper error:', linkedinError);
                throw new Error(`Error cargando datos: ${linkedinError.message}`);
              }
              result = {
                platform: platform.name,
                success: true,
                postsFound: linkedinData?.data?.data?.posts?.length || 0,
                profileData: linkedinData?.data?.data?.company || null
              };
            } else {
              throw new Error('URL de LinkedIn no válida');
            }
            break;
          case 'tiktok':
            const tiktokId = platform.url.match(/tiktok\.com\/@([a-zA-Z0-9._-]+)/)?.[1];
            if (tiktokId) {
              console.log(`🎵 Loading TikTok data: @${tiktokId}`);
              const {
                data: tiktokData,
                error: tiktokError
              } = await supabase.functions.invoke('tiktok-scraper', {
                body: {
                  action: 'get_posts',
                  unique_id: tiktokId
                }
              });
              if (tiktokError) {
                console.error('TikTok scraper error:', tiktokError);
                throw new Error(`Error cargando datos: ${tiktokError.message}`);
              }
              result = {
                platform: platform.name,
                success: true,
                postsFound: tiktokData?.data?.videos?.length || 0,
                profileData: tiktokData?.data?.profile || null
              };
            } else {
              throw new Error('Username de TikTok no válido');
            }
            break;
          default:
            result = {
              platform: platform.name,
              success: false,
              postsFound: 0,
              error: 'Plataforma no soportada'
            };
        }
        console.log(`✅ ${platform.name} data loading completed:`, result);
        setDataResults(prev => [...prev, result]);
      } catch (error: any) {
        console.error(`❌ Error loading data from ${platform.name}:`, error);
        setDataResults(prev => [...prev, {
          platform: platform.name,
          success: false,
          postsFound: 0,
          error: error.message || 'Error desconocido'
        }]);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setCurrentLoading('');
    setLoadingData(false);
    console.log('🎉 All social media data loading completed');
  };
  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisResults([]);
    try {
      console.log('🚀 Iniciando análisis completo...');

      // 1. Calcular métricas de analytics para todas las plataformas
      setCurrentAnalyzing('Calculando métricas de rendimiento...');
      const {
        data: analyticsData,
        error: analyticsError
      } = await supabase.functions.invoke('calculate-social-analytics', {
        body: {} // Sin platform = todas las plataformas
      });
      if (analyticsError) {
        console.error('Error calculating analytics:', analyticsError);
        throw new Error(`Error calculando métricas: ${analyticsError.message}`);
      }

      // 2. Ejecutar análisis premium con IA
      setCurrentAnalyzing('Generando insights premium con IA avanzada...');
      const {
        data: premiumAnalysis,
        error: premiumError
      } = await supabase.functions.invoke('premium-ai-insights', {
        body: {
          platform: null
        } // Analizar todas las plataformas
      });
      if (premiumError) {
        console.error('Error in premium analysis:', premiumError);
        throw new Error(`Error en análisis premium: ${premiumError.message}`);
      }

      // Consolidar resultados
      const totalInsights = premiumAnalysis?.analysis?.insights?.length || 0;
      const totalActionables = premiumAnalysis?.analysis?.actionables?.length || 0;
      const totalRecommendations = premiumAnalysis?.analysis?.recommendations?.length || 0;
      console.log(`✅ Análisis completado: ${totalInsights} insights, ${totalActionables} actionables, ${totalRecommendations} recomendaciones`);

      // Crear resultado consolidado
      const result = {
        platform: 'Todas las plataformas',
        success: true,
        insightsGenerated: totalInsights,
        actionablesGenerated: totalActionables
      };
      setAnalysisResults([result]);
    } catch (error: any) {
      console.error('❌ Error in analysis:', error);
      setAnalysisResults([{
        platform: 'Análisis',
        success: false,
        error: error.message || 'Error desconocido'
      }]);
    } finally {
      setAnalyzing(false);
      setCurrentAnalyzing('');
    }
  };
  const saveSocialConnections = async () => {
    //if (!companyData?.id) return;
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('companies').update({
        facebook_url: socialConnections.facebook,
        instagram_url: socialConnections.instagram,
        twitter_url: socialConnections.twitter,
        youtube_url: socialConnections.youtube,
        tiktok_url: socialConnections.tiktok,
        linkedin_url: socialConnections.linkedin
      }).eq('id', companyData.id);
      if (error) throw error;
      if (!completedSteps.includes(6)) {
        setCompletedSteps(prev => [...prev, 6]);
      }
      toast({
        title: "Redes sociales guardadas",
        description: "La configuración de redes sociales ha sido actualizada."
      });
    } catch (error: any) {
      console.error('Error saving social connections:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de redes sociales.",
        variant: "destructive"
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
  const startConfiguration = async () => {
    console.log('🔗 Iniciando configuración...', {
      user: user?.id,
      companyData: companyData,
      profile: profile,
      'profile.user_id': profile?.user_id,
      'typeof profile': typeof profile,
      'profile keys': profile ? Object.keys(profile) : 'profile is null/undefined'
    });

    // Validar que tenemos información mínima requerida antes de enviar al webhook
    let companyName = companyData?.name;
    let websiteUrl = companyData?.website_url;

    // Asegurar que obtenemos la info directamente desde la tabla companies (sin usar profile)
    if (!companyName || !websiteUrl) {
      try {
        // Validar que tenemos user_id antes de hacer la consulta
        const userId = profile?.user_id || user?.id;
        if (!userId) {
          console.warn('No se puede obtener empresa: user_id no disponible en profile ni user');
          return;
        }
        const {
          data: membership,
          error: memberError
        } = await supabase.from('company_members').select('company_id').eq('user_id', userId).eq('is_primary', true).maybeSingle();
        if (!memberError && membership?.company_id) {
          const companyId = membership.company_id;
          const {
            data: freshCompany,
            error: companyError
          } = await supabase.from('companies').select('name,website_url').eq('id', companyId).maybeSingle();
          if (!companyError && freshCompany) {
            companyName = freshCompany.name;
            websiteUrl = freshCompany.website_url;
          }
        }
      } catch (e) {
        console.warn('No se pudo refrescar datos de companies:', e);
      }
    }
    // Normalizar valores
    companyName = companyName?.trim();
    websiteUrl = websiteUrl?.trim();
    if (!websiteUrl || !companyName) {
      console.log('⚠️ Información insuficiente para webhook (desde companies). Continuando sin webhook.', {
        companyName,
        websiteUrl
      });
      toast({
        title: "Configuración guardada",
        description: "La información ha sido guardada. Puedes completar el nombre y sitio web más adelante.",
        variant: "default"
      });
      nextStep();
      return;
    }

    // Llamar webhook de n8n cuando se hace clic en "Comenzar configuración"
    {
      console.log('🔗 Ejecutando webhook n8n al comenzar configuración con datos:', {
        companyName,
        websiteUrl,
        industry: companyData?.industry_sector
      });
      setLoading(true);
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
          body: {
            KEY: 'INFO',
            COMPANY_INFO: JSON.stringify({
              company_name: companyName,
              website_url: websiteUrl,
              country: companyData?.country || 'No especificado'
            }),
            ADDITIONAL_INFO: JSON.stringify({
              industry: companyData?.industry_sector,
              description: companyData?.descripcion_empresa || ''
            })
          }
        });
        if (error) {
          console.error('Error ejecutando webhook n8n:', error);
          toast({
            title: "Error",
            description: "No se pudo obtener información adicional de la empresa",
            variant: "destructive"
          });
        } else {
          console.log('✅ Webhook n8n ejecutado exitosamente:', data);

          // Procesar la respuesta y actualizar la empresa si hay datos útiles
          if (data?.success && data?.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log('📊 Procesando respuesta del webhook...');
            const responseArray = data.data[0]?.response || [];

            // Extraer todos los datos de la respuesta
            const descripcionItem = responseArray.find((item: any) => item.key === 'descripcion_empresa');
            const industriaItem = responseArray.find((item: any) => item.key === 'industria_principal');
            const facebookItem = responseArray.find((item: any) => item.key === 'facebook');
            const twitterItem = responseArray.find((item: any) => item.key === 'twitter');
            const linkedinItem = responseArray.find((item: any) => item.key === 'linkedin');
            const instagramItem = responseArray.find((item: any) => item.key === 'instagram');
            const youtubeItem = responseArray.find((item: any) => item.key === 'youtube');
            const tiktokItem = responseArray.find((item: any) => item.key === 'tiktok');

            // Validar si hay información útil
            const hasUsefulInfo = (value: string) => {
              return value && value !== 'No se encontró información' && value !== 'No tiene' && !value.includes('No se encontró información específica') && !value.includes('No se pudo determinar') && !value.includes('[URL de') &&
              // Evitar plantillas sin completar
              !value.includes('[Nombre del') && !value.includes('[Descripción');
            };

            // Preparar datos para actualizar
            const updateData: any = {
              webhook_data: data.data,
              webhook_processed_at: new Date().toISOString()
            };

            // Solo actualizar campos que tienen información válida
            if (descripcionItem && hasUsefulInfo(descripcionItem.value)) {
              updateData.descripcion_empresa = descripcionItem.value;
            }
            if (industriaItem && hasUsefulInfo(industriaItem.value)) {
              updateData.industria_principal = industriaItem.value;
            }
            if (facebookItem && hasUsefulInfo(facebookItem.value)) {
              updateData.facebook_url = facebookItem.value;
            }
            if (twitterItem && hasUsefulInfo(twitterItem.value)) {
              updateData.twitter_url = twitterItem.value;
            }
            if (linkedinItem && hasUsefulInfo(linkedinItem.value)) {
              updateData.linkedin_url = linkedinItem.value;
            }
            if (instagramItem && hasUsefulInfo(instagramItem.value)) {
              updateData.instagram_url = instagramItem.value;
            }
            if (youtubeItem && hasUsefulInfo(youtubeItem.value)) {
              updateData.youtube_url = youtubeItem.value;
            }
            if (tiktokItem && hasUsefulInfo(tiktokItem.value)) {
              updateData.tiktok_url = tiktokItem.value;
            }

            // Actualizar la empresa con todos los datos obtenidos
            const {
              error: updateError
            } = await supabase.from('companies').update(updateData).eq('id', companyData.id);
            if (!updateError) {
              // Actualizar el estado local
              setCompanyData(prev => ({
                ...prev,
                ...updateData
              }));

              // Actualizar estados específicos
              if (updateData.descripcion_empresa) {
                setTempDescription(updateData.descripcion_empresa);
                setEditingDescription(false); // Desactivar modo de edición para mostrar la descripción obtenida
              }

              // Actualizar conexiones sociales si se encontraron
              const newSocialConnections = {
                ...socialConnections
              };
              if (updateData.facebook_url) newSocialConnections.facebook = updateData.facebook_url;
              if (updateData.twitter_url) newSocialConnections.twitter = updateData.twitter_url;
              if (updateData.linkedin_url) newSocialConnections.linkedin = updateData.linkedin_url;
              if (updateData.instagram_url) newSocialConnections.instagram = updateData.instagram_url;
              if (updateData.youtube_url) newSocialConnections.youtube = updateData.youtube_url;
              if (updateData.tiktok_url) newSocialConnections.tiktok = updateData.tiktok_url;
              setSocialConnections(newSocialConnections);
              console.log('✅ Información completa de empresa actualizada:', updateData);

              // Mostrar mensaje informativo sobre qué se encontró
              const foundItems = [];
              if (updateData.descripcion_empresa) foundItems.push('descripción');
              if (updateData.industria_principal) foundItems.push('industria');
              if (updateData.facebook_url || updateData.twitter_url || updateData.linkedin_url || updateData.instagram_url || updateData.youtube_url || updateData.tiktok_url) {
                foundItems.push('redes sociales');
              }
              if (foundItems.length > 0) {
                toast({
                  title: "Información obtenida",
                  description: `Se ha cargado: ${foundItems.join(', ')} de tu empresa`
                });
              }
            } else {
              console.error('Error actualizando empresa:', updateError);
            }
          }
        }
      } catch (error) {
        console.error('Error en llamada al webhook n8n:', error);
        toast({
          title: "Error",
          description: "Error al procesar información de la empresa",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    // Avanzar al siguiente paso independientemente del resultado del webhook
    nextStep();
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const goToStep = async (step: number) => {
    setCurrentStep(step);
  };

  // Función para obtener el contenido del paso actual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Card className="max-w-2xl mx-auto">
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
              <Button onClick={startConfiguration} className="w-full" size="lg" disabled={loading}>
                {loading ? <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Obteniendo información...
                  </> : <>
                    Comenzar configuración
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>}
              </Button>
            </CardContent>
          </Card>;
      case 2:
        return <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-6 h-6 mr-2 text-primary" />
                Descripción de tu negocio
              </CardTitle>
              <p className="text-muted-foreground">
                {companyData?.descripcion_empresa ? "Encontramos esta descripción de tu negocio. Revísala y ajústala si es necesario." : "Cuéntanos sobre tu negocio para que ERA pueda entender mejor tu industria y objetivos."}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!editingDescription && companyData?.descripcion_empresa ? <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      {companyData?.descripcion_empresa}
                    </p>
                  </div>
                  <Button onClick={() => {
                setEditingDescription(true);
                setTempDescription(companyData?.descripcion_empresa || "");
              }} variant="outline" className="w-full">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar descripción
                  </Button>
                </div> : <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción del negocio</Label>
                    <Textarea id="description" rows={4} value={tempDescription} onChange={e => setTempDescription(e.target.value)} placeholder="Describe tu negocio, los productos o servicios que ofreces, tu público objetivo y lo que te hace único..." className="resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveDescription} disabled={loading || !tempDescription.trim()} className="flex-1">
                      {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Guardar
                    </Button>
                    <Button onClick={() => {
                  setEditingDescription(false);
                  setTempDescription(companyData?.descripcion_empresa || "");
                }} variant="outline">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>}

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
                <Button onClick={nextStep} disabled={!companyData?.descripcion_empresa && !tempDescription.trim()}>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>;
      case 3:
        return <Card className="max-w-2xl mx-auto">
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
              {showGeneratedStrategy ? <div className="space-y-6">
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
                      <textarea className="w-full p-3 border rounded-lg resize-none" rows={3} value={tempStrategyData.mission} onChange={e => setTempStrategyData(prev => ({
                    ...prev,
                    mission: e.target.value
                  }))} placeholder="Misión de la empresa..." />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Visión</label>
                      <textarea className="w-full p-3 border rounded-lg resize-none" rows={3} value={tempStrategyData.vision} onChange={e => setTempStrategyData(prev => ({
                    ...prev,
                    vision: e.target.value
                  }))} placeholder="Visión de la empresa..." />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Propuesta de Valor</label>
                      <textarea className="w-full p-3 border rounded-lg resize-none" rows={3} value={tempStrategyData.propuesta_valor} onChange={e => setTempStrategyData(prev => ({
                    ...prev,
                    propuesta_valor: e.target.value
                  }))} placeholder="Propuesta de valor..." />
                    </div>
                  </div>

                </div> : !strategyData.vision && !strategyData.mission && !strategyData.propuesta_valor ? <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    {loading ? <>
                        <RefreshCw className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
                        <p className="text-muted-foreground">
                          ERA está generando automáticamente tu estrategia empresarial...
                        </p>
                      </> : <p className="text-muted-foreground">
                        Generando estrategia automáticamente con ERA
                      </p>}
                  </div>
                </div> : <div className="space-y-6">
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
                </div>}

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
                <Button onClick={async () => {
                // Si hay estrategia generada sin guardar, guardarla primero
                if (showGeneratedStrategy && tempStrategyData) {
                  await acceptGeneratedStrategy();
                }
                nextStep();
              }} disabled={!showGeneratedStrategy && (!strategyData.vision || !strategyData.mission || !strategyData.propuesta_valor)}>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>;
      case 4:
        return <Card className="max-w-2xl mx-auto">
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
              {generatingObjectives ? <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground mb-4">
                      ERA está analizando tu estrategia empresarial para generar objetivos específicos de crecimiento...
                    </p>
                  </div>
                </div> : !showGeneratedObjectives && objectives.length === 0 ? <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      ERA generará automáticamente 3 objetivos de crecimiento basados en tu estrategia empresarial
                    </p>
                  </div>
                </div> : <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Objetivos de crecimiento
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      Ajusta los objetivos existentes o agrega nuevos. Recomendación: máximo 3 objetivos.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {(showGeneratedObjectives ? generatedObjectives : objectives).map((objective, index) => <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div>
                          <label className="text-sm font-medium">Título del objetivo</label>
                          <input type="text" value={objective.title} onChange={e => {
                      if (showGeneratedObjectives) {
                        const updated = [...generatedObjectives];
                        updated[index].title = e.target.value;
                        setGeneratedObjectives(updated);
                      } else {
                        const updated = [...objectives];
                        updated[index].title = e.target.value;
                        setObjectives(updated);
                      }
                    }} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder="Título del objetivo..." />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Descripción</label>
                          <textarea value={objective.description} onChange={e => {
                      if (showGeneratedObjectives) {
                        const updated = [...generatedObjectives];
                        updated[index].description = e.target.value;
                        setGeneratedObjectives(updated);
                      } else {
                        const updated = [...objectives];
                        updated[index].description = e.target.value;
                        setObjectives(updated);
                      }
                    }} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" rows={3} placeholder="Descripción detallada del objetivo..." />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium">Plazo</label>
                            <select value={objective.type} onChange={e => {
                        if (showGeneratedObjectives) {
                          const updated = [...generatedObjectives];
                          updated[index].type = e.target.value;
                          setGeneratedObjectives(updated);
                        } else {
                          const updated = [...objectives];
                          updated[index].type = e.target.value;
                          setObjectives(updated);
                        }
                      }} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                              <option value="short_term">Corto plazo</option>
                              <option value="medium_term">Mediano plazo</option>
                              <option value="long_term">Largo plazo</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Prioridad</label>
                            <select value={objective.priority} onChange={e => {
                        if (showGeneratedObjectives) {
                          const updated = [...generatedObjectives];
                          updated[index].priority = e.target.value;
                          setGeneratedObjectives(updated);
                        } else {
                          const updated = [...objectives];
                          updated[index].priority = e.target.value;
                          setObjectives(updated);
                        }
                      }} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                              <option value="alta">Alta</option>
                              <option value="media">Media</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <Button onClick={() => {
                        if (showGeneratedObjectives) {
                          const updated = generatedObjectives.filter((_, i) => i !== index);
                          setGeneratedObjectives(updated);
                        } else {
                          const updated = objectives.filter((_, i) => i !== index);
                          setObjectives(updated);
                        }
                      }} variant="destructive" size="sm" className="w-full">
                              Eliminar
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {objective.type === 'short_term' ? 'Corto plazo' : objective.type === 'medium_term' ? 'Mediano plazo' : 'Largo plazo'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Prioridad {objective.priority}
                          </Badge>
                          {objective.timeframe && <Badge variant="default" className="text-xs">
                              {objective.timeframe}
                            </Badge>}
                        </div>
                      </div>)}
                  </div>

                  {(showGeneratedObjectives ? generatedObjectives.length : objectives.length) < 3 && <Button onClick={() => {
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
              }} variant="outline" className="w-full">
                      Agregar objetivo
                    </Button>}
                </div>}

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
                <Button onClick={async () => {
                if (showGeneratedObjectives) {
                  await acceptGeneratedObjectives();
                } else {
                  await saveObjectives();
                }
                nextStep();
              }} disabled={(showGeneratedObjectives ? generatedObjectives.length : objectives.length) === 0}>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>;
      case 5:
        return <Card className="max-w-2xl mx-auto">
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
              {loading ? <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground mb-4">
                      ERA está generando automáticamente tu identidad de marca basada en tu estrategia empresarial...
                    </p>
                  </div>
                </div> : !brandingData.visual_identity && !brandingData.primary_color ? <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      ERA generará automáticamente tu identidad de marca basada en tu estrategia empresarial
                    </p>
                  </div>
                </div> : <div className="space-y-6">
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
                      <textarea value={brandingData.visual_identity} onChange={e => setBrandingData(prev => ({
                    ...prev,
                    visual_identity: e.target.value
                  }))} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" rows={4} placeholder="Describe la identidad visual de tu marca..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Color Primario</label>
                        <div className="flex gap-2 mt-1">
                          <input type="color" value={brandingData.primary_color || "#000000"} onChange={e => setBrandingData(prev => ({
                        ...prev,
                        primary_color: e.target.value
                      }))} className="w-12 h-10 border rounded" />
                          <input type="text" value={brandingData.primary_color} onChange={e => setBrandingData(prev => ({
                        ...prev,
                        primary_color: e.target.value
                      }))} className="flex-1 px-3 py-2 border rounded-md text-sm" placeholder="#000000" />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Color Secundario</label>
                        <div className="flex gap-2 mt-1">
                          <input type="color" value={brandingData.secondary_color || "#000000"} onChange={e => setBrandingData(prev => ({
                        ...prev,
                        secondary_color: e.target.value
                      }))} className="w-12 h-10 border rounded" />
                          <input type="text" value={brandingData.secondary_color} onChange={e => setBrandingData(prev => ({
                        ...prev,
                        secondary_color: e.target.value
                      }))} className="flex-1 px-3 py-2 border rounded-md text-sm" placeholder="#000000" />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Color Complementario 1</label>
                        <div className="flex gap-2 mt-1">
                          <input type="color" value={brandingData.complementary_color_1 || "#000000"} onChange={e => setBrandingData(prev => ({
                        ...prev,
                        complementary_color_1: e.target.value
                      }))} className="w-12 h-10 border rounded" />
                          <input type="text" value={brandingData.complementary_color_1} onChange={e => setBrandingData(prev => ({
                        ...prev,
                        complementary_color_1: e.target.value
                      }))} className="flex-1 px-3 py-2 border rounded-md text-sm" placeholder="#000000" />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Color Complementario 2</label>
                        <div className="flex gap-2 mt-1">
                          <input type="color" value={brandingData.complementary_color_2 || "#000000"} onChange={e => setBrandingData(prev => ({
                        ...prev,
                        complementary_color_2: e.target.value
                      }))} className="w-12 h-10 border rounded" />
                          <input type="text" value={brandingData.complementary_color_2} onChange={e => setBrandingData(prev => ({
                        ...prev,
                        complementary_color_2: e.target.value
                      }))} className="flex-1 px-3 py-2 border rounded-md text-sm" placeholder="#000000" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>}

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
                <Button onClick={async () => {
                await saveBranding(brandingData);
                nextStep();
              }} disabled={!brandingData.visual_identity && !brandingData.primary_color}>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>;
      case 6:
        return <Card className="max-w-2xl mx-auto">
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
                    <Input id="facebook" value={socialConnections.facebook} onChange={e => setSocialConnections(prev => ({
                    ...prev,
                    facebook: e.target.value
                  }))} placeholder="https://facebook.com/tu-empresa" className="mt-1" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <div className="flex-1">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" value={socialConnections.instagram} onChange={e => setSocialConnections(prev => ({
                    ...prev,
                    instagram: e.target.value
                  }))} placeholder="https://instagram.com/tu-empresa" className="mt-1" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  <div className="flex-1">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input id="linkedin" value={socialConnections.linkedin} onChange={e => setSocialConnections(prev => ({
                    ...prev,
                    linkedin: e.target.value
                  }))} placeholder="https://linkedin.com/company/tu-empresa" className="mt-1" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-sky-500" />
                  <div className="flex-1">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input id="twitter" value={socialConnections.twitter} onChange={e => setSocialConnections(prev => ({
                    ...prev,
                    twitter: e.target.value
                  }))} placeholder="https://twitter.com/tu-empresa" className="mt-1" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Youtube className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input id="youtube" value={socialConnections.youtube} onChange={e => setSocialConnections(prev => ({
                    ...prev,
                    youtube: e.target.value
                  }))} placeholder="https://youtube.com/@tu-empresa" className="mt-1" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-black dark:text-white" />
                  <div className="flex-1">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input id="tiktok" value={socialConnections.tiktok} onChange={e => setSocialConnections(prev => ({
                    ...prev,
                    tiktok: e.target.value
                  }))} placeholder="https://tiktok.com/@tu-empresa" className="mt-1" />
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
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar configuración
              </Button>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button onClick={async () => {
                await saveSocialConnections();
                nextStep();
              }} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <>
                      Siguiente
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>}
                </Button>
              </div>
            </CardContent>
          </Card>;
      case 7:
        return <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-6 h-6 mr-2 text-primary" />
                Carga de datos de redes sociales
              </CardTitle>
              <p className="text-muted-foreground">
                Cargando información, analytics e insights de tus redes sociales conectadas
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {dataResults.length === 0 && !loadingData && !analyzing ? <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      ERA iniciará automáticamente la carga de datos de tus redes sociales conectadas
                    </p>
                    <div className="text-sm text-muted-foreground">
                      Preparando carga de datos...
                    </div>
                  </div>
                </div> : loadingData ? <div className="space-y-4">
                  <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium mb-2">Cargando datos...</h3>
                    {currentLoading && <p className="text-muted-foreground">
                        Procesando: {currentLoading}
                      </p>}
                  </div>
                  
                  {dataResults.length > 0 && <div className="space-y-3">
                      {dataResults.map((result, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {result.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                            <span className="font-medium">{result.platform}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.success ? `${result.postsFound} posts cargados` : result.error}
                          </div>
                        </div>)}
                    </div>}
                </div> : analyzing ? <div className="space-y-4">
                  <div className="text-center">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-medium mb-2">Generando insights inteligentes...</h3>
                    <p className="text-muted-foreground">
                      ERA está analizando tus datos para crear estrategias personalizadas
                    </p>
                  </div>
                  
                  {analysisResults.length > 0 && <div className="space-y-3">
                      {analysisResults.map((result, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {result.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                            <span className="font-medium">{result.platform}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.success ? `${result.insights} insights generados` : result.error}
                          </div>
                        </div>)}
                    </div>}
                </div> : <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">¡Proceso completado exitosamente!</h3>
                    <p className="text-muted-foreground">
                      Se ha completado la carga e análisis de tus redes sociales
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {dataResults.map((result, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                          <span className="font-medium">{result.platform}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.success ? `${result.postsFound} posts cargados` : result.error}
                        </div>
                      </div>)}
                  </div>

                  {analysisResults.length > 0 && <>
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Análisis inteligente completado</h4>
                        <div className="space-y-3">
                          {analysisResults.map((result, index) => <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Brain className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">{result.platform}</span>
                              </div>
                              <div className="text-sm text-blue-600 dark:text-blue-400">
                                {result.success ? `${result.insights} insights generados` : result.error}
                              </div>
                            </div>)}
                        </div>
                      </div>
                    </>}
                </div>}

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      ¿Qué estamos procesando?
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Cargamos tus publicaciones, calculamos analytics, y generamos insights inteligentes 
                      para crear estrategias personalizadas y recomendaciones específicas para tu negocio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button onClick={async () => {
                // Marcar onboarding como completado
                if (user) {
                  try {
                    const registrationMethod = user.app_metadata?.provider || 'email';
                    await supabase.rpc('mark_onboarding_completed', {
                      _user_id: user.id,
                      _registration_method: registrationMethod
                    });
                  } catch (error) {
                    console.error('Error marking onboarding as completed:', error);
                  }
                }
                // Finalizar onboarding y ir al mando central
                navigate('/company-dashboard');
              }} disabled={loadingData || analyzing || dataResults.length === 0 && analysisResults.length === 0}>
                  {loadingData || analyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <>
                      Finalizar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>}
                </Button>
              </div>
            </CardContent>
          </Card>;
      case 8:
        return <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-6 h-6 mr-2 text-primary" />
                Análisis inteligente
              </CardTitle>
              <p className="text-muted-foreground">
                ERA está analizando tus datos para generar insights personalizados
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!analyzing && analysisResults.length === 0 ? <div className="text-center space-y-4">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                    <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Ahora analizaremos tus datos para generar insights y recomendaciones personalizadas
                    </p>
                    <Button onClick={runAnalysis} className="w-full">
                      <Brain className="w-4 h-4 mr-2" />
                      Iniciar análisis inteligente
                    </Button>
                  </div>
                </div> : analyzing ? <div className="space-y-4">
                  <div className="text-center">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-medium mb-2">Analizando datos...</h3>
                    {currentAnalyzing && <p className="text-muted-foreground">
                        {currentAnalyzing}
                      </p>}
                  </div>
                </div> : <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">¡Análisis completado!</h3>
                    <p className="text-muted-foreground">
                      ERA ha generado insights y recomendaciones para tu estrategia digital
                    </p>
                  </div>
                  
                  {analysisResults.map((result, index) => <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{result.platform}</span>
                        {result.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                      </div>
                      {result.success ? <div className="text-sm text-muted-foreground">
                          {result.insightsGenerated} insights generados • {result.actionablesGenerated} acciones recomendadas
                        </div> : <div className="text-sm text-red-600">{result.error}</div>}
                    </div>)}
                </div>}

              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                      Análisis con IA avanzada
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      ERA utiliza inteligencia artificial para analizar tus patrones de contenido, 
                      engagement y tendencias para generar recomendaciones estratégicas personalizadas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={prevStep} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button onClick={async () => {
                // Solo marcar como completado si es primera vez
                if (isFirstTime && user) {
                  try {
                    // Marcar DNA empresarial como completado
                    await supabase.from('user_onboarding_status').upsert({
                      user_id: user.id,
                      dna_empresarial_completed: true,
                      first_login_completed: true,
                      onboarding_completed_at: new Date().toISOString()
                    }, {
                      onConflict: 'user_id'
                    });

                    // Marcar onboarding general como completado
                    await supabase.rpc('mark_onboarding_completed', {
                      _user_id: user.id,
                      _registration_method: user.app_metadata?.provider || 'email'
                    });
                    console.log('DNA empresarial y onboarding marcados como completados');
                  } catch (error) {
                    console.error('Error marking DNA empresarial as completed:', error);
                  }
                }
                setIsOnboardingComplete(true);
                toast({
                  title: "¡Configuración Empresarial completada!",
                  description: isFirstTime ? "Tu empresa está configurada. Ahora conoce las funcionalidades clave." : "Cambios guardados exitosamente."
                });

                // Si es primera vez, redirigir para mostrar coachmarks
                // Si no es primera vez, quedarse en la misma vista  
                if (isFirstTime) {
                  setTimeout(() => {
                    window.location.href = '/company-dashboard?view=mando-central';
                  }, 2000);
                }
              }} disabled={analyzing || analysisResults.length === 0} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ir al Mando Central
                </Button>
              </div>
            </CardContent>
          </Card>;
      default:
        return null;
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header con progreso - solo mostrar para usuarios nuevos en onboarding */}
        {isFirstTime && !isOnboardingComplete && <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Configuración Inicial de tu Empresa</h1>
              <Badge variant="outline" className="text-sm">
                Paso {currentStep} de {totalSteps}
              </Badge>
            </div>
          
          {/* Barra de progreso */}
          <div className="space-y-2">
            <Progress value={completedSteps.length / totalSteps * 100} className="h-2" />
            
          </div>

            {/* Navegación de pasos - solo para usuarios nuevos */}
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                {Array.from({
              length: totalSteps
            }, (_, i) => i + 1).map(step => <button key={step} onClick={() => goToStep(step)} className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors", step === currentStep ? "bg-primary text-primary-foreground" : completedSteps.includes(step) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                    {completedSteps.includes(step) && step !== currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                  </button>)}
              </div>
            </div>
          </div>}

        {/* Contenido del paso actual */}
        <div className="animate-fade-in">
          {renderStepContent()}
        </div>

        {/* Resumen al completar */}
        {isOnboardingComplete && <Card className="max-w-2xl mx-auto mt-8 border-green-200 dark:border-green-800">
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
          </Card>}
      </div>
    </div>;
};
export default ADNEmpresa;