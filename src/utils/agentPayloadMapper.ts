/**
 * Agent Payload Mapper
 * Maps company data to the specific parameters each edge function expects
 */

interface Company {
  id: string;
  name: string;
  description?: string;
  website_url?: string;
  industry_sector?: string;
  company_size?: string;
  country?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  tiktok_url?: string;
}

interface Strategy {
  id?: string;
  mision?: string;
  vision?: string;
  propuesta_valor?: string;
  diferenciador?: string;
  objetivos?: string;
}

interface Audience {
  id: string;
  name: string;
  description?: string;
  age_ranges?: any;
  interests?: any;
  geographic_locations?: any;
}

interface Branding {
  primary_color?: string;
  secondary_color?: string;
  visual_identity?: string;
  brand_voice?: any;
}

export interface AgentPayloadContext {
  company: Company;
  strategy?: Strategy | null;
  audiences?: Audience[];
  branding?: Branding | null;
  configuration?: Record<string, any>;
  userId?: string;
  language?: string;
}

/**
 * Build the specific payload for each agent's edge function
 */
export const buildAgentPayload = (
  agentCode: string,
  context: AgentPayloadContext
): Record<string, any> => {
  const { company, strategy, audiences, branding, configuration, userId, language } = context;
  
  const basePayload = {
    companyId: company.id,
    userId,
    language: language || 'es'
  };

  switch (agentCode) {
    // Marketing Strategy Agent
    case 'MKTG_STRATEGIST':
      return {
        input: {
          nombre_empresa: company.name,
          objetivo_de_negocio: company.description || strategy?.objetivos || '',
          propuesta_valor: strategy?.propuesta_valor || '',
          sitio_web: company.website_url || '',
          sector_industria: company.industry_sector || '',
          audiencias: audiences?.map(a => ({
            nombre: a.name,
            descripcion: a.description,
            edades: a.age_ranges,
            intereses: a.interests,
            ubicaciones: a.geographic_locations
          })) || [],
          ...configuration
        },
        ...basePayload
      };

    // Content Creator Agent
    case 'CONTENT_CREATOR':
      return {
        companyId: company.id,
        userId,
        platform: configuration?.platform || 'general',
        contentType: configuration?.content_type || 'post',
        topic: configuration?.topic || '',
        tone: configuration?.tone || branding?.brand_voice || 'profesional',
        language: language || 'es',
        brandContext: {
          companyName: company.name,
          industry: company.industry_sector,
          valueProposition: strategy?.propuesta_valor,
          visualIdentity: branding?.visual_identity,
          brandVoice: branding?.brand_voice
        },
        ...configuration
      };

    // Calendar Planner Agent
    case 'CALENDAR_PLANNER':
      return {
        companyId: company.id,
        userId,
        period: configuration?.period || 'month',
        platforms: configuration?.platforms || ['instagram', 'linkedin'],
        postsPerWeek: configuration?.posts_per_week || 3,
        brandContext: {
          companyName: company.name,
          industry: company.industry_sector,
          audiences: audiences?.map(a => a.name)
        },
        language: language || 'es',
        ...configuration
      };

    // Image Creator Agent
    case 'IMAGE_CREATOR':
      return {
        companyId: company.id,
        userId,
        prompt: configuration?.prompt || '',
        style: configuration?.style || 'profesional',
        aspectRatio: configuration?.aspect_ratio || '1:1',
        brandColors: {
          primary: branding?.primary_color,
          secondary: branding?.secondary_color
        },
        ...configuration
      };

    // Video Creator Agent
    case 'VIDEO_CREATOR':
      return {
        companyId: company.id,
        userId,
        topic: configuration?.topic || '',
        duration: configuration?.duration || 30,
        platform: configuration?.platform || 'instagram',
        style: configuration?.style || 'promotional',
        brandContext: {
          companyName: company.name,
          brandVoice: branding?.brand_voice
        },
        ...configuration
      };

    // Audience Analyst Agent
    case 'AUDIENCE_ANALYST':
      return {
        companyId: company.id,
        userId,
        platform: configuration?.platform || 'instagram',
        analysisType: configuration?.analysis_type || 'demographics',
        existingAudiences: audiences?.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description
        })),
        language: language || 'es',
        ...configuration
      };

    // Content Publisher Agent  
    case 'CONTENT_PUBLISHER':
      return {
        companyId: company.id,
        userId,
        contentId: configuration?.content_id,
        platform: configuration?.platform || 'instagram',
        scheduledTime: configuration?.scheduled_time,
        caption: configuration?.caption,
        hashtags: configuration?.hashtags,
        ...configuration
      };

    // Insights Generator Agent
    case 'INSIGHTS_GENERATOR':
      return {
        companyId: company.id,
        userId,
        platform: configuration?.platform || 'all',
        insightType: configuration?.insight_type || 'performance',
        dateRange: configuration?.date_range || 'last_30_days',
        companyContext: {
          name: company.name,
          industry: company.industry_sector,
          objectives: strategy?.objetivos
        },
        language: language || 'es',
        ...configuration
      };

    // Company Strategy Agent
    case 'COMPANY_STRATEGY':
      return {
        companyId: company.id,
        userId,
        strategySections: configuration?.sections || ['mision', 'vision', 'propuesta_valor'],
        currentStrategy: {
          mision: strategy?.mision,
          vision: strategy?.vision,
          propuesta_valor: strategy?.propuesta_valor
        },
        companyInfo: {
          name: company.name,
          description: company.description,
          industry: company.industry_sector,
          website: company.website_url
        },
        language: language || 'es',
        ...configuration
      };

    // Competitive Intelligence Agent
    case 'COMPETITIVE_INTEL':
      return {
        companyId: company.id,
        userId,
        competitors: configuration?.competitors || [],
        analysisAreas: configuration?.analysis_areas || ['social_media', 'positioning'],
        companyContext: {
          name: company.name,
          industry: company.industry_sector,
          website: company.website_url
        },
        language: language || 'es',
        ...configuration
      };

    // Brand Identity Agent
    case 'BRAND_IDENTITY':
      return {
        companyId: company.id,
        userId,
        currentBranding: {
          visualIdentity: branding?.visual_identity,
          brandVoice: branding?.brand_voice,
          primaryColor: branding?.primary_color,
          secondaryColor: branding?.secondary_color
        },
        companyInfo: {
          name: company.name,
          industry: company.industry_sector,
          valueProposition: strategy?.propuesta_valor
        },
        language: language || 'es',
        ...configuration
      };

    // Social Media Analyzer Agent
    case 'SOCIAL_ANALYZER':
      return {
        companyId: company.id,
        userId,
        platform: configuration?.platform || 'instagram',
        profileUrl: configuration?.profile_url || company.instagram_url,
        analysisDepth: configuration?.analysis_depth || 'standard',
        language: language || 'es',
        ...configuration
      };

    // Era Content Optimizer (special case)
    case 'ERA_OPTIMIZER':
      return {
        text: configuration?.text || '',
        fieldType: configuration?.field_type || 'general',
        context: {
          companyName: company.name,
          industry: company.industry_sector,
          brandVoice: branding?.brand_voice
        },
        language: language || 'es'
      };

    // Default payload for unknown agents
    default:
      return {
        ...basePayload,
        companyData: {
          id: company.id,
          name: company.name,
          description: company.description,
          website_url: company.website_url,
          industry_sector: company.industry_sector
        },
        strategyData: strategy ? {
          mision: strategy.mision,
          vision: strategy.vision,
          propuesta_valor: strategy.propuesta_valor
        } : null,
        audiences: audiences?.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description
        })),
        configuration: configuration || {}
      };
  }
};

/**
 * Get the list of additional data needed for a specific agent
 */
export const getAgentDataRequirements = (agentCode: string): {
  needsStrategy: boolean;
  needsAudiences: boolean;
  needsBranding: boolean;
} => {
  switch (agentCode) {
    case 'MKTG_STRATEGIST':
      return { needsStrategy: true, needsAudiences: true, needsBranding: false };
    case 'CONTENT_CREATOR':
      return { needsStrategy: true, needsAudiences: false, needsBranding: true };
    case 'CALENDAR_PLANNER':
      return { needsStrategy: false, needsAudiences: true, needsBranding: false };
    case 'IMAGE_CREATOR':
    case 'VIDEO_CREATOR':
      return { needsStrategy: false, needsAudiences: false, needsBranding: true };
    case 'AUDIENCE_ANALYST':
      return { needsStrategy: false, needsAudiences: true, needsBranding: false };
    case 'INSIGHTS_GENERATOR':
      return { needsStrategy: true, needsAudiences: false, needsBranding: false };
    case 'COMPANY_STRATEGY':
      return { needsStrategy: true, needsAudiences: false, needsBranding: false };
    case 'BRAND_IDENTITY':
      return { needsStrategy: true, needsAudiences: false, needsBranding: true };
    default:
      return { needsStrategy: true, needsAudiences: true, needsBranding: true };
  }
};
