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

    console.log('📊 Analyzing retrospective statistics for user:', user.id);

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

    // Calculate date range for analysis (last 90 days to get good retrospective data)
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
    console.log(`📅 Analyzing retrospective data from ${fromFormatted} to ${toFormatted} (last 90 days)`);

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({ error: 'RapidAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = [];

    // Analyze retrospective statistics for each social network
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

        // Skip LinkedIn - the retrospective API only supports Instagram and TikTok
        if (analysis.social_type === 'LI' || cid.toString().startsWith('108477120')) {
          console.log(`⚠️ LinkedIn CID ${cid} skipped - retrospective API only supports Instagram/TikTok`);
          continue;
        }

        console.log(`📈 Analyzing retrospective statistics for CID: ${cid}`);

        // Call RapidAPI Instagram Statistics API - Retrospective endpoint
        const apiUrl = `https://instagram-statistics-api.p.rapidapi.com/statistics/retrospective?cid=${encodeURIComponent(cid)}&from=${fromFormatted}&to=${toFormatted}`;
        
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

        const retrospectiveData = await apiResponse.json();

        if (!retrospectiveData.data) {
          console.log(`No retrospective data found for CID ${cid}`);
          continue;
        }

        console.log(`✅ Retrieved retrospective data for CID ${cid}`);

        // Calculate key metrics from the data
        const currentSummary = retrospectiveData.data.summary?.current || {};
        const prevSummary = retrospectiveData.data.summary?.prev || {};
        const deltaSummary = retrospectiveData.data.summary?.delta || {};

        // Store retrospective analysis results
        const retrospectiveAnalysisData = {
          user_id: user.id,
          platform: analysis.social_type || 'instagram',
          cid: cid,
          analysis_period_start: fromDate.toISOString(),
          analysis_period_end: toDate.toISOString(),
          current_followers: currentSummary.usersCount || 0,
          followers_growth: deltaSummary.deltaUsersCount || 0,
          total_posts: currentSummary.deltaPosts || 0,
          total_interactions: currentSummary.deltaInteractions || 0,
          total_likes: currentSummary.deltaLikes || 0,
          total_comments: currentSummary.deltaComments || 0,
          average_er: currentSummary.avgER || 0,
          quality_score: currentSummary.qualityScore || 0,
          avg_posts_per_week: currentSummary.avgPostsPerWeek || 0,
          series_data: retrospectiveData.data.series,
          summary_data: retrospectiveData.data.summary,
          raw_api_response: retrospectiveData,
          created_at: new Date().toISOString(),
        };

        // Upsert into social_retrospective_analysis table to avoid duplicates
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('social_retrospective_analysis')
          .upsert(retrospectiveAnalysisData, { onConflict: 'user_id,platform,cid' })
          .select()
          .single();

        if (insertError) {
          console.error('Error storing retrospective analysis:', insertError);
          continue;
        }

        results.push({
          platform: analysis.social_type || 'instagram',
          cid: cid,
          analysis_id: insertedData.id,
          current_followers: currentSummary.usersCount || 0,
          followers_growth: deltaSummary.deltaUsersCount || 0,
          total_posts: currentSummary.deltaPosts || 0,
          total_interactions: currentSummary.deltaInteractions || 0,
          average_er: currentSummary.avgER || 0,
          quality_score: currentSummary.qualityScore || 0,
        });

      } catch (error) {
        console.error(`Error analyzing retrospective data for analysis ${analysis.id}:`, error);
        continue;
      }
    }

    console.log(`🎉 Retrospective analysis completed. Analyzed ${results.length} social networks.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Retrospective analysis completed for ${results.length} social networks`,
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
    console.error('Error in analyze-social-retrospective function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})