/**
 * Edge Functions Service - Business Layer
 * 
 * Business logic, campaigns, subscriptions, and integrations
 */

import { invokeEdgeFunction } from './core';
import type { CampaignGenerationRequest, SubscriptionCheckResponse, EdgeFunctionResponse } from './types';

// ============= CAMPAIGN MANAGEMENT =============

/**
 * Generate AI-powered campaign
 */
export async function generateCampaign(
  request: CampaignGenerationRequest
): Promise<EdgeFunctionResponse<any>> {
  return invokeEdgeFunction(
    'campaign-ai-generator',
    request,
    { retries: 2, timeout: 90000 }
  );
}

/**
 * Extract company information from URL
 */
export async function extractCompanyInfo(websiteUrl: string) {
  return invokeEdgeFunction(
    'company-info-extractor',
    { website_url: websiteUrl },
    { timeout: 60000 }
  );
}

/**
 * Generate company strategy
 */
export async function generateCompanyStrategy(companyId: string) {
  return invokeEdgeFunction(
    'company-strategy',
    { company_id: companyId },
    { timeout: 60000 }
  );
}

/**
 * Extract brand identity
 */
export async function extractBrandIdentity(data: any) {
  return invokeEdgeFunction(
    'brand-identity',
    data,
    { timeout: 45000 }
  );
}

// ============= SUBSCRIPTION & PAYMENTS =============

/**
 * Check subscription status
 */
export async function checkSubscriptionStatus(): Promise<EdgeFunctionResponse<SubscriptionCheckResponse>> {
  return invokeEdgeFunction<SubscriptionCheckResponse>(
    'check-subscription-status',
    {},
    { cache: true, cacheTTL: 60000 } // 1 minute cache
  );
}

/**
 * Create subscription checkout
 */
export async function createSubscriptionCheckout(planId: string) {
  return invokeEdgeFunction(
    'create-subscription-checkout',
    { plan_id: planId }
  );
}

/**
 * Calculate revenue
 */
export async function calculateRevenue(data: any) {
  return invokeEdgeFunction(
    'calculate-revenue',
    data
  );
}

// ============= AGENTS =============

/**
 * Create company agent
 */
export async function createCompanyAgent(userId: string, companyId: string) {
  return invokeEdgeFunction(
    'create-company-agent',
    { user_id: userId, company_id: companyId },
    { timeout: 60000 }
  );
}

/**
 * Company agent chat
 */
export async function chatWithCompanyAgent(request: any) {
  return invokeEdgeFunction(
    'company-agent-chat',
    request,
    { timeout: 45000 }
  );
}

/**
 * Deploy agent
 */
export async function deployAgent(request: any) {
  return invokeEdgeFunction(
    'deploy-agent',
    request,
    { timeout: 60000 }
  );
}

/**
 * Deploy agent instance
 */
export async function deployAgentInstance(request: any) {
  return invokeEdgeFunction(
    'deploy-agent-instance',
    request,
    { timeout: 60000 }
  );
}

/**
 * Deploy workforce agent
 */
export async function deployWorkforceAgent(request: any) {
  return invokeEdgeFunction(
    'deploy-workforce-agent',
    request,
    { timeout: 60000 }
  );
}

/**
 * Create response agent
 */
export async function createResponseAgent(request: any) {
  return invokeEdgeFunction(
    'create-response-agent',
    request,
    { timeout: 45000 }
  );
}

/**
 * Agent chat proxy
 */
export async function agentChatProxy(request: any) {
  return invokeEdgeFunction(
    'agent-chat-proxy',
    request,
    { timeout: 45000 }
  );
}

// ============= SOCIAL MEDIA =============

/**
 * Facebook/Instagram auth
 */
export async function facebookAuth(code: string) {
  return invokeEdgeFunction(
    'facebook-instagram-auth',
    { code }
  );
}

/**
 * TikTok auth
 */
export async function tiktokAuth(code: string) {
  return invokeEdgeFunction(
    'tiktok-auth',
    { code }
  );
}

/**
 * LinkedIn OAuth callback
 */
export async function linkedinCallback(code: string) {
  return invokeEdgeFunction(
    'linkedin-oauth-callback',
    { code }
  );
}

/**
 * LinkedIn data sync
 */
export async function syncLinkedInData(userId: string) {
  return invokeEdgeFunction(
    'linkedin-data-sync',
    { user_id: userId },
    { timeout: 60000 }
  );
}

/**
 * LinkedIn posts
 */
export async function getLinkedInPosts(request: any) {
  return invokeEdgeFunction(
    'linkedin-posts',
    request
  );
}

// ============= EMAIL SYSTEM =============

/**
 * Send Buildera email
 */
export async function sendBuilderaEmail(request: any) {
  return invokeEdgeFunction(
    'send-buildera-email',
    request
  );
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string) {
  return invokeEdgeFunction(
    'send-verification-email',
    { email }
  );
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(userId: string) {
  return invokeEdgeFunction(
    'send-welcome-email',
    { user_id: userId }
  );
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string) {
  return invokeEdgeFunction(
    'send-password-reset-email',
    { email }
  );
}

/**
 * Send company invitation
 */
export async function sendCompanyInvitation(request: any) {
  return invokeEdgeFunction(
    'send-company-invitation',
    request
  );
}

/**
 * Accept company invitation
 */
export async function acceptCompanyInvitation(token: string) {
  return invokeEdgeFunction(
    'accept-company-invitation',
    { token }
  );
}

// ============= ADMIN =============

/**
 * Fetch available AI models
 */
export async function fetchAvailableModels(provider?: string) {
  return invokeEdgeFunction(
    'fetch-available-models',
    { provider },
    { cache: true, cacheTTL: 3600000 } // 1 hour cache
  );
}

/**
 * Run champion challenge
 */
export async function runChampionChallenge(request: any) {
  return invokeEdgeFunction(
    'run-champion-challenge',
    request,
    { timeout: 120000 }
  );
}

/**
 * AI model monitoring
 */
export async function monitorAIModels() {
  return invokeEdgeFunction(
    'ai-model-monitoring',
    {}
  );
}
