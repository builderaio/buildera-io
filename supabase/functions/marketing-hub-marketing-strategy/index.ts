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

    const { input } = await req.json();
    
    console.log('Marketing Hub Strategy Request:', input);

    // Validate required fields
    const requiredFields = ['nombre_empresa', 'pais', 'objetivo_de_negocio', 'propuesta_de_valor', 'audiencia_objetivo'];
    for (const field of requiredFields) {
      if (!input[field]) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate a structured marketing strategy response
    const response = {
      empresa: input.nombre_empresa,
      pais: input.pais,
      objetivo: input.objetivo_de_negocio,
      propuesta_valor: input.propuesta_de_valor,
      audiencia: input.audiencia_objetivo,
      estrategia: `Estrategia integral para ${input.nombre_empresa} enfocada en ${input.objetivo_de_negocio}.\n\nPropuesta de valor: ${input.propuesta_de_valor}.\n\nPilares:\n1) Descubrimiento (Awareness) con contenido educativo y anuncios segmentados.\n2) Consideración con casos de éxito y webinars.\n3) Conversión con ofertas claras y CTA medibles.\n4) Fidelización con email/SMS y programa de referidos.`,
      funnel_tactics: [
        { etapa: 'Awareness', tacticas: ['Contenido educativo semanal', 'Anuncios segmentados por buyer persona', 'Colaboraciones con micro-influencers'] },
        { etapa: 'Consideration', tacticas: ['Casos de estudio', 'Webinars mensuales', 'Comparativas de valor'] },
        { etapa: 'Conversion', tacticas: ['Ofertas limitadas', 'Landing pages optimizadas', 'Remarketing con prueba social'] },
        { etapa: 'Loyalty', tacticas: ['Newsletter de valor', 'Programa de referidos', 'Encuestas NPS trimestrales'] }
      ],
      timestamp: new Date().toISOString(),
      status: 'generated'
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in marketing-hub-marketing-strategy:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});