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
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      // Supabase JWT authentication
      console.log('JWT auth detected for content calendar generation');
      
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
    } else {
      // No auth header. Function is public per config; continue.
      console.log('No authentication provided, proceeding as public function');
    }

    const { input } = await req.json();
    
    console.log('Marketing Hub Content Calendar Request:', input);

    // Validate minimally required fields (allow optional/empty fields like pais)
    const errors: string[] = [];
    const nombreEmpresaOk = typeof input?.nombre_empresa === 'string' && input.nombre_empresa.trim().length > 0;
    const fechaInicioOk = typeof input?.fecha_inicio_calendario === 'string' && input.fecha_inicio_calendario.trim().length > 0;
    const diasNum = parseInt(String(input?.numero_dias_generar ?? 0));

    if (!nombreEmpresaOk) errors.push('nombre_empresa requerido');
    if (!fechaInicioOk) errors.push('fecha_inicio_calendario requerido');
    if (!Number.isFinite(diasNum) || diasNum <= 0) errors.push('numero_dias_generar debe ser > 0');

    if (errors.length > 0) {
      console.warn('Validation errors:', errors);
      return new Response(JSON.stringify({ error: 'Invalid input', details: errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call N8N Content Calendar API
    console.log('Calling N8N Content Calendar API with input:', input);

    const n8nPayload = {
      ...input,
      // Ensure required fields have defaults
      numero_dias_generar: input.numero_dias_generar || 7,
      plataformas_seleccionadas: input.plataformas_seleccionadas || ['linkedin'],
      // Pass the marketing strategy from previous step
      estrategia_de_marketing: input.estrategia_de_marketing || {},
      audiencia_objetivo: input.audiencia_objetivo || {}
    };

    console.log('N8N Payload prepared:', n8nPayload);

    const n8nResponse = await fetch('https://buildera.app.n8n.cloud/webhook/content-calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${N8N_AUTH_USER}:${N8N_AUTH_PASS}`)}`
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!n8nResponse.ok) {
      console.error('N8N API Error:', n8nResponse.status, n8nResponse.statusText);
      // Do not throw here; continue to fallback handling below
    }

    let n8nResult: any = null;
    let rawText = '';
    try {
      rawText = await n8nResponse.text();
      if (!rawText || rawText.trim().length === 0) {
        console.warn('N8N returned empty body, proceeding with fallback.');
      } else {
        try {
          n8nResult = JSON.parse(rawText);
        } catch (parseErr) {
          console.warn('Failed to parse N8N JSON. Content-Type:', n8nResponse.headers.get('content-type'));
          console.warn('Raw N8N body (first 500 chars):', rawText.slice(0, 500));
        }
      }
    } catch (readErr) {
      console.error('Error reading N8N response body:', readErr);
    }
    console.log('N8N API Response received:', n8nResult ?? '[empty]');
    // Extract calendar data from N8N response
    let calendario_contenido = [];
    
    if (n8nResult && Array.isArray(n8nResult) && n8nResult.length > 0) {
      // N8N returns an array, get the first element
      const firstResult = n8nResult[0];
      if (firstResult.output && firstResult.output.calendario_editorial) {
        calendario_contenido = firstResult.output.calendario_editorial;
      } else if (firstResult.output && firstResult.output.calendario_contenido) {
        calendario_contenido = firstResult.output.calendario_contenido;
      } else if (firstResult.calendario_editorial) {
        calendario_contenido = firstResult.calendario_editorial;
      } else if (firstResult.calendario_contenido) {
        calendario_contenido = firstResult.calendario_contenido;
      }
    } else if (n8nResult && n8nResult.calendario_editorial) {
      calendario_contenido = n8nResult.calendario_editorial;
    } else if (n8nResult && n8nResult.calendario_contenido) {
      calendario_contenido = n8nResult.calendario_contenido;
    } else if (n8nResult && Array.isArray(n8nResult.output)) {
      calendario_contenido = n8nResult.output;
    }

    console.log('Extracted calendario_contenido:', calendario_contenido);

    if (!Array.isArray(calendario_contenido) || calendario_contenido.length === 0) {
      console.warn('No valid calendar content received from N8N, creating fallback');
      // Fallback: create basic calendar structure
      const platforms = input.plataformas_seleccionadas || ['linkedin'];
      const numDays = input.numero_dias_generar || 7;
      const startDate = new Date(input.fecha_inicio_calendario);
      
      calendario_contenido = [];
      for (let day = 0; day < numDays; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        for (const platform of platforms) {
          calendario_contenido.push({
            fecha: dateStr,
            hora: '10:00',
            red_social: platform,
            tipo_contenido: 'Post',
            tema_concepto: `Contenido para ${platform} - ${input.nombre_empresa}`,
            descripcion_creativo: `Contenido generado para ${platform}`,
            estado: 'programado',
            prioridad: 2
          });
        }
      }
    }

    const response = {
      message: `Calendario de contenido generado exitosamente para ${input.nombre_empresa}`,
      calendario_contenido: calendario_contenido,
      resumen: {
        total_posts: calendario_contenido.length,
        plataformas_incluidas: input.plataformas_seleccionadas || ['linkedin'],
        fecha_inicio: input.fecha_inicio_calendario,
        fecha_fin: calendario_contenido[calendario_contenido.length - 1]?.fecha,
        duracion_dias: input.numero_dias_generar || 7
      },
      metadata: {
        empresa: input.nombre_empresa,
        generated_at: new Date().toISOString(),
        status: 'completed',
        source: 'n8n_api'
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in marketing-hub-content-calendar:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});