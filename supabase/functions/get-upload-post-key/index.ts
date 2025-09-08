import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const uploadPostApiKey = Deno.env.get('UPLOAD_POST_API_KEY');
    
    if (!uploadPostApiKey) {
      throw new Error('UPLOAD_POST_API_KEY no está configurada');
    }

    return new Response(JSON.stringify({ 
      success: true,
      api_key: uploadPostApiKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error en get-upload-post-key:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});