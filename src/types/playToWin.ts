// Types for Play to Win Strategy Module (Roger Martin Framework)

export interface AspirationMetric {
  id: string;
  metric: string;
  target: string;
  current: string;
  unit: string;
}

export interface TargetMarket {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  sizeEstimate: string;
}

export interface TargetSegment {
  id: string;
  name: string;
  description: string;
  size: string;
  growthPotential: 'high' | 'medium' | 'low';
}

export interface GeographicFocus {
  id: string;
  region: string;
  country: string;
  priority: 'primary' | 'secondary' | 'exploratory';
}

export interface ChannelFocus {
  id: string;
  channel: string;
  priority: 'primary' | 'secondary';
  rationale: string;
}

export interface DifferentiationFactor {
  id: string;
  factor: string;
  description: string;
  evidence: string;
}

export interface ValuePropositionCanvas {
  customerJobs: string[];
  pains: string[];
  gains: string[];
  products: string[];
  painRelievers: string[];
  gainCreators: string[];
}

export type MoatType = 'cost' | 'differentiation' | 'focus' | 'network_effects';

export type CapabilityCategory = 'technology' | 'talent' | 'processes' | 'alliances';

export interface RequiredCapability {
  id: string;
  name: string;
  category: CapabilityCategory;
  currentLevel: number; // 1-5
  targetLevel: number; // 1-5
  gap: number;
  actions: string[];
}

export interface CapabilityMilestone {
  id: string;
  capabilityId: string;
  milestone: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export type ReviewCadence = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface KeyResult {
  id: string;
  result: string;
  target: string;
  current: string;
  status: 'at_risk' | 'on_track' | 'completed';
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: KeyResult[];
}

export interface KPIDefinition {
  id: string;
  name: string;
  formula: string;
  target: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  owner: string;
}

export interface GovernanceModel {
  decisionRights: string;
  escalationPath: string;
  reviewMeetings: string;
}

export type PTWStatus = 'draft' | 'in_progress' | 'complete' | 'reviewing';

export type BusinessModelType = 'b2b' | 'b2c' | 'b2b2c' | 'mixed';

export interface PlayToWinStrategy {
  id: string;
  companyId: string;
  
  // Business Model
  businessModel: BusinessModelType | null;
  
  // Step 1: Winning Aspiration
  winningAspiration: string;
  aspirationMetrics: AspirationMetric[];
  aspirationTimeline: '1_year' | '3_years' | '5_years';
  currentSituation: string;
  futurePositioning: string;
  
  // Step 2: Where to Play
  targetMarkets: TargetMarket[];
  targetSegments: TargetSegment[];
  geographicFocus: GeographicFocus[];
  channelsFocus: ChannelFocus[];
  desiredAudiencePositioning: string;
  
  // Step 3: How to Win
  competitiveAdvantage: string;
  differentiationFactors: DifferentiationFactor[];
  valuePropositionCanvas: ValuePropositionCanvas | null;
  moatType: MoatType | null;
  competitiveCategory: string;
  keyAssets: string;
  
  // Step 4: Capabilities
  requiredCapabilities: RequiredCapability[];
  capabilityRoadmap: CapabilityMilestone[];
  
  // Step 5: Management Systems
  reviewCadence: ReviewCadence;
  okrs: OKR[];
  kpiDefinitions: KPIDefinition[];
  governanceModel: GovernanceModel | null;
  
  // Meta
  currentStep: number;
  completionPercentage: number;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  status: PTWStatus;
  generatedWithAI: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface PTWReview {
  id: string;
  companyId: string;
  ptwId: string;
  reviewType: ReviewCadence | 'annual';
  reviewDate: string;
  metricsSnapshot: Record<string, any> | null;
  okrProgressSnapshot: Record<string, any> | null;
  wins: string[];
  challenges: string[];
  learnings: string[];
  adjustments: Record<string, any> | null;
  decisionsMade: Array<{
    decision: string;
    rationale: string;
    owner: string;
    deadline: string;
  }>;
  actionItems: Array<{
    action: string;
    owner: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  reviewedBy: string | null;
  createdAt: string;
}

// Step configuration for the wizard
export interface PTWStep {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const PTW_STEPS: PTWStep[] = [
  {
    id: 1,
    key: 'winning_aspiration',
    title: 'Winning Aspiration',
    description: '¿Qué significa ganar para tu negocio?',
    icon: 'Trophy'
  },
  {
    id: 2,
    key: 'where_to_play',
    title: 'Where to Play',
    description: '¿En qué mercados y segmentos competir?',
    icon: 'Map'
  },
  {
    id: 3,
    key: 'how_to_win',
    title: 'How to Win',
    description: '¿Cuál es tu ventaja competitiva?',
    icon: 'Zap'
  },
  {
    id: 4,
    key: 'capabilities',
    title: 'Capabilities',
    description: '¿Qué capacidades necesitas desarrollar?',
    icon: 'Wrench'
  },
  {
    id: 5,
    key: 'management_systems',
    title: 'Management Systems',
    description: '¿Cómo vas a gestionar y medir el progreso?',
    icon: 'Settings'
  }
];
