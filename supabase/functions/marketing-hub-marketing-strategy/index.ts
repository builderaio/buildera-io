import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_AUTH_USER = Deno.env.get('N8N_AUTH_USER');
const N8N_AUTH_PASS = Deno.env.get('N8N_AUTH_PASS');

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: Accept Basic (if configured) or Bearer (Supabase) or none (public)
    const authHeader = req.headers.get('authorization') || '';

    if (authHeader.startsWith('Basic ')) {
      if (!N8N_AUTH_USER || !N8N_AUTH_PASS) {
        console.warn('Basic auth provided but no N8N credentials configured. Skipping verification.');
      } else {
        const credentials = atob(authHeader.slice(6));
        const [username, password] = credentials.split(':');
        if (username !== N8N_AUTH_USER || password !== N8N_AUTH_PASS) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    } else if (authHeader.startsWith('Bearer ')) {
      // Supabase JWT present; allow request. Verification handled by platform when enabled
      console.log('JWT auth detected for marketing strategy generation');
    } else {
      // No auth header. Function is public per config; continue.
    }

    const body = await req.json();
    console.log('Raw request body:', JSON.stringify(body));
    
    const { input } = body;
    
    if (!input) {
      console.error('No input found in request body');
      return new Response(JSON.stringify({ error: 'Input parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Marketing Hub Strategy Request - Input:', JSON.stringify(input, null, 2));

    // Validate essential required fields
    const requiredFields = ['nombre_empresa', 'objetivo_de_negocio'];
    for (const field of requiredFields) {
      if (!input[field] || (typeof input[field] === 'string' && input[field].trim() === '')) {
        console.error(`Validation failed: Missing field ${field}`);
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT token
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Bearer token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Get user's primary company
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    if (companyError || !companyMember) {
      console.error('Error getting user company:', companyError);
      return new Response(JSON.stringify({ error: 'No primary company found for user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Company found:', companyMember.company_id);

    // Get comprehensive company data including all fields
    const { data: companyData, error: companyDataError } = await supabase
      .from('companies')
      .select('name, description, website_url, industry_sector, country, location, facebook_url, twitter_url, linkedin_url, instagram_url, youtube_url, tiktok_url')
      .eq('id', companyMember.company_id)
      .single();

    if (companyDataError) {
      console.error('Error getting company data:', companyDataError);
    } else {
      console.log('Company data retrieved:', JSON.stringify(companyData, null, 2));
    }

    // Get comprehensive company audiences data
    const { data: companyAudiences, error: audiencesError } = await supabase
      .from('company_audiences')
      .select('name, description, gender_split, age_ranges, geographic_locations, job_titles, interests, pain_points, motivations, goals, challenges, preferred_channels')
      .eq('company_id', companyMember.company_id)
      .eq('is_active', true);

    if (audiencesError) {
      console.error('Error getting company audiences:', audiencesError);
    } else {
      console.log('Company audiences retrieved:', JSON.stringify(companyAudiences, null, 2));
    }

    // Get company strategy to obtain propuesta_valor and other strategic info
    const { data: companyStrategy, error: strategyError } = await supabase
      .from('company_strategy')
      .select('propuesta_valor, mision, vision')
      .eq('company_id', companyMember.company_id)
      .maybeSingle();

    let propuestaValor = input.propuesta_de_valor || 'Por definir';
    
    if (!strategyError && companyStrategy?.propuesta_valor) {
      propuestaValor = companyStrategy.propuesta_valor;
      console.log('Using propuesta_valor from company_strategy:', propuestaValor);
    } else {
      console.log('No company strategy found or no propuesta_valor, using default');
    }

    // Get company branding to obtain brand_voice
    const { data: companyBranding, error: brandingError } = await supabase
      .from('company_branding')
      .select('brand_voice, primary_color, secondary_color, complementary_color_1, complementary_color_2, visual_identity, full_brand_data, visual_synthesis')
      .eq('company_id', companyMember.company_id)
      .maybeSingle();

    if (brandingError) {
      console.error('Error getting company branding:', brandingError);
    } else {
      console.log('Company branding retrieved:', JSON.stringify(companyBranding, null, 2));
    }

    // Normalize branding fields from JSON structure
    const brandVoiceJson = companyBranding?.brand_voice && typeof companyBranding.brand_voice === 'string'
      ? (() => { try { return JSON.parse(companyBranding.brand_voice as unknown as string); } catch { return companyBranding.brand_voice; } })()
      : companyBranding?.brand_voice;
    const brandVoiceText = brandVoiceJson?.descripcion || brandVoiceJson?.personalidad || 'No especificado';
    const tonoText = brandVoiceJson?.personalidad || 'Profesional';
    const valoresArray = (companyBranding?.full_brand_data as any)?.valores || brandVoiceJson?.valores || [];

    // Get company objectives (growth objectives)
    const { data: companyObjectives, error: objectivesError } = await supabase
      .from('company_objectives')
      .select('*')
      .eq('company_id', companyMember.company_id)
      .eq('is_active', true);

    if (objectivesError) {
      console.error('Error getting company objectives:', objectivesError);
    } else {
      console.log('Company objectives retrieved:', JSON.stringify(companyObjectives, null, 2));
    }

    // Get content_insights and audience_insights
    const { data: contentInsights } = await supabase
      .from('content_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: audienceInsights } = await supabase
      .from('audience_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: marketingInsights } = await supabase
      .from('marketing_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: contentRecommendations } = await supabase
      .from('content_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get social media connections to determine active networks
    const { data: linkedinConnection } = await supabase
      .from('linkedin_connections')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const { data: facebookConnection } = await supabase
      .from('facebook_instagram_connections')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const { data: tiktokConnection } = await supabase
      .from('tiktok_connections')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    // Build active social networks array
    const redesSocialesHabilitadas = [];
    if (linkedinConnection && linkedinConnection.length > 0) redesSocialesHabilitadas.push('linkedin');
    if (facebookConnection && facebookConnection.length > 0) redesSocialesHabilitadas.push('facebook', 'instagram');
    if (tiktokConnection && tiktokConnection.length > 0) redesSocialesHabilitadas.push('tiktok');

    console.log('Active social networks:', redesSocialesHabilitadas);

    // Build streamlined processedInput with only relevant data
    const processedInput = {
      // EMPRESA (simplificado - solo info activa)
      empresa: {
        nombre: companyData?.name || input.nombre_empresa,
        descripcion: companyData?.description || 'No especificado',
        industria: companyData?.industry_sector || 'No especificado',
        pais: companyData?.country || 'No especificado',
        sitio_web: companyData?.website_url || 'No especificado',
        redes_sociales_activas: redesSocialesHabilitadas
      },
      
      // BRANDING
      branding: {
        brand_voice: brandVoiceText,
        tono: tonoText,
        valores: Array.isArray(valoresArray) ? valoresArray : []
      },
      
      // ESTRATEGIA EMPRESARIAL
      estrategia: {
        propuesta_valor: propuestaValor,
        mision: companyStrategy?.mision || 'No especificado',
        vision: companyStrategy?.vision || 'No especificado'
      },
      
      // OBJETIVO DE NEGOCIO
      objetivo_negocio: input.objetivo_de_negocio,
      
      // ⭐ RESUMEN DE CAMPAÑA (Información completa estructurada)
      resumen_campana: {
        informacion_basica: {
          nombre: input.nombre_campana || 'Nueva Campaña',
          descripcion: input.descripcion_campana || input.objetivo_campana || 'Campaña de marketing',
          empresa: companyData?.name || input.nombre_empresa
        },
        tipo_objetivo: {
          tipo: input.tipo_objetivo_campana || 'awareness',
          descripcion: input.objetivo_campana || 'No especificado'
        },
        objetivos_crecimiento: (companyObjectives || []).map((obj: any) => ({
          nombre: obj.title,
          descripcion: obj.description,
          tipo: obj.objective_type,
          plazo: obj.target_date
        })),
        audiencias_seleccionadas: (input.audiencia_objetivo?.buyer_personas || []).map((persona: any) => ({
          nombre: persona.nombre_ficticio || persona.name || 'Audiencia',
          descripcion: persona.descripcion || persona.description || '',
          edad: persona.demograficos?.edad || 'No especificado',
          ubicaciones: (() => {
            if (persona.demograficos?.ubicacion) return [persona.demograficos.ubicacion];
            const loc = persona.geographic_locations;
            const all: string[] = [];
            if (loc?.cities && Array.isArray(loc.cities)) all.push(...loc.cities);
            if (loc?.countries && Array.isArray(loc.countries)) all.push(...loc.countries);
            if (loc?.regions && Array.isArray(loc.regions)) all.push(...loc.regions);
            return all;
          })(),
          plataformas_preferidas: persona.demograficos?.plataforma_preferida
            ? [persona.demograficos.plataforma_preferida]
            : (persona.preferred_channels || []),
          intereses_primarios: persona.intereses?.primary || [],
          intereses_secundarios: persona.intereses?.secondary || []
        }))
      },
      
      // INSIGHTS (simplificados - solo títulos/resúmenes para contexto)
      insights_previos: {
        contenido: (contentInsights || []).slice(0, 3).map((i: any) => ({ 
          titulo: i.title,
          tipo: i.insight_type
        })),
        audiencia: (audienceInsights || []).slice(0, 3).map((i: any) => ({ 
          titulo: i.insight_type,
          segmento: i.audience_segment
        }))
      }
    };

    console.log('📊 Payload Summary:', {
      empresa: processedInput.empresa.nombre,
      audiencias_count: processedInput.resumen_campana.audiencias_seleccionadas.length,
      objetivos_count: processedInput.resumen_campana.objetivos_crecimiento.length,
      tipo_objetivo: processedInput.resumen_campana.tipo_objetivo.tipo,
      payload_size_kb: Math.round(JSON.stringify(processedInput).length / 1024)
    });

    // Call N8N webhook with extended timeout (5 minutes)
    const webhookUrl = 'https://buildera.app.n8n.cloud/webhook/marketing-strategy';
    console.log('Calling N8N webhook:', webhookUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(N8N_AUTH_USER && N8N_AUTH_PASS ? {
            'Authorization': `Basic ${btoa(`${N8N_AUTH_USER}:${N8N_AUTH_PASS}`)}`
          } : {})
        },
        body: JSON.stringify(processedInput),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!webhookResponse.ok) {
        console.error('N8N webhook failed:', webhookResponse.status, await webhookResponse.text());
        return new Response(JSON.stringify({ 
          error: 'Failed to generate marketing strategy',
          details: `Webhook returned ${webhookResponse.status}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const webhookResult = await webhookResponse.json();
      console.log('N8N webhook response:', JSON.stringify(webhookResult, null, 2));

      // Store competitive intelligence if competitors data is available
      if (webhookResult && webhookResult[0]?.output?.análisis_competitivo) {
        try {
          const competitors = webhookResult[0].output.análisis_competitivo;
          const strategy = webhookResult[0].output;
          
          // Create competitive intelligence record
          const { data: intelligence, error: intelligenceError } = await supabase
            .from('competitive_intelligence')
            .insert({
              user_id: user.id,
              industry_sector: companyData?.industry_sector || 'General',
              target_market: companyData?.country || 'No especificado',
              analysis_session_id: `marketing-strategy-${Date.now()}`,
              analysis_status: 'completed',
              data_sources: strategy.sources || [],
              ai_discovered_competitors: competitors,
              marketing_strategies_analysis: {
                core_message: strategy.mensaje_unificado_diferenciador?.core_message,
                strategies: strategy.embudo_estrategias
              }
            })
            .select()
            .single();

          if (intelligenceError) {
            console.error('Error creating competitive intelligence:', intelligenceError);
          } else if (intelligence) {
            // Store each competitor profile
            for (const competitor of competitors) {
              await supabase
                .from('competitor_profiles')
                .insert({
                  analysis_id: intelligence.id,
                  company_name: competitor.nombre,
                  website_url: competitor.url,
                  competitive_threat_score: 7, // Default medium-high threat
                  strengths: Array.isArray(competitor.fortalezas) 
                    ? competitor.fortalezas 
                    : [competitor.fortalezas || ''],
                  weaknesses: Array.isArray(competitor.debilidades)
                    ? competitor.debilidades
                    : [competitor.debilidades || ''],
                  data_sources: competitor.sources || [],
                  content_strategy: competitor.resumen_tácticas_digitales 
                    ? { digital_tactics: competitor.resumen_tácticas_digitales } 
                    : null,
                });
            }
            console.log('Competitive intelligence saved successfully');
          }
        } catch (ciError) {
          console.error('Error saving competitive intelligence:', ciError);
          // Don't fail the entire request if competitive intelligence saving fails
        }
      }

      return new Response(JSON.stringify(webhookResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('N8N webhook timeout after 5 minutes');
        return new Response(JSON.stringify({ 
          error: 'timeout',
          message: 'La generación está tomando más tiempo del esperado. Por favor, intenta nuevamente.',
          retryable: true
        }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.error('N8N webhook fetch error:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'fetch_failed',
        message: 'No se pudo conectar con el servicio de generación. Verifica tu conexión e intenta nuevamente.',
        retryable: true,
        details: fetchError.message
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }


  } catch (error) {
    console.error('Error in marketing-hub-marketing-strategy:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});