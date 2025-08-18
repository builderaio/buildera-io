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

import { useOnboardingStep } from "@/hooks/useOnboardingStep";
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
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true); // Nueva variable para controlar primera vez
  const [user, setUser] = useState<any>(null);

  // Hook para manejar el tracking de pasos
  const {
    currentStep,
    updateCurrentStep,
    nextStep,
    goToStep
  } = useOnboardingStep(user?.id);

  // Estados para los datos
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // Nuevo estado para tracking de carga inicial
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

  const totalSteps = 7;
  useEffect(() => {
    if (profile?.user_id) {
      console.log('🚀 Usuario detectado, iniciando carga básica de datos para:', profile.user_id);
      // Solo cargar datos de empresa inicialmente
      fetchCompanyData().then(() => {
        setDataLoaded(true);
      });
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

  // Función para verificar si es primera vez del usuario
  const checkIfFirstTime = async () => {
    try {
      // Verificar el estado del onboarding del usuario
      const {
        data: onboardingStatus,
        error
      } = await supabase.from('user_onboarding_status').select('dna_empresarial_completed, current_step').eq('user_id', profile?.user_id).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', error);
        return;
      }

      // Si no existe registro o no ha completado el DNA empresarial, es primera vez
      const isFirstTimeUser = !onboardingStatus || !onboardingStatus.dna_empresarial_completed;
      setIsFirstTime(isFirstTimeUser);

      // AJUSTE 1: El paso se restaura automáticamente por el hook useOnboardingStep
      if (onboardingStatus?.current_step && isFirstTimeUser) {
        console.log(`📍 Restaurando progreso: paso ${onboardingStatus.current_step}`);
        // El currentStep ya se maneja en el hook
      }

      // Si es primera vez y hay un website_url, intentar cargar información automáticamente
      if (isFirstTimeUser && (profile?.website_url || companyData?.website_url)) {
        await loadCompanyInfoFromWebhook();
      }

      // Si no es primera vez, saltar al modo de edición
      if (!isFirstTimeUser) {
        setIsOnboardingComplete(true);
        goToStepLocal(totalSteps); // Ir al último paso para mostrar resumen
      } else {
        // Si es primera vez y no hay descripción, activar modo de edición automáticamente
        if (!companyData?.description) {
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
      if (companyData?.webhook_data && companyData?.description) {
        console.log('✅ Información ya disponible desde webhook');
        return;
      }

      // Si no hay descripción pero hay webhook_data, procesarla
      if (companyData?.webhook_data && !companyData?.description) {
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
                description: descripcionItem.value
              }));
              console.log('✅ Descripción actualizada desde webhook existente');
            }
          }
        }
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
      if (!companyData?.id) {
        console.log('🔍 fetchStrategy: No company ID available');
        return;
      }
      console.log('🔍 fetchStrategy: Buscando estrategia para company_id:', companyData.id);
      const {
        data,
        error
      } = await supabase.from('company_strategy').select('*').eq('company_id', companyData.id).order('created_at', {
        ascending: false
      }).limit(1);
      if (error) throw error;
      console.log('🔍 fetchStrategy: Resultado de búsqueda:', data);
      if (data && data.length > 0) {
        const strategy = data[0];
        const strategyToSet = {
          vision: strategy.vision || "",
          mission: strategy.mision || "",
          propuesta_valor: strategy.propuesta_valor || ""
        };
        console.log('✅ fetchStrategy: Cargando estrategia existente:', strategyToSet);
        setStrategyData(strategyToSet);
        
        // Si estamos en el paso 3 y se cargaron datos existentes, mostrarlos
        if (currentStep === 3) {
          console.log('📊 Mostrando estrategia existente en paso 3');
        }
      } else {
        console.log('🔍 fetchStrategy: No se encontró estrategia existente para la empresa');
        // Limpiar strategyData para asegurar que el useEffect detecte la falta de datos
        setStrategyData({
          vision: "",
          mission: "",
          propuesta_valor: ""
        });
      }
    } catch (error: any) {
      console.error('❌ fetchStrategy: Error fetching strategy:', error);
    }
  };
  const fetchBranding = async () => {
    try {
      if (!companyData?.id) {
        console.log('🔍 fetchBranding: No company ID available');
        return;
      }
      console.log('🔍 fetchBranding: Buscando branding para company_id:', companyData.id);
      const {
        data,
        error
      } = await supabase.from('company_branding').select('*').eq('company_id', companyData.id).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      console.log('🔍 fetchBranding: Resultado de búsqueda:', data);
      if (data) {
        const brandingToSet = {
          primary_color: data.primary_color || "",
          secondary_color: data.secondary_color || "",
          complementary_color_1: data.complementary_color_1 || "",
          complementary_color_2: data.complementary_color_2 || "",
          visual_identity: data.visual_identity || ""
        };
        console.log('✅ fetchBranding: Cargando branding existente:', brandingToSet);
        setBrandingData(brandingToSet);
      } else {
        console.log('🔍 fetchBranding: No se encontró branding existente para la empresa');
      }
    } catch (error: any) {
      console.error('❌ fetchBranding: Error fetching branding:', error);
    }
  };
  const fetchObjectives = async () => {
    try {
      if (!companyData?.id) {
        console.log('🔍 fetchObjectives: No company ID available');
        return;
      }
      console.log('🔍 fetchObjectives: Buscando objetivos para company_id:', companyData.id);
      const {
        data,
        error
      } = await supabase.from('company_objectives').select('*').eq('company_id', companyData.id).order('priority', {
        ascending: true
      });
      if (error) throw error;
      console.log('🔍 fetchObjectives: Resultado de búsqueda:', data);
      console.log('✅ fetchObjectives: Cargando objetivos existentes:', data || []);
      setObjectives(data || []);
    } catch (error: any) {
      console.error('❌ fetchObjectives: Error fetching objectives:', error);
    }
  };
  const fetchSocialConnections = async () => {
    try {
      if (!companyData?.id) {
        console.log('🔍 fetchSocialConnections: No company ID available');
        return;
      }
      console.log('🔍 fetchSocialConnections: Buscando datos sociales para company_id:', companyData.id);

      // Buscar por company_id en lugar de created_by
      const {
        data: company,
        error
      } = await supabase.from('companies').select('*').eq('id', companyData.id).maybeSingle();
      if (error) throw error;
      console.log('🔍 fetchSocialConnections: Resultado de búsqueda:', company);
      if (company) {
        const socialData = {
          facebook: company.facebook_url || "",
          instagram: company.instagram_url || "",
          twitter: company.twitter_url || "",
          youtube: company.youtube_url || "",
          tiktok: company.tiktok_url || "",
          linkedin: company.linkedin_url || ""
        };
        console.log('✅ fetchSocialConnections: Cargando conexiones sociales existentes:', socialData);
        setSocialConnections(socialData);
      } else {
        console.log('🔍 fetchSocialConnections: No se encontraron datos sociales para la empresa');
      }
    } catch (error: any) {
      console.error('❌ fetchSocialConnections: Error fetching social connections:', error);
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
      updateCurrentStep(1);
    }
  };

  // Cargar datos de estrategia cuando se entre al paso 3
  useEffect(() => {
    if (dataLoaded && currentStep === 3) {
      console.log('📊 Cargando datos de estrategia para el paso 3');
      fetchStrategy();
    }
  }, [dataLoaded, currentStep]);

  // Cargar datos de objetivos cuando se entre al paso 4
  useEffect(() => {
    if (dataLoaded && currentStep === 4) {
      console.log('🎯 Cargando datos de objetivos para el paso 4');
      fetchObjectives();
    }
  }, [dataLoaded, currentStep]);

  // Cargar datos de branding cuando se entre al paso 5
  useEffect(() => {
    if (dataLoaded && currentStep === 5) {
      console.log('🎨 Cargando datos de branding para el paso 5');
      fetchBranding();
    }
  }, [dataLoaded, currentStep]);

  // AJUSTE 2 y 3: Auto-cargar datos de redes sociales cuando se entre al paso 7 SOLO si no hay datos
  useEffect(() => {
    console.log('📥 Checking social data auto-loading:', {
      currentStep,
      dataResultsLength: dataResults.length,
      loadingData,
      analyzing,
      hasSocialConnections: Object.values(socialConnections).some(url => url.trim() !== '')
    });
    if (currentStep === 7 && !loadingData && !analyzing && dataResults.length === 0 && Object.values(socialConnections).some(url => url.trim() !== '')) {
      console.log('🚀 Cargando datos de redes sociales automáticamente (sin datos previos)');
      loadSocialData();
    }
  }, [currentStep, loadingData, analyzing, dataResults.length, socialConnections]);

  // AJUSTE 2 y 3: Auto-ejecutar análisis inteligente después de cargar datos SOLO si no hay análisis previo
  useEffect(() => {
    if (currentStep === 7 && !loadingData && !analyzing && dataResults.length > 0 && analysisResults.length === 0) {
      console.log('🧠 Ejecutando análisis inteligente automáticamente (sin análisis previo)');
      runAnalysis();
    }
  }, [currentStep, loadingData, analyzing, dataResults.length, analysisResults.length]);
  const generateStrategyWithAI = async () => {
    setLoading(true);
    try {
      // Verificar datos mínimos requeridos
      if (!companyData?.name || !companyData?.description) {
        throw new Error('Faltan datos de la empresa para generar la estrategia');
      }

      // Preparar información de la empresa para el webhook
      const companyInfo = {
        company_name: companyData.name,
        industry_sector: companyData.industry_sector || 'No especificado',
        company_size: companyData.company_size || 'No especificado',
        website_url: companyData.website_url || '',
        country: companyData?.country || user?.user_metadata?.country || 'No especificado',
        description: companyData.description || ''
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
        description: companyData?.description || ''
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
        description: companyData?.description,
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
        description: tempDescription
      }));
      setEditingDescription(false);
      if (!completedSteps.includes(2)) {
        setCompletedSteps(prev => [...prev, 2]);
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
      if (!companyData?.id) {
        throw new Error('No se encontró la empresa asociada');
      }
      const {
        error
      } = await supabase.from('company_strategy').upsert({
        company_id: companyData.id,
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
      if (!companyData?.id) {
        throw new Error('No se encontró la empresa asociada');
      }
      const {
        error
      } = await supabase.from('company_branding').upsert({
        company_id: companyData.id,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        complementary_color_1: data.complementary_color_1,
        complementary_color_2: data.complementary_color_2,
        visual_identity: data.visual_identity
      }, {
        onConflict: 'company_id'
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
      if (!companyData?.id) {
        throw new Error('No se encontró la empresa asociada');
      }

      // Primero eliminar objetivos existentes
      const {
        error: deleteError
      } = await supabase.from('company_objectives').delete().eq('company_id', companyData.id);
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
        company_id: companyData.id,
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
      if (!companyData?.id) {
        throw new Error('No se encontró la empresa asociada');
      }

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
        company_id: companyData.id,
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
  // AJUSTE 1: Función para persistir el paso actual en la base de datos
  const persistCurrentStep = async (step: number) => {
    if (!profile?.user_id) return;
    try {
      await supabase.from('user_onboarding_status').upsert({
        user_id: profile.user_id,
        current_step: step,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      console.log(`💾 Paso ${step} persistido en base de datos`);
    } catch (error) {
      console.error('Error persistiendo paso actual:', error);
    }
  };
  const nextStepLocal = async () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;

      // Usar el hook para actualizar el paso
      await updateCurrentStep(newStep);

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
          } = await supabase.from('companies').select('name,website_url,description').eq('id', companyId).maybeSingle();
          if (!companyError && freshCompany) {
            companyName = freshCompany.name;
            websiteUrl = freshCompany.website_url;
            const existingDesc = (freshCompany.description || '').trim();
            if (existingDesc) {
              // Ya existe descripción, saltar webhook
              setCompanyData(prev => prev ? { ...prev, description: freshCompany.description } : prev);
              setTempDescription(freshCompany.description);
              toast({ title: 'Información encontrada', description: 'Ya existe una descripción, omitimos la llamada al webhook.' });
              nextStepLocal();
              return;
            }
          }
        }
      } catch (e) {
        console.warn('No se pudo refrescar datos de companies:', e);
      }
    }

    // Si en estado ya hay descripción, también omitir webhook
    if ((companyData?.description || '').trim()) {
      toast({ title: 'Información encontrada', description: 'Ya existe una descripción, omitimos la llamada al webhook.' });
      setTempDescription(companyData!.description);
      nextStepLocal();
      return;
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
      nextStepLocal();
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
              country: companyData?.country || user?.user_metadata?.country || 'No especificado'
            }),
            ADDITIONAL_INFO: JSON.stringify({
              industry: companyData?.industry_sector,
              description: companyData?.description || ''
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

          // Llamar a la función process-company-webhooks para procesar y guardar los datos
          if (data?.success && data?.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log('📊 Procesando respuesta del webhook...');
            try {
              const {
                error: processError
              } = await supabase.functions.invoke('process-company-webhooks', {
                body: {
                  user_id: user?.id || profile?.user_id,
                  company_name: companyName,
                  website_url: websiteUrl,
                  country: companyData?.country || user?.user_metadata?.country || 'No especificado',
                  trigger_type: 'update',
                  webhook_data: data.data
                }
              });
              if (processError) {
                console.error('Error procesando webhook:', processError);
              } else {
                console.log('✅ Datos del webhook procesados y guardados correctamente');

                // Refrescar los datos de la empresa desde la base de datos
                await fetchCompanyData();
                toast({
                  title: "Información obtenida",
                  description: "Se ha cargado información adicional de tu empresa"
                });
              }
            } catch (processError) {
              console.error('Error llamando process-company-webhooks:', processError);
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
    nextStepLocal();
  };
  const prevStep = async () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;

      // Usar el hook para actualizar el paso
      await updateCurrentStep(newStep);
    }
  };
  const goToStepLocal = async (step: number) => {
    // Usar el hook para actualizar el paso
    await updateCurrentStep(step);
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
                {companyData?.description ? "Encontramos esta descripción de tu negocio. Revísala y ajústala si es necesario." : "Cuéntanos sobre tu negocio para que ERA pueda entender mejor tu industria y objetivos."}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!editingDescription && companyData?.description ? <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      {companyData?.description}
                    </p>
                  </div>
                  <Button onClick={() => {
                setEditingDescription(true);
                setTempDescription(companyData?.description || "");
              }} variant="outline" className="w-full">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar descripción
                  </Button>
                </div> : <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción del negocio</Label>
                    <Textarea id="description" rows={4} value={tempDescription} onChange={e => setTempDescription(e.target.value)} placeholder="Describe tu negocio, los productos o servicios que ofreces, tu público objetivo y lo que te hace único..." className="resize-none" />
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
                <Button 
                  onClick={async () => {
                    // Primero verificar si hay estrategia existente
                    await fetchStrategy();
                    
                    // Si no hay estrategia y hay descripción, generar automáticamente
                    if (!strategyData.vision && !strategyData.mission && !strategyData.propuesta_valor && companyData?.description) {
                      console.log('🤖 Generando estrategia automáticamente antes de ir al paso 3');
                      await generateStrategyWithAI();
                    }
                    
                    // Avanzar al siguiente paso
                    nextStep();
                  }} 
                  disabled={!companyData?.description && !tempDescription.trim()}
                >
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
                        onChange={e => setTempStrategyData(prev => ({
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
                        onChange={e => setTempStrategyData(prev => ({
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
                        onChange={e => setTempStrategyData(prev => ({
                          ...prev,
                          propuesta_valor: e.target.value
                        }))} 
                        placeholder="Propuesta de valor..." 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mission">Misión</Label>
                      <Textarea
                        id="mission"
                        value={strategyData.mission}
                        onChange={(e) => setStrategyData(prev => ({
                          ...prev,
                          mission: e.target.value
                        }))}
                        placeholder="¿Cuál es el propósito fundamental de tu empresa?"
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vision">Visión</Label>
                      <Textarea
                        id="vision"
                        value={strategyData.vision}
                        onChange={(e) => setStrategyData(prev => ({
                          ...prev,
                          vision: e.target.value
                        }))}
                        placeholder="¿Hacia dónde quieres llevar tu empresa en el futuro?"
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="value-proposition">Propuesta de Valor</Label>
                      <Textarea
                        id="value-proposition"
                        value={strategyData.propuesta_valor}
                        onChange={(e) => setStrategyData(prev => ({
                          ...prev,
                          propuesta_valor: e.target.value
                        }))}
                        placeholder="¿Qué valor único ofreces a tus clientes?"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  {(strategyData.vision || strategyData.mission || strategyData.propuesta_valor) && (
                    <div className="flex justify-center">
                      <Button onClick={generateStrategyWithAI} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerar con ERA
                      </Button>
                    </div>
                  )}
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
                    } else {
                      // Guardar los datos del formulario
                      await saveStrategy();
                    }
                    
                    // Cargar objetivos existentes
                    await fetchObjectives();
                    
                    // Si no hay objetivos, generar automáticamente
                    if (objectives.length === 0 && strategyData.vision && strategyData.mission && strategyData.propuesta_valor) {
                      console.log('🎯 Generando objetivos automáticamente antes de ir al paso 4');
                      await generateObjectivesWithAI();
                    }
                    
                    nextStep();
                  }} 
                  disabled={!showGeneratedStrategy && (!strategyData.vision || !strategyData.mission || !strategyData.propuesta_valor)}
                >
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
              {showGeneratedObjectives ? (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-5 h-5 text-blue-500" />
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">
                        Objetivos generados por ERA
                      </h3>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      Revisa los objetivos generados y ajústalos si es necesario antes de continuar.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {generatedObjectives.map((objective, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div>
                          <Label htmlFor={`gen-objective-title-${index}`}>Título del objetivo</Label>
                          <Input
                            id={`gen-objective-title-${index}`}
                            value={objective.title} 
                            onChange={e => {
                              const updated = [...generatedObjectives];
                              updated[index].title = e.target.value;
                              setGeneratedObjectives(updated);
                            }} 
                            placeholder="Título del objetivo..." 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`gen-objective-description-${index}`}>Descripción</Label>
                          <Textarea
                            id={`gen-objective-description-${index}`}
                            value={objective.description} 
                            onChange={e => {
                              const updated = [...generatedObjectives];
                              updated[index].description = e.target.value;
                              setGeneratedObjectives(updated);
                            }} 
                            placeholder="Descripción detallada del objetivo..."
                            className="min-h-[80px]" 
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`gen-objective-type-${index}`}>Plazo</Label>
                            <Select 
                              value={objective.type} 
                              onValueChange={value => {
                                const updated = [...generatedObjectives];
                                updated[index].type = value;
                                setGeneratedObjectives(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar plazo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short_term">Corto plazo</SelectItem>
                                <SelectItem value="medium_term">Mediano plazo</SelectItem>
                                <SelectItem value="long_term">Largo plazo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`gen-objective-priority-${index}`}>Prioridad</Label>
                            <Select 
                              value={objective.priority} 
                              onValueChange={value => {
                                const updated = [...generatedObjectives];
                                updated[index].priority = value;
                                setGeneratedObjectives(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar prioridad" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="medium">Media</SelectItem>
                                <SelectItem value="low">Baja</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`gen-objective-area-${index}`}>Área</Label>
                            <Select 
                              value={objective.area} 
                              onValueChange={value => {
                                const updated = [...generatedObjectives];
                                updated[index].area = value;
                                setGeneratedObjectives(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar área" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ventas">Ventas</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="operaciones">Operaciones</SelectItem>
                                <SelectItem value="financiero">Financiero</SelectItem>
                                <SelectItem value="tecnologia">Tecnología</SelectItem>
                                <SelectItem value="recursos_humanos">Recursos Humanos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => {
                            const updated = generatedObjectives.filter((_, i) => i !== index);
                            setGeneratedObjectives(updated);
                          }} 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Eliminar objetivo
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {generatedObjectives.length < 5 && (
                    <Button 
                      onClick={() => {
                        const newObjective = {
                          title: "",
                          description: "",
                          type: "medium_term",
                          priority: "medium",
                          area: "marketing"
                        };
                        setGeneratedObjectives([...generatedObjectives, newObjective]);
                      }} 
                      variant="outline" 
                      className="w-full"
                    >
                      Agregar objetivo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {objectives.map((objective, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div>
                          <Label htmlFor={`objective-title-${index}`}>Título del objetivo</Label>
                          <Input
                            id={`objective-title-${index}`}
                            value={objective.title}
                            onChange={e => {
                              const updated = [...objectives];
                              updated[index].title = e.target.value;
                              setObjectives(updated);
                            }}
                            placeholder="Título del objetivo..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`objective-description-${index}`}>Descripción</Label>
                          <Textarea
                            id={`objective-description-${index}`}
                            value={objective.description}
                            onChange={e => {
                              const updated = [...objectives];
                              updated[index].description = e.target.value;
                              setObjectives(updated);
                            }}
                            placeholder="Descripción detallada del objetivo..."
                            className="min-h-[80px]"
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`objective-type-${index}`}>Plazo</Label>
                            <Select 
                              value={objective.type} 
                              onValueChange={value => {
                                const updated = [...objectives];
                                updated[index].type = value;
                                setObjectives(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar plazo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short_term">Corto plazo</SelectItem>
                                <SelectItem value="medium_term">Mediano plazo</SelectItem>
                                <SelectItem value="long_term">Largo plazo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`objective-priority-${index}`}>Prioridad</Label>
                            <Select 
                              value={objective.priority} 
                              onValueChange={value => {
                                const updated = [...objectives];
                                updated[index].priority = value;
                                setObjectives(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar prioridad" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="medium">Media</SelectItem>
                                <SelectItem value="low">Baja</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`objective-area-${index}`}>Área</Label>
                            <Select 
                              value={objective.area} 
                              onValueChange={value => {
                                const updated = [...objectives];
                                updated[index].area = value;
                                setObjectives(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar área" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ventas">Ventas</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="operaciones">Operaciones</SelectItem>
                                <SelectItem value="financiero">Financiero</SelectItem>
                                <SelectItem value="tecnologia">Tecnología</SelectItem>
                                <SelectItem value="recursos_humanos">Recursos Humanos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => {
                            const updated = objectives.filter((_, i) => i !== index);
                            setObjectives(updated);
                          }} 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Eliminar objetivo
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {objectives.length === 0 && (
                    <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No hay objetivos definidos. Agrega al menos un objetivo para continuar.
                      </p>
                    </div>
                  )}
                  
                  {objectives.length < 5 && (
                    <Button 
                      onClick={() => {
                        const newObjective = {
                          title: "",
                          description: "",
                          type: "medium_term",
                          priority: "medium",
                          area: "marketing"
                        };
                        setObjectives([...objectives, newObjective]);
                      }} 
                      variant="outline" 
                      className="w-full"
                    >
                      Agregar objetivo
                    </Button>
                  )}
                  
                  {(objectives.length > 0) && (
                    <div className="flex justify-center">
                      <Button onClick={generateObjectivesWithAI} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerar con ERA
                      </Button>
                    </div>
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
                    
                    // Cargar branding existente
                    await fetchBranding();
                    
                    // Si no hay branding, generar automáticamente
                    if (!brandingData.visual_identity && !brandingData.primary_color && strategyData.vision && strategyData.mission && strategyData.propuesta_valor) {
                      console.log('🎨 Generando branding automáticamente antes de ir al paso 5');
                      await generateBrandingWithAI();
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
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="visual-identity">Identidad Visual</Label>
                    <Textarea
                      id="visual-identity"
                      value={brandingData.visual_identity}
                      onChange={(e) => setBrandingData(prev => ({
                        ...prev,
                        visual_identity: e.target.value
                      }))}
                      placeholder="Describe la identidad visual de tu marca..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary-color">Color Primario</Label>
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="color" 
                          value={brandingData.primary_color || "#000000"} 
                          onChange={e => setBrandingData(prev => ({
                            ...prev,
                            primary_color: e.target.value
                          }))} 
                          className="w-12 h-10 border rounded" 
                        />
                        <Input
                          type="text"
                          value={brandingData.primary_color}
                          onChange={e => setBrandingData(prev => ({
                            ...prev,
                            primary_color: e.target.value
                          }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="secondary-color">Color Secundario</Label>
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="color" 
                          value={brandingData.secondary_color || "#000000"} 
                          onChange={e => setBrandingData(prev => ({
                            ...prev,
                            secondary_color: e.target.value
                          }))} 
                          className="w-12 h-10 border rounded" 
                        />
                        <Input
                          type="text"
                          value={brandingData.secondary_color}
                          onChange={e => setBrandingData(prev => ({
                            ...prev,
                            secondary_color: e.target.value
                          }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="complementary-color-1">Color Complementario 1</Label>
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="color" 
                          value={brandingData.complementary_color_1 || "#000000"} 
                          onChange={e => setBrandingData(prev => ({
                            ...prev,
                            complementary_color_1: e.target.value
                          }))} 
                          className="w-12 h-10 border rounded" 
                        />
                        <Input
                          type="text"
                          value={brandingData.complementary_color_1}
                          onChange={e => setBrandingData(prev => ({
                            ...prev,
                            complementary_color_1: e.target.value
                          }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="complementary-color-2">Color Complementario 2</Label>
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="color" 
                          value={brandingData.complementary_color_2 || "#000000"} 
                          onChange={e => setBrandingData(prev => ({
                            ...prev,
                            complementary_color_2: e.target.value
                          }))} 
                          className="w-12 h-10 border rounded" 
                        />
                        <Input
                          type="text"
                          value={brandingData.complementary_color_2}
                          onChange={e => setBrandingData(prev => ({
                            ...prev,
                            complementary_color_2: e.target.value
                          }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {(brandingData.visual_identity || brandingData.primary_color) && (
                    <div className="flex justify-center">
                      <Button onClick={generateBrandingWithAI} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerar con ERA
                      </Button>
                    </div>
                  )}
                </div>
              </div>

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
                nextStepLocal();
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
            }, (_, i) => i + 1).map(step => <button key={step} onClick={() => goToStepLocal(step)} className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors", step === currentStep ? "bg-primary text-primary-foreground" : completedSteps.includes(step) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
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