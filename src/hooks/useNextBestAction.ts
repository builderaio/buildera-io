import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');

  const actions = useMemo(() => {
    const nbas: NextBestAction[] = [];

    // Rule 1: Profile incomplete - Critical
    if (companyState.areas.profile.status === 'incomplete') {
      nbas.push({
        id: 'complete-profile',
        priority: 'critical',
        type: 'profile',
        title: t('nba.completeProfile.title'),
        description: t('nba.completeProfile.description'),
        action: { label: t('nba.completeProfile.action'), view: 'adn-empresa' },
        estimatedImpact: t('nba.completeProfile.impact'),
        requiredTime: t('nba.completeProfile.time'),
        icon: '🏢',
      });
    }

    // Rule 2: No strategy - High
    if (companyState.areas.strategy.status === 'incomplete') {
      nbas.push({
        id: 'define-strategy',
        priority: 'high',
        type: 'profile',
        title: t('nba.defineStrategy.title'),
        description: t('nba.defineStrategy.description'),
        action: { label: t('nba.defineStrategy.action'), view: 'adn-empresa' },
        estimatedImpact: t('nba.defineStrategy.impact'),
        requiredTime: t('nba.defineStrategy.time'),
        icon: '🎯',
      });
    }

    // Rule 3: No agents enabled - High
    if (enabledAgentsCount === 0) {
      nbas.push({
        id: 'enable-agents',
        priority: 'high',
        type: 'agent',
        title: t('nba.enableAgents.title'),
        description: t('nba.enableAgents.description'),
        action: { label: t('nba.enableAgents.action'), view: 'marketplace' },
        estimatedImpact: t('nba.enableAgents.impact'),
        requiredTime: t('nba.enableAgents.time'),
        icon: '🤖',
      });
    }

    // Rule 4: Pending insights - Medium
    if (companyState.areas.content.status === 'incomplete') {
      nbas.push({
        id: 'generate-insights',
        priority: 'medium',
        type: 'agent',
        title: t('nba.generateInsights.title'),
        description: t('nba.generateInsights.description'),
        action: { label: t('nba.generateInsights.action'), agentId: 'INSIGHTS_GENERATOR' },
        estimatedImpact: t('nba.generateInsights.impact'),
        requiredTime: t('nba.generateInsights.time'),
        icon: '💡',
      });
    }

    // Rule 5: No social connections - Medium
    if (companyState.areas.social.status === 'incomplete') {
      nbas.push({
        id: 'connect-social',
        priority: 'medium',
        type: 'social',
        title: t('nba.connectSocial.title'),
        description: t('nba.connectSocial.description'),
        action: { label: t('nba.connectSocial.action'), view: 'adn-empresa' },
        estimatedImpact: t('nba.connectSocial.impact'),
        requiredTime: t('nba.connectSocial.time'),
        icon: '📱',
      });
    }

    // Rule 6: No audiences defined - Medium
    if (companyState.areas.audience.status === 'incomplete') {
      nbas.push({
        id: 'define-audiences',
        priority: 'medium',
        type: 'profile',
        title: t('nba.defineAudiences.title'),
        description: t('nba.defineAudiences.description'),
        action: { label: t('nba.defineAudiences.action'), view: 'adn-empresa' },
        estimatedImpact: t('nba.defineAudiences.impact'),
        requiredTime: t('nba.defineAudiences.time'),
        icon: '👥',
      });
    }

    // Rule 7: Low credits - Medium
    if (availableCredits < 50) {
      nbas.push({
        id: 'upgrade-credits',
        priority: availableCredits < 10 ? 'high' : 'medium',
        type: 'subscription',
        title: t('nba.lowCredits.title'),
        description: t('nba.lowCredits.description', { credits: availableCredits }),
        action: { label: t('nba.lowCredits.action'), view: 'configuracion' },
        estimatedImpact: t('nba.lowCredits.impact'),
        requiredTime: t('nba.lowCredits.time'),
        icon: '⚡',
      });
    }

    // Rule 8: Unused agents available - Low
    if (enabledAgentsCount > 0 && totalAgentsCount > enabledAgentsCount) {
      nbas.push({
        id: 'discover-agents',
        priority: 'low',
        type: 'agent',
        title: t('nba.discoverAgents.title'),
        description: t('nba.discoverAgents.description', { count: totalAgentsCount - enabledAgentsCount }),
        action: { label: t('nba.discoverAgents.action'), view: 'marketplace' },
        estimatedImpact: t('nba.discoverAgents.impact'),
        requiredTime: t('nba.discoverAgents.time'),
        icon: '🛒',
      });
    }

    // Rule 9: Encourage learning - Low
    if (companyState.maturityLevel === 'starter') {
      nbas.push({
        id: 'start-learning',
        priority: 'low',
        type: 'learning',
        title: t('nba.startLearning.title'),
        description: t('nba.startLearning.description'),
        action: { label: t('nba.startLearning.action'), view: 'academia-buildera' },
        estimatedImpact: t('nba.startLearning.impact'),
        requiredTime: t('nba.startLearning.time'),
        icon: '🎓',
      });
    }

    // === Enterprise Department Rules ===

    // Rule 10: Sales CRM empty - Medium
    if (companyState.areas.sales.status === 'incomplete') {
      nbas.push({
        id: 'setup-crm',
        priority: 'medium',
        type: 'profile',
        title: t('nba.setupCRM.title'),
        description: t('nba.setupCRM.description'),
        action: { label: t('nba.setupCRM.action'), view: 'crm' },
        estimatedImpact: t('nba.setupCRM.impact'),
        requiredTime: t('nba.setupCRM.time'),
        icon: '🛒',
      });
    }

    // Rule 11: Finance not configured - Low
    if (companyState.areas.finance.status === 'incomplete') {
      nbas.push({
        id: 'setup-finance',
        priority: 'low',
        type: 'profile',
        title: t('nba.setupFinance.title'),
        description: t('nba.setupFinance.description'),
        action: { label: t('nba.setupFinance.action'), view: 'enterprise-autopilot' },
        estimatedImpact: t('nba.setupFinance.impact'),
        requiredTime: t('nba.setupFinance.time'),
        icon: '💰',
      });
    }

    // Rule 12: Legal not configured - Low (non-starter only)
    if (companyState.areas.legal.status === 'incomplete' && companyState.maturityLevel !== 'starter') {
      nbas.push({
        id: 'setup-legal',
        priority: 'low',
        type: 'profile',
        title: t('nba.setupLegal.title'),
        description: t('nba.setupLegal.description'),
        action: { label: t('nba.setupLegal.action'), view: 'adn-empresa' },
        estimatedImpact: t('nba.setupLegal.impact'),
        requiredTime: t('nba.setupLegal.time'),
        icon: '⚖️',
      });
    }

    // Rule 13: HR not configured - Low (non-starter only)
    if (companyState.areas.hr.status === 'incomplete' && companyState.maturityLevel !== 'starter') {
      nbas.push({
        id: 'setup-hr',
        priority: 'low',
        type: 'profile',
        title: t('nba.setupHR.title'),
        description: t('nba.setupHR.description'),
        action: { label: t('nba.setupHR.action'), view: 'adn-empresa' },
        estimatedImpact: t('nba.setupHR.impact'),
        requiredTime: t('nba.setupHR.time'),
        icon: '👥',
      });
    }

    // Rule 14: Operations not configured - Low (non-starter only)
    if (companyState.areas.operations.status === 'incomplete' && companyState.maturityLevel !== 'starter') {
      nbas.push({
        id: 'setup-operations',
        priority: 'low',
        type: 'profile',
        title: t('nba.setupOperations.title'),
        description: t('nba.setupOperations.description'),
        action: { label: t('nba.setupOperations.action'), view: 'ai-workforce' },
        estimatedImpact: t('nba.setupOperations.impact'),
        requiredTime: t('nba.setupOperations.time'),
        icon: '⚙️',
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
  }, [companyState, availableCredits, enabledAgentsCount, totalAgentsCount, t]);

  return actions;
};