import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InferredStrategicData {
  // Module 1: Core Mission Logic
  structuralProblem: string | null;
  transformation: string | null;
  
  // Module 2: Target Market
  icpName: string | null;
  icpDescription: string | null;
  icpPainPoints: string[];
  clientMaturity: 'early' | 'growing' | 'established' | null;
  decisionMaker: 'founder' | 'clevel' | 'corporate' | null;
  
  // Module 3: Competitive Positioning
  competitiveCategory: string | null;
  competitiveAdvantage: string | null;
  keyRisks: string[];
  
  // Meta
  hasDigitalPresence: boolean;
  hasWebhookData: boolean;
  hasAudiences: boolean;
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
        const [presenceRes, companyRes, audienceRes] = await Promise.all([
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
        ]);

        const presence = presenceRes.data;
        const company = companyRes.data;
        const audiences = audienceRes.data || [];
        const webhook = company?.webhook_data as any;

        const hasDigitalPresence = !!presence;
        const hasWebhookData = !!webhook;
        const hasAudiences = audiences.length > 0;

        // Infer structural problem from digital presence
        let structuralProblem: string | null = null;
        if (presence?.what_is_missing && Array.isArray(presence.what_is_missing) && presence.what_is_missing.length > 0) {
          const missing = (presence.what_is_missing as string[]).slice(0, 3).join('. ');
          const summary = presence.digital_footprint_summary || '';
          structuralProblem = summary 
            ? `${summary} Brechas identificadas: ${missing}`
            : `Brechas identificadas en el mercado: ${missing}`;
        }

        // Infer transformation from executive diagnosis
        let transformation: string | null = null;
        const exec = presence?.executive_diagnosis as any;
        if (exec?.highest_leverage_focus) {
          transformation = exec.highest_leverage_focus;
        }

        // Infer ICP from audiences
        let icpName: string | null = null;
        let icpDescription: string | null = null;
        let icpPainPoints: string[] = [];
        if (audiences.length > 0) {
          const primary = audiences[0];
          icpName = primary.name;
          icpDescription = primary.description;
          icpPainPoints = primary.pain_points || [];
        }

        // Infer maturity from company_size
        let clientMaturity: 'early' | 'growing' | 'established' | null = null;
        const size = company?.company_size;
        if (size === '1-10' || size === '1' || size === 'solo') clientMaturity = 'early';
        else if (size === '11-50' || size === '2-10') clientMaturity = 'growing';
        else if (size) clientMaturity = 'established';

        // Infer decision maker from size
        let decisionMaker: 'founder' | 'clevel' | 'corporate' | null = null;
        if (size === '1-10' || size === '1' || size === 'solo' || size === '2-10') decisionMaker = 'founder';
        else if (size === '11-50' || size === '51-200') decisionMaker = 'clevel';
        else if (size) decisionMaker = 'corporate';

        // Infer competitive category from industry + services
        let competitiveCategory: string | null = null;
        if (company?.industry_sector) {
          competitiveCategory = company.industry_sector;
          if (company.country) competitiveCategory += ` en ${company.country}`;
        }

        // Infer competitive advantage from positioning
        let competitiveAdvantage: string | null = null;
        if (presence?.competitive_positioning) {
          competitiveAdvantage = presence.competitive_positioning;
        }

        // Key risks
        let keyRisks: string[] = [];
        if (presence?.key_risks && Array.isArray(presence.key_risks)) {
          keyRisks = (presence.key_risks as string[]).slice(0, 4);
        }

        // Confidence level
        let evidenceCount = 0;
        if (hasDigitalPresence) evidenceCount++;
        if (hasWebhookData) evidenceCount++;
        if (hasAudiences) evidenceCount++;
        const confidence = evidenceCount >= 3 ? 'high' : evidenceCount >= 2 ? 'medium' : 'low';

        setInferredData({
          structuralProblem,
          transformation,
          icpName,
          icpDescription,
          icpPainPoints,
          clientMaturity,
          decisionMaker,
          competitiveCategory,
          competitiveAdvantage,
          keyRisks,
          hasDigitalPresence,
          hasWebhookData,
          hasAudiences,
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
