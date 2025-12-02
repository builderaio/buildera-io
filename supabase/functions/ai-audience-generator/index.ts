import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSystemPrompt, validateLanguage } from '../_shared/prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getOpenAIApiKey = async (supabase: any) => {
  try {
    const { data, error } = await supabase
      .from('llm_api_keys')
      .select('api_key')
      .eq('provider', 'openai')
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data?.api_key;
  } catch (error) {
    console.log('No OpenAI key found in database, using environment variable');
    return Deno.env.get('OPENAI_API_KEY');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, company_id, language } = await req.json();
    const userLanguage = validateLanguage(language);
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🎯 Iniciando generación de audiencias con IA para usuario:', user_id);

    // Obtener análisis de audiencias existentes
    const { data: audienceAnalysis, error: audienceError } = await supabase
      .from('audience_analysis')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (audienceError) {
      console.error('Error obteniendo análisis de audiencias:', audienceError);
    }

    // Obtener recomendaciones de contenido
    const { data: contentRecommendations, error: contentError } = await supabase
      .from('content_recommendations')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (contentError) {
      console.error('Error obteniendo recomendaciones de contenido:', contentError);
    }

    // Obtener información de la empresa
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError) {
      console.error('Error obteniendo datos de la empresa:', companyError);
    }

    // Obtener audiencias existentes para evitar duplicados
    const { data: existingAudiences, error: existingError } = await supabase
      .from('company_audiences')
      .select('name, description, interests, age_ranges, geographic_locations')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (existingError) {
      console.error('Error obteniendo audiencias existentes:', existingError);
    }

    const openAIApiKey = await getOpenAIApiKey(supabase);
    if (!openAIApiKey) {
      throw new Error('No se encontró la clave API de OpenAI');
    }

    // Construir contexto para IA
    const context = {
      company: companyData,
      audienceAnalysis: audienceAnalysis || [],
      contentRecommendations: contentRecommendations || [],
      existingAudiences: existingAudiences || []
    };

    console.log('📊 Contexto preparado:', {
      company: !!context.company,
      audienceAnalysisCount: context.audienceAnalysis.length,
      contentRecommendationsCount: context.contentRecommendations.length,
      existingAudiencesCount: context.existingAudiences.length
    });

    console.log('User language:', userLanguage);
    const systemPrompt = getSystemPrompt('ai-audience-generator', userLanguage);

    const userPromptText = userLanguage === 'en' 
      ? 'Analyze the following data and generate intelligent audiences:'
      : userLanguage === 'pt'
      ? 'Analise os seguintes dados e gere públicos inteligentes:'
      : 'Analiza los siguientes datos y genera audiencias inteligentes:';

    const companyLabel = userLanguage === 'en' ? 'COMPANY:' : userLanguage === 'pt' ? 'EMPRESA:' : 'EMPRESA:';
    const audienceLabel = userLanguage === 'en' ? 'SOCIAL AUDIENCE ANALYSIS:' : userLanguage === 'pt' ? 'ANÁLISE DE PÚBLICO SOCIAL:' : 'ANÁLISIS DE AUDIENCIAS SOCIALES:';
    const contentLabel = userLanguage === 'en' ? 'CONTENT RECOMMENDATIONS:' : userLanguage === 'pt' ? 'RECOMENDAÇÕES DE CONTEÚDO:' : 'RECOMENDACIONES DE CONTENIDO:';
    const existingLabel = userLanguage === 'en' ? 'EXISTING AUDIENCES (DO NOT DUPLICATE):' : userLanguage === 'pt' ? 'PÚBLICOS EXISTENTES (NÃO DUPLICAR):' : 'AUDIENCIAS EXISTENTES (NO DUPLICAR):';
    const generateText = userLanguage === 'en' 
      ? 'Generate specific, differentiated and actionable audiences based on this real data.'
      : userLanguage === 'pt'
      ? 'Gere públicos específicos, diferenciados e acionáveis baseados nestes dados reais.'
      : 'Genera audiencias específicas, diferenciadas y accionables basadas en estos datos reales.';

    const userPrompt = `${userPromptText}

${companyLabel}
${JSON.stringify(context.company, null, 2)}

${audienceLabel}
${JSON.stringify(context.audienceAnalysis, null, 2)}

${contentLabel}
${JSON.stringify(context.contentRecommendations, null, 2)}

${existingLabel}
${JSON.stringify(context.existingAudiences, null, 2)}

${generateText}`;

    console.log('🤖 Llamando a OpenAI GPT-4.1 para generar audiencias...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error de OpenAI:', errorData);
      throw new Error(`Error de OpenAI: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('✅ Respuesta de OpenAI recibida');

    let parsedAudiences;
    try {
      parsedAudiences = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Error parseando respuesta de OpenAI:', parseError);
      throw new Error('Error parseando respuesta de IA');
    }

    console.log('📊 Audiencias generadas:', parsedAudiences.audiences?.length || 0);

    // Guardar audiencias en la base de datos
    const savedAudiences = [];
    
    if (parsedAudiences.audiences && Array.isArray(parsedAudiences.audiences)) {
      for (const audience of parsedAudiences.audiences) {
        try {
          const audienceData = {
            user_id,
            company_id,
            name: audience.name,
            description: audience.description,
            age_ranges: audience.age_ranges || {},
            gender_split: audience.gender_split || {},
            income_ranges: audience.income_ranges || {},
            education_levels: audience.education_levels || {},
            relationship_status: audience.relationship_status || {},
            geographic_locations: audience.geographic_locations || {},
            job_titles: audience.job_titles || {},
            industries: audience.industries || {},
            company_sizes: audience.company_sizes || {},
            professional_level: audience.professional_level || {},
            interests: audience.interests || {},
            brand_affinities: audience.brand_affinities || {},
            online_behaviors: audience.online_behaviors || {},
            purchase_behaviors: audience.purchase_behaviors || {},
            content_consumption_habits: audience.content_consumption_habits || {},
            device_usage: audience.device_usage || {},
            platform_preferences: audience.platform_preferences || {},
            engagement_patterns: audience.engagement_patterns || {},
            active_hours: audience.active_hours || {},
            content_preferences: audience.content_preferences || {},
            pain_points: audience.pain_points || [],
            motivations: audience.motivations || [],
            goals: audience.goals || [],
            challenges: audience.challenges || [],
            estimated_size: audience.estimated_size || 1000,
            conversion_potential: audience.conversion_potential || 0.5,
            lifetime_value_estimate: audience.lifetime_value_estimate || 500,
            acquisition_cost_estimate: audience.acquisition_cost_estimate || 25,
            facebook_targeting: audience.facebook_targeting || {},
            instagram_targeting: audience.instagram_targeting || {},
            linkedin_targeting: audience.linkedin_targeting || {},
            tiktok_targeting: audience.tiktok_targeting || {},
            twitter_targeting: audience.twitter_targeting || {},
            youtube_targeting: audience.youtube_targeting || {},
            ai_insights: {
              generatedBy: 'ai-audience-generator',
              generatedAt: new Date().toISOString(),
              source_data: {
                audience_analysis_count: context.audienceAnalysis.length,
                content_recommendations_count: context.contentRecommendations.length
              },
              model_used: 'gpt-4.1-2025-04-14'
            },
            confidence_score: audience.confidence_score || 0.7,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: savedAudience, error: saveError } = await supabase
            .from('company_audiences')
            .insert(audienceData)
            .select()
            .single();

          if (saveError) {
            console.error('Error guardando audiencia:', saveError);
            continue;
          }

          savedAudiences.push(savedAudience);
          console.log(`✅ Audiencia "${audience.name}" guardada exitosamente`);

        } catch (error) {
          console.error('Error procesando audiencia:', error);
        }
      }
    }

    console.log('🎉 Proceso completado. Audiencias guardadas:', savedAudiences.length);

    return new Response(JSON.stringify({
      success: true,
      audiences: savedAudiences,
      insights: parsedAudiences.insights || {},
      generated_count: savedAudiences.length,
      metadata: {
        source_data: {
          audience_analysis_count: context.audienceAnalysis.length,
          content_recommendations_count: context.contentRecommendations.length,
          existing_audiences_count: context.existingAudiences.length
        },
        model_used: 'gpt-4.1-2025-04-14',
        generated_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en ai-audience-generator:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});