/**
 * Edge Functions Service - Type Definitions
 * 
 * Centralized type definitions for all Edge Function interactions
 */

export interface EdgeFunctionOptions {
  retries?: number;
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export interface EdgeFunctionResponse<T = any> {
  data: T | null;
  error: Error | null;
  cached?: boolean;
}

// ============= DATA LAYER TYPES =============

export interface CompanyData {
  objectives: any[];
  audiences: any[];
  company_id: string;
}

export interface SocialAnalytics {
  platform: string;
  metrics: Record<string, any>;
  insights: string[];
}

// ============= AI/ML LAYER TYPES =============

export interface AIGenerationRequest {
  companyId: string;
  context?: Record<string, any>;
  temperature?: number;
  model?: string;
}

export interface ContentGenerationRequest extends AIGenerationRequest {
  contentType: 'post' | 'image' | 'video' | 'reel' | 'story';
  platform?: string;
  tone?: string;
  topics?: string[];
}

export interface AnalysisRequest extends AIGenerationRequest {
  dataType: 'audience' | 'content' | 'retrospective' | 'activity';
  data?: any;
}

// ============= BUSINESS LAYER TYPES =============

export interface CampaignGenerationRequest {
  companyId: string;
  objectives?: string[];
  targetAudience?: any;
}

export interface SubscriptionCheckResponse {
  plan_name: string;
  plan_slug: string;
  limits: Record<string, any>;
  usage?: Record<string, number>;
  status: string;
  current_period_end: string | null;
}

// ============= ERROR TYPES =============

export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public functionName: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'EdgeFunctionError';
  }
}
