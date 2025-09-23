import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { asset_url, user_id, company_id, content_type, post_data } = await req.json();

    if (!asset_url || !user_id) {
      throw new Error('asset_url and user_id are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('📥 Downloading asset:', asset_url);

    // Download the asset
    const response = await fetch(asset_url);
    if (!response.ok) {
      throw new Error(`Failed to download asset: ${response.status}`);
    }

    const fileBuffer = await response.arrayBuffer();
    const contentTypeHeader = response.headers.get('content-type') || content_type || 'image/jpeg';
    
    // Determine file extension
    let extension = 'jpg';
    if (contentTypeHeader.includes('video')) {
      extension = 'mp4';
    } else if (contentTypeHeader.includes('png')) {
      extension = 'png';
    } else if (contentTypeHeader.includes('gif')) {
      extension = 'gif';
    } else if (contentTypeHeader.includes('webp')) {
      extension = 'webp';
    }

    // Generate unique filename
    const timestamp = new Date().getTime();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `${user_id}/${timestamp}_${randomId}.${extension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-library')
      .upload(filename, fileBuffer, {
        contentType: contentTypeHeader,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    console.log('✅ Asset uploaded to storage:', uploadData.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('content-library')
      .getPublicUrl(uploadData.path);

    // Save to content library
    const { data: libraryData, error: libraryError } = await supabase
      .from('content_library')
      .insert({
        user_id,
        company_id,
        file_path: uploadData.path,
        file_url: urlData.publicUrl,
        original_url: asset_url,
        file_type: contentTypeHeader.startsWith('video') ? 'video' : 'image',
        file_size: fileBuffer.byteLength,
        metadata: {
          original_post: post_data || {},
          content_type: contentTypeHeader,
          downloaded_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (libraryError) {
      console.error('Library insert error:', libraryError);
      // Try to clean up uploaded file
      await supabase.storage
        .from('content-library')
        .remove([uploadData.path]);
      throw new Error(`Failed to save to library: ${libraryError.message}`);
    }

    console.log('✅ Asset saved to content library');

    return new Response(JSON.stringify({
      success: true,
      file_path: uploadData.path,
      file_url: urlData.publicUrl,
      library_id: libraryData.id,
      file_type: contentTypeHeader.startsWith('video') ? 'video' : 'image'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error downloading content asset:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to download and store content asset'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});