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
        
        const apiResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey,
          },
        });

        if (!apiResponse.ok) {
          console.error(`API error for CID ${cid}:`, apiResponse.status, apiResponse.statusText);
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

        // Insert into social_content_analysis table
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('social_content_analysis')
          .insert(contentAnalysisData)
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