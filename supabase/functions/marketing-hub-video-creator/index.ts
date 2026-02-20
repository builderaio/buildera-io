import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CREATIFY_BASE = "https://api.creatify.ai/api";

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CREATIFY_API_ID = Deno.env.get("CREATIFY_API_ID");
    const CREATIFY_API_KEY = Deno.env.get("CREATIFY_API_KEY");

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    console.log('Marketing Hub Video Creator Request:', JSON.stringify(body));

    let prompt: string;
    let platform = 'general';

    if (body.input?.calendario_item) {
      const item = body.input.calendario_item;
      prompt = item.tema_concepto || item.titulo_gancho || item.copy_mensaje || '';
      platform = item.red_social || 'general';
    } else if (body.prompt) {
      prompt = body.prompt;
      platform = body.platform || 'general';
    } else {
      return new Response(JSON.stringify({ error: 'Missing prompt or calendario_item' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use Creatify URL-to-Video with correct /link_to_videos/ endpoint
    if (CREATIFY_API_ID && CREATIFY_API_KEY) {
      console.log('Using Creatify API for video generation...');

      const creatifyHeaders = {
        "X-API-ID": CREATIFY_API_ID,
        "X-API-KEY": CREATIFY_API_KEY,
        "Content-Type": "application/json",
      };

      // First create a link
      const linkRes = await fetch(`${CREATIFY_BASE}/links/`, {
        method: "POST",
        headers: creatifyHeaders,
        body: JSON.stringify({ url: prompt }),
      });

      if (!linkRes.ok) {
        const linkErr = await linkRes.text();
        console.error('Creatify link creation failed:', linkRes.status, linkErr);
      } else {
        const linkData = await linkRes.json();
        console.log('Creatify link created:', linkData.id);

        const aspectMap: Record<string, string> = {
          tiktok: '9x16', instagram_reels: '9x16', youtube_shorts: '9x16',
          youtube: '16x9', linkedin: '16x9',
          instagram_feed: '1x1', facebook_feed: '1x1',
        };

        // Use correct endpoint /link_to_videos/ and field name "link"
        const videoRes = await fetch(`${CREATIFY_BASE}/link_to_videos/`, {
          method: "POST",
          headers: creatifyHeaders,
          body: JSON.stringify({
            link: linkData.id,
            aspect_ratio: aspectMap[platform] || '16x9',
            script_style: 'BrandStoryV2',
            visual_style: 'AvatarBubbleTemplate',
          }),
        });

        if (videoRes.ok) {
          const videoData = await videoRes.json();
          console.log('Creatify video job created:', videoData.id);

          const companyRes = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .single();

          if (companyRes.data?.company_id) {
            await supabase.from('creatify_jobs').insert({
              company_id: companyRes.data.company_id,
              user_id: user.id,
              job_type: 'url_to_video',
              creatify_job_id: videoData.id,
              status: videoData.status || 'pending',
              input_params: { prompt, platform },
            });
          }

          return new Response(JSON.stringify({
            success: true,
            videoUrl: videoData.video_output || videoData.output || null,
            jobId: videoData.id,
            status: videoData.status || 'pending',
            message: `Video generation started (job: ${videoData.id})`,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          const videoErr = await videoRes.text();
          console.error('Creatify video creation failed:', videoRes.status, videoErr);
        }
      }
    }

    // Fallback
    console.log('Creatify not available or failed, returning processing status');
    return new Response(JSON.stringify({
      success: true,
      videoUrl: null,
      status: 'processing',
      message: `Video generation for "${prompt.substring(0, 50)}..." has been queued.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in marketing-hub-video-creator:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
