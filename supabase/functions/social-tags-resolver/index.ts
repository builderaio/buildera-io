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

    console.log('🏷️ Fetching social tags/categories from Instagram Statistics API...');

    const apiUrl = 'https://instagram-statistics-api.p.rapidapi.com/tags';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Tags API error: ${response.status} ${errText.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ error: `Tags API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tagsData = await response.json();

    // Parse tags into categories for easier frontend consumption
    const categories: Record<string, any[]> = {};
    const allTags = tagsData.data || tagsData || [];

    if (Array.isArray(allTags)) {
      for (const tag of allTags) {
        const type = tag.type || 'other';
        if (!categories[type]) categories[type] = [];
        categories[type].push({
          id: tag.id || tag._id,
          name: tag.name,
          type: tag.type,
          parentId: tag.parentId || null,
        });
      }
    }

    console.log(`✅ Tags resolved: ${Object.keys(categories).length} categories, ${Array.isArray(allTags) ? allTags.length : 0} total tags`);

    return new Response(
      JSON.stringify({
        success: true,
        tags: allTags,
        categories,
        total: Array.isArray(allTags) ? allTags.length : 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in social-tags-resolver:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
