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
    const { userId, platform } = await req.json();
    
    console.log(`🔍 Análisis semántico para ${platform} - Usuario: ${userId}`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Obtener embeddings existentes para clustering
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('content_embeddings')
      .select(`
        id, post_id, content_text, embedding, metadata,
        social_media_posts!inner(metrics, hashtags, published_at)
      `)
      .eq('user_id', userId)
      .eq('platform', platform);

    if (embeddingsError) {
      throw new Error(`Error fetching embeddings: ${embeddingsError.message}`);
    }

    if (!embeddings || embeddings.length < 10) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Insufficient data for semantic analysis (minimum 10 posts required)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Analizando ${embeddings.length} embeddings`);

    // Realizar clustering semántico
    const clusters = await performSemanticClustering(userId, platform, embeddings);
    
    // Generar recomendaciones basadas en clusters
    const recommendations = await generateContentRecommendations(userId, platform, clusters, embeddings);

    // Analizar tendencias temporales
    const trends = await analyzeTrendingTopics(embeddings);

    return new Response(JSON.stringify({ 
      success: true, 
      clustersGenerated: clusters.length,
      recommendationsGenerated: recommendations.length,
      trends,
      message: `Análisis semántico completado para ${platform}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en análisis semántico:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performSemanticClustering(userId: string, platform: string, embeddings: any[]) {
  console.log('🎯 Realizando clustering semántico...');
  
  // Implementar K-means simplificado para agrupar contenido similar
  const clusters = await simplifiedKMeansClustering(embeddings, 5); // 5 clusters
  
  const savedClusters = [];

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    if (cluster.posts.length === 0) continue;

    // Calcular métricas del cluster
    const totalEngagement = cluster.posts.reduce((sum, post) => {
      const metrics = post.social_media_posts.metrics || {};
      return sum + (metrics.likes || 0) + (metrics.comments || 0);
    }, 0);

    const avgEngagement = totalEngagement / cluster.posts.length;

    // Extraer hashtags más comunes
    const hashtagCounts = {};
    cluster.posts.forEach(post => {
      const hashtags = post.social_media_posts.hashtags || [];
      hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    const topHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Generar tema del cluster con IA
    const clusterTheme = await generateClusterTheme(cluster.posts);

    const clusterData = {
      user_id: userId,
      cluster_name: `Cluster ${i + 1}: ${clusterTheme}`,
      platform,
      content_theme: clusterTheme,
      post_count: cluster.posts.length,
      avg_engagement: avgEngagement,
      top_hashtags: topHashtags,
      representative_posts: cluster.posts.slice(0, 3).map(p => p.post_id),
      embedding_centroid: `[${cluster.centroid.join(',')}]`
    };

    savedClusters.push(clusterData);
  }

  // Guardar clusters en la base de datos
  if (savedClusters.length > 0) {
    const { error } = await supabase
      .from('content_clusters')
      .upsert(savedClusters, { 
        onConflict: 'user_id,platform,cluster_name',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error saving clusters:', error);
    }
  }

  return savedClusters;
}

async function simplifiedKMeansClustering(embeddings: any[], k: number) {
  // Convertir embeddings string a arrays numéricos
  const vectors = embeddings.map(e => {
    const embeddingStr = e.embedding.replace(/[\[\]]/g, '');
    return embeddingStr.split(',').map(num => parseFloat(num.trim()));
  });

  // Inicializar centroides aleatoriamente
  const centroids = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * vectors.length);
    centroids.push([...vectors[randomIndex]]);
  }

  // Iteraciones de K-means (simplificado, 3 iteraciones)
  for (let iter = 0; iter < 3; iter++) {
    const clusters = Array(k).fill(null).map(() => ({ posts: [], vectors: [] }));

    // Asignar cada punto al centroide más cercano
    embeddings.forEach((embedding, idx) => {
      const vector = vectors[idx];
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let c = 0; c < k; c++) {
        const distance = cosineSimilarity(vector, centroids[c]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = c;
        }
      }

      clusters[closestCluster].posts.push(embedding);
      clusters[closestCluster].vectors.push(vector);
    });

    // Recalcular centroides
    for (let c = 0; c < k; c++) {
      if (clusters[c].vectors.length > 0) {
        const newCentroid = Array(vectors[0].length).fill(0);
        clusters[c].vectors.forEach(vector => {
          vector.forEach((val, idx) => {
            newCentroid[idx] += val;
          });
        });
        
        newCentroid.forEach((val, idx) => {
          newCentroid[idx] = val / clusters[c].vectors.length;
        });
        
        centroids[c] = newCentroid;
      }
    }
  }

  // Crear resultado final
  const finalClusters = [];
  for (let c = 0; c < k; c++) {
    const cluster = Array(k).fill(null).map(() => ({ posts: [] }))[c] || { posts: [] };
    
    embeddings.forEach((embedding, idx) => {
      const vector = vectors[idx];
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let cc = 0; cc < k; cc++) {
        const distance = cosineSimilarity(vector, centroids[cc]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = cc;
        }
      }

      if (closestCluster === c) {
        cluster.posts.push(embedding);
      }
    });

    finalClusters.push({
      posts: cluster.posts,
      centroid: centroids[c]
    });
  }

  return finalClusters;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return 1 - (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
}

async function generateClusterTheme(posts: any[]): Promise<string> {
  // Tomar muestra de contenido para generar tema
  const sampleContent = posts.slice(0, 5).map(p => p.content_text).join(' ');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Analiza el contenido y genera un tema descriptivo en 2-3 palabras en español.' 
          },
          { 
            role: 'user', 
            content: `Contenido: ${sampleContent.substring(0, 1000)}` 
          }
        ],
        temperature: 0.3,
        max_tokens: 20,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Contenido General';
  } catch (error) {
    console.error('Error generating cluster theme:', error);
    return 'Contenido General';
  }
}

async function generateContentRecommendations(userId: string, platform: string, clusters: any[], embeddings: any[]) {
  console.log('💡 Generando recomendaciones de contenido...');
  
  const recommendations = [];

  // Recomendación 1: Contenido de mejor rendimiento
  const bestPerformingCluster = clusters.reduce((best, current) => 
    current.avg_engagement > best.avg_engagement ? current : best
  );

  if (bestPerformingCluster) {
    recommendations.push({
      user_id: userId,
      platform,
      recommendation_type: 'trending_topics',
      title: `Continúa con contenido sobre: ${bestPerformingCluster.content_theme}`,
      description: `Este tipo de contenido tiene un engagement promedio de ${Math.round(bestPerformingCluster.avg_engagement)} interacciones. Considera crear más contenido similar.`,
      confidence_score: 0.85,
      similar_post_ids: bestPerformingCluster.representative_posts || [],
      suggested_content: {
        theme: bestPerformingCluster.content_theme,
        hashtags: bestPerformingCluster.top_hashtags,
        expected_engagement: bestPerformingCluster.avg_engagement
      }
    });
  }

  // Recomendación 2: Contenido infrautilizado
  const underperformingCluster = clusters.reduce((worst, current) => 
    current.avg_engagement < worst.avg_engagement ? current : worst
  );

  if (underperformingCluster && underperformingCluster !== bestPerformingCluster) {
    recommendations.push({
      user_id: userId,
      platform,
      recommendation_type: 'similar_content',
      title: `Optimiza contenido sobre: ${underperformingCluster.content_theme}`,
      description: `Este tema tiene potencial pero bajo engagement (${Math.round(underperformingCluster.avg_engagement)}). Prueba nuevos enfoques o formatos.`,
      confidence_score: 0.70,
      similar_post_ids: underperformingCluster.representative_posts || [],
      suggested_content: {
        theme: underperformingCluster.content_theme,
        suggestions: ['Cambiar formato', 'Usar hashtags populares', 'Publicar en horarios diferentes']
      }
    });
  }

  // Recomendación 3: Análisis temporal
  const recentPosts = embeddings.filter(e => {
    const publishedDate = new Date(e.social_media_posts.published_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return publishedDate > thirtyDaysAgo;
  });

  if (recentPosts.length > 0) {
    const recentEngagement = recentPosts.reduce((sum, post) => {
      const metrics = post.social_media_posts.metrics || {};
      return sum + (metrics.likes || 0) + (metrics.comments || 0);
    }, 0) / recentPosts.length;

    recommendations.push({
      user_id: userId,
      platform,
      recommendation_type: 'optimal_timing',
      title: 'Análisis de tendencia reciente',
      description: `Tu contenido reciente tiene un engagement promedio de ${Math.round(recentEngagement)}. ${recentEngagement > bestPerformingCluster.avg_engagement ? 'Mantienes una tendencia positiva.' : 'Considera volver a temas de mayor engagement.'}`,
      confidence_score: 0.75,
      suggested_content: {
        recent_performance: recentEngagement,
        trend: recentEngagement > bestPerformingCluster.avg_engagement ? 'up' : 'down'
      }
    });
  }

  // Guardar recomendaciones
  if (recommendations.length > 0) {
    const { error } = await supabase
      .from('content_recommendations')
      .upsert(recommendations, { 
        onConflict: 'user_id,platform,recommendation_type,title',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error saving recommendations:', error);
    }
  }

  return recommendations;
}

async function analyzeTrendingTopics(embeddings: any[]) {
  // Análisis simple de hashtags trending
  const hashtagCounts = {};
  const recentPosts = embeddings.filter(e => {
    const publishedDate = new Date(e.social_media_posts.published_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return publishedDate > thirtyDaysAgo;
  });

  recentPosts.forEach(post => {
    const hashtags = post.social_media_posts.hashtags || [];
    hashtags.forEach(tag => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });
  });

  const trendingHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return { trendingHashtags };
}