// Tipos para la estrategia de marketing

export interface DifferentiatedMessage {
  linkedin_variant?: string;
  tiktok_variant?: string;
  instagram_facebook_variant?: string;
}

export interface Competitor {
  name: string;
  strengths?: string[];
  weaknesses?: string[];
  digital_tactics?: string[];
  benchmarks?: Record<string, any>;
}

export interface FunnelStrategy {
  stage: string;
  objective: string;
  main_channel?: string;
  main_kpi?: string;
  tactics?: string[];
  moonshot_tactics?: string[];
}

export interface ContentPlan {
  [platform: string]: {
    frequency?: string;
    content_types?: string[];
    best_times?: string[];
  };
}

export interface KPI {
  name: string;
  target: string;
  measurement?: string;
}

export interface ExecutionPlan {
  week?: string;
  actions?: string[];
}

export interface MarketingStrategy {
  core_message?: string;
  differentiated_message?: DifferentiatedMessage;
  message_variants?: Record<string, string>;
  competitors?: Competitor[];
  strategies?: Record<string, FunnelStrategy>;
  funnel_strategies?: FunnelStrategy[];
  content_plan?: ContentPlan;
  kpis?: KPI[];
  execution_plan?: ExecutionPlan[];
  risks?: string[];
  assumptions?: string[];
  sources?: string[];
  ai_insights?: any[] | Record<string, any> | string;
  full_strategy_data?: any;
}
