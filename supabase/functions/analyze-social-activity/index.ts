import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

// CORS headers
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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!rapidApiKey) {
      console.error('RAPIDAPI_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'RapidAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with the request's Authorization header
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Authenticate user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting social activity analysis for user: ${user.id}`);

    // Fetch social analysis data (containing CIDs) for the user
    const { data: socialAnalysisData, error: fetchError } = await supabaseClient
      .from('social_analysis')
      .select('cid, social_type')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching social analysis data:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch social analysis data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!socialAnalysisData || socialAnalysisData.length === 0) {
      console.log('No social analysis data found for user');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No social accounts found for analysis',
          results: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${socialAnalysisData.length} social accounts to analyze`);

    const results = [];

    // Process each social analysis record
    for (const analysisData of socialAnalysisData) {
      const { cid, social_type } = analysisData;
      
      console.log(`Analyzing activity for CID: ${cid}, Platform: ${social_type}`);

      try {
        // Call Instagram Statistics API for activity data
        const apiUrl = `https://instagram-statistics-api.p.rapidapi.com/statistics/activity?cid=${encodeURIComponent(cid)}`;
        
        const apiResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey,
          },
        });

        if (!apiResponse.ok) {
          console.error(`API request failed for CID ${cid}:`, apiResponse.status, apiResponse.statusText);
          continue;
        }

        const apiData = await apiResponse.json();
        console.log(`Successfully retrieved activity data for CID: ${cid}`);

        // Process the activity data
        const activityData = apiData.data || [];
        
        // Calculate peak activity hours and summary metrics
        let peakHour = '';
        let peakDayOfWeek = '';
        let maxInteractions = 0;
        let totalInteractions = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalViews = 0;
        let totalRePosts = 0;

        const hourlyStats = {};
        const dailyStats = {};

        activityData.forEach((timePoint: any) => {
          const [dayOfWeek, hour] = timePoint.time.split('_');
          const interactions = timePoint.interactions || 0;
          const likes = timePoint.likes || 0;
          const comments = timePoint.comments || 0;
          const views = timePoint.views || 0;
          const rePosts = timePoint.rePosts || 0;

          // Track totals
          totalInteractions += interactions;
          totalLikes += likes;
          totalComments += comments;
          totalViews += views;
          totalRePosts += rePosts;

          // Find peak activity
          if (interactions > maxInteractions) {
            maxInteractions = interactions;
            peakHour = hour;
            peakDayOfWeek = dayOfWeek;
          }

          // Aggregate by hour
          if (!hourlyStats[hour]) {
            hourlyStats[hour] = { interactions: 0, likes: 0, comments: 0, count: 0 };
          }
          hourlyStats[hour].interactions += interactions;
          hourlyStats[hour].likes += likes;
          hourlyStats[hour].comments += comments;
          hourlyStats[hour].count += 1;

          // Aggregate by day of week
          if (!dailyStats[dayOfWeek]) {
            dailyStats[dayOfWeek] = { interactions: 0, likes: 0, comments: 0, count: 0 };
          }
          dailyStats[dayOfWeek].interactions += interactions;
          dailyStats[dayOfWeek].likes += likes;
          dailyStats[dayOfWeek].comments += comments;
          dailyStats[dayOfWeek].count += 1;
        });

        // Calculate averages
        const avgInteractionsPerHour = activityData.length > 0 ? totalInteractions / activityData.length : 0;
        const avgLikesPerHour = activityData.length > 0 ? totalLikes / activityData.length : 0;
        const avgCommentsPerHour = activityData.length > 0 ? totalComments / activityData.length : 0;

        // Prepare analysis data to store
        const analysisResults = {
          user_id: user.id,
          platform: social_type,
          cid: cid,
          peak_hour: parseInt(peakHour) || 0,
          peak_day_of_week: parseInt(peakDayOfWeek) || 1,
          peak_interactions: maxInteractions,
          total_interactions: totalInteractions,
          total_likes: totalLikes,
          total_comments: totalComments,
          total_views: totalViews,
          total_reposts: totalRePosts,
          avg_interactions_per_hour: avgInteractionsPerHour,
          avg_likes_per_hour: avgLikesPerHour,
          avg_comments_per_hour: avgCommentsPerHour,
          hourly_breakdown: hourlyStats,
          daily_breakdown: dailyStats,
          raw_activity_data: activityData,
          raw_api_response: apiData,
          analysis_date: new Date().toISOString(),
        };

        // Upsert analysis data into database to avoid duplicates
        const { error: insertError } = await supabaseClient
          .from('social_activity_analysis')
          .upsert(analysisResults, { onConflict: 'user_id,platform,cid' });

        if (insertError) {
          console.error(`Error inserting activity analysis for CID ${cid}:`, insertError);
        } else {
          console.log(`Successfully stored activity analysis for CID: ${cid}`);
          results.push({
            cid,
            platform: social_type,
            peak_hour: peakHour,
            peak_day_of_week: peakDayOfWeek,
            total_interactions: totalInteractions,
            status: 'success'
          });
        }

      } catch (error) {
        console.error(`Error processing CID ${cid}:`, error);
        results.push({
          cid,
          platform: social_type,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`Social activity analysis completed. Processed ${results.length} accounts.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Social activity analysis completed successfully',
        results: results,
        total_processed: results.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Social activity analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});