/**
 * Edge Functions Service - Core Client
 * 
 * Centralized handler for all Edge Function invocations with:
 * - Unified error handling
 * - Automatic retries
 * - Logging
 * - Performance monitoring
 */

import { supabase } from '@/integrations/supabase/client';
import { EdgeFunctionError, EdgeFunctionOptions, EdgeFunctionResponse } from './types';

const DEFAULT_OPTIONS: EdgeFunctionOptions = {
  retries: 2,
  timeout: 30000,
  cache: false,
  cacheTTL: 300000, // 5 minutes
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Core Edge Function invocation with retry logic and error handling
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body?: Record<string, any>,
  options: EdgeFunctionOptions = {}
): Promise<EdgeFunctionResponse<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cacheKey = `${functionName}:${JSON.stringify(body || {})}`;
  
  // Check cache
  if (opts.cache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < (opts.cacheTTL || 300000)) {
      console.log(`✅ [EdgeFunction] Cache hit for ${functionName}`);
      return { data: cached.data, error: null, cached: true };
    }
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= (opts.retries || 0); attempt++) {
    try {
      const startTime = performance.now();
      
      console.log(`🔄 [EdgeFunction] Invoking ${functionName}`, {
        attempt: attempt + 1,
        maxAttempts: (opts.retries || 0) + 1,
        body
      });

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: body || {}
      });

      const duration = performance.now() - startTime;
      
      if (error) {
        throw new EdgeFunctionError(
          error.message || 'Edge function invocation failed',
          functionName,
          error.status,
          error
        );
      }

      console.log(`✅ [EdgeFunction] Success ${functionName} (${duration.toFixed(0)}ms)`);

      // Cache successful response
      if (opts.cache && data) {
        cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return { data, error: null };

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ [EdgeFunction] Error in ${functionName} (attempt ${attempt + 1}/${(opts.retries || 0) + 1}):`, {
        error: lastError.message,
        details: lastError
      });

      // Don't retry on last attempt
      if (attempt < (opts.retries || 0)) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`⏳ [EdgeFunction] Retrying ${functionName} in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  return { 
    data: null, 
    error: lastError || new Error(`Failed to invoke ${functionName}`) 
  };
}

/**
 * Batch invoke multiple Edge Functions in parallel
 */
export async function batchInvokeEdgeFunctions<T = any>(
  requests: Array<{ functionName: string; body?: Record<string, any>; options?: EdgeFunctionOptions }>
): Promise<Array<EdgeFunctionResponse<T>>> {
  console.log(`📦 [EdgeFunction] Batch invoking ${requests.length} functions`);
  
  const promises = requests.map(req => 
    invokeEdgeFunction<T>(req.functionName, req.body, req.options)
  );

  return Promise.all(promises);
}

/**
 * Clear cache for specific function or all
 */
export function clearCache(functionName?: string): void {
  if (functionName) {
    for (const key of cache.keys()) {
      if (key.startsWith(functionName)) {
        cache.delete(key);
      }
    }
    console.log(`🧹 [EdgeFunction] Cache cleared for ${functionName}`);
  } else {
    cache.clear();
    console.log(`🧹 [EdgeFunction] All cache cleared`);
  }
}
