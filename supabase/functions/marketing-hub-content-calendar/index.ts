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

    // Generate content calendar
    const startDate = new Date(input.fecha_inicio_calendario);
    const numDays = Number.isFinite(Number(input.numero_dias_generar)) && Number(input.numero_dias_generar) > 0
      ? Number(input.numero_dias_generar)
      : 7;
    const platforms = Array.isArray(input.plataformas_seleccionadas) && input.plataformas_seleccionadas.length > 0
      ? input.plataformas_seleccionadas
      : ['linkedin'];
    
    console.log('Generando calendario:', { startDate, numDays, platforms });
    
    const calendario_contenido = [];
    const contentTypes = ['Post', 'Story', 'Reel', 'Carousel', 'Video'];
    const timeSlots = ['08:00', '10:00', '12:00', '15:00', '18:00', '20:00'];
    
    // Generate posts for each day and platform
    for (let day = 0; day < numDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Skip weekends for LinkedIn, focus more content on weekdays
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      
      for (const platform of platforms) {
        // Determine how many posts per platform per day
        let postsPerDay = 1;
        if (platform === 'instagram') postsPerDay = isWeekend ? 1 : 2;
        if (platform === 'tiktok') postsPerDay = 2;
        if (platform === 'linkedin' && isWeekend) continue; // Skip LinkedIn on weekends
        
        for (let postIndex = 0; postIndex < postsPerDay; postIndex++) {
          const randomTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
          const randomContentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
          
          // Generate topic based on platform and business
          let tema_concepto = '';
          let descripcion_creativo = '';
          
          if (platform === 'linkedin') {
            const linkedinTopics = [
              'Tips profesionales sobre servicios legales',
              'Beneficios de la automatización legal',
              'Casos de éxito de clientes',
              'Tendencias en el sector legal',
              'Consejos para empresas'
            ];
            tema_concepto = linkedinTopics[Math.floor(Math.random() * linkedinTopics.length)];
            descripcion_creativo = 'Contenido profesional e informativo para audiencia empresarial';
          } else if (platform === 'instagram') {
            const instagramTopics = [
              'Infografía sobre documentos legales',
              'Carousel explicativo de servicios',
              'Story con tips legales rápidos',
              'Reel educativo sobre IA legal',
              'Post testimonial de clientes'
            ];
            tema_concepto = instagramTopics[Math.floor(Math.random() * instagramTopics.length)];
            descripcion_creativo = 'Contenido visual atractivo con valor educativo';
          } else if (platform === 'tiktok') {
            const tiktokTopics = [
              'Video corto: "¿Sabías que la IA puede generar contratos?"',
              'Tutorial rápido: Cómo usar servicios legales digitales',
              'Mito vs Realidad en servicios legales',
              'Trend legal: Lo que necesitas saber',
              'Mini-consulta legal en 60 segundos'
            ];
            tema_concepto = tiktokTopics[Math.floor(Math.random() * tiktokTopics.length)];
            descripcion_creativo = 'Video dinámico y educativo con elementos virales';
          }
          
          calendario_contenido.push({
            fecha: dateStr,
            hora: randomTime,
            red_social: platform,
            tipo_contenido: randomContentType,
            tema_concepto: tema_concepto,
            descripcion_creativo: descripcion_creativo,
            estado: 'programado',
            prioridad: Math.floor(Math.random() * 3) + 1 // 1-3
          });
        }
      }
    }
    
    // Sort by date and time
    calendario_contenido.sort((a, b) => {
      const dateComparison = a.fecha.localeCompare(b.fecha);
      if (dateComparison === 0) {
        return a.hora.localeCompare(b.hora);
      }
      return dateComparison;
    });
    
    console.log('Calendario generado con', calendario_contenido.length, 'posts');
    
    const response = {
      message: `Calendario de contenido generado exitosamente para ${input.nombre_empresa}`,
      calendario_contenido: calendario_contenido,
      resumen: {
        total_posts: calendario_contenido.length,
        plataformas_incluidas: platforms,
        fecha_inicio: input.fecha_inicio_calendario,
        fecha_fin: calendario_contenido[calendario_contenido.length - 1]?.fecha,
        duracion_dias: numDays
      },
      metadata: {
        empresa: input.nombre_empresa,
        generated_at: new Date().toISOString(),
        status: 'completed'
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