import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InferredStrategicData {
  // Module 1: Core Mission Logic
  structuralProblem: string | null;
  transformation: string | null;
  currentState: string | null;       // what_is_working summary
  desiredState: string | null;        // action_plan / future positioning
  
  // Module 2: Target Market
  icpName: string | null;
  icpDescription: string | null;
  icpPainPoints: string[];
  icpGoals: string[];
  clientMaturity: 'early' | 'growing' | 'established' | null;
  decisionMaker: 'founder' | 'clevel' | 'corporate' | null;
  marketSize: string | null;
  
  // Module 3: Competitive Positioning
  competitiveCategory: string | null;
  competitiveAdvantage: string | null;
  keyRisks: string[];
  keyAssets: string | null;           // what_is_working as moat assets
  suggestedMoat: 'cost' | 'differentiation' | 'focus' | 'network_effects' | null;
  
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
            .limit(3),
          supabase
            .from('company_products')
            .select('name, category, description')
            .eq('company_id', companyId)
            .limit(5),
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

        // ────── MODULE 1: Core Mission Logic ──────
        
        // Structural problem from digital gaps
        let structuralProblem: string | null = null;
        if (presence?.what_is_missing && Array.isArray(presence.what_is_missing) && presence.what_is_missing.length > 0) {
          const missing = (presence.what_is_missing as string[]).slice(0, 4).join('. ');
          const summary = presence.digital_footprint_summary || '';
          structuralProblem = summary 
            ? `${summary}\n\nBrechas identificadas: ${missing}`
            : `Brechas identificadas en el mercado: ${missing}`;
        } else if (webhook?.analysis?.gaps) {
          structuralProblem = Array.isArray(webhook.analysis.gaps) 
            ? webhook.analysis.gaps.join('. ') 
            : String(webhook.analysis.gaps);
        }

        // Current state from what_is_working
        let currentState: string | null = null;
        if (presence?.what_is_working && Array.isArray(presence.what_is_working) && presence.what_is_working.length > 0) {
          currentState = (presence.what_is_working as string[]).join('. ');
        }

        // Transformation / desired future state
        let transformation: string | null = null;
        let desiredState: string | null = null;
        const exec = presence?.executive_diagnosis as any;
        
        if (exec?.highest_leverage_focus) {
          transformation = exec.highest_leverage_focus;
        }
        
        // Build desired state from action_plan
        if (presence?.action_plan && Array.isArray(presence.action_plan) && presence.action_plan.length > 0) {
          desiredState = (presence.action_plan as string[]).slice(0, 3).join('. ');
        } else if (exec?.scores) {
          // Build desired state from low-scoring areas
          const areas: string[] = [];
          if (exec.scores.visibility < 50) areas.push('Mejorar visibilidad digital y SEO');
          if (exec.scores.trust < 50) areas.push('Fortalecer confianza y credibilidad online');
          if (exec.scores.positioning < 50) areas.push('Definir posicionamiento competitivo claro');
          if (areas.length > 0) desiredState = areas.join('. ');
        }

        // If no transformation yet, derive from description
        if (!transformation && company?.description) {
          transformation = company.description;
        }

        // ────── MODULE 2: Target Market ──────
        
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
          
          // Estimate market size from audience count
          if (audiences.length > 1) {
            marketSize = `${audiences.length} segmentos de audiencia identificados`;
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

        // ────── MODULE 3: Competitive Positioning ──────
        
        let competitiveCategory: string | null = null;
        if (company?.industry_sector) {
          competitiveCategory = company.industry_sector;
          if (company.country) competitiveCategory += ` en ${company.country}`;
        }
        
        // Enrich category with products
        if (hasProducts && products.length > 0) {
          const serviceNames = products.slice(0, 2).map(p => p.name).join(', ');
          if (competitiveCategory) {
            competitiveCategory += ` — ${serviceNames}`;
          } else {
            competitiveCategory = serviceNames;
          }
        }

        let competitiveAdvantage: string | null = null;
        if (presence?.competitive_positioning) {
          competitiveAdvantage = presence.competitive_positioning;
        }

        // Key assets from what_is_working
        let keyAssets: string | null = null;
        if (currentState) {
          keyAssets = currentState;
        }

        // Suggest moat type based on data signals
        let suggestedMoat: 'cost' | 'differentiation' | 'focus' | 'network_effects' | null = null;
        if (audiences.length === 1) suggestedMoat = 'focus'; // single audience = niche focus
        else if (hasProducts && products.length >= 3) suggestedMoat = 'differentiation';
        else if (competitiveAdvantage) suggestedMoat = 'differentiation';

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
        const confidence = evidenceCount >= 3 ? 'high' : evidenceCount >= 2 ? 'medium' : 'low';

        setInferredData({
          structuralProblem,
          transformation,
          currentState,
          desiredState,
          icpName,
          icpDescription,
          icpPainPoints,
          icpGoals,
          clientMaturity,
          decisionMaker,
          marketSize,
          competitiveCategory,
          competitiveAdvantage,
          keyRisks,
          keyAssets,
          suggestedMoat,
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
