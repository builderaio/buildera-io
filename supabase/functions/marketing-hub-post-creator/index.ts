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
      console.log('JWT auth detected for post creation');
      
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
    
    console.log('Marketing Hub Post Creator Request:', input);

    // Validate required fields
    const requiredFields = ['tono_de_la_marca', 'buyer_persona_objetivo', 'calendario_item'];
    for (const field of requiredFields) {
      if (!input[field]) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Extract post title from calendario_item for response message
    const postTitle = input.calendario_item.tema_concepto || input.calendario_item.titulo_gancho || 'contenido solicitado';
    
    // Call N8N post creation API
    console.log('Calling N8N Post Creator API with input:', input);

    const n8nPayload = {
      ...input,
      // Ensure required fields have defaults
      tono_de_la_marca: input.tono_de_la_marca || "Profesional y amigable",
      buyer_persona_objetivo: input.buyer_persona_objetivo || {},
      calendario_item: input.calendario_item || {}
    };

    console.log('N8N Payload prepared:', n8nPayload);

    // Make the call to N8N with Basic Auth
    if (N8N_AUTH_USER && N8N_AUTH_PASS) {
      const n8nResponse = await fetch('https://buildera.app.n8n.cloud/webhook/post-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${N8N_AUTH_USER}:${N8N_AUTH_PASS}`)}`
        },
        body: JSON.stringify(n8nPayload)
      });

      if (n8nResponse.ok) {
        const n8nResult = await n8nResponse.json();
        console.log('N8N API Response received:', n8nResult);
        
        return new Response(JSON.stringify({
          message: `Copy para '${postTitle}' generado exitosamente.`,
          data: n8nResult,
          status: 'completed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.error('N8N API Error:', n8nResponse.status, n8nResponse.statusText);
      }
    }
    
    // Fallback: Simulate post creation processing
    const response = {
      message: `Copy para '${postTitle}' en proceso.`,
      data: {
        tono: input.tono_de_la_marca,
        persona: input.buyer_persona_objetivo,
        item: input.calendario_item,
        timestamp: new Date().toISOString(),
        status: 'processing'
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in marketing-hub-post-creator:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});