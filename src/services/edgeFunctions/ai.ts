/**
 * Edge Functions Service - AI/ML Layer
 * 
 * AI-powered content generation, analysis, and optimization
 */

import { invokeEdgeFunction, batchInvokeEdgeFunctions } from './core';
import type { 
  ContentGenerationRequest, 
  AnalysisRequest,
  EdgeFunctionResponse 
} from './types';

// ============= CONTENT GENERATION =============

/**
 * Generate general company content
 */
export async function generateCompanyContent(request: ContentGenerationRequest) {
  return invokeEdgeFunction(
    'generate-company-content',
    request,
    { retries: 3, timeout: 45000 }
  );
}

/**
 * Generate marketing post
 */
export async function generateMarketingPost(request: any) {
  return invokeEdgeFunction(
    'marketing-hub-post-creator',
    request,
    { retries: 3, timeout: 45000 }
  );
}

/**
 * Generate marketing image
 */
export async function generateMarketingImage(request: any) {
  return invokeEdgeFunction(
    'marketing-hub-image-creator',
    request,
    { retries: 3, timeout: 60000 }
  );
}

/**
 * Generate marketing video/reel
 */
export async function generateMarketingReel(request: any) {
  return invokeEdgeFunction(
    'marketing-hub-reel-creator',
    request,
    { retries: 3, timeout: 90000 }
  );
}

/**
 * Generate marketing strategy
 */
export async function generateMarketingStrategy(request: any) {
  return invokeEdgeFunction(
    'marketing-hub-marketing-strategy',
    request,
    { retries: 2, timeout: 60000 }
  );
}

/**
 * Generate target audience
 */
export async function generateTargetAudience(request: any) {
  return invokeEdgeFunction(
    'marketing-hub-target-audience',
    request,
    { retries: 2, timeout: 45000 }
  );
}

/**
 * Generate content calendar
 */
export async function generateContentCalendar(request: any) {
  return invokeEdgeFunction(
    'marketing-hub-content-calendar',
    request,
    { retries: 2, timeout: 60000 }
  );
}

// ============= CONTENT ANALYSIS =============

/**
 * Analyze social content
 */
export async function analyzeSocialContent(request: AnalysisRequest) {
  return invokeEdgeFunction(
    'analyze-social-content',
    request,
    { timeout: 45000 }
  );
}

/**
 * Analyze social audience
 */
export async function analyzeSocialAudience(request: AnalysisRequest) {
  return invokeEdgeFunction(
    'analyze-social-audience',
    request,
    { timeout: 45000 }
  );
}

/**
 * Analyze social activity
 */
export async function analyzeSocialActivity(request: AnalysisRequest) {
  return invokeEdgeFunction(
    'analyze-social-activity',
    request,
    { timeout: 45000 }
  );
}

/**
 * Social retrospective analysis
 */
export async function analyzeSocialRetrospective(request: AnalysisRequest) {
  return invokeEdgeFunction(
    'analyze-social-retrospective',
    request,
    { timeout: 45000 }
  );
}

/**
 * Batch analyze all social metrics
 */
export async function batchAnalyzeSocial(companyId: string) {
  return batchInvokeEdgeFunctions([
    { functionName: 'analyze-social-content', body: { company_id: companyId } },
    { functionName: 'analyze-social-audience', body: { company_id: companyId } },
    { functionName: 'analyze-social-activity', body: { company_id: companyId } },
    { functionName: 'analyze-social-retrospective', body: { company_id: companyId } }
  ]);
}

/**
 * Advanced social analyzer
 */
export async function advancedSocialAnalysis(request: any) {
  return invokeEdgeFunction(
    'advanced-social-analyzer',
    request,
    { timeout: 60000 }
  );
}

/**
 * Premium AI insights
 */
export async function getPremiumAIInsights(request: any) {
  return invokeEdgeFunction(
    'premium-ai-insights',
    request,
    { timeout: 60000 }
  );
}

/**
 * Content insights generator
 */
export async function generateContentInsights(request: any) {
  return invokeEdgeFunction(
    'content-insights-generator',
    request,
    { timeout: 45000 }
  );
}

/**
 * Content insights analyzer
 */
export async function analyzeContentInsights(request: any) {
  return invokeEdgeFunction(
    'content-insights-analyzer',
    request,
    { timeout: 45000 }
  );
}

/**
 * Audience intelligence analysis
 */
export async function analyzeAudienceIntelligence(request: any) {
  return invokeEdgeFunction(
    'audience-intelligence-analysis',
    request,
    { timeout: 45000 }
  );
}

// ============= AI OPTIMIZATION =============

/**
 * ERA content optimizer
 */
export async function optimizeContentWithERA(request: any) {
  return invokeEdgeFunction(
    'era-content-optimizer',
    request,
    { retries: 2, timeout: 30000 }
  );
}

/**
 * ERA campaign optimizer
 */
export async function optimizeCampaignWithERA(request: any) {
  return invokeEdgeFunction(
    'era-campaign-optimizer',
    request,
    { retries: 2, timeout: 45000 }
  );
}

/**
 * ERA chat
 */
export async function chatWithERA(request: any) {
  return invokeEdgeFunction(
    'era-chat',
    request,
    { timeout: 30000 }
  );
}

// ============= AI WORKFORCE =============

/**
 * Generate AI audience
 */
export async function generateAIAudience(request: any) {
  return invokeEdgeFunction(
    'ai-audience-generator',
    request,
    { retries: 2, timeout: 60000 }
  );
}

/**
 * AI Learning Tutor
 */
export async function chatWithAITutor(request: any) {
  return invokeEdgeFunction(
    'ai-learning-tutor',
    request,
    { timeout: 45000 }
  );
}

/**
 * Execute workforce mission
 */
export async function executeWorkforceMission(request: any) {
  return invokeEdgeFunction(
    'execute-workforce-mission',
    request,
    { timeout: 120000 } // 2 minutes for complex missions
  );
}
