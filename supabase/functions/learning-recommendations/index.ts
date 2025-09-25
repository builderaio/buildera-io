import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  userId: string;
  context?: 'next_module' | 'skill_gap' | 'career_path' | 'review_recommendation';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get OpenAI API key
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('llm_api_keys')
      .select('api_key')
      .eq('provider', 'openai')
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData?.api_key) {
      throw new Error('OpenAI API key not found');
    }

    const openaiApiKey = apiKeyData.api_key;
    const { userId, context = 'next_module' }: RecommendationRequest = await req.json();

    // Get comprehensive user data
    const [userProfile, userGamification, userProgress, userBadges, userAssessments, userSessions] = await Promise.all([
      supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      
      supabaseClient
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      
      supabaseClient
        .from('user_learning_progress')
        .select('*, learning_modules(*)')
        .eq('user_id', userId),
      
      supabaseClient
        .from('user_badges')
        .select('*, learning_badges(*)')
        .eq('user_id', userId),
      
      supabaseClient
        .from('ai_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('taken_at', { ascending: false })
        .limit(10),
      
      supabaseClient
        .from('ai_tutor_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    // Get all available modules
    const { data: allModules } = await supabaseClient
      .from('learning_modules')
      .select('*')
      .eq('is_active', true)
      .order('difficulty_level');

    // Get all available badges
    const { data: allBadges } = await supabaseClient
      .from('learning_badges')
      .select('*')
      .eq('is_active', true);

    if (!userProfile.data) {
      throw new Error('User profile not found');
    }

    console.log('🔍 Analyzing user learning profile for recommendations');

    // Prepare data for AI analysis
    const profile = userProfile.data;
    const gamification = userGamification.data || {};
    const progress = userProgress.data || [];
    const badges = userBadges.data || [];
    const assessments = userAssessments.data || [];
    const sessions = userSessions.data || [];

    // Calculate learning analytics
    const completedModules = progress.filter(p => p.status === 'completed');
    const inProgressModules = progress.filter(p => p.status === 'in_progress');
    const averageScore = assessments.length > 0 
      ? assessments.reduce((acc, curr) => acc + (curr.score / curr.max_score * 100), 0) / assessments.length 
      : 0;
    
    const strongCategories = [...new Set(badges.map(b => b.learning_badges.category))];
    const recentTopics = sessions.slice(0, 10).flatMap(s => s.topics_covered || []);
    const knowledgeGaps = sessions.flatMap(s => s.knowledge_gaps_identified || []);

    // Build comprehensive prompt for AI recommendations
    const systemPrompt = `Eres un experto en recomendaciones de aprendizaje para profesionales en IA y negocios.

PERFIL DEL USUARIO:
- Nombre: ${profile.full_name}
- Empresa: ${profile.company_name || 'No especificada'}
- Tipo: ${profile.user_type}
- Industria: ${profile.industry || 'No especificada'}

DATOS DE GAMIFICACIÓN:
- Nivel actual: ${gamification.level || 1}
- Puntos totales: ${gamification.total_points || 0}
- Módulos completados: ${gamification.modules_completed || 0}
- Badges obtenidos: ${gamification.badges_earned || 0}
- Tiempo total de estudio: ${gamification.total_study_time_minutes || 0} minutos
- Racha actual: ${gamification.streak_days || 0} días

PROGRESO ACADÉMICO:
- Módulos completados: ${completedModules.length}
- Módulos en progreso: ${inProgressModules.length}
- Puntuación promedio en evaluaciones: ${averageScore.toFixed(1)}%
- Categorías dominadas: ${strongCategories.join(', ') || 'Ninguna aún'}

ANÁLISIS DE RENDIMIENTO:
- Interacciones con IA tutor: ${sessions.length}
- Últimos temas estudiados: ${recentTopics.slice(0, 5).join(', ') || 'Ninguno'}
- Brechas de conocimiento identificadas: ${knowledgeGaps.slice(0, 3).join(', ') || 'Ninguna'}

MÓDULOS DISPONIBLES:
${allModules?.map(m => `- ${m.title} (${m.difficulty_level}, ${m.category})`).join('\n') || 'Ninguno'}

BADGES DISPONIBLES:
${allBadges?.map(b => `- ${b.name} (nivel ${b.level}, categoría ${b.category})`).join('\n') || 'Ninguno'}

CONTEXTO DE RECOMENDACIÓN: ${context}

INSTRUCCIONES:
Basándote en el perfil completo del usuario, genera recomendaciones personalizadas que incluyan:

1. Próximo módulo recomendado (con justificación)
2. Ruta de aprendizaje sugerida (secuencia de 3-5 módulos)
3. Badges objetivo a corto plazo
4. Áreas de mejora específicas
5. Estrategias de estudio personalizadas
6. Estimación de tiempo para objetivos

Las recomendaciones deben ser:
- Específicas para el nivel y experiencia del usuario
- Alineadas con sus objetivos profesionales
- Progresivas en dificultad
- Motivadoras y alcanzables

FORMATO DE RESPUESTA (JSON):
{
  "next_module": {
    "id": "module_id",
    "title": "título",
    "reason": "justificación específica",
    "estimated_completion_days": 7
  },
  "learning_path": [
    {
      "id": "module_id",
      "title": "título",
      "priority": 1,
      "estimated_days": 7
    }
  ],
  "target_badges": [
    {
      "id": "badge_id", 
      "name": "nombre",
      "requirements": "qué necesita hacer",
      "timeline": "cuando puede lograrlo"
    }
  ],
  "improvement_areas": [
    {
      "area": "área específica",
      "current_level": "nivel actual",
      "target_level": "nivel objetivo",
      "action_plan": "plan específico"
    }
  ],
  "study_strategy": {
    "recommended_session_duration": 30,
    "sessions_per_week": 3,
    "best_times": ["morning", "afternoon"],
    "learning_style_tips": ["tip1", "tip2"]
  },
  "motivation": {
    "current_strengths": ["fortaleza1", "fortaleza2"],
    "achievement_forecast": "Lo que puede lograr en 30 días",
    "career_impact": "Cómo esto impactará su carrera"
  }
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Genera recomendaciones personalizadas de aprendizaje para este usuario con contexto: ${context}` }
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const recommendations = JSON.parse(openaiData.choices[0].message.content);

    // Save recommendations to database
    const recommendationsToSave = [];

    // Save next module recommendation
    if (recommendations.next_module) {
      recommendationsToSave.push({
        user_id: userId,
        platform: 'academy',
        recommendation_type: 'next_module',
        title: `Próximo módulo: ${recommendations.next_module.title}`,
        description: recommendations.next_module.reason,
        confidence_score: 0.9,
        status: 'active',
        suggested_content: {
          module_id: recommendations.next_module.id,
          estimated_days: recommendations.next_module.estimated_completion_days
        }
      });
    }

    // Save learning path recommendations
    if (recommendations.learning_path && recommendations.learning_path.length > 0) {
      recommendationsToSave.push({
        user_id: userId,
        platform: 'academy',
        recommendation_type: 'learning_path',
        title: 'Ruta de aprendizaje personalizada',
        description: `Plan de estudio con ${recommendations.learning_path.length} módulos`,
        confidence_score: 0.85,
        status: 'active',
        suggested_content: {
          path: recommendations.learning_path,
          total_estimated_days: recommendations.learning_path.reduce((acc: number, curr: any) => acc + curr.estimated_days, 0)
        }
      });
    }

    // Save to database
    if (recommendationsToSave.length > 0) {
      const { error: saveError } = await supabaseClient
        .from('content_recommendations')
        .insert(recommendationsToSave);

      if (saveError) {
        console.error('Error saving recommendations:', saveError);
      }
    }

    // Award points for checking recommendations
    const { error: gamificationError } = await supabaseClient
      .rpc('update_user_gamification', {
        p_user_id: userId,
        p_points_earned: 2
      });

    if (gamificationError) {
      console.error('Error updating gamification:', gamificationError);
    }

    console.log('✅ Personalized recommendations generated successfully');

    return new Response(JSON.stringify({
      success: true,
      recommendations: recommendations,
      user_profile: {
        level: gamification.level || 1,
        total_points: gamification.total_points || 0,
        modules_completed: completedModules.length,
        badges_earned: badges.length,
        average_score: averageScore.toFixed(1)
      },
      context: context,
      generated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error generating learning recommendations:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});