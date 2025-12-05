import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyData {
  id: string;
  name: string;
  website_url: string | null;
  industry_sector: string | null;
  description: string | null;
}

interface NBARequest {
  company_id: string;
  user_id: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, user_id, language = 'es' } = await req.json() as NBARequest;

    if (!company_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'company_id and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company data
    const [
      companyRes,
      strategyRes,
      objectivesRes,
      enabledAgentsRes,
      usageLogsRes,
      insightsRes,
      creditsRes,
    ] = await Promise.all([
      supabase.from('companies').select('*').eq('id', company_id).single(),
      supabase.from('company_strategy').select('*').eq('company_id', company_id).maybeSingle(),
      supabase.from('company_objectives').select('*').eq('company_id', company_id),
      supabase.from('company_enabled_agents').select('*, platform_agents(name, category)').eq('company_id', company_id),
      supabase.from('agent_usage_log').select('*').eq('company_id', company_id).order('created_at', { ascending: false }).limit(20),
      supabase.from('content_insights').select('*').eq('user_id', user_id).eq('status', 'active').limit(10),
      supabase.from('company_credits').select('*').eq('company_id', company_id).maybeSingle(),
    ]);

    const company = companyRes.data as CompanyData | null;
    const strategy = strategyRes.data;
    const objectives = objectivesRes.data || [];
    const enabledAgents = enabledAgentsRes.data || [];
    const usageLogs = usageLogsRes.data || [];
    const insights = insightsRes.data || [];
    const credits = creditsRes.data;

    // Build context for AI
    const contextSummary = {
      hasCompleteName: !!company?.name,
      hasWebsite: !!company?.website_url,
      hasSector: !!company?.industry_sector,
      hasDescription: !!company?.description,
      hasMission: !!strategy?.mision,
      hasVision: !!strategy?.vision,
      hasValueProp: !!strategy?.propuesta_valor,
      objectivesCount: objectives.length,
      enabledAgentsCount: enabledAgents.length,
      recentExecutions: usageLogs.length,
      activeInsights: insights.length,
      availableCredits: credits?.available_credits || 0,
      enabledAgentCategories: [...new Set(enabledAgents.map((a: any) => a.platform_agents?.category).filter(Boolean))],
    };

    // Call Lovable AI Gateway for intelligent recommendations
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.log('LOVABLE_API_KEY not set, returning rule-based NBAs');
      // Fallback to simple rule-based NBAs
      const actions = generateRuleBasedNBAs(contextSummary, language);
      return new Response(
        JSON.stringify({ success: true, actions, source: 'rules' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = language === 'es' 
      ? `Eres un consultor de negocios experto que ayuda a empresas a maximizar el uso de una plataforma de agentes IA.
         Genera recomendaciones personalizadas basadas en el estado actual de la empresa.
         Responde SOLO con un JSON array de máximo 5 acciones, cada una con: id, priority (critical/high/medium/low), title, description, action_view, estimated_impact, required_time, icon (emoji).`
      : `You are an expert business consultant helping companies maximize their AI agent platform usage.
         Generate personalized recommendations based on the company's current state.
         Respond ONLY with a JSON array of max 5 actions, each with: id, priority (critical/high/medium/low), title, description, action_view, estimated_impact, required_time, icon (emoji).`;

    const userPrompt = `Company context:
- Profile complete: ${contextSummary.hasCompleteName && contextSummary.hasWebsite && contextSummary.hasSector}
- Strategy defined: ${contextSummary.hasMission && contextSummary.hasVision && contextSummary.hasValueProp}
- Objectives count: ${contextSummary.objectivesCount}
- Enabled agents: ${contextSummary.enabledAgentsCount}
- Recent executions: ${contextSummary.recentExecutions}
- Active insights: ${contextSummary.activeInsights}
- Available credits: ${contextSummary.availableCredits}
- Agent categories: ${contextSummary.enabledAgentCategories.join(', ') || 'none'}

Generate the most impactful next best actions for this company.`;

    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI Gateway error:', await aiResponse.text());
        const actions = generateRuleBasedNBAs(contextSummary, language);
        return new Response(
          JSON.stringify({ success: true, actions, source: 'rules' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const actions = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify({ success: true, actions, source: 'ai' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (aiError) {
      console.error('AI processing error:', aiError);
    }

    // Fallback
    const actions = generateRuleBasedNBAs(contextSummary, language);
    return new Response(
      JSON.stringify({ success: true, actions, source: 'rules' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-next-best-actions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateRuleBasedNBAs(context: any, language: string) {
  const actions = [];
  const isES = language === 'es';

  if (!context.hasCompleteName || !context.hasWebsite) {
    actions.push({
      id: 'complete-profile',
      priority: 'critical',
      title: isES ? 'Completa tu perfil de empresa' : 'Complete your company profile',
      description: isES 
        ? 'Tu perfil está incompleto. Los agentes necesitan esta información.'
        : 'Your profile is incomplete. Agents need this information.',
      action_view: 'adn-empresa',
      estimated_impact: isES ? 'Mejora 40% la calidad' : '40% quality improvement',
      required_time: '5 min',
      icon: '🏢',
    });
  }

  if (!context.hasMission && !context.hasVision) {
    actions.push({
      id: 'define-strategy',
      priority: 'high',
      title: isES ? 'Define tu estrategia' : 'Define your strategy',
      description: isES
        ? 'Sin misión y visión, los agentes no pueden alinear resultados.'
        : 'Without mission and vision, agents cannot align results.',
      action_view: 'adn-empresa',
      estimated_impact: isES ? 'Contenido más alineado' : 'Better aligned content',
      required_time: '10 min',
      icon: '🎯',
    });
  }

  if (context.enabledAgentsCount === 0) {
    actions.push({
      id: 'enable-agents',
      priority: 'high',
      title: isES ? 'Activa tu primer agente' : 'Activate your first agent',
      description: isES
        ? 'Explora el marketplace y habilita agentes.'
        : 'Explore the marketplace and enable agents.',
      action_view: 'marketplace',
      estimated_impact: isES ? 'Comienza a automatizar' : 'Start automating',
      required_time: '2 min',
      icon: '🤖',
    });
  }

  if (context.availableCredits < 50) {
    actions.push({
      id: 'get-credits',
      priority: context.availableCredits < 10 ? 'high' : 'medium',
      title: isES ? 'Obtén más créditos' : 'Get more credits',
      description: isES
        ? `Solo tienes ${context.availableCredits} créditos disponibles.`
        : `You only have ${context.availableCredits} credits available.`,
      action_view: 'configuracion',
      estimated_impact: isES ? 'Continúa usando agentes' : 'Continue using agents',
      required_time: '2 min',
      icon: '⚡',
    });
  }

  if (context.activeInsights === 0 && context.enabledAgentsCount > 0) {
    actions.push({
      id: 'generate-insights',
      priority: 'medium',
      title: isES ? 'Genera insights' : 'Generate insights',
      description: isES
        ? 'Los agentes pueden identificar oportunidades de crecimiento.'
        : 'Agents can identify growth opportunities.',
      action_view: 'marketing-hub',
      estimated_impact: isES ? 'Descubre oportunidades' : 'Discover opportunities',
      required_time: '3 min',
      icon: '💡',
    });
  }

  return actions.slice(0, 5);
}
