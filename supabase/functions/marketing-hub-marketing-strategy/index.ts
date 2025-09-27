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

    // Get company data including social networks, industry, and country
    const { data: companyData, error: companyDataError } = await supabase
      .from('companies')
      .select('name, industry_sector, country, facebook_url, twitter_url, linkedin_url, instagram_url, youtube_url, tiktok_url')
      .eq('id', companyMember.company_id)
      .single();

    if (companyDataError) {
      console.error('Error getting company data:', companyDataError);
    }

    // Get company strategy to obtain propuesta_valor
    const { data: companyStrategy, error: strategyError } = await supabase
      .from('company_strategy')
      .select('propuesta_valor, mision, vision')
      .eq('company_id', companyMember.company_id)
      .single();

    let propuestaValor = input.propuesta_de_valor || 'Por definir';
    
    if (!strategyError && companyStrategy?.propuesta_valor) {
      propuestaValor = companyStrategy.propuesta_valor;
      console.log('Using propuesta_valor from company_strategy:', propuestaValor);
    } else {
      console.log('No company strategy found or no propuesta_valor, using default');
    }

    // Get content analysis findings
    const { data: contentInsights } = await supabase
      .from('audience_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

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
      .select('is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    const { data: facebookConnection } = await supabase
      .from('facebook_instagram_connections')
      .select('is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    const { data: tiktokConnection } = await supabase
      .from('tiktok_connections')
      .select('is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    // Build active social networks array
    const redesSocialesHabilitadas = [];
    if (linkedinConnection && linkedinConnection.length > 0) redesSocialesHabilitadas.push('linkedin');
    if (facebookConnection && facebookConnection.length > 0) redesSocialesHabilitadas.push('facebook', 'instagram');
    if (tiktokConnection && tiktokConnection.length > 0) redesSocialesHabilitadas.push('tiktok');

    console.log('Active social networks:', redesSocialesHabilitadas);

    // Set defaults for optional fields with real propuesta_valor and enhanced data
    const processedInput = {
      nombre_empresa: input.nombre_empresa,
      pais: companyData?.country || input.pais || 'No especificado',
      industria: companyData?.industry_sector || 'No especificado',
      objetivo_de_negocio: input.objetivo_de_negocio,
      propuesta_de_valor: propuestaValor,
      redes_sociales_habilitadas: redesSocialesHabilitadas,
      redes_sociales_urls: {
        facebook: companyData?.facebook_url || null,
        twitter: companyData?.twitter_url || null,
        linkedin: companyData?.linkedin_url || null,
        instagram: companyData?.instagram_url || null,
        youtube: companyData?.youtube_url || null,
        tiktok: companyData?.tiktok_url || null
      },
      audiencia_objetivo: input.audiencia_objetivo || { buyer_personas: [] },
      objetivo_campana: input.objetivo_campana || 'No especificado',
      hallazgos_analisis: {
        insights_audiencia: contentInsights || [],
        insights_marketing: marketingInsights || [],
        recomendaciones_contenido: contentRecommendations || []
      }
    };

    console.log('Processed input with real propuesta_valor:', JSON.stringify(processedInput, null, 2));

    // Call N8N webhook
    const webhookUrl = 'https://buildera.app.n8n.cloud/webhook/marketing-strategy';
    console.log('Calling N8N webhook:', webhookUrl);

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_AUTH_USER && N8N_AUTH_PASS ? {
          'Authorization': `Basic ${btoa(`${N8N_AUTH_USER}:${N8N_AUTH_PASS}`)}`
        } : {})
      },
      body: JSON.stringify(processedInput)
    });

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

    return new Response(JSON.stringify(webhookResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in marketing-hub-marketing-strategy:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});