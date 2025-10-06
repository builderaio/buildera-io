import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStepVerifications } from '@/hooks/useStepVerifications';
import { useAnalysisCache } from '@/hooks/useAnalysisCache';
import confetti from 'canvas-confetti';
import { 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Sparkles,
  MessageCircle,
  Zap,
  Settings,
  BarChart3,
  Users,
  FileText,
  Megaphone,
  ShoppingCart,
  Loader2,
  Save,
  ChevronDown,
  Maximize2,
  Clock,
  Pause,
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GuideStep {
  id: number;
  title: string;
  what: string;
  why: string;
  how: string;
  target_section: string;
  tab?: string;
  completed: boolean;
  icon: any;
  actionText: string;
  verificationText: string;
  color: string;
  requiresManualCompletion?: boolean;
}

interface SimpleEraGuideProps {
  userId: string;
  currentSection: string;
  onNavigate: (section: string, params?: Record<string, string>) => void;
}

const SimpleEraGuide = ({ userId, currentSection, onNavigate }: SimpleEraGuideProps) => {
  const { toast } = useToast();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [showTourBadge, setShowTourBadge] = useState(false); // 🆕 Badge de tour disponible
  
  // 🆕 Nuevos estados para mejoras
  const [autoMinimized, setAutoMinimized] = useState(false);
  const [temporarilyHidden, setTemporarilyHidden] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showPeek, setShowPeek] = useState(false);
  
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const lastInteractionRef = useRef<Date>(new Date());
  const recentlyMaximizedRef = useRef(false);  // 🆕 Prevenir auto-minimización inmediata
  const verifications = useStepVerifications(userId);
  const cacheData = useAnalysisCache(userId);  // 🆕 Obtener metadata de análisis

  const steps: GuideStep[] = [
    {
      id: 1,
      title: "Completa el ADN de tu Empresa",
      what: "Configura la información esencial de tu negocio.",
      why: "Esto permite que Era personalice todo el contenido y estrategias según tu identidad de marca única.",
      how: "Ve a ADN Empresa y completa tu misión, valores y productos/servicios. Sin esto, las recomendaciones serán genéricas.",
      target_section: "adn-empresa",
      completed: false,
      icon: Settings,
      actionText: "Ir a ADN Empresa",
      verificationText: "Verificar completado",
      color: "from-blue-500 to-blue-600",
      requiresManualCompletion: false
    },
    {
      id: 2,
      title: "Conecta tus Redes Sociales",
      what: "Vincula al menos una red social (LinkedIn, Instagram, Facebook o TikTok).",
      why: "Esto permite que Era analice tu audiencia actual, rendimiento de contenido y cree publicaciones optimizadas.",
      how: "Ve a Configuración en Marketing Hub y presiona 'Conectar' en al menos una plataforma. Recomendamos conectar todas las que uses.",
      target_section: "marketing-hub",
      tab: "configuracion",
      completed: false,
      icon: Zap,
      actionText: "Ir a Configuración",
      verificationText: "Verificar conexión",
      color: "from-green-500 to-green-600",
      requiresManualCompletion: false
    },
    {
      id: 3,
      title: "Configura URLs de tus Perfiles",
      what: "Agrega las URLs públicas de tus perfiles en redes sociales.",
      why: "Esto permite que Era analice tu contenido publicado y genere insights precisos sobre tu estrategia actual.",
      how: "En Configuración → Conexiones de Redes Sociales, agrega las URLs de tus perfiles conectados.",
      target_section: "marketing-hub",
      tab: "configuracion",
      completed: false,
      icon: MessageCircle,
      actionText: "Ir a Configuración",
      verificationText: "Verificar URLs",
      color: "from-purple-500 to-purple-600",
      requiresManualCompletion: false
    },
    {
      id: 4,
      title: "Analiza tu Audiencia",
      what: "Descubre quién conforma tu audiencia actual.",
      why: "Conocer demografía, intereses y comportamientos te permite crear contenido que realmente resuene con tu público.",
      how: "Ve a Audiencias y presiona 'Analizar con IA'. Era procesará tus datos y generará insights detallados.",
      target_section: "audiencias-manager",
      completed: false,
      icon: BarChart3,
      actionText: "Ir a Audiencias",
      verificationText: "Verificar análisis",
      color: "from-orange-500 to-orange-600",
      requiresManualCompletion: false
    },
    {
      id: 5,
      title: "Evalúa tu Contenido Existente",
      what: "Analiza el rendimiento de tus publicaciones anteriores.",
      why: "Identifica qué tipo de contenido funciona mejor para optimizar tu estrategia futura y aumentar el engagement.",
      how: "Ve a Análisis de Contenido e inicia el análisis. Era evaluará tus posts y te mostrará qué formatos y temas resonan más.",
      target_section: "content-analysis-dashboard",
      completed: false,
      icon: FileText,
      actionText: "Ir a Análisis de Contenido",
      verificationText: "Verificar análisis",
      color: "from-cyan-500 to-cyan-600",
      requiresManualCompletion: false
    },
    {
      id: 6,
      title: "Crea Segmentos de Audiencia",
      what: "Define buyer personas específicos por red social.",
      why: "Cada plataforma tiene diferentes audiencias. Personalizar tu mensaje por segmento aumenta la efectividad de tus campañas.",
      how: "En Audiencias, crea personas basados en los insights obtenidos. Define demografía, intereses y comportamientos específicos.",
      target_section: "audiencias-manager",
      completed: false,
      icon: Users,
      actionText: "Ir a Audiencias",
      verificationText: "Verificar segmentos",
      color: "from-pink-500 to-pink-600",
      requiresManualCompletion: false
    },
    {
      id: 7,
      title: "Diseña tu Primera Campaña",
      what: "Crea una campaña de marketing completa guiada por Era.",
      why: "Las campañas estructuradas generan mejores resultados que publicaciones aisladas. Era te ayudará a definir objetivos claros.",
      how: "Ve a Marketing Hub → Campañas y usa el asistente. Define objetivos, audiencia, estrategia y calendario de contenido.",
      target_section: "marketing-hub",
      completed: false,
      icon: Megaphone,
      actionText: "Ir a Campañas",
      verificationText: "✓ Completé este paso",
      color: "from-red-500 to-red-600",
      requiresManualCompletion: false
    },
    {
      id: 8,
      title: "Genera tu Primer Contenido con IA",
      what: "Crea publicaciones optimizadas usando la IA de Era.",
      why: "Ahorra tiempo y genera contenido profesional adaptado a cada plataforma y audiencia específica.",
      how: "Ve a Marketing Hub → Crear y selecciona el tipo de contenido. Era generará publicaciones listas para programar o publicar.",
      target_section: "marketing-hub",
      tab: "create",
      completed: false,
      icon: Sparkles,
      actionText: "Ir a Crear Contenido",
      verificationText: "Verificar contenido",
      color: "from-yellow-500 to-yellow-600",
      requiresManualCompletion: false
    },
    {
      id: 9,
      title: "Explora el Marketplace de Agentes",
      what: "Descubre agentes especializados para tu negocio.",
      why: "Amplía las capacidades de tu empresa con agentes de IA para ventas, atención al cliente, análisis y más.",
      how: "Visita el Marketplace y explora los agentes disponibles. Encuentra soluciones específicas para tus necesidades.",
      target_section: "marketplace",
      completed: false,
      icon: ShoppingCart,
      actionText: "Ir al Marketplace",
      verificationText: "✓ Completé este paso",
      color: "from-indigo-500 to-indigo-600",
      requiresManualCompletion: true
    }
  ];

  // 🆕 Auto-save cada 30 segundos con indicador visual
  useEffect(() => {
    if (!isActive || !userId) return;

    autoSaveIntervalRef.current = setInterval(() => {
      console.log('💾 Auto-guardando progreso del tour...');
      saveTourState(true);
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isActive, userId, currentStep, completedSteps]);

  // 🆕 Guardar y restaurar estado en localStorage para persistencia entre recargas (con userId y timestamp)
  useEffect(() => {
    if (isActive && userId) {
      const stateData = {
        active: true,
        step: currentStep,
        section: currentSection,
        minimized: isMinimized,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`simple-era-guide-active-${userId}`, JSON.stringify(stateData));
      console.log('💾 [SimpleEraGuide] Guardando estado en localStorage', stateData);
    } else if (!isActive && userId) {
      localStorage.removeItem(`simple-era-guide-active-${userId}`);
    }
  }, [isActive, currentStep, currentSection, isMinimized, userId]);

  // 🆕 Al cargar, verificar localStorage para restaurar estado (con validación de tiempo y sección)
  useEffect(() => {
    if (!loading && userId) {
      const savedStateStr = localStorage.getItem(`simple-era-guide-active-${userId}`);
      
      if (savedStateStr) {
        try {
          const savedState = JSON.parse(savedStateStr);
          const savedTimestamp = new Date(savedState.timestamp);
          const hoursSince = (new Date().getTime() - savedTimestamp.getTime()) / (1000 * 3600);
          
          console.log('🔄 [SimpleEraGuide] Verificando localStorage', { 
            savedState,
            hoursSince,
            currentSection,
            currentIsActive: isActive 
          });
          
          // Solo restaurar si:
          // 1. Han pasado menos de 24 horas
          // 2. Estamos en la misma sección donde se pausó (o sin sección guardada)
          if (hoursSince <= 24 && savedState.active && !isActive) {
            const isSameSection = !savedState.section || savedState.section === currentSection;
            
            if (isSameSection) {
              setIsActive(true);
              setCurrentStep(savedState.step || 1);
              setIsMinimized(savedState.minimized || false);
              console.log('✅ Restaurado desde localStorage');
            } else {
              console.log('⚠️ Sección diferente, no restaurar automáticamente');
              setShowTourBadge(true); // Mostrar badge para continuar tour
            }
          } else if (hoursSince > 24) {
            console.log('⏰ Estado expirado (>24h), limpiando...');
            localStorage.removeItem(`simple-era-guide-active-${userId}`);
          }
        } catch (error) {
          console.error('❌ Error parsing localStorage state:', error);
          localStorage.removeItem(`simple-era-guide-active-${userId}`);
        }
      }
    }
  }, [loading, userId, currentSection]);
  
  // 🆕 Cargar preferencias de localStorage
  useEffect(() => {
    const savedMinimized = localStorage.getItem('simple-era-guide-minimized');
    const savedCompactMode = localStorage.getItem('simple-era-guide-compact');
    const pausedUntil = localStorage.getItem('simple-era-guide-paused-until');
    
    if (savedMinimized === 'true') {
      setIsMinimized(true);
    }
    if (savedCompactMode === 'true') {
      setCompactMode(true);
    }
    if (pausedUntil) {
      const pauseDate = new Date(pausedUntil);
      if (pauseDate > new Date()) {
        setTemporarilyHidden(true);
      } else {
        localStorage.removeItem('simple-era-guide-paused-until');
      }
    }
  }, []);
  
  // 🆕 Auto-minimizar en secciones críticas
  useEffect(() => {
    // 🔥 PREVENIR auto-minimización si el usuario acaba de maximizar manualmente
    if (recentlyMaximizedRef.current) {
      console.log('⏸️ [SimpleEraGuide] Usuario maximizó recientemente, evitando auto-minimización');
      return;
    }
    
    const criticalSections = ['adn-empresa', 'marketing-hub', 'content-creation'];
    const shouldAutoMinimize = criticalSections.includes(currentSection);
    
    console.log('🔍 [SimpleEraGuide] Auto-minimize check:', {
      currentSection,
      shouldAutoMinimize,
      isMinimized,
      isActive,
      recentlyMaximized: recentlyMaximizedRef.current
    });
    
    // 🔥 DESHABILITAR auto-minimización si el tour recién se activó
    // Solo minimizar si el usuario ya ha interactuado con el tour
    if (shouldAutoMinimize && !isMinimized && isActive && completedSteps.length > 0) {
      console.log('📦 [SimpleEraGuide] Auto-minimizando en sección crítica');
      setAutoMinimized(true);
      setIsMinimized(true);
      toast({
        title: "Guía minimizada",
        description: "La guía se minimizó para que trabajes cómodamente. Máximiza cuando necesites ayuda.",
        duration: 4000
      });
    }
  }, [currentSection, isMinimized, isActive, completedSteps.length]);
  
  // 🆕 Animación de peek cuando está minimizado
  useEffect(() => {
    if (!isMinimized || !isActive) return;
    
    const peekInterval = setInterval(() => {
      setShowPeek(true);
      setTimeout(() => setShowPeek(false), 3000);
    }, 120000); // Cada 2 minutos
    
    return () => clearInterval(peekInterval);
  }, [isMinimized, isActive]);
  
  // 🆕 Detectar si hay procesamiento activo en la plataforma
  const isProcessingActive = useCallback(() => {
    // Buscar indicadores de procesamiento
    const hasLoadingIndicators = document.querySelector('[data-loading="true"]') !== null;
    const hasSpinners = document.querySelector('.animate-spin') !== null;
    const hasDisabledButtons = document.querySelector('button:disabled') !== null;
    const hasFetchingText = document.body.textContent?.toLowerCase().includes('cargando') || 
                            document.body.textContent?.toLowerCase().includes('procesando') ||
                            document.body.textContent?.toLowerCase().includes('generando');
    
    return hasLoadingIndicators || hasSpinners || hasDisabledButtons || hasFetchingText;
  }, []);

  // 🆕 Auto-minimización al hacer clic en textareas y reaparición inteligente
  useEffect(() => {
    if (!isActive || isMinimized) return;

    const handleTextareaClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Detectar clic en textarea o input de texto
      if (target.tagName === 'TEXTAREA' || 
          (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') ||
          target.contentEditable === 'true') {
        
        console.log('📝 [SimpleEraGuide] Clic en campo de texto detectado, minimizando...');
        setIsMinimized(true);
        setAutoMinimized(true);
        lastInteractionRef.current = new Date();
        
        // Limpiar timer anterior si existe
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        
        // Iniciar timer de inactividad (8 segundos)
        inactivityTimerRef.current = setTimeout(() => {
          const now = new Date();
          const timeSinceLastInteraction = (now.getTime() - lastInteractionRef.current.getTime()) / 1000;
          
          // Solo maximizar si:
          // 1. Han pasado al menos 8 segundos
          // 2. No hay procesamiento activo
          // 3. El guide sigue activo y minimizado
          if (timeSinceLastInteraction >= 8 && !isProcessingActive() && isActive) {
            console.log('⏰ [SimpleEraGuide] Inactividad detectada sin procesamiento, maximizando...');
            setIsMinimized(false);
            setAutoMinimized(false);
          } else if (isProcessingActive()) {
            console.log('⚙️ [SimpleEraGuide] Procesamiento activo detectado, manteniendo minimizado');
            // Reintentar después de 5 segundos adicionales
            inactivityTimerRef.current = setTimeout(() => {
              if (!isProcessingActive() && isActive) {
                console.log('✅ [SimpleEraGuide] Procesamiento finalizado, maximizando...');
                setIsMinimized(false);
                setAutoMinimized(false);
              }
            }, 5000);
          }
        }, 8000); // 8 segundos de inactividad
      }
    };

    // Detectar cualquier interacción del usuario para resetear el timer
    const handleUserInteraction = () => {
      lastInteractionRef.current = new Date();
    };

    document.addEventListener('click', handleTextareaClick);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('scroll', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleTextareaClick);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isActive, isMinimized, isProcessingActive]);

  // 🆕 Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      
      // Esc: Minimizar guía
      if (e.key === 'Escape' && !isMinimized) {
        handleMinimize();
      }
      
      // Shift + G: Toggle guía
      if (e.shiftKey && e.key === 'G') {
        if (isMinimized) {
          handleMaximize();
        } else {
          handleMinimize();
        }
      }
      
      // Flecha derecha: Siguiente paso (si está completado)
      if (e.key === 'ArrowRight' && !isMinimized) {
        const currentStepCompleted = completedSteps.includes(currentStep);
        if (currentStepCompleted && currentStep < steps.length) {
          setCurrentStep(currentStep + 1);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isMinimized, currentStep, completedSteps]);

  // Guardar antes de desmontar
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userId) {
        saveTourState(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (userId) {
        saveTourState(true);
      }
    };
  }, [userId, currentStep, completedSteps]);

  useEffect(() => {
    loadTourProgress();
  }, [userId]);

  // 🆕 Notificaciones cuando hay datos existentes
  useEffect(() => {
    if (cacheData.loading || !isActive || isMinimized) return;

    const showDataNotification = () => {
      if (currentStep === 4 && cacheData.audienceInsights.exists) {
        toast({ title: "📊 Datos Existentes", description: `Ya tienes ${cacheData.audienceInsights.count} análisis de audiencia disponible. Puedes actualizarlo.`, duration: 4000 });
      } else if (currentStep === 5 && cacheData.contentAnalysis.exists) {
        toast({ title: "📊 Contenido Analizado", description: `Ya tienes ${cacheData.contentAnalysis.count} posts analizados. Puedes actualizar el análisis.`, duration: 4000 });
      } else if (currentStep === 6 && cacheData.buyerPersonas.exists) {
        toast({ title: "📊 Audiencias Creadas", description: `Ya tienes ${cacheData.buyerPersonas.count} buyer personas. Puedes revisarlas o crear más.`, duration: 4000 });
      }
    };

    const timeoutId = setTimeout(showDataNotification, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentStep, cacheData, isActive, isMinimized]);

  const loadTourProgress = async () => {
    if (!userId) return;

    try {
      const { data: tourStatus } = await supabase
        .from('user_guided_tour')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (tourStatus) {
        const hasProgress = (tourStatus.completed_steps?.length || 0) > 0;
        const isCompleted = tourStatus.tour_completed;

        if (hasProgress && !isCompleted) {
          setRecoveryData(tourStatus);
          setShowRecoveryDialog(true);
        } else if (isCompleted) {
          setIsActive(false);
        } else {
          await checkIfNewUser();
        }

        setCompletedSteps(tourStatus.completed_steps || []);
        setCurrentStep(tourStatus.current_step || 1);
      } else {
        await checkIfNewUser();
      }
    } catch (error) {
      console.error('Error cargando progreso del tour:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfNewUser = async () => {
    try {
      console.log('🔍 [SimpleEraGuide] checkIfNewUser - Iniciando verificación');
      
      // 🔍 Verificar si está en proceso de onboarding activo
      const urlParams = new URLSearchParams(window.location.search);
      const isInOnboardingProcess = urlParams.get('view') === 'onboarding' || 
                                     urlParams.get('first_login') === 'true';
      
      console.log('🔍 [SimpleEraGuide] URL params:', {
        view: urlParams.get('view'),
        first_login: urlParams.get('first_login'),
        isInOnboardingProcess
      });
      
      if (isInOnboardingProcess) {
        console.log('🚫 Usuario en proceso de onboarding, tour no se mostrará');
        setIsActive(false);
        return;
      }

      // 🔍 Verificar estado de onboarding (AMBOS campos)
      const { data: onboarding, error: onboardingError } = await supabase
        .from('user_onboarding_status')
        .select('onboarding_completed_at, dna_empresarial_completed')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('🔍 [SimpleEraGuide] Onboarding data:', { onboarding, error: onboardingError });

      // 🔍 Verificar si ya completó el tour
      const { data: tourData, error: tourError } = await supabase
        .from('user_guided_tour')
        .select('tour_completed')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('🔍 [SimpleEraGuide] Tour data:', { tourData, error: tourError });

      const hasCompletedOnboarding = onboarding?.onboarding_completed_at || onboarding?.dna_empresarial_completed;
      const hasTourCompleted = tourData?.tour_completed;

      console.log('🔍 [SimpleEraGuide] Verificación final:', {
        hasCompletedOnboarding,
        hasTourCompleted,
        shouldActivate: hasCompletedOnboarding && !hasTourCompleted
      });

      // ✅ Activar tour si completó onboarding pero no el tour (SIN límite de tiempo)
      if (hasCompletedOnboarding && !hasTourCompleted) {
        console.log('✅ [SimpleEraGuide] Onboarding completado, tour no completado - auto-activando');
        setShowWelcome(true);
        setIsActive(true);
        setIsMinimized(false); // 🔥 ASEGURAR que se muestre expandido
      } else if (hasTourCompleted) {
        console.log('✓ [SimpleEraGuide] Tour ya completado');
        setIsActive(false);
      } else {
        console.log('⏳ [SimpleEraGuide] Onboarding no completado');
        setIsActive(false);
      }
    } catch (error) {
      console.error('❌ [SimpleEraGuide] Error verificando nuevo usuario:', error);
    }
  };

  const saveTourState = async (silent: boolean = false) => {
    if (!userId) return;

    try {
      const stateToSave = {
        user_id: userId,
        current_step: currentStep,
        completed_steps: completedSteps,
        tour_completed: completedSteps.length === steps.length,
        updated_at: new Date().toISOString(),
        ...(completedSteps.length === steps.length && { 
          tour_completed_at: new Date().toISOString() 
        })
      };

      const { error } = await supabase
        .from('user_guided_tour')
        .upsert(stateToSave, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setLastSaved(new Date());
      
      if (!silent) {
        toast({
          title: "✓ Progreso guardado",
          description: "Tu avance en el tour ha sido guardado correctamente.",
        });
      }
    } catch (error) {
      console.error('Error guardando estado del tour:', error);
      if (!silent) {
        toast({
          title: "Error al guardar",
          description: "No se pudo guardar tu progreso. Verifica tu conexión.",
          variant: "destructive"
        });
      }
    }
  };

  // 🆕 Funciones mejoradas
  const handleTemporaryHide = () => {
    setTemporarilyHidden(true);
    toast({
      title: "Guía oculta temporalmente",
      description: "La guía reaparecerá en 5 minutos.",
      duration: 3000
    });
    
    setTimeout(() => {
      setTemporarilyHidden(false);
      setIsMinimized(true);
    }, 300000); // 5 minutos
  };
  
  const handlePauseTour = async () => {
    const pauseUntil = new Date();
    pauseUntil.setHours(pauseUntil.getHours() + 24);
    
    localStorage.setItem('simple-era-guide-paused-until', pauseUntil.toISOString());
    setTemporarilyHidden(true);
    
    toast({
      title: "Tour pausado por 24 horas",
      description: "Puedes reactivarlo cuando quieras desde el menú.",
      duration: 4000
    });
  };
  
  const toggleCompactMode = () => {
    const newCompactMode = !compactMode;
    setCompactMode(newCompactMode);
    localStorage.setItem('simple-era-guide-compact', newCompactMode.toString());
  };
  
  const handleMinimize = () => {
    setIsMinimized(true);
    setAutoMinimized(false);
    localStorage.setItem('simple-era-guide-minimized', 'true');
  };
  
  const handleMaximize = () => {
    console.log('📖 [SimpleEraGuide] handleMaximize clicked', { isActive, isMinimized });
    
    // 🔥 Marcar que el usuario maximizó manualmente
    recentlyMaximizedRef.current = true;
    
    // Si el tour no está activo, mostrar welcome dialog
    if (!isActive) {
      setShowWelcome(true);
      setIsMinimized(false);
      console.log('💡 Tour inactivo, mostrando welcome dialog');
      
      // Resetear flag después de 5 segundos
      setTimeout(() => {
        recentlyMaximizedRef.current = false;
      }, 5000);
      return;
    }
    
    // Si está activo, solo expandir
    setIsMinimized(false);
    setAutoMinimized(false);
    localStorage.setItem('simple-era-guide-minimized', 'false');
    
    console.log('✅ [SimpleEraGuide] Maximizado por usuario, flag activado por 5 segundos');
    
    // Resetear flag después de 5 segundos
    setTimeout(() => {
      recentlyMaximizedRef.current = false;
      console.log('⏰ [SimpleEraGuide] Flag de maximización manual expirado');
    }, 5000);
  };
  
  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const startTour = async () => {
    try {
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          current_step: 1,
          completed_steps: [],
          tour_started_at: new Date().toISOString(),
          tour_completed: false
        });

      setIsActive(true);
      setCurrentStep(1);
      setCompletedSteps([]);
      setShowWelcome(false);
      setShowTourBadge(false); // 🆕 Ocultar badge al iniciar tour
      
      toast({
        title: "🚀 Tour iniciado",
        description: "¡Comencemos! Era te guiará paso a paso.",
      });
    } catch (error) {
      console.error('Error starting tour:', error);
    }
  };

  const verifyStepCompletion = async (stepId: number): Promise<boolean> => {
    setVerifying(true);
    
    try {
      let isComplete = false;

      switch(stepId) {
        case 1:
          isComplete = await verifications.verifyCompanyProfile();
          break;
        case 2:
          isComplete = await verifications.verifySocialConnections();
          break;
        case 3:
          isComplete = await verifications.verifySocialURLs();
          break;
        case 4:
          isComplete = await verifications.verifyAudienceAnalysis();
          break;
        case 5:
          isComplete = await verifications.verifyContentAnalysis();
          break;
        case 6:
          isComplete = await verifications.verifyBuyerPersonas();
          break;
        case 7:
          isComplete = await verifications.verifyCampaignCreated();
          break;
        case 8:
          isComplete = await verifications.verifyContentGenerated();
          break;
        case 9:
          isComplete = true;
          break;
        default:
          isComplete = false;
      }

      return isComplete;
    } catch (error) {
      console.error('Error verifying step:', error);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const completeStep = async (stepId: number) => {
    if (completedSteps.includes(stepId)) return;

    const step = steps.find(s => s.id === stepId);
    if (step && !step.requiresManualCompletion) {
      const isComplete = await verifyStepCompletion(stepId);
      
      if (!isComplete) {
        toast({
          title: "Paso incompleto",
          description: `Completa las acciones requeridas para este paso antes de continuar.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const newCompletedSteps = [...completedSteps, stepId];
      const nextStep = Math.max(...newCompletedSteps) + 1;
      const allCompleted = newCompletedSteps.length === steps.length;

      setCompletedSteps(newCompletedSteps);
      setCurrentStep(nextStep);

      await saveTourState(true);

      // 🆕 Celebración con confetti
      triggerCelebration();

      if (!allCompleted) {
        const nextStepData = steps.find(s => s.id === nextStep);
        if (nextStepData?.tab && nextStepData.target_section === currentSection) {
          onNavigate(nextStepData.target_section, { tab: nextStepData.tab });
        }
        
        // 🎯 Auto-minimizar después de verificar exitosamente para que el usuario pueda trabajar
        toast({
          title: "✓ Paso completado",
          description: `Paso ${stepId} de ${steps.length} completado. El guide se minimizará para que puedas trabajar.`,
        });
        
        // Minimizar después de 1.5 segundos para dar tiempo a ver la celebración
        setTimeout(() => {
          console.log('🔽 Auto-minimizando guide después de verificación exitosa');
          handleMinimize();
        }, 1500);
      }

      if (allCompleted) {
        // 🆕 Gran celebración final
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 }
        });
        
        setIsActive(false);
        toast({
          title: "¡Felicitaciones! 🎉",
          description: "Has completado el tour de Buildera. Era está lista para asistirte.",
        });
        
        // 🎯 Dispatch evento para que ResponsiveLayout desbloquee el sidebar
        window.dispatchEvent(new CustomEvent('tour-completed', { 
          detail: { userId, timestamp: new Date().toISOString() }
        }));
        window.dispatchEvent(new CustomEvent('simple-era-guide-completed'));
      }
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  const skipTour = async () => {
    try {
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          tour_completed: true,
          tour_skipped: true,
          tour_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      setIsActive(false);
      setShowSkipConfirm(false);
      
      toast({
        title: "Tour omitido",
        description: "Puedes reactivarlo en cualquier momento con el botón Era.",
      });
      
      // 🎯 Dispatch evento para que ResponsiveLayout desbloquee el sidebar
      window.dispatchEvent(new CustomEvent('tour-completed', { 
        detail: { userId, timestamp: new Date().toISOString() }
      }));
      window.dispatchEvent(new CustomEvent('simple-era-guide-completed'));
    } catch (error) {
      console.error('Error skipping tour:', error);
    }
  };

  const restartTour = async () => {
    try {
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          current_step: 1,
          completed_steps: [],
          tour_completed: false,
          tour_skipped: false,
          tour_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      setIsActive(true);
      setCurrentStep(1);
      setCompletedSteps([]);
      
      toast({
        title: "Tour reiniciado",
        description: "Comenzarás desde el paso 1.",
      });
    } catch (error) {
      console.error('Error restarting tour:', error);
    }
  };

  const handleRecoverTour = async () => {
    if (recoveryData) {
      setCurrentStep(recoveryData.current_step);
      setCompletedSteps(recoveryData.completed_steps || []);
      setIsActive(true);
      setShowRecoveryDialog(false);
      
      toast({
        title: "Tour recuperado",
        description: `Continuarás desde el paso ${recoveryData.current_step}.`,
      });
    }
  };

  const handleRestartFromRecovery = async () => {
    setShowRecoveryDialog(false);
    await restartTour();
  };

  // 🆕 Función para obtener clases de posicionamiento dinámico
  const getPositionClass = () => {
    if (isMinimized) {
      return 'bottom-6 right-6 w-auto';
    }
    
    // En móvil, ocupar todo el ancho inferior
    if (window.innerWidth < 768) {
      return 'bottom-0 left-0 right-0 rounded-t-xl rounded-b-none w-full';
    }
    
    // En desktop, modo compacto
    if (compactMode) {
      return 'bottom-6 right-6 w-64';
    }
    
    // En desktop normal, centrado inferior
    return 'bottom-6 left-1/2 transform -translate-x-1/2 w-96 max-w-[90vw]';
  };

  if (loading) {
    return (
      <Card className={`fixed shadow-2xl border-primary/20 z-50 ${getPositionClass()}`}>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
          <span className="text-sm text-muted-foreground">Cargando guía...</span>
        </div>
      </Card>
    );
  }

  // 🆕 Si está temporalmente oculto, no renderizar
  if (temporarilyHidden) {
    return null;
  }
  
  // 🆕 Badge flotante de "Tour Disponible" cuando se cierra el welcome sin iniciar
  if (showTourBadge && !isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Badge flotante clicked - activando tour directamente');
            setShowTourBadge(false);
            startTour();
          }}
          className="rounded-full shadow-2xl hover:scale-110 transition-all h-14 px-6 group bg-gradient-to-r from-primary to-primary/80 animate-pulse"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          <span className="font-medium">Iniciar Tour de Era</span>
          <Badge className="ml-2 bg-primary-foreground/20 hover:bg-primary-foreground/30">
            {steps.length} pasos
          </Badge>
        </Button>
      </motion.div>
    );
  }

  // 🎯 MINIMIZED STATE: Botón flotante con peek
  if (isMinimized) {
    const currentStepData = steps[currentStep - 1];
    return (
      <>
        {showPeek && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="fixed bottom-20 right-6 w-72 shadow-2xl border-primary/20 z-50 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Siguiente paso:</p>
                  <p className="text-sm font-semibold">{currentStepData.title}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMaximize();
          }}
          className="fixed bottom-6 right-6 rounded-full shadow-2xl hover:scale-110 transition-all z-50 h-14 px-6 group"
          size="lg"
        >
          <currentStepData.icon className="w-5 h-5 mr-2" />
          <span className="font-medium">Guía de Era</span>
          <span className="ml-2 text-xs bg-primary-foreground/20 px-2 py-1 rounded-full">
            {completedSteps.length}/{steps.length}
          </span>
          <Maximize2 className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </>
    );
  }

  // 🎯 ACTIVE TOUR STATE: Card principal con overlay
  const currentStepData = steps[currentStep - 1];
  const isStepCompleted = completedSteps.includes(currentStep);
  const progressPercentage = (completedSteps.length / steps.length) * 100;

  return (
    <>
      {/* 🆕 Overlay semitransparente opcional */}
      {showOverlay && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40 animate-fade-in"
          onClick={handleMinimize}
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`fixed shadow-2xl border-primary/20 backdrop-blur-xl z-50 max-h-[85vh] overflow-y-auto ${getPositionClass()}`}>
          <div className="p-6 space-y-4">
            {/* Header con controles mejorados */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Guía de Era</h3>
              </div>
              <div className="flex items-center gap-1">
                {/* 🆕 Modo compacto toggle (solo desktop) */}
                {window.innerWidth >= 768 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleCompactMode}
                    className="h-8 w-8 p-0"
                    title={compactMode ? "Modo normal" : "Modo compacto"}
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${compactMode ? 'rotate-180' : ''}`} />
                  </Button>
                )}
                
                {/* 🆕 Ocultar temporalmente */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleTemporaryHide}
                  className="h-8 w-8 p-0"
                  title="Ocultar por 5 minutos"
                >
                  <Clock className="w-4 h-4" />
                </Button>
                
                {/* 🆕 Minimizar mejorado */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-8 px-2 gap-1"
                  title="Minimizar (Esc)"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span className="text-xs hidden md:inline">Minimizar</span>
                </Button>
                
                {/* Cerrar/Skip */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSkipConfirm(true)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* 🆕 Indicador de último guardado */}
            {lastSaved && !compactMode && (
              <p className="text-[10px] text-muted-foreground text-right -mt-2 mb-2">
                Último guardado: {new Date(lastSaved).toLocaleTimeString()}
              </p>
            )}

            <Progress value={progressPercentage} className="h-2" />
            {!compactMode && (
              <p className="text-xs text-muted-foreground text-center">
                Paso {currentStep} de {steps.length} • {completedSteps.length} completados
              </p>
            )}

            {/* Contenido del paso actual */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${currentStepData.color}`}>
                  <currentStepData.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base mb-1">{currentStepData.title}</h4>
                  
                  {/* 🆕 Preview de datos existentes */}
                  {!cacheData.loading && (
                    <div className="mb-2">
                      {currentStep === 1 && cacheData.companyProfile.exists && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200">
                          <Eye className="w-3 h-3 mr-1" />
                          Perfil configurado • {new Date(cacheData.companyProfile.lastUpdate!).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                        </Badge>
                      )}
                      {currentStep === 2 && cacheData.socialAccounts.exists && (
                        <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {cacheData.socialAccounts.count} red{cacheData.socialAccounts.count !== 1 ? 'es' : ''} conectada{cacheData.socialAccounts.count !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {currentStep === 4 && cacheData.audienceInsights.exists && (
                        <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          {cacheData.audienceInsights.count} análisis • {new Date(cacheData.audienceInsights.lastUpdate!).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                        </Badge>
                      )}
                      {currentStep === 5 && cacheData.contentAnalysis.exists && (
                        <Badge variant="outline" className="text-xs bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 border-cyan-200">
                          <FileText className="w-3 h-3 mr-1" />
                          {cacheData.contentAnalysis.count} post{cacheData.contentAnalysis.count !== 1 ? 's' : ''} analizado{cacheData.contentAnalysis.count !== 1 ? 's' : ''} • {new Date(cacheData.contentAnalysis.lastUpdate!).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                        </Badge>
                      )}
                      {currentStep === 6 && cacheData.buyerPersonas.exists && (
                        <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200">
                          <Users className="w-3 h-3 mr-1" />
                          {cacheData.buyerPersonas.count} buyer persona{cacheData.buyerPersonas.count !== 1 ? 's' : ''} • {new Date(cacheData.buyerPersonas.lastUpdate!).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {!compactMode && (
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>{currentStepData.what}</p>
                      <p>{currentStepData.why}</p>
                      <p>{currentStepData.how}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción unificados */}
              <div className="flex gap-2 pt-2">
                {currentStepData.target_section && onNavigate && (
                  <Button
                    type="button"
                    onClick={() => {
                      onNavigate(currentStepData.target_section!, currentStepData.tab ? { tab: currentStepData.tab } : undefined);
                      // Auto-minimizar al navegar
                      setTimeout(() => handleMinimize(), 500);
                    }}
                    className="flex-1"
                    variant="default"
                  >
                    {currentStepData.actionText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                
                {isStepCompleted ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="flex-1 border-green-500 text-green-500"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completado
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => completeStep(currentStep)}
                    variant="outline"
                    disabled={verifying}
                    className="flex-1"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {currentStepData.verificationText}
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* 🆕 Botón de pausar tour */}
              {!compactMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePauseTour}
                  className="w-full mt-2 text-xs"
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Pausar tour por hoy
                </Button>
              )}
            </div>
            
            {/* 🆕 Atajos de teclado (solo desktop y no compacto) */}
            {!compactMode && window.innerWidth >= 768 && (
              <div className="pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground text-center">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Esc</kbd> minimizar • 
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] ml-1">Shift+G</kbd> toggle •
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] ml-1">→</kbd> siguiente
                </p>
              </div>
            )}

            {/* Navegación entre pasos */}
            {!compactMode && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="flex-1"
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {currentStep}/{steps.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                  disabled={currentStep === steps.length}
                  className="flex-1"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Welcome Dialog */}
      <AlertDialog open={showWelcome} onOpenChange={setShowWelcome}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              ¡Bienvenido a Buildera!
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Soy <strong>Era</strong>, tu asistente de IA. Estoy aquí para guiarte en la configuración inicial de la plataforma.</p>
              
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="font-medium text-foreground">Con este tour aprenderás a:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Configurar el ADN de tu negocio</li>
                  <li>Conectar tus redes sociales</li>
                  <li>Analizar tu audiencia actual</li>
                  <li>Crear campañas de marketing efectivas</li>
                  <li>Generar contenido con IA</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted-foreground">
                ⏱️ Tiempo estimado: 15-20 minutos • Puedes pausar en cualquier momento
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowWelcome(false);
              if (!isActive) {
                setShowTourBadge(true);
                toast({
                  title: "Tour disponible",
                  description: "Puedes iniciar el tour en cualquier momento desde el botón flotante.",
                  duration: 5000
                });
              }
            }}>
              Explorar por mi cuenta
            </AlertDialogCancel>
            <AlertDialogAction onClick={startTour}>
              Comenzar tour guiado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recovery Dialog */}
      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Save className="w-6 h-6 text-primary" />
              Progreso detectado
            </AlertDialogTitle>
            <AlertDialogDescription>
              Detectamos que dejaste el tour en el paso {recoveryData?.current_step} con {recoveryData?.completed_steps?.length || 0} pasos completados.
              <br /><br />
              ¿Deseas continuar donde lo dejaste o reiniciar desde el principio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRestartFromRecovery}>
              Reiniciar desde el inicio
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRecoverTour}>
              Continuar donde lo dejé
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Saltar el tour?</AlertDialogTitle>
            <AlertDialogDescription>
              Puedes reactivar la guía de Era en cualquier momento. Tu progreso actual se guardará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={skipTour}>
              Sí, saltar tour
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SimpleEraGuide;