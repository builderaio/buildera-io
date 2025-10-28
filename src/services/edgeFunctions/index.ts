/**
 * Edge Functions Service - Main Export
 * 
 * Centralized service for ALL Edge Function interactions in the app.
 * 
 * Usage:
 * ```typescript
 * import { edgeFunctions } from '@/services/edgeFunctions';
 * 
 * // Data operations
 * const result = await edgeFunctions.data.getCompanyData(companyId);
 * 
 * // AI operations
 * const content = await edgeFunctions.ai.generateCompanyContent(request);
 * 
 * // Business operations
 * const campaign = await edgeFunctions.business.generateCampaign(request);
 * ```
 */

// Re-export types
export * from './types';

// Re-export core utilities
export { invokeEdgeFunction, batchInvokeEdgeFunctions, clearCache } from './core';

// Import layer modules
import * as dataLayer from './data';
import * as aiLayer from './ai';
import * as businessLayer from './business';

/**
 * Unified Edge Functions service with organized layers
 */
export const edgeFunctions = {
  /**
   * Data layer: Database operations, company data, social stats
   */
  data: dataLayer,

  /**
   * AI/ML layer: Content generation, analysis, optimization
   */
  ai: aiLayer,

  /**
   * Business layer: Campaigns, subscriptions, integrations
   */
  business: businessLayer,
};

/**
 * Default export for convenience
 */
export default edgeFunctions;
