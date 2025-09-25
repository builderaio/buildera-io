import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_AUTH_USER = Deno.env.get('N8N_AUTH_USER');
const N8N_AUTH_PASS = Deno.env.get('N8N_AUTH_PASS');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Basic auth verification
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new Response(JSON.stringify({ error: 'Basic authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const credentials = atob(authHeader.slice(6));
    const [username, password] = credentials.split(':');
    
    if (username !== N8N_AUTH_USER || password !== N8N_AUTH_PASS) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { input } = await req.json();
    
    console.log('Marketing Hub Target Audience Request:', input);

    // Validate required fields
    const requiredFields = ['nombre_empresa', 'pais', 'objetivo_de_negocio', 'propuesta_de_valor'];
    for (const field of requiredFields) {
      if (!input[field]) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Simulate target audience analysis processing
    const response = {
      message: `Solicitud para ${input.nombre_empresa} recibida. Iniciando análisis de audiencia.`,
      data: {
        empresa: input.nombre_empresa,
        pais: input.pais,
        objetivo: input.objetivo_de_negocio,
        propuesta_valor: input.propuesta_de_valor,
        redes_sociales: input.redes_socciales_activas || [],
        url_sitio: input.url_sitio_web,
        timestamp: new Date().toISOString(),
        status: 'processing'
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in marketing-hub-target-audience:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});