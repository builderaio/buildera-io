import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateRequest {
  userId: string;
  badgeId: string;
  moduleId?: string;
  shareOnLinkedIn?: boolean;
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

    // Get OpenAI API key for image generation
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
    const { userId, badgeId, moduleId, shareOnLinkedIn }: CertificateRequest = await req.json();

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, company_name, email')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Get badge information
    const { data: badge, error: badgeError } = await supabaseClient
      .from('learning_badges')
      .select('*')
      .eq('id', badgeId)
      .single();

    if (badgeError || !badge) {
      throw new Error('Badge not found');
    }

    // Get or verify user badge
    const { data: userBadge, error: userBadgeError } = await supabaseClient
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single();

    if (userBadgeError || !userBadge) {
      throw new Error('User badge not found or not earned');
    }

    // Get module information if provided
    let moduleInfo = null;
    if (moduleId) {
      const { data: module } = await supabaseClient
        .from('learning_modules')
        .select('title, description, category')
        .eq('id', moduleId)
        .single();
      moduleInfo = module;
    }

    console.log('🎨 Generating certificate image with AI');

    // Create certificate design prompt
    const certificatePrompt = `Create a professional business certificate design with the following specifications:

CERTIFICATE DETAILS:
- Recipient: ${profile.full_name}
- Company: ${profile.company_name || 'Professional'}
- Badge: ${badge.name}
- Description: ${badge.description}
- Category: ${badge.category}
- Level: ${badge.level === 1 ? 'Bronze' : badge.level === 2 ? 'Silver' : badge.level === 3 ? 'Gold' : 'Platinum'}
- Date: ${new Date().toLocaleDateString('es-ES')}
- Institution: Academia Buildera
- Verification Code: ${userBadge.verification_code}

DESIGN REQUIREMENTS:
- Professional business certificate layout
- Modern, clean design with corporate aesthetic
- Include Academia Buildera branding
- Use business colors: navy blue, gold accents, white background
- Include verification QR code area
- Elegant typography suitable for LinkedIn sharing
- Certificate border with professional patterns
- Badge/seal area with level indication (${badge.level === 1 ? 'Bronze' : badge.level === 2 ? 'Silver' : badge.level === 3 ? 'Gold' : 'Platinum'})
- High-resolution, professional quality
- 16:9 aspect ratio suitable for social media sharing

TEXT ELEMENTS TO INCLUDE:
- "CERTIFICADO DE COMPLETION"
- "Academia Buildera certifica que"
- "${profile.full_name}"
- "Ha completado exitosamente el programa"
- "${badge.name}"
- "En la categoría de ${badge.category}"
- "Fecha: ${new Date().toLocaleDateString('es-ES')}"
- "Código de verificación: ${userBadge.verification_code}"
- "Este certificado valida las competencias adquiridas en inteligencia artificial para negocios"

The certificate should look professional enough to be shared on LinkedIn and other professional networks.`;

    // Generate certificate image
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: certificatePrompt,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
        style: 'natural'
      }),
    });

    if (!imageResponse.ok) {
      throw new Error(`OpenAI Image API error: ${imageResponse.statusText}`);
    }

    const imageData = await imageResponse.json();
    const certificateImageUrl = imageData.data[0].url;

    console.log('📄 Certificate image generated successfully');

    // Create LinkedIn sharing data
    const linkedInData = {
      title: `Certificado: ${badge.name}`,
      description: `Orgulloso de haber completado el programa "${badge.name}" en Academia Buildera. Este certificado valida mis competencias en ${badge.category} y mi compromiso con el aprendizaje continuo en inteligencia artificial para negocios.`,
      image_url: certificateImageUrl,
      hashtags: ['#AcademiaBuildera', '#IA', '#Certificacion', '#AprendizajeContinuo', '#InteligenciaArtificial'],
      verification_url: `https://academy.buildera.io/verify/${userBadge.verification_code}`,
      skills: [badge.category, 'Inteligencia Artificial', 'Innovación Digital'],
      industry: moduleInfo?.category || badge.category
    };

    // Update user badge with certificate URL and LinkedIn data
    const { error: updateError } = await supabaseClient
      .from('user_badges')
      .update({
        certificate_url: certificateImageUrl,
        linkedin_shared: shareOnLinkedIn || false,
        linkedin_shared_at: shareOnLinkedIn ? new Date().toISOString() : null,
        metadata: {
          ...userBadge.metadata,
          linkedin_data: linkedInData,
          certificate_generated_at: new Date().toISOString()
        }
      })
      .eq('id', userBadge.id);

    if (updateError) {
      console.error('Error updating user badge:', updateError);
    }

    // Update badge table with LinkedIn sharing data
    const { error: badgeUpdateError } = await supabaseClient
      .from('learning_badges')
      .update({
        linkedin_badge_data: linkedInData
      })
      .eq('id', badgeId);

    if (badgeUpdateError) {
      console.error('Error updating badge LinkedIn data:', badgeUpdateError);
    }

    // Award bonus points for certificate generation
    const { error: gamificationError } = await supabaseClient
      .rpc('update_user_gamification', {
        p_user_id: userId,
        p_points_earned: 50 // Bonus points for certificate
      });

    if (gamificationError) {
      console.error('Error updating gamification:', gamificationError);
    }

    // Create verification URL
    const verificationUrl = `https://academy.buildera.io/verify/${userBadge.verification_code}`;

    console.log('✅ Certificate generated and processed successfully');

    return new Response(JSON.stringify({
      success: true,
      certificate_url: certificateImageUrl,
      verification_code: userBadge.verification_code,
      verification_url: verificationUrl,
      linkedin_data: linkedInData,
      badge_info: {
        name: badge.name,
        description: badge.description,
        level: badge.level,
        category: badge.category
      },
      recipient: {
        name: profile.full_name,
        company: profile.company_name
      },
      earned_date: userBadge.earned_at,
      points_bonus: 50
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});