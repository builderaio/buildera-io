/**
 * Edge Functions Service - Data Layer
 * 
 * Functions that primarily read/write database data
 */

import { invokeEdgeFunction } from './core';
import type { CompanyData, EdgeFunctionResponse } from './types';

/**
 * Get company data (objectives and audiences)
 */
export async function getCompanyData(
  companyId: string
): Promise<EdgeFunctionResponse<CompanyData>> {
  return invokeEdgeFunction<CompanyData>(
    'get-company-data',
    { company_id: companyId },
    { cache: true, cacheTTL: 300000 } // 5 minutes cache
  );
}

/**
 * Get company objectives
 */
export async function getCompanyObjectives(companyId: string) {
  return invokeEdgeFunction(
    'get-company-objetivos',
    { company_id: companyId },
    { cache: true }
  );
}

/**
 * Manage company objectives (create, update, delete)
 */
export async function manageCompanyObjectives(
  companyId: string,
  action: 'create' | 'update' | 'delete',
  objectiveData?: any
) {
  return invokeEdgeFunction(
    'manage-company-objectives',
    { company_id: companyId, action, data: objectiveData }
  );
}

/**
 * Get social audience stats
 */
export async function getSocialAudienceStats(
  companyId: string,
  platform: string
) {
  return invokeEdgeFunction(
    'get-social-audience-stats',
    { company_id: companyId, platform },
    { cache: true, cacheTTL: 600000 } // 10 minutes cache
  );
}

/**
 * Calculate social analytics
 */
export async function calculateSocialAnalytics(companyId: string) {
  return invokeEdgeFunction(
    'calculate-social-analytics',
    { company_id: companyId }
  );
}

/**
 * Calculate dashboard metrics
 */
export async function calculateDashboardMetrics(userId: string) {
  return invokeEdgeFunction(
    'calculate-dashboard-metrics',
    { user_id: userId }
  );
}
