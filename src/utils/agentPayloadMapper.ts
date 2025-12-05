/**
 * Agent Payload Mapper
 * Maps company data to the specific parameters each edge function expects
 */

export interface Company {
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
  twitter_url?: string;
  youtube_url?: string;
}

export interface Strategy {
  id?: string;
  mision?: string;
  vision?: string;
  propuesta_valor?: string;
  objetivos_estrategicos?: string[];
  tono_comunicacion?: string;
  palabras_clave?: string[];
  diferenciadores?: string[];
}

export interface Audience {
  id: string;
  name: string;
  description?: string;
  age_ranges?: any;
  gender_split?: any;
  interests?: any;
  geographic_locations?: any;
  pain_points?: string[];
  goals?: string[];
  challenges?: string[];
}

export interface Branding {
  id?: string;
  primary_color?: string;
  secondary_color?: string;
  complementary_color_1?: string;
  complementary_color_2?: string;
  visual_identity?: string;
  brand_voice?: any;
  visual_synthesis?: any;
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

export interface ContextRequirements {
  needsStrategy: boolean;
  needsAudiences: boolean;
  needsBranding: boolean;
}

/**
 * Interpolate template variables with actual values
 * Supports syntax like {{company.name}}, {{strategy.mision}}, etc.
 */
const interpolateTemplate = (
  template: Record<string, any>,
  context: AgentPayloadContext
): Record<string, any> => {
  const { company, strategy, audiences, branding, configuration, userId, language } = context;
  
  const contextMap: Record<string, any> = {
    company,
    strategy: strategy || {},
    audiences: audiences || [],
    branding: branding || {},
    configuration: configuration || {},
    userId,
    language: language || 'es'
  };

  const interpolateValue = (value: any): any => {
    if (typeof value === 'string') {
      // Check for template variable pattern {{path.to.value}}
      const templatePattern = /\{\{([^}]+)\}\}/g;
      let result = value;
      let match;
      
      while ((match = templatePattern.exec(value)) !== null) {
        const path = match[1].trim();
        const resolvedValue = getNestedValue(contextMap, path);
        
        // If the entire string is just a template variable, return the resolved value directly
        // This preserves types (objects, arrays, etc.)
        if (match[0] === value) {
          return resolvedValue;
        }
        
        // Otherwise, do string replacement
        result = result.replace(match[0], String(resolvedValue ?? ''));
      }
      return result;
    }
    
    if (Array.isArray(value)) {
      return value.map(interpolateValue);
    }
    
    if (typeof value === 'object' && value !== null) {
      const interpolated: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        interpolated[key] = interpolateValue(val);
      }
      return interpolated;
    }
    
    return value;
  };

  return interpolateValue(template);
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj: Record<string, any>, path: string): any => {
  const parts = path.split('.');
  let current: any = obj;
  
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  
  return current;
};

/**
 * Build the specific payload for each agent's edge function
 * Supports both dynamic templates and hardcoded legacy mappings
 */
export const buildAgentPayload = (
  agentCode: string,
  context: AgentPayloadContext,
  payloadTemplate?: Record<string, any>
): Record<string, any> => {
  const { company, strategy, audiences, branding, configuration, userId, language } = context;

  // If a payload template is provided and not empty, use dynamic interpolation
  if (payloadTemplate && Object.keys(payloadTemplate).length > 0) {
    return interpolateTemplate(payloadTemplate, context);
  }

  // Fallback to hardcoded mappings for legacy agents

  switch (agentCode) {
    // ============================================
    // STRATEGY AGENTS
    // ============================================
    case 'MKTG_STRATEGIST':
      return {
        input: {
          nombre_empresa: company.name,
          objetivo_de_negocio: company.description || '',
          propuesta_valor: strategy?.propuesta_valor || '',
          sitio_web: company.website_url || '',
          sector_industria: company.industry_sector || '',
          audiencias: (audiences || []).map(a => ({
            nombre: a.name,
            descripcion: a.description || '',
            pain_points: a.pain_points || [],
            goals: a.goals || []
          })),
          ...configuration
        },
        language: language || 'es'
      };

    case 'BUSINESS_STRATEGIST':
      return {
        companyId: company.id,
        userId,
        language: language || 'es'
      };

    case 'CAMPAIGN_GENERATOR':
      return {
        companyId: company.id,
        userId,
        campaignType: configuration?.campaign_type || 'awareness',
        objective: configuration?.objective || '',
        targetAudience: audiences?.[0] || null,
        budget: configuration?.budget || null,
        duration: configuration?.duration || '30 days',
        platforms: configuration?.platforms || ['instagram', 'facebook'],
        language: language || 'es'
      };

    case 'CAMPAIGN_OPTIMIZER':
      return {
        campaignId: configuration?.campaign_id,
        metrics: configuration?.metrics || {},
        optimizationType: configuration?.optimization_type || 'engagement',
        language: language || 'es'
      };

    // ============================================
    // CONTENT AGENTS
    // ============================================
    case 'CONTENT_CREATOR':
      return {
        companyId: company.id,
        platform: configuration?.platform || 'general',
        contentType: configuration?.content_type || 'post',
        topic: configuration?.topic || '',
        tone: strategy?.tono_comunicacion || branding?.brand_voice?.tono || 'profesional',
        keywords: strategy?.palabras_clave || [],
        brandVoice: branding?.brand_voice || null,
        language: language || 'es'
      };

    case 'CALENDAR_PLANNER':
      return {
        companyId: company.id,
        userId,
        period: configuration?.period || 'month',
        platforms: configuration?.platforms || ['instagram', 'linkedin'],
        contentMix: configuration?.content_mix || {
          educational: 40,
          promotional: 30,
          engagement: 30
        },
        strategy: {
          propuesta_valor: strategy?.propuesta_valor || '',
          tono: strategy?.tono_comunicacion || '',
          keywords: strategy?.palabras_clave || []
        },
        language: language || 'es'
      };

    case 'IMAGE_CREATOR':
      return {
        input: {
          identidad_visual: branding?.visual_identity || '',
          colores_marca: {
            primary: branding?.primary_color || '#3c46b2',
            secondary: branding?.secondary_color || '#f15438'
          },
          tipo_imagen: configuration?.image_type || 'social_post',
          descripcion: configuration?.description || '',
          estilo: configuration?.style || 'moderno'
        },
        language: language || 'es'
      };

    case 'VIDEO_CREATOR':
      return {
        input: {
          identidad_visual: branding?.visual_identity || '',
          calendario_item: configuration?.calendario_item || {
            titulo_gancho: configuration?.topic || 'Video para mi negocio',
            tema_concepto: configuration?.concept || ''
          },
          duracion: configuration?.duration || '60',
          tipo_video: configuration?.video_type || 'reel'
        },
        language: language || 'es'
      };

    case 'REEL_CREATOR':
      return {
        input: {
          identidad_visual: branding?.visual_identity || '',
          colores_marca: {
            primary: branding?.primary_color || '#3c46b2',
            secondary: branding?.secondary_color || '#f15438'
          },
          calendario_item: configuration?.calendario_item || {
            titulo_gancho: configuration?.topic || 'Reel para mi negocio',
            tema_concepto: configuration?.concept || ''
          },
          duracion: configuration?.duration || '30'
        },
        language: language || 'es'
      };

    case 'TEXT_OPTIMIZER':
      return {
        text: configuration?.text || '',
        fieldType: configuration?.field_type || 'general',
        context: {
          companyName: company.name,
          industry: company.industry_sector || '',
          brandVoice: branding?.brand_voice || null,
          tone: strategy?.tono_comunicacion || 'profesional'
        },
        language: language || 'es'
      };

    case 'CONTENT_GENERATOR':
      return {
        prompt: configuration?.prompt || '',
        context: {
          companyName: company.name,
          platform: configuration?.platform || 'general',
          brandVoice: branding?.brand_voice || null,
          top_posts: configuration?.top_posts || []
        },
        language: language || 'es'
      };

    case 'CONTENT_PUBLISHER':
      return {
        companyId: company.id,
        userId,
        content: configuration?.content || '',
        platform: configuration?.platform || 'linkedin',
        scheduledAt: configuration?.scheduled_at || null,
        mediaUrls: configuration?.media_urls || []
      };

    // ============================================
    // ANALYTICS AGENTS
    // ============================================
    case 'INSIGHTS_GENERATOR':
      return {
        user_id: userId,  // snake_case as edge function expects
        platform: configuration?.platform || 'all',
        language: language || 'es'
      };

    case 'AUDIENCE_ANALYST':
      return {
        userId,
        companyId: company.id,
        platform: configuration?.platform || 'all',
        includeRecommendations: true,
        language: language || 'es'
      };

    case 'COMPETITIVE_INTEL':
      return {
        companyId: company.id,
        userId,
        competitors: configuration?.competitors || [],
        analysisDepth: configuration?.analysis_depth || 'standard',
        language: language || 'es'
      };

    // Platform-specific analysts
    case 'LINKEDIN_ANALYST':
      return {
        userId,
        companyId: company.id,
        platform: 'linkedin',
        profileUrl: company.linkedin_url || configuration?.profile_url || '',
        analysisType: configuration?.analysis_type || 'full',
        language: language || 'es'
      };

    case 'INSTAGRAM_ANALYST':
      return {
        userId,
        companyId: company.id,
        platform: 'instagram',
        profileUrl: company.instagram_url || configuration?.profile_url || '',
        analysisType: configuration?.analysis_type || 'full',
        language: language || 'es'
      };

    case 'FACEBOOK_ANALYST':
      return {
        userId,
        companyId: company.id,
        platform: 'facebook',
        profileUrl: company.facebook_url || configuration?.profile_url || '',
        analysisType: configuration?.analysis_type || 'full',
        language: language || 'es'
      };

    case 'TIKTOK_ANALYST':
      return {
        userId,
        companyId: company.id,
        platform: 'tiktok',
        profileUrl: company.tiktok_url || configuration?.profile_url || '',
        analysisType: configuration?.analysis_type || 'full',
        language: language || 'es'
      };

    case 'SOCIAL_ANALYZER':
      return {
        userId,
        companyId: company.id,
        platforms: configuration?.platforms || ['linkedin', 'instagram', 'facebook'],
        analysisType: configuration?.analysis_type || 'unified',
        language: language || 'es'
      };

    // Premium Analytics
    case 'AUDIENCE_INTELLIGENCE':
      return {
        userId,
        companyId: company.id,
        analysisDepth: 'deep',
        includeSegmentation: true,
        includePredictions: true,
        language: language || 'es'
      };

    case 'SEMANTIC_ANALYZER':
      return {
        userId,
        companyId: company.id,
        content: configuration?.content || '',
        analysisType: configuration?.analysis_type || 'full',
        includeKeywords: true,
        includeSentiment: true,
        language: language || 'es'
      };

    case 'PREMIUM_INSIGHTS':
      return {
        userId,
        companyId: company.id,
        insightTypes: configuration?.insight_types || ['performance', 'trends', 'predictions'],
        timeRange: configuration?.time_range || '30d',
        language: language || 'es'
      };

    // ============================================
    // BRANDING AGENTS
    // ============================================
    case 'BRAND_IDENTITY':
      return {
        companyId: company.id,
        companyName: company.name,
        industry: company.industry_sector || '',
        websiteUrl: company.website_url || '',
        currentBranding: branding || null,
        language: language || 'es'
      };

    // ============================================
    // ASSISTANT AGENTS
    // ============================================
    case 'ERA_ASSISTANT':
      return {
        userId,
        companyId: company.id,
        message: configuration?.message || '',
        conversationHistory: configuration?.conversation_history || [],
        context: {
          company: company.name,
          strategy: strategy?.propuesta_valor || '',
          currentPage: configuration?.current_page || ''
        },
        language: language || 'es'
      };

    case 'LEARNING_TUTOR':
      return {
        moduleId: configuration?.module_id || null,
        userId,
        sessionType: configuration?.session_type || 'learning',
        userMessage: configuration?.message || '',
        learningStyle: configuration?.learning_style || 'visual',
        currentProgress: configuration?.current_progress || null,
        language: language || 'es'
      };

    case 'NBA_ENGINE':
      return {
        user_id: userId,
        company_id: company.id,
        language: language || 'es'
      };

    // ============================================
    // LEGACY/DEPRECATED (keep for backwards compatibility)
    // ============================================
    case 'COMPANY_STRATEGY':
      return {
        companyId: company.id,
        userId,
        language: language || 'es'
      };

    case 'ERA_OPTIMIZER':
      return {
        text: configuration?.text || '',
        fieldType: configuration?.field_type || 'general',
        context: {
          companyName: company.name,
          industry: company.industry_sector || '',
          brandVoice: branding?.brand_voice || null
        },
        language: language || 'es'
      };

    // ============================================
    // DEFAULT
    // ============================================
    default:
      return {
        companyId: company.id,
        userId,
        ...configuration,
        language: language || 'es'
      };
  }
};

/**
 * Get the list of additional data needed for a specific agent
 * Supports both dynamic configuration and hardcoded legacy mappings
 */
export const getAgentDataRequirements = (
  agentCode: string,
  contextRequirements?: ContextRequirements
): {
  needsStrategy: boolean;
  needsAudiences: boolean;
  needsBranding: boolean;
} => {
  // If context requirements are provided from agent config, use them
  if (contextRequirements) {
    return {
      needsStrategy: contextRequirements.needsStrategy ?? false,
      needsAudiences: contextRequirements.needsAudiences ?? false,
      needsBranding: contextRequirements.needsBranding ?? false,
    };
  }

  // Fallback to hardcoded mappings for legacy agents
  switch (agentCode) {
    // Strategy + Audiences
    case 'MKTG_STRATEGIST':
      return { needsStrategy: true, needsAudiences: true, needsBranding: false };

    // Strategy + Audiences + Branding
    case 'CAMPAIGN_GENERATOR':
      return { needsStrategy: true, needsAudiences: true, needsBranding: true };

    // Strategy only
    case 'BUSINESS_STRATEGIST':
    case 'CALENDAR_PLANNER':
    case 'ERA_ASSISTANT':
    case 'LEARNING_TUTOR':
    case 'NBA_ENGINE':
    case 'COMPANY_STRATEGY':
      return { needsStrategy: true, needsAudiences: false, needsBranding: false };

    // Strategy + Branding
    case 'CONTENT_CREATOR':
    case 'IMAGE_CREATOR':
    case 'VIDEO_CREATOR':
    case 'REEL_CREATOR':
    case 'TEXT_OPTIMIZER':
    case 'CONTENT_GENERATOR':
    case 'BRAND_IDENTITY':
    case 'ERA_OPTIMIZER':
      return { needsStrategy: true, needsAudiences: false, needsBranding: true };

    // Strategy + Audiences
    case 'AUDIENCE_ANALYST':
    case 'AUDIENCE_INTELLIGENCE':
      return { needsStrategy: true, needsAudiences: true, needsBranding: false };

    // No extra data needed
    case 'LINKEDIN_ANALYST':
    case 'INSTAGRAM_ANALYST':
    case 'FACEBOOK_ANALYST':
    case 'TIKTOK_ANALYST':
    case 'SOCIAL_ANALYZER':
    case 'SEMANTIC_ANALYZER':
    case 'PREMIUM_INSIGHTS':
    case 'CONTENT_PUBLISHER':
    case 'CAMPAIGN_OPTIMIZER':
      return { needsStrategy: false, needsAudiences: false, needsBranding: false };

    // Strategy only (insights)
    case 'INSIGHTS_GENERATOR':
    case 'COMPETITIVE_INTEL':
      return { needsStrategy: true, needsAudiences: false, needsBranding: false };

    default:
      return { needsStrategy: false, needsAudiences: false, needsBranding: false };
  }
};

/**
 * Get the edge function name for an agent
 */
export const getAgentEdgeFunction = (agentCode: string): string | null => {
  const functionMap: Record<string, string> = {
    'MKTG_STRATEGIST': 'marketing-hub-marketing-strategy',
    'BUSINESS_STRATEGIST': 'company-strategy',
    'CAMPAIGN_GENERATOR': 'campaign-ai-generator',
    'CAMPAIGN_OPTIMIZER': 'era-campaign-optimizer',
    'CONTENT_CREATOR': 'marketing-hub-post-creator',
    'CALENDAR_PLANNER': 'marketing-hub-content-calendar',
    'IMAGE_CREATOR': 'marketing-hub-image-creator',
    'VIDEO_CREATOR': 'marketing-hub-video-creator',
    'REEL_CREATOR': 'marketing-hub-reel-creator',
    'TEXT_OPTIMIZER': 'era-content-optimizer',
    'CONTENT_GENERATOR': 'generate-company-content',
    'CONTENT_PUBLISHER': 'upload-post-manager',
    'INSIGHTS_GENERATOR': 'content-insights-generator',
    'AUDIENCE_ANALYST': 'analyze-social-audience',
    'COMPETITIVE_INTEL': 'competitive-intelligence-agent',
    'LINKEDIN_ANALYST': 'linkedin-intelligent-analysis',
    'INSTAGRAM_ANALYST': 'instagram-intelligent-analysis',
    'FACEBOOK_ANALYST': 'facebook-intelligent-analysis',
    'TIKTOK_ANALYST': 'tiktok-intelligent-analysis',
    'SOCIAL_ANALYZER': 'social-media-analyzer',
    'AUDIENCE_INTELLIGENCE': 'audience-intelligence-analysis',
    'SEMANTIC_ANALYZER': 'semantic-content-analyzer',
    'PREMIUM_INSIGHTS': 'premium-ai-insights',
    'BRAND_IDENTITY': 'brand-identity',
    'ERA_ASSISTANT': 'era-chat',
    'LEARNING_TUTOR': 'ai-learning-tutor',
    'NBA_ENGINE': 'generate-next-best-actions',
    'ERA_OPTIMIZER': 'era-content-optimizer',
    'COMPANY_STRATEGY': 'company-strategy'
  };

  return functionMap[agentCode] || null;
};
