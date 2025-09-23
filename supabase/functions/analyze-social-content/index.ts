import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Analyzing social content for user:', user.id);

    // Get social analysis data for the user (contains CIDs)
    const { data: socialAnalyses, error: analysisError } = await supabaseClient
      .from('social_analysis')
      .select('*')
      .eq('user_id', user.id)

    if (analysisError) {
      console.error('Error fetching social analyses:', analysisError);
      return new Response(
        JSON.stringify({ error: 'Error fetching social analyses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!socialAnalyses || socialAnalyses.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No social networks analyzed. Please analyze your social media audience first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate date range (last 90 days)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const fromFormatted = formatDate(fromDate);
    const toFormatted = formatDate(toDate);

    console.log(`📅 Current date: ${toFormatted}`);
    console.log(`📅 Analyzing content from ${fromFormatted} to ${toFormatted} (last 90 days)`);

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({ error: 'RapidAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = [];

    // Analyze content for each social network
    for (const analysis of socialAnalyses) {
      try {
        // Extract CID from social_analysis data
        let cid = null;
        
        // Check if cid is directly stored
        if (analysis.cid) {
          cid = analysis.cid;
        } else if (analysis.raw_data && analysis.raw_data.cid) {
          cid = analysis.raw_data.cid;
        } else if (analysis.platform_data && analysis.platform_data.cid) {
          cid = analysis.platform_data.cid;
        }

        if (!cid) {
          console.log(`⚠️ No CID found for analysis ${analysis.id}, skipping...`);
          continue;
        }

        console.log(`📊 Analyzing content for CID: ${cid}`);

        // Call RapidAPI Instagram Statistics API
        const apiUrl = `https://instagram-statistics-api.p.rapidapi.com/posts?cid=${encodeURIComponent(cid)}&from=${fromFormatted}&to=${toFormatted}&type=posts&sort=date`;
        
        let apiResponse;
        let retryCount = 0;
        const maxRetries = 3;
        const baseDelay = 2000; // 2 seconds

        // Implement exponential backoff for rate limiting
        while (retryCount <= maxRetries) {
          apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
              'x-rapidapi-key': rapidApiKey,
            },
          });

          if (apiResponse.ok) {
            break; // Success
          }

          if (apiResponse.status === 429 && retryCount < maxRetries) {
            // Rate limited - wait and retry
            const delay = baseDelay * Math.pow(2, retryCount);
            console.log(`Rate limited for CID ${cid}. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            continue;
          }

          // Other error or max retries reached
          console.error(`API error for CID ${cid}:`, apiResponse.status, apiResponse.statusText);
          if (apiResponse.status === 429) {
            console.error(`Rate limit exceeded for CID ${cid} after ${maxRetries + 1} attempts`);
          }
          break;
        }

        if (!apiResponse?.ok) {
          // Store partial analysis with error info for better user feedback
          const errorAnalysisData = {
            user_id: user.id,
            platform: analysis.social_type || 'instagram',
            cid: cid,
            analysis_period_start: fromDate.toISOString(),
            analysis_period_end: toDate.toISOString(),
            posts_analyzed: 0,
            posts_data: [],
            summary_data: null,
            error_details: {
              status: apiResponse?.status,
              statusText: apiResponse?.statusText,
              message: apiResponse?.status === 429 ? 'Rate limit exceeded - try again later' : 'API error'
            },
            raw_api_response: null,
            created_at: new Date().toISOString(),
          };

          await supabaseClient
            .from('social_content_analysis')
            .upsert(errorAnalysisData, { onConflict: 'user_id,platform,cid' });

          continue;
        }

        const contentData = await apiResponse.json();

        if (!contentData.data || !contentData.data.posts) {
          console.log(`No posts found for CID ${cid} — storing empty analysis`);
          contentData.data = contentData.data || {};
          contentData.data.posts = [];
          contentData.data.summary = contentData.data.summary || null;
        }

        console.log(`✅ Found ${contentData.data.posts.length} posts for CID ${cid}`);

        // Store content analysis results
        const contentAnalysisData = {
          user_id: user.id,
          platform: analysis.social_type || 'instagram',
          cid: cid,
          analysis_period_start: fromDate.toISOString(),
          analysis_period_end: toDate.toISOString(),
          posts_analyzed: contentData.data.posts.length,
          posts_data: contentData.data.posts,
          summary_data: contentData.data.summary,
          raw_api_response: contentData,
          created_at: new Date().toISOString(),
        };

        // Upsert into social_content_analysis table to avoid duplicates
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('social_content_analysis')
          .upsert(contentAnalysisData, { onConflict: 'user_id,platform,cid' })
          .select()
          .single();

        if (insertError) {
          console.error('Error storing content analysis:', insertError);
          continue;
        }

        results.push({
          platform: analysis.social_type || 'instagram',
          cid: cid,
          posts_count: contentData.data.posts.length,
          analysis_id: insertedData.id,
          summary: contentData.data.summary,
        });

      } catch (error) {
        console.error(`Error analyzing content for analysis ${analysis.id}:`, error);
        continue;
      }
    }

    console.log(`🎉 Content analysis completed. Analyzed ${results.length} social networks.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Content analysis completed for ${results.length} social networks`,
        results: results,
        period: {
          from: fromFormatted,
          to: toFormatted,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in analyze-social-content function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})