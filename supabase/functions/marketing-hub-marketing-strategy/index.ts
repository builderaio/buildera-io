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

    // Set defaults for optional fields
    const processedInput = {
      nombre_empresa: input.nombre_empresa,
      pais: input.pais || 'No especificado',
      objetivo_de_negocio: input.objetivo_de_negocio,
      propuesta_de_valor: input.propuesta_de_valor || 'Por definir',
      audiencia_objetivo: input.audiencia_objetivo || { buyer_personas: [] },
      objetivo_campana: input.objetivo_campana || 'No especificado'
    };

    console.log('Processed input:', JSON.stringify(processedInput, null, 2));

    // Generate a structured marketing strategy response
    const response = {
      empresa: processedInput.nombre_empresa,
      pais: processedInput.pais,
      objetivo: processedInput.objetivo_de_negocio,
      propuesta_valor: processedInput.propuesta_de_valor,
      audiencia: processedInput.audiencia_objetivo,
      estrategia: `Estrategia integral para ${processedInput.nombre_empresa} enfocada en ${processedInput.objetivo_de_negocio}.\n\nObjetivo de campaña: ${processedInput.objetivo_campana}\nPropuesta de valor: ${processedInput.propuesta_de_valor}\n\nPilares estratégicos:\n1) Descubrimiento (Awareness): Contenido educativo y anuncios segmentados\n2) Consideración: Casos de éxito y webinars informativos\n3) Conversión: Ofertas claras y CTA optimizados\n4) Fidelización: Programa de seguimiento y referidos\n\nEsta estrategia está diseñada específicamente para ${processedInput.nombre_empresa} y sus objetivos de crecimiento.`,
      funnel_tactics: [
        { fase: 'Awareness', descripcion: 'Contenido educativo semanal en redes sociales' },
        { fase: 'Awareness', descripcion: 'Anuncios segmentados por buyer persona' },
        { fase: 'Consideration', descripcion: 'Casos de estudio y testimonios' },
        { fase: 'Consideration', descripcion: 'Webinars mensuales informativos' },
        { fase: 'Conversion', descripcion: 'Landing pages optimizadas' },
        { fase: 'Conversion', descripcion: 'Ofertas limitadas en tiempo' },
        { fase: 'Loyalty', descripcion: 'Newsletter de valor agregado' },
        { fase: 'Loyalty', descripcion: 'Programa de referidos incentivado' }
      ],
      timestamp: new Date().toISOString(),
      status: 'generated'
    };

    console.log('Generated response:', JSON.stringify(response, null, 2));

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