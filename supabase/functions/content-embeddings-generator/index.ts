import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, platform, jobId } = await req.json();
    
    console.log(`🧠 Generando embeddings para ${platform} - Usuario: ${userId}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Crear job para tracking de embeddings
    const { data: embeddingJob, error: jobError } = await supabase
      .from('data_processing_jobs')
      .insert({
        user_id: userId,
        platform,
        job_type: 'embedding_generation',
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Error creating embedding job: ${jobError.message}`);
    }

    // Obtener posts que no tienen embeddings
    const { data: posts, error: postsError } = await supabase
      .from('social_media_posts')
      .select('id, content, hashtags, platform')
      .eq('user_id', userId)
      .eq('platform', platform)
      .not('id', 'in', `(SELECT post_id FROM content_embeddings WHERE user_id = '${userId}')`);

    if (postsError) {
      throw new Error(`Error fetching posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      await supabase
        .from('data_processing_jobs')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString()
        })
        .eq('id', embeddingJob.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No new posts to process for embeddings'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Procesando embeddings para ${posts.length} posts`);

    // Procesar en lotes de 20 para evitar rate limits
    const batchSize = 20;
    let processed = 0;

    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      await processBatchEmbeddings(userId, batch);
      processed += batch.length;
      
      // Actualizar progreso
      const progress = Math.round((processed / posts.length) * 100);
      await supabase
        .from('data_processing_jobs')
        .update({
          progress,
          processed_items: processed,
          total_items: posts.length
        })
        .eq('id', embeddingJob.id);

      console.log(`Embeddings: ${processed}/${posts.length} (${progress}%)`);
      
      // Pequeña pausa para evitar rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Marcar job como completado
    await supabase
      .from('data_processing_jobs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString()
      })
      .eq('id', embeddingJob.id);

    // Iniciar análisis semántico en background
    await generateSemanticAnalysis(userId, platform);

    return new Response(JSON.stringify({ 
      success: true, 
      embeddingsGenerated: processed,
      message: `Embeddings generados para ${processed} posts de ${platform}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generando embeddings:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processBatchEmbeddings(userId: string, posts: any[]) {
  const embeddings = [];

  for (const post of posts) {
    try {
      // Preparar texto para embedding
      const textContent = prepareTextForEmbedding(post);
      
      // Generar embedding con OpenAI
      const embedding = await generateEmbedding(textContent);
      
      embeddings.push({
        user_id: userId,
        post_id: post.id,
        platform: post.platform,
        content_text: textContent,
        embedding: `[${embedding.join(',')}]`, // PostgreSQL array format
        metadata: {
          hashtags: post.hashtags || [],
          word_count: textContent.split(' ').length,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error(`Error generating embedding for post ${post.id}:`, error);
      // Continuar con el siguiente post en caso de error
    }
  }

  // Guardar embeddings en lote
  if (embeddings.length > 0) {
    const { error } = await supabase
      .from('content_embeddings')
      .upsert(embeddings, { onConflict: 'post_id' });

    if (error) {
      console.error('Error saving embeddings:', error);
      throw error;
    }
  }
}

function prepareTextForEmbedding(post: any): string {
  let text = post.content || '';
  
  // Agregar hashtags como contexto
  if (post.hashtags && post.hashtags.length > 0) {
    text += ' ' + post.hashtags.join(' ');
  }
  
  // Limpiar texto
  text = text.replace(/[^\w\s#@]/gi, ' ').replace(/\s+/g, ' ').trim();
  
  // Limitar longitud para OpenAI
  if (text.length > 8000) {
    text = text.substring(0, 8000);
  }
  
  return text;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function generateSemanticAnalysis(userId: string, platform: string) {
  console.log(`🔍 Iniciando análisis semántico para ${platform}`);
  
  try {
    // Activar análisis de clusters y recomendaciones
    await supabase.functions.invoke('semantic-content-analyzer', {
      body: { userId, platform }
    });
  } catch (error) {
    console.error('Error initiating semantic analysis:', error);
  }
}