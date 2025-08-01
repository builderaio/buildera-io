import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessmentRequest {
  moduleId: string;
  userId: string;
  assessmentType: 'adaptive' | 'final' | 'practice';
  userAnswers?: any[];
  currentQuestionIndex?: number;
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
    const { moduleId, userId, assessmentType, userAnswers, currentQuestionIndex }: AssessmentRequest = await req.json();

    // Get module information
    const { data: module, error: moduleError } = await supabaseClient
      .from('learning_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      throw new Error('Module not found');
    }

    // Get user's previous assessments for adaptation
    const { data: previousAssessments } = await supabaseClient
      .from('ai_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .order('taken_at', { ascending: false })
      .limit(3);

    // Get user's gamification level
    const { data: gamification } = await supabaseClient
      .from('user_gamification')
      .select('level, total_points')
      .eq('user_id', userId)
      .maybeSingle();

    const userLevel = gamification?.level || 1;
    const difficultyMap = {
      1: 'muy básico',
      2: 'básico',
      3: 'intermedio básico',
      4: 'intermedio',
      5: 'intermedio avanzado',
      6: 'avanzado',
      7: 'muy avanzado',
      8: 'experto',
      9: 'master',
      10: 'guru'
    };

    const targetDifficulty = difficultyMap[userLevel as keyof typeof difficultyMap] || 'básico';

    if (!userAnswers) {
      // Generate initial questions
      console.log('🎯 Generating adaptive assessment questions');

      const systemPrompt = `Eres un experto en evaluación adaptativa para la Academia Buildera. 

MÓDULO: ${module.title}
DESCRIPCIÓN: ${module.description}
OBJETIVOS: ${module.learning_objectives?.join(', ')}
NIVEL DEL USUARIO: ${userLevel} (${targetDifficulty})
TIPO DE EVALUACIÓN: ${assessmentType}

INSTRUCCIONES:
1. Genera exactamente 5 preguntas de selección múltiple adaptadas al nivel del usuario
2. Las preguntas deben evaluar comprensión conceptual y aplicación práctica
3. Cada pregunta debe tener 4 opciones (A, B, C, D) con solo una correcta
4. Incluye casos prácticos relacionados con negocios reales
5. Adapta la dificultad al nivel ${targetDifficulty}
6. Las preguntas deben estar en español
7. Incluye una explicación de por qué cada respuesta es correcta o incorrecta

FORMATO DE RESPUESTA (JSON):
{
  "questions": [
    {
      "id": 1,
      "question": "Pregunta aquí",
      "options": {
        "A": "Opción A",
        "B": "Opción B", 
        "C": "Opción C",
        "D": "Opción D"
      },
      "correct_answer": "A",
      "explanation": "Explicación detallada",
      "difficulty": "intermedio",
      "topic": "tema específico",
      "business_context": "contexto empresarial"
    }
  ],
  "total_questions": 5,
  "estimated_time_minutes": 15,
  "difficulty_level": "${targetDifficulty}"
}

Genera preguntas que desafíen al estudiante apropiadamente para su nivel.`;

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
            { role: 'user', content: `Genera una evaluación adaptativa de nivel ${targetDifficulty} sobre ${module.title}` }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const openaiData = await openaiResponse.json();
      const questionsData = JSON.parse(openaiData.choices[0].message.content);

      // Save assessment to database
      const assessmentData = {
        user_id: userId,
        module_id: moduleId,
        assessment_type: assessmentType,
        questions: questionsData,
        score: 0,
        max_score: questionsData.questions.length,
        difficulty_adapted: true,
        knowledge_areas_assessed: module.learning_objectives || [],
        taken_at: new Date().toISOString()
      };

      const { data: savedAssessment, error: assessmentError } = await supabaseClient
        .from('ai_assessments')
        .insert(assessmentData)
        .select()
        .single();

      if (assessmentError) {
        throw new Error('Error saving assessment');
      }

      return new Response(JSON.stringify({
        success: true,
        assessment_id: savedAssessment.id,
        questions: questionsData.questions,
        total_questions: questionsData.total_questions,
        estimated_time: questionsData.estimated_time_minutes,
        difficulty_level: questionsData.difficulty_level
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Evaluate answers
      console.log('📊 Evaluating assessment answers');

      // Get the original assessment
      const { data: assessment, error: assessmentError } = await supabaseClient
        .from('ai_assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .order('taken_at', { ascending: false })
        .limit(1)
        .single();

      if (assessmentError || !assessment) {
        throw new Error('Assessment not found');
      }

      const questions = assessment.questions.questions;
      let correctAnswers = 0;
      const detailedResults = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const userAnswer = userAnswers[i];
        const isCorrect = userAnswer === question.correct_answer;
        
        if (isCorrect) correctAnswers++;

        detailedResults.push({
          question_id: question.id,
          question: question.question,
          user_answer: userAnswer,
          correct_answer: question.correct_answer,
          is_correct: isCorrect,
          explanation: question.explanation,
          topic: question.topic
        });
      }

      const score = correctAnswers;
      const percentage = (score / questions.length) * 100;
      const passed = percentage >= 70;

      // AI evaluation of performance
      const evaluationPrompt = `Analiza el rendimiento del estudiante en esta evaluación:

MÓDULO: ${module.title}
PUNTUACIÓN: ${score}/${questions.length} (${percentage.toFixed(1)}%)
NIVEL DEL USUARIO: ${userLevel}

RESPUESTAS DETALLADAS:
${detailedResults.map(r => `
- ${r.question}
  Respuesta del usuario: ${r.user_answer}
  Respuesta correcta: ${r.correct_answer}
  ¿Correcto?: ${r.is_correct ? 'Sí' : 'No'}
  Tema: ${r.topic}
`).join('')}

Proporciona:
1. Fortalezas identificadas (máximo 3)
2. Áreas de mejora (máximo 3)  
3. Recomendaciones específicas para el siguiente paso
4. Si el estudiante está listo para certificación (true/false)

Formato JSON:
{
  "strengths": ["fortaleza1", "fortaleza2"],
  "improvement_areas": ["area1", "area2"],
  "recommendations": ["recomendación1", "recomendación2"],
  "certification_ready": false,
  "next_level_ready": false,
  "overall_assessment": "Evaluación general en una oración"
}`;

      const evaluationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Eres un evaluador experto en educación empresarial y IA.' },
            { role: 'user', content: evaluationPrompt }
          ],
          temperature: 0.2,
          max_tokens: 800,
        }),
      });

      const evaluationData = await evaluationResponse.json();
      const aiEvaluation = JSON.parse(evaluationData.choices[0].message.content);

      // Update assessment with results
      const { error: updateError } = await supabaseClient
        .from('ai_assessments')
        .update({
          user_answers: userAnswers,
          ai_evaluation: aiEvaluation,
          score: score,
          time_taken_minutes: 15, // Estimate
          passed: passed,
          certification_eligible: aiEvaluation.certification_ready
        })
        .eq('id', assessment.id);

      if (updateError) {
        console.error('Error updating assessment:', updateError);
      }

      // Update user progress
      const { error: progressError } = await supabaseClient
        .from('user_learning_progress')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          quiz_attempts: (assessment.quiz_attempts || 0) + 1,
          best_quiz_score: Math.max(assessment.best_quiz_score || 0, percentage),
          status: passed ? 'completed' : 'in_progress',
          progress_percentage: passed ? 100 : 75,
          completed_at: passed ? new Date().toISOString() : null,
          last_interaction: new Date().toISOString()
        });

      if (progressError) {
        console.error('Error updating progress:', progressError);
      }

      // Award points based on performance
      const pointsEarned = passed ? module.points_reward : Math.floor(module.points_reward * 0.5);
      
      const { error: gamificationError } = await supabaseClient
        .rpc('update_user_gamification', {
          p_user_id: userId,
          p_points_earned: pointsEarned
        });

      if (gamificationError) {
        console.error('Error updating gamification:', gamificationError);
      }

      // Check for badge eligibility if passed
      let badgeEarned = null;
      if (passed) {
        const { data: badges } = await supabaseClient
          .from('learning_badges')
          .select('*')
          .eq('category', module.category)
          .lte('points_required', (gamification?.total_points || 0) + pointsEarned);

        if (badges && badges.length > 0) {
          // Check if user already has this badge
          const { data: userBadges } = await supabaseClient
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', userId);

          const userBadgeIds = userBadges?.map(ub => ub.badge_id) || [];
          const newBadge = badges.find(b => !userBadgeIds.includes(b.id));

          if (newBadge) {
            const verificationCode = `BUILDERA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const { error: badgeError } = await supabaseClient
              .from('user_badges')
              .insert({
                user_id: userId,
                badge_id: newBadge.id,
                verification_code: verificationCode
              });

            if (!badgeError) {
              badgeEarned = { ...newBadge, verification_code: verificationCode };
            }
          }
        }
      }

      console.log('✅ Assessment evaluation completed');

      return new Response(JSON.stringify({
        success: true,
        score: score,
        total_questions: questions.length,
        percentage: percentage,
        passed: passed,
        points_earned: pointsEarned,
        detailed_results: detailedResults,
        ai_evaluation: aiEvaluation,
        badge_earned: badgeEarned,
        certification_eligible: aiEvaluation.certification_ready
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Error in Adaptive Assessment:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});