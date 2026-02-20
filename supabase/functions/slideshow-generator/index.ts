import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// 6-slide formula from Larry methodology
const SLIDE_STRUCTURE = [
  { role: 'hook', description: 'Opening hook — grab attention in 0.5s. Bold text, emotional trigger.' },
  { role: 'pain_point', description: 'Pain point — relatable problem the audience faces daily.' },
  { role: 'solution', description: 'Solution reveal — show how your product/service solves it.' },
  { role: 'social_proof', description: 'Social proof — testimonials, numbers, before/after.' },
  { role: 'cta', description: 'Call to action — clear next step, urgency.' },
  { role: 'download', description: 'Download/Follow slide — final push with link or handle.' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const body = await req.json();
    const {
      app_name,
      app_description,
      target_audience,
      problem_solved,
      category = 'general',
      hook_text,
      visual_style = 'modern_minimal',
      aspect_ratio = '9:16',
      company_id,
    } = body;

    if (!app_name || !app_description) {
      throw new Error('app_name and app_description are required');
    }

    console.log(`🎬 Generating slideshow for "${app_name}" by user ${user.id}`);

    // Step 1: Generate slide texts using AI
    const textPrompt = `You are a viral TikTok/Instagram slideshow copywriter using the Larry methodology (7M+ views).

Generate text for a 6-slide carousel about: "${app_name}" - ${app_description}
Target audience: ${target_audience || 'general audience'}
Problem solved: ${problem_solved || app_description}
Category: ${category}
${hook_text ? `Use this hook for slide 1: "${hook_text}"` : 'Create a viral hook for slide 1.'}

For each slide, provide:
1. HOOK: ${hook_text || 'Attention-grabbing opener (Person + Conflict formula preferred)'}
2. PAIN POINT: Relatable daily struggle
3. SOLUTION: How the product solves it (show, don't tell)
4. SOCIAL PROOF: Numbers, testimonials, or before/after
5. CTA: Clear action with urgency
6. DOWNLOAD/FOLLOW: Final push

Return ONLY a JSON array of 6 objects: [{"slide": 1, "headline": "...", "subtext": "...", "overlay_text": "..."}]
Keep text SHORT (max 8 words headline, 15 words subtext). This is for visual slides.`;

    const textResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: textPrompt }],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_slide_texts',
            description: 'Generate text content for 6 slideshow slides',
            parameters: {
              type: 'object',
              properties: {
                slides: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      slide: { type: 'number' },
                      headline: { type: 'string' },
                      subtext: { type: 'string' },
                      overlay_text: { type: 'string' },
                    },
                    required: ['slide', 'headline', 'subtext'],
                  },
                },
              },
              required: ['slides'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'generate_slide_texts' } },
      }),
    });

    if (!textResponse.ok) {
      if (textResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (textResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI text generation failed: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    let slideTexts: any[] = [];

    // Parse tool call response
    const toolCall = textData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      slideTexts = parsed.slides || [];
    }

    if (slideTexts.length < 6) {
      // Fallback: try parsing from content
      const content = textData.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        slideTexts = JSON.parse(jsonMatch[0]);
      }
    }

    if (slideTexts.length < 6) {
      throw new Error('Failed to generate slide texts');
    }

    console.log(`✅ Generated ${slideTexts.length} slide texts`);

    // Step 2: Generate images for each slide using AI image generation
    const slideResults: any[] = [];
    const dimensions = aspect_ratio === '9:16' ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 };

    for (let i = 0; i < Math.min(slideTexts.length, 6); i++) {
      const slide = slideTexts[i];
      const slideRole = SLIDE_STRUCTURE[i];

      const imagePrompt = `Create a ${aspect_ratio} portrait social media slide image for a ${category} app called "${app_name}".
Slide ${i + 1}/6 - ${slideRole.role}: ${slideRole.description}
Visual style: ${visual_style}, clean, modern, vibrant colors.
The image should be a background for text overlay. Do NOT include any text in the image.
Make it photorealistic, high quality, Instagram/TikTok aesthetic.
Content context: ${slide.headline} - ${slide.subtext}
Ultra high resolution.`;

      try {
        const imgResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{ role: 'user', content: imagePrompt }],
            modalities: ['image', 'text'],
          }),
        });

        if (!imgResponse.ok) {
          console.error(`Image generation failed for slide ${i + 1}: ${imgResponse.status}`);
          slideResults.push({
            ...slide,
            role: slideRole.role,
            image_url: null,
            image_error: `Generation failed: ${imgResponse.status}`,
          });
          continue;
        }

        const imgData = await imgResponse.json();
        const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        // Upload to Supabase Storage if we have an image
        let storedUrl = imageUrl;
        if (imageUrl && imageUrl.startsWith('data:image')) {
          try {
            const serviceClient = createClient(supabaseUrl, supabaseKey);
            const base64Data = imageUrl.split(',')[1];
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const filePath = `slideshows/${user.id}/${Date.now()}_slide_${i + 1}.png`;

            // Ensure bucket exists
            await serviceClient.storage.createBucket('slideshow-assets', { public: true }).catch(() => {});

            const { error: uploadError } = await serviceClient.storage
              .from('slideshow-assets')
              .upload(filePath, binaryData, { contentType: 'image/png', upsert: true });

            if (!uploadError) {
              const { data: urlData } = serviceClient.storage.from('slideshow-assets').getPublicUrl(filePath);
              storedUrl = urlData.publicUrl;
            }
          } catch (uploadErr) {
            console.warn(`Storage upload failed for slide ${i + 1}, using base64:`, uploadErr);
          }
        }

        slideResults.push({
          ...slide,
          role: slideRole.role,
          image_url: storedUrl,
        });

        console.log(`✅ Slide ${i + 1} generated`);
      } catch (imgErr) {
        console.error(`Slide ${i + 1} image error:`, imgErr);
        slideResults.push({
          ...slide,
          role: slideRole.role,
          image_url: null,
          image_error: (imgErr as Error).message,
        });
      }
    }

    // Log agent usage
    const serviceClient = createClient(supabaseUrl, supabaseKey);
    if (company_id) {
      await serviceClient.from('agent_usage_log').insert({
        company_id,
        user_id: user.id,
        status: 'completed',
        credits_consumed: 3,
        input_data: { app_name, category, aspect_ratio },
        output_summary: `Generated ${slideResults.filter(s => s.image_url).length}/6 slides for "${app_name}"`,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      slides: slideResults,
      metadata: {
        app_name,
        category,
        aspect_ratio,
        total_slides: slideResults.length,
        successful_images: slideResults.filter(s => s.image_url && !s.image_error).length,
        formula: '6-Slide Larry Methodology',
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Slideshow generator error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
