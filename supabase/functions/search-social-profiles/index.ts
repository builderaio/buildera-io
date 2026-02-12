import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      return new Response(JSON.stringify({ error: 'RapidAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const {
      q,
      page = 1,
      perPage = 20,
      sort = '-score',
      socialTypes,
      tags,
      locations,
      genders,
      minAge,
      maxAge,
      minUsersCount,
      maxUsersCount,
      minER,
      maxER,
      minViews,
      maxViews,
      audienceLocations,
      minAudienceLocationsPercent,
      audienceGenders,
      minAudienceGendersPercent,
      minAudienceAge,
      maxAudienceAge,
      minAudienceAgePercent,
      minLikes,
      maxLikes,
      minComments,
      maxComments,
      maxFakeFollowers,
      minQualityScore,
      minInteractions,
      maxInteractions,
      isVerified,
      isContactEmail,
      isActive,
      trackTotal,
    } = body;

    // Build query parameters
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('perPage', String(Math.min(perPage, 20)));
    params.set('sort', sort);

    if (q) params.set('q', q);
    if (socialTypes) params.set('socialTypes', socialTypes);
    if (tags) params.set('tags', tags);
    if (locations) params.set('locations', locations);
    if (genders) params.set('genders', genders);
    if (minAge != null) params.set('minAge', String(minAge));
    if (maxAge != null) params.set('maxAge', String(maxAge));
    if (minUsersCount != null) params.set('minUsersCount', String(minUsersCount));
    if (maxUsersCount != null) params.set('maxUsersCount', String(maxUsersCount));
    if (minER != null) params.set('minER', String(minER));
    if (maxER != null) params.set('maxER', String(maxER));
    if (minViews != null) params.set('minViews', String(minViews));
    if (maxViews != null) params.set('maxViews', String(maxViews));
    if (audienceLocations) params.set('audienceLocations', audienceLocations);
    if (minAudienceLocationsPercent != null) params.set('minAudienceLocationsPercent', String(minAudienceLocationsPercent));
    if (audienceGenders) params.set('audienceGenders', audienceGenders);
    if (minAudienceGendersPercent != null) params.set('minAudienceGendersPercent', String(minAudienceGendersPercent));
    if (minAudienceAge != null) params.set('minAudienceAge', String(minAudienceAge));
    if (maxAudienceAge != null) params.set('maxAudienceAge', String(maxAudienceAge));
    if (minAudienceAgePercent != null) params.set('minAudienceAgePercent', String(minAudienceAgePercent));
    if (minLikes != null) params.set('minLikes', String(minLikes));
    if (maxLikes != null) params.set('maxLikes', String(maxLikes));
    if (minComments != null) params.set('minComments', String(minComments));
    if (maxComments != null) params.set('maxComments', String(maxComments));
    if (maxFakeFollowers != null) params.set('maxFakeFollowers', String(maxFakeFollowers));
    if (minQualityScore != null) params.set('minQualityScore', String(minQualityScore));
    if (minInteractions != null) params.set('minInteractions', String(minInteractions));
    if (maxInteractions != null) params.set('maxInteractions', String(maxInteractions));
    if (isVerified != null) params.set('isVerified', String(isVerified));
    if (isContactEmail != null) params.set('isContactEmail', String(isContactEmail));
    if (isActive != null) params.set('isActive', String(isActive));
    if (trackTotal != null) params.set('trackTotal', String(trackTotal));

    console.log(`🔍 Searching social profiles: q="${q}", socialTypes=${socialTypes}, page=${page}`);

    const apiUrl = `https://instagram-statistics-api.p.rapidapi.com/search?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Search API error: ${response.status} ${errText.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ error: `Search API error: ${response.status}`, details: errText.slice(0, 300) }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await response.json();
    console.log(`✅ Search returned ${searchData.data?.length || 0} results, total: ${searchData.pagination?.total || 'unknown'}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: searchData.data || [],
        pagination: searchData.pagination || {},
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-social-profiles:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
