import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Lightbulb, 
  X, 
  ArrowRight, 
  CheckCircle2,
  Target,
  Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextualTip {
  id: string;
  section: string;
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
  priority: 'high' | 'medium' | 'low';
}

interface EraContextualTipsProps {
  userId: string;
  currentSection: string;
  onNavigate: (section: string) => void;
}

const EraContextualTips = ({ userId, currentSection, onNavigate }: EraContextualTipsProps) => {
  const [activeTip, setActiveTip] = useState<ContextualTip | null>(null);
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const contextualTips: ContextualTip[] = [
    {
      id: 'adn-empresa-info',
      section: 'adn-empresa',
      title: '🏢 Completa tu ADN Empresarial',
      description: 'Define la información base de tu empresa para personalizar todas las herramientas de IA.',
      actionText: 'Completar información',
      onAction: () => {
        // La acción se maneja automáticamente en la sección
        dismissTip('adn-empresa-info');
      },
      priority: 'high'
    },
    {
      id: 'marketing-hub-connect',
      section: 'marketing-hub',
      title: '🔗 Conecta tus redes sociales',
      description: 'Conecta LinkedIn, Instagram, Facebook y TikTok para automatizar tu marketing.',
      actionText: 'Conectar redes',
      onAction: () => {
        // Scroll to social connections section
        const connectSection = document.querySelector('[data-testid="social-connections"]');
        if (connectSection) {
          connectSection.scrollIntoView({ behavior: 'smooth' });
        }
        dismissTip('marketing-hub-connect');
      },
      priority: 'high'
    },
    {
      id: 'configuracion-urls',
      section: 'configuracion',
      title: '🌐 Actualiza URLs de redes',
      description: 'Verifica que las URLs de tus redes sociales estén correctas para el análisis.',
      actionText: 'Revisar URLs',
      onAction: () => {
        dismissTip('configuracion-urls');
      },
      priority: 'medium'
    },
    {
      id: 'inteligencia-analyze',
      section: 'inteligencia-competitiva',
      title: '📊 Analiza tu audiencia',
      description: 'Ejecuta análisis inteligentes para entender mejor a tus seguidores.',
      actionText: 'Analizar audiencia',
      onAction: () => {
        dismissTip('inteligencia-analyze');
      },
      priority: 'high'
    },
    {
      id: 'marketplace-agents',
      section: 'marketplace',
      title: '🤖 Contrata agentes especializados',
      description: 'Explora agentes IA especializados para automatizar tareas específicas.',
      actionText: 'Ver agentes',
      onAction: () => {
        dismissTip('marketplace-agents');
      },
      priority: 'medium'
    }
  ];

  useEffect(() => {
    loadDismissedTips();
  }, [userId]);

  useEffect(() => {
    checkForRelevantTips();
  }, [currentSection, dismissedTips]);

  const loadDismissedTips = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('user_guided_tour')
        .select('completed_steps')
        .eq('user_id', userId)
        .maybeSingle();

      // Convertir pasos completados en tips dismissed
      const completedSteps = data?.completed_steps || [];
      const dismissed = completedSteps.map((step: number) => {
        switch (step) {
          case 1: return 'adn-empresa-info';
          case 2: return 'marketing-hub-connect';
          case 3: return 'configuracion-urls';
          case 4: case 5: return 'inteligencia-analyze';
          case 9: return 'marketplace-agents';
          default: return null;
        }
      }).filter(Boolean);

      setDismissedTips(dismissed);
    } catch (error) {
      console.error('Error loading dismissed tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForRelevantTips = () => {
    if (loading) return;

    const relevantTips = contextualTips.filter(tip => 
      tip.section === currentSection && 
      !dismissedTips.includes(tip.id)
    );

    // Priorizar tips de alta prioridad
    const highPriorityTip = relevantTips.find(tip => tip.priority === 'high');
    const nextTip = highPriorityTip || relevantTips[0];

    setActiveTip(nextTip || null);
  };

  const dismissTip = (tipId: string) => {
    setDismissedTips(prev => [...prev, tipId]);
    setActiveTip(null);
    
    // Opcional: guardar en base de datos
    // En este caso simple, solo lo mantenemos en estado local
  };

  if (loading || !activeTip) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-6 z-40 w-80"
      >
        <Alert className="border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <AlertDescription>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground">
                    {activeTip.title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1"
                    onClick={() => dismissTip(activeTip.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {activeTip.description}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={activeTip.onAction}
                    className="text-xs"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    {activeTip.actionText}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissTip(activeTip.id)}
                    className="text-xs"
                  >
                    Omitir
                  </Button>
                </div>
              </AlertDescription>
            </div>
          </div>
          
          {/* Era signature */}
          <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Consejo de Era</span>
            </div>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default EraContextualTips;