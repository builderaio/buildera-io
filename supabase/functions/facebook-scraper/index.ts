import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FacebookPageDetails {
  name?: string;
  type?: string;
  page_id?: string;
  url?: string;
  image?: string;
  intro?: string;
  likes?: number;
  followers?: number;
  categories?: string[];
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  services?: string;
  price_range?: string;
  website?: string;
  cover_image?: string;
  verified?: boolean;
}

interface FacebookPageReview {
  author_name?: string;
  rating?: number;
  review_text?: string;
  date?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { action, page_url } = await req.json();

    console.log('🔍 Facebook Scraper called with:', { action, page_url });

    if (!page_url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'page_url is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const headers = {
      'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    };

    let result: any = {};

    if (action === 'get_page_details') {
      // 1. Obtener detalles de la página
      console.log('📋 Getting Facebook page details for:', page_url);
      
      const detailsUrl = `https://facebook-scraper3.p.rapidapi.com/page/details?url=${encodeURIComponent(page_url)}`;
      const detailsResponse = await fetch(detailsUrl, { headers });
      
      if (!detailsResponse.ok) {
        throw new Error(`Failed to fetch page details: ${detailsResponse.status}`);
      }
      
      const pageDetailsResponse = await detailsResponse.json();
      const pageDetails: FacebookPageDetails = pageDetailsResponse.results || pageDetailsResponse;
      console.log('✅ Page details retrieved:', pageDetails);

      // 2. Obtener ID de la página para reviews
      console.log('🆔 Getting Facebook page ID for:', page_url);
      
      const pageIdUrl = `https://facebook-scraper3.p.rapidapi.com/page/page_id?url=${encodeURIComponent(page_url)}`;
      const pageIdResponse = await fetch(pageIdUrl, { headers });
      
      let reviews: FacebookPageReview[] = [];
      
      if (pageIdResponse.ok) {
        const pageIdData = await pageIdResponse.json();
        const pageId = pageIdData.page_id;
        
        if (pageId) {
          console.log('📝 Getting Facebook page reviews for ID:', pageId);
          
          // 3. Obtener reviews de la página
          const reviewsUrl = `https://facebook-scraper3.p.rapidapi.com/page/reviews?page_id=${pageId}`;
          const reviewsResponse = await fetch(reviewsUrl, { headers });
          
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            reviews = reviewsData.reviews || [];
            console.log('✅ Reviews retrieved:', reviews.length);
          } else {
            console.log('⚠️ Failed to fetch reviews:', reviewsResponse.status);
          }
        }
      } else {
        console.log('⚠️ Failed to fetch page ID:', pageIdResponse.status);
      }

      result = {
        success: true,
        data: {
          page_details: pageDetails,
          reviews: reviews.slice(0, 10), // Limitar a 10 reviews
          total_reviews: reviews.length
        }
      };

      // Guardar en base de datos para cache
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('facebook_page_data').upsert({
          user_id: user.id,
          page_url: page_url,
          page_details: pageDetails,
          reviews: reviews.slice(0, 10),
          total_reviews: reviews.length,
          last_updated: new Date().toISOString()
        });
      }

    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid action. Use: get_page_details' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Facebook scraper completed successfully');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Error in Facebook scraper:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});