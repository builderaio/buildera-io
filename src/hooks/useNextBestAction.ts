import { useMemo } from 'react';
import { CompanyState } from './useCompanyState';

export type NBAPriority = 'critical' | 'high' | 'medium' | 'low';
export type NBAType = 'profile' | 'agent' | 'content' | 'subscription' | 'learning' | 'social';

export interface NextBestAction {
  id: string;
  priority: NBAPriority;
  type: NBAType;
  title: string;
  description: string;
  action: {
    label: string;
    view?: string;
    agentId?: string;
  };
  estimatedImpact: string;
  requiredTime: string;
  icon: string;
}

interface UseNextBestActionParams {
  companyState: CompanyState;
  availableCredits: number;
  enabledAgentsCount: number;
  totalAgentsCount: number;
}

export const useNextBestAction = ({
  companyState,
  availableCredits,
  enabledAgentsCount,
  totalAgentsCount,
}: UseNextBestActionParams): NextBestAction[] => {
  const actions = useMemo(() => {
    const nbas: NextBestAction[] = [];

    // Rule 1: Profile incomplete - Critical
    if (companyState.areas.profile.status === 'incomplete') {
      nbas.push({
        id: 'complete-profile',
        priority: 'critical',
        type: 'profile',
        title: 'Completa tu perfil de empresa',
        description: 'Tu perfil está incompleto. Los agentes IA necesitan esta información para generar mejores resultados.',
        action: { label: 'Completar Perfil', view: 'adn-empresa' },
        estimatedImpact: 'Mejora un 40% la calidad de las recomendaciones',
        requiredTime: '5 minutos',
        icon: '🏢',
      });
    }

    // Rule 2: No strategy - High
    if (companyState.areas.strategy.status === 'incomplete') {
      nbas.push({
        id: 'define-strategy',
        priority: 'high',
        type: 'profile',
        title: 'Define tu estrategia de negocio',
        description: 'Sin misión, visión u objetivos claros, los agentes no pueden alinear sus resultados con tus metas.',
        action: { label: 'Definir Estrategia', view: 'adn-empresa' },
        estimatedImpact: 'Contenido y estrategias más alineadas',
        requiredTime: '10 minutos',
        icon: '🎯',
      });
    }

    // Rule 3: No agents enabled - High
    if (enabledAgentsCount === 0) {
      nbas.push({
        id: 'enable-agents',
        priority: 'high',
        type: 'agent',
        title: 'Activa tu primer agente IA',
        description: 'No tienes ningún agente activo. Explora el marketplace y habilita agentes para empezar a automatizar.',
        action: { label: 'Explorar Agentes', view: 'marketplace' },
        estimatedImpact: 'Comienza a automatizar tareas',
        requiredTime: '2 minutos',
        icon: '🤖',
      });
    }

    // Rule 4: Pending insights - Medium
    if (companyState.areas.content.status === 'incomplete') {
      nbas.push({
        id: 'generate-insights',
        priority: 'medium',
        type: 'content',
        title: 'Genera insights de contenido',
        description: 'No tienes insights activos. Los agentes de análisis pueden identificar oportunidades de crecimiento.',
        action: { label: 'Generar Insights', view: 'marketing-hub' },
        estimatedImpact: 'Descubre oportunidades ocultas',
        requiredTime: '3 minutos',
        icon: '💡',
      });
    }

    // Rule 5: No social connections - Medium
    if (companyState.areas.social.status === 'incomplete') {
      nbas.push({
        id: 'connect-social',
        priority: 'medium',
        type: 'social',
        title: 'Conecta tus redes sociales',
        description: 'Sin redes conectadas, no podemos analizar tu audiencia ni publicar contenido automáticamente.',
        action: { label: 'Conectar Redes', view: 'adn-empresa' },
        estimatedImpact: 'Habilita publicación automática',
        requiredTime: '5 minutos',
        icon: '📱',
      });
    }

    // Rule 6: No audiences defined - Medium
    if (companyState.areas.audience.status === 'incomplete') {
      nbas.push({
        id: 'define-audiences',
        priority: 'medium',
        type: 'profile',
        title: 'Define tus audiencias objetivo',
        description: 'Crear perfiles de audiencia ayuda a los agentes a generar contenido más relevante.',
        action: { label: 'Crear Audiencia', view: 'adn-empresa' },
        estimatedImpact: 'Contenido más personalizado',
        requiredTime: '8 minutos',
        icon: '👥',
      });
    }

    // Rule 7: Low credits - Medium
    if (availableCredits < 50) {
      nbas.push({
        id: 'upgrade-credits',
        priority: availableCredits < 10 ? 'high' : 'medium',
        type: 'subscription',
        title: 'Tus créditos están bajos',
        description: `Solo tienes ${availableCredits} créditos. Considera obtener más para seguir usando tus agentes.`,
        action: { label: 'Obtener Créditos', view: 'configuracion' },
        estimatedImpact: 'Continúa usando tus agentes',
        requiredTime: '2 minutos',
        icon: '⚡',
      });
    }

    // Rule 8: Unused agents available - Low
    if (enabledAgentsCount > 0 && totalAgentsCount > enabledAgentsCount) {
      nbas.push({
        id: 'discover-agents',
        priority: 'low',
        type: 'agent',
        title: 'Descubre más agentes',
        description: `Hay ${totalAgentsCount - enabledAgentsCount} agentes disponibles que podrían ayudarte.`,
        action: { label: 'Ver Marketplace', view: 'marketplace' },
        estimatedImpact: 'Amplía tus capacidades',
        requiredTime: '5 minutos',
        icon: '🛒',
      });
    }

    // Rule 9: Encourage learning - Low
    if (companyState.maturityLevel === 'starter') {
      nbas.push({
        id: 'start-learning',
        priority: 'low',
        type: 'learning',
        title: 'Aprende a sacar el máximo provecho',
        description: 'La Academia Buildera tiene cursos gratuitos para dominar la plataforma.',
        action: { label: 'Ir a Academia', view: 'academia-buildera' },
        estimatedImpact: 'Mejora tus habilidades',
        requiredTime: '15 minutos',
        icon: '🎓',
      });
    }

    // Sort by priority
    const priorityOrder: Record<NBAPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return nbas.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [companyState, availableCredits, enabledAgentsCount, totalAgentsCount]);

  return actions;
};
