import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InferredAudienceSegment {
  name: string;
  description: string | null;
  painPoints: string[];
  goals: string[];
  challenges: string[];
}

export interface InferredActionItem {
  action: string;
  reason: string;
  horizon: 'short_term' | 'mid_term' | 'long_term';
}

export interface InferredStrategicData {
  // Module 1: Core Mission Logic
  structuralProblem: string | null;
  transformation: string | null;
  currentState: string | null;
  desiredState: string | null;
  primaryConstraint: string | null;
  highestLeverageFocus: string | null;
  
  // Module 2: Target Market
  icpName: string | null;
  icpDescription: string | null;
  icpPainPoints: string[];
  icpGoals: string[];
  allAudiences: InferredAudienceSegment[];
  clientMaturity: 'early' | 'growing' | 'established' | null;
  decisionMaker: 'founder' | 'clevel' | 'corporate' | null;
  marketSize: string | null;
  
  // Module 3: Competitive Positioning
  competitiveCategory: string | null;
  competitiveAdvantage: string | null;
  keyRisks: string[];
  keyAssets: string | null;
  suggestedMoat: 'cost' | 'differentiation' | 'focus' | 'network_effects' | null;
  
  // SEO & Digital Signals
  seoKeywords: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  
  // Products/Services
  products: Array<{ name: string; category: string; description: string | null }>;
  productBasedAdvantage: string | null;
  
  // Structured Action Plan
  actionPlan: InferredActionItem[];
  
  // Digital Gaps (for supplementing ICP pain points)
  digitalGaps: string[];
  
  // Executive Diagnosis Scores
  executiveDiagnosis: {
    visibility: number;
    trust: number;
    positioning: number;
    overall: number;
  } | null;
  
  // Meta
  hasDigitalPresence: boolean;
  hasWebhookData: boolean;
  hasAudiences: boolean;
  hasProducts: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export function useDiagnosticInference(companyId: string) {
  const [inferredData, setInferredData] = useState<InferredStrategicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    
    const fetchDiagnosticData = async () => {
      setIsLoading(true);
      try {
        const [presenceRes, companyRes, audienceRes, productsRes] = await Promise.all([
          supabase
            .from('company_digital_presence')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('companies')
            .select('webhook_data, description, industry_sector, company_size, country')
            .eq('id', companyId)
            .single(),
          supabase
            .from('company_audiences')
            .select('name, description, pain_points, goals, challenges')
            .eq('company_id', companyId)
            .limit(10),
          supabase
            .from('company_products')
            .select('name, category, description')
            .eq('company_id', companyId)
            .limit(10),
        ]);

        const presence = presenceRes.data;
        const company = companyRes.data;
        const audiences = audienceRes.data || [];
        const products = productsRes.data || [];
        const webhook = company?.webhook_data as any;

        const hasDigitalPresence = !!presence;
        const hasWebhookData = !!webhook;
        const hasAudiences = audiences.length > 0;
        const hasProducts = products.length > 0;

        const exec = presence?.executive_diagnosis as any;

        // ══════════════════════════════════════════
        // MODULE 1: Core Mission Logic
        // ══════════════════════════════════════════
        
        // Structural problem: concise statement from primary constraint or top gap
        let structuralProblem: string | null = null;
        const primaryConstraint: string | null = exec?.primary_constraint || null;
        
        if (primaryConstraint) {
          // Use primary constraint directly — it's already a concise statement
          structuralProblem = primaryConstraint;
        } else if (presence?.what_is_missing && Array.isArray(presence.what_is_missing) && (presence.what_is_missing as string[]).length > 0) {
          // Synthesize from top 2 gaps only, without the raw diagnostic summary
          const topGaps = (presence.what_is_missing as string[]).slice(0, 2);
          structuralProblem = topGaps.join('. ');
        } else if (webhook?.analysis?.gaps) {
          const gaps = Array.isArray(webhook.analysis.gaps) ? webhook.analysis.gaps : [String(webhook.analysis.gaps)];
          structuralProblem = gaps.slice(0, 2).join('. ');
        }

        // Current state: concise summary, not a wall of text
        let currentState: string | null = exec?.current_state || null;
        if (!currentState && presence?.what_is_working && Array.isArray(presence.what_is_working) && (presence.what_is_working as string[]).length > 0) {
          // Use only top 2 working items as current state, not everything
          currentState = (presence.what_is_working as string[]).slice(0, 2).join('. ');
        }

        // Transformation / highest leverage focus
        const highestLeverageFocus: string | null = exec?.highest_leverage_focus || null;
        let transformation: string | null = highestLeverageFocus;
        if (!transformation && company?.description) {
          transformation = company.description;
        }

        // Desired state: strategic objectives, NOT raw tactical action items
        let desiredState: string | null = null;
        const actionPlan: InferredActionItem[] = [];
        
        // Still parse action plan for the actionPlan array (used elsewhere)
        if (presence?.action_plan && typeof presence.action_plan === 'object' && !Array.isArray(presence.action_plan)) {
          const plan = presence.action_plan as any;
          for (const [horizon, items] of Object.entries(plan)) {
            if (Array.isArray(items)) {
              for (const item of items as any[]) {
                const mappedHorizon = horizon === 'short_term' ? 'short_term' 
                  : horizon === 'mid_term' ? 'mid_term' : 'long_term';
                actionPlan.push({
                  action: item.action || String(item),
                  reason: item.reason || '',
                  horizon: mappedHorizon as any,
                });
              }
            }
          }
        }
        
        // Desired state: derive strategic objectives from scores, NOT from raw action items
        if (exec?.scores) {
          const areas: string[] = [];
          if (exec.scores.visibility < 50) areas.push('Mejorar visibilidad digital y SEO');
          if (exec.scores.trust < 50) areas.push('Fortalecer confianza y credibilidad online');
          if (exec.scores.positioning < 50) areas.push('Definir posicionamiento competitivo claro');
          if (areas.length > 0) desiredState = areas.join('. ');
        }
        
        // Fallback: use mid/long-term action themes (not verbatim tactical items)
        if (!desiredState && actionPlan.length > 0) {
          const strategic = actionPlan
            .filter(a => a.horizon === 'mid_term' || a.horizon === 'long_term')
            .slice(0, 2)
            .map(a => a.action);
          if (strategic.length > 0) {
            desiredState = strategic.join('. ');
          } else {
            // If only short-term, take top 2 only
            desiredState = actionPlan.slice(0, 2).map(a => a.action).join('. ');
          }
        }

        // Digital gaps for supplementing audience pain points
        const digitalGaps: string[] = [];
        if (presence?.what_is_missing && Array.isArray(presence.what_is_missing)) {
          digitalGaps.push(...(presence.what_is_missing as string[]));
        }

        // ══════════════════════════════════════════
        // MODULE 2: Target Market (Audiences → ICP)
        // ══════════════════════════════════════════
        
        // Map ALL audiences, not just the first
        const allAudiences: InferredAudienceSegment[] = audiences.map(a => ({
          name: a.name,
          description: a.description,
          painPoints: a.pain_points || [],
          goals: a.goals || [],
          challenges: a.challenges || [],
        }));

        // Primary ICP = first audience, enriched with supplementary data
        let icpName: string | null = null;
        let icpDescription: string | null = null;
        let icpPainPoints: string[] = [];
        let icpGoals: string[] = [];
        let marketSize: string | null = null;
        
        if (audiences.length > 0) {
          const primary = audiences[0];
          icpName = primary.name;
          icpDescription = primary.description;
          icpPainPoints = primary.pain_points || [];
          icpGoals = primary.goals || [];
          
          // If audience pain_points are empty, supplement from diagnostic gaps and risks
          if (icpPainPoints.length === 0) {
            const supplementalPains: string[] = [];
            // From key_risks
            if (presence?.key_risks && Array.isArray(presence.key_risks)) {
              supplementalPains.push(...(presence.key_risks as string[]).slice(0, 2));
            }
            // From digital gaps (what_is_missing)
            if (digitalGaps.length > 0) {
              supplementalPains.push(...digitalGaps.slice(0, 2));
            }
            if (supplementalPains.length > 0) {
              icpPainPoints = supplementalPains;
            }
          }
          
          // If goals are empty, derive from action plan
          if (icpGoals.length === 0 && actionPlan.length > 0) {
            icpGoals = actionPlan
              .filter(a => a.horizon === 'short_term' || a.horizon === 'mid_term')
              .slice(0, 3)
              .map(a => a.action);
          }
          
          // Market size from audience count + names
          if (audiences.length > 1) {
            const segmentNames = audiences.map(a => a.name).join(', ');
            marketSize = `${audiences.length} segmentos identificados: ${segmentNames}`;
          }
        }

        // Maturity from company_size
        let clientMaturity: 'early' | 'growing' | 'established' | null = null;
        const size = company?.company_size;
        if (size === '1-10' || size === '1' || size === 'solo') clientMaturity = 'early';
        else if (size === '11-50' || size === '2-10') clientMaturity = 'growing';
        else if (size) clientMaturity = 'established';

        // Decision maker
        let decisionMaker: 'founder' | 'clevel' | 'corporate' | null = null;
        if (size === '1-10' || size === '1' || size === 'solo' || size === '2-10') decisionMaker = 'founder';
        else if (size === '11-50' || size === '51-200') decisionMaker = 'clevel';
        else if (size) decisionMaker = 'corporate';

        // ══════════════════════════════════════════
        // MODULE 3: Competitive Positioning
        // ══════════════════════════════════════════
        
        // SEO data from webhook
        let seoKeywords: string[] = [];
        let seoTitle: string | null = null;
        let seoDescription: string | null = null;
        
        if (webhook?.seo) {
          seoTitle = webhook.seo.title || null;
          seoDescription = webhook.seo.description || null;
          seoKeywords = Array.isArray(webhook.seo.keyword) ? webhook.seo.keyword : [];
        }
        
        // Competitive category: industry + country + SEO keywords
        let competitiveCategory: string | null = null;
        if (company?.industry_sector) {
          competitiveCategory = company.industry_sector;
          if (company.country) competitiveCategory += ` en ${company.country}`;
        }
        
        // Enrich with top SEO keywords
        if (seoKeywords.length > 0 && competitiveCategory) {
          const topKeywords = seoKeywords.slice(0, 3).join(', ');
          competitiveCategory += ` — ${topKeywords}`;
        } else if (seoKeywords.length > 0) {
          competitiveCategory = seoKeywords.slice(0, 5).join(', ');
        }
        
        // If still no category, use product names
        if (!competitiveCategory && hasProducts && products.length > 0) {
          competitiveCategory = products.slice(0, 3).map(p => p.name).join(', ');
        } else if (competitiveCategory && hasProducts && products.length > 0) {
          const serviceNames = products.slice(0, 2).map(p => p.name).join(', ');
          competitiveCategory += ` — ${serviceNames}`;
        }

        // Competitive advantage: DO NOT use competitive_positioning raw text
        // That field contains diagnostic observations, not a strategic advantage statement
        let competitiveAdvantage: string | null = null;
        
        // Product-based advantage synthesis
        let productBasedAdvantage: string | null = null;
        if (hasProducts && products.length >= 3) {
          const serviceCount = products.filter(p => p.category === 'service').length;
          const productCount = products.filter(p => p.category === 'product').length;
          const parts: string[] = [];
          if (serviceCount > 0) parts.push(`${serviceCount} servicios`);
          if (productCount > 0) parts.push(`${productCount} productos`);
          productBasedAdvantage = `Portafolio diversificado con ${parts.join(' y ')}: ${products.slice(0, 4).map(p => p.name).join(', ')}`;
          competitiveAdvantage = productBasedAdvantage;
        }
        
        // Fallback: use what_is_working (strengths) as advantage base, concisely
        if (!competitiveAdvantage && presence?.what_is_working && Array.isArray(presence.what_is_working) && (presence.what_is_working as string[]).length > 0) {
          competitiveAdvantage = (presence.what_is_working as string[]).slice(0, 2).join('. ');
        }

        // Key assets: concise list of strengths, not a wall of text
        let keyAssets: string | null = null;
        if (presence?.what_is_working && Array.isArray(presence.what_is_working) && (presence.what_is_working as string[]).length > 0) {
          keyAssets = (presence.what_is_working as string[]).slice(0, 3).join('. ');
        }
        if (hasProducts && products.length > 0) {
          const productList = products.slice(0, 4).map(p => p.name).join(', ');
          keyAssets = keyAssets 
            ? `${keyAssets}. Productos/Servicios: ${productList}` 
            : `Productos/Servicios: ${productList}`;
        }

        // Suggest moat type based on richer signals
        let suggestedMoat: 'cost' | 'differentiation' | 'focus' | 'network_effects' | null = null;
        if (audiences.length === 1) {
          suggestedMoat = 'focus';
        } else if (hasProducts && products.length >= 5) {
          suggestedMoat = 'differentiation';
        } else if (hasProducts && products.length >= 3) {
          suggestedMoat = 'differentiation';
        } else if (competitiveAdvantage) {
          suggestedMoat = 'differentiation';
        }
        // Check for network effects signals in SEO/description
        const networkKeywords = ['plataforma', 'marketplace', 'comunidad', 'network', 'ecosystem'];
        const descLower = (company?.description || '').toLowerCase() + ' ' + (seoDescription || '').toLowerCase();
        if (networkKeywords.some(k => descLower.includes(k))) {
          suggestedMoat = 'network_effects';
        }

        // Key risks
        let keyRisks: string[] = [];
        if (presence?.key_risks && Array.isArray(presence.key_risks)) {
          keyRisks = (presence.key_risks as string[]).slice(0, 4);
        }

        // Executive Diagnosis scores
        let executiveDiagnosis: InferredStrategicData['executiveDiagnosis'] = null;
        if (exec?.scores) {
          executiveDiagnosis = {
            visibility: exec.scores.visibility || 0,
            trust: exec.scores.trust || 0,
            positioning: exec.scores.positioning || 0,
            overall: exec.scores.overall || 0,
          };
        }

        // Confidence level
        let evidenceCount = 0;
        if (hasDigitalPresence) evidenceCount++;
        if (hasWebhookData) evidenceCount++;
        if (hasAudiences) evidenceCount++;
        if (hasProducts) evidenceCount++;
        if (seoKeywords.length > 0) evidenceCount++;
        if (actionPlan.length > 0) evidenceCount++;
        const confidence = evidenceCount >= 4 ? 'high' : evidenceCount >= 2 ? 'medium' : 'low';

        setInferredData({
          structuralProblem,
          transformation,
          currentState,
          desiredState,
          primaryConstraint,
          highestLeverageFocus,
          icpName,
          icpDescription,
          icpPainPoints,
          icpGoals,
          allAudiences,
          clientMaturity,
          decisionMaker,
          marketSize,
          competitiveCategory,
          competitiveAdvantage,
          keyRisks,
          keyAssets,
          suggestedMoat,
          seoKeywords,
          seoTitle,
          seoDescription,
          products: products.map(p => ({ name: p.name, category: p.category, description: p.description })),
          productBasedAdvantage,
          actionPlan,
          digitalGaps,
          executiveDiagnosis,
          hasDigitalPresence,
          hasWebhookData,
          hasAudiences,
          hasProducts,
          confidence,
        });
      } catch (error) {
        console.error('Error fetching diagnostic inference data:', error);
        setInferredData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiagnosticData();
  }, [companyId]);

  return { inferredData, isLoading };
}
