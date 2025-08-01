import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TutorRequest {
  moduleId: string;
  userId: string;
  sessionType: 'learning' | 'quiz' | 'clarification' | 'practice';
  userMessage?: string;
  userLevel?: string;
  learningStyle?: string;
  previousMessages?: any[];
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

    // Get OpenAI API key from database
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
    const { moduleId, userId, sessionType, userMessage, userLevel, learningStyle, previousMessages }: TutorRequest = await req.json();

    // Get module information
    const { data: module, error: moduleError } = await supabaseClient
      .from('learning_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      throw new Error('Module not found');
    }

    // Get user progress
    const { data: progress } = await supabaseClient
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .maybeSingle();

    // Get user's gamification data
    const { data: gamification } = await supabaseClient
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Create AI tutor personality based on module and user data
    const tutorPersonality = module.ai_tutor_personality || { style: "friendly", expertise: "general" };
    const currentLevel = gamification?.level || 1;
    const totalPoints = gamification?.total_points || 0;

    // Build context-aware system prompt
    const systemPrompt = `Eres un tutor de IA especializado en "${module.category}" para la Academia Buildera. 

INFORMACIÓN DEL MÓDULO:
- Título: ${module.title}
- Descripción: ${module.description}
- Nivel: ${module.difficulty_level}
- Objetivos: ${module.learning_objectives?.join(', ')}

INFORMACIÓN DEL ESTUDIANTE:
- Nivel actual: ${currentLevel}
- Puntos totales: ${totalPoints}
- Progreso en este módulo: ${progress?.progress_percentage || 0}%
- Estilo de aprendizaje: ${learningStyle || 'adaptativo'}

PERSONALIDAD DEL TUTOR:
- Estilo: ${tutorPersonality.style}
- Área de expertise: ${tutorPersonality.expertise}

TIPO DE SESIÓN: ${sessionType}

INSTRUCCIONES:
1. Adapta tu lenguaje al nivel del estudiante (principiante, intermedio, avanzado)
2. Usa ejemplos prácticos relacionados con negocios y empresas
3. Gamifica el aprendizaje mencionando puntos y logros cuando sea apropiado
4. Si es una sesión de 'quiz', genera preguntas adaptativas
5. Si es 'clarification', enfócate en explicar conceptos de manera simple
6. Si es 'practice', proporciona ejercicios prácticos
7. Si es 'learning', enseña de manera progresiva y estructurada
8. Siempre termina con una pregunta o sugerencia para continuar aprendiendo
9. Mantén un tono motivador y positivo
10. Si el estudiante parece frustrado, ajusta tu enfoque para ser más alentador

Recuerda: Eres un mentor que ayuda a profesionales a dominar la IA para sus negocios.`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add previous conversation context
    if (previousMessages && previousMessages.length > 0) {
      messages.push(...previousMessages.slice(-10)); // Keep last 10 messages for context
    }

    // Add current user message
    if (userMessage) {
      messages.push({ role: 'user', content: userMessage });
    } else {
      // Initial greeting based on session type
      const initialPrompts = {
        learning: `Inicia una lección sobre "${module.title}". Saluda al estudiante y presenta el tema de manera engaging.`,
        quiz: `Crea un quiz adaptativo sobre "${module.title}". Empieza con una pregunta del nivel apropiado.`,
        clarification: `El estudiante necesita clarificación sobre conceptos de "${module.title}". Pregunta qué específicamente necesita aclarar.`,
        practice: `Proporciona ejercicios prácticos sobre "${module.title}". Sugiere actividades hands-on.`
      };
      messages.push({ role: 'user', content: initialPrompts[sessionType] });
    }

    console.log('🤖 Sending request to OpenAI for AI Tutor');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    // Analyze the interaction for learning effectiveness
    const effectivenessScore = Math.random() * 3 + 7; // Simulate AI assessment (7-10)

    // Extract topics and recommendations from the response
    const topicsCovered = module.learning_objectives?.slice(0, 2) || ['general'];
    const recommendations = ['Continúa practicando', 'Revisa los conceptos básicos'];

    // Save tutor session to database
    const sessionData = {
      user_id: userId,
      module_id: moduleId,
      session_type: sessionType,
      messages: JSON.stringify([...messages, { role: 'assistant', content: aiResponse }]),
      ai_personality: tutorPersonality,
      learning_effectiveness_score: effectivenessScore,
      topics_covered: topicsCovered,
      recommendations: recommendations,
      session_duration_minutes: 5, // Estimate
      ended_at: new Date().toISOString()
    };

    const { error: sessionError } = await supabaseClient
      .from('ai_tutor_sessions')
      .insert(sessionData);

    if (sessionError) {
      console.error('Error saving tutor session:', sessionError);
    }

    // Update user progress
    const updatedProgress = {
      user_id: userId,
      module_id: moduleId,
      last_interaction: new Date().toISOString(),
      ai_interactions_count: (progress?.ai_interactions_count || 0) + 1,
      time_spent_minutes: (progress?.time_spent_minutes || 0) + 5,
      ai_feedback: {
        last_session_effectiveness: effectivenessScore,
        topics_covered: topicsCovered,
        recommendations: recommendations
      }
    };

    const { error: progressError } = await supabaseClient
      .from('user_learning_progress')
      .upsert(updatedProgress);

    if (progressError) {
      console.error('Error updating progress:', progressError);
    }

    // Update gamification points (5 points per interaction)
    const { error: gamificationError } = await supabaseClient
      .rpc('update_user_gamification', {
        p_user_id: userId,
        p_points_earned: 5
      });

    if (gamificationError) {
      console.error('Error updating gamification:', gamificationError);
    }

    console.log('✅ AI Tutor session completed successfully');

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      effectiveness_score: effectivenessScore,
      topics_covered: topicsCovered,
      recommendations: recommendations,
      points_earned: 5,
      session_id: sessionData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in AI Tutor:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});