import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Extracting company info from URL:', url);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute synchronously now
    const result = await extractCompanyData(url, user.id, token);
    
    return new Response(
      JSON.stringify(result ?? { success: false, message: 'No data generated' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in company-info-extractor:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractCompanyData(url: string, userId: string, token: string) {
  console.log('🔄 Starting extraction for URL:', url);
  try {
    // Normalize URL (ensure scheme) and get domain for matching
    const normalizedUrl = /^(https?:)\/\//i.test(url) ? url : `https://${url}`;
    const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
/*
    // Idempotency: avoid duplicate work if already processed recently
    const { data: existingProcessed, error: processedErr } = await supabase
      .from('companies')
      .select('id, webhook_processed_at, webhook_data')
      .eq('created_by', userId)
      .ilike('website_url', `%${domain}%`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (processedErr) {
      console.warn('⚠️ Error checking existing processed company:', processedErr);
    }

    if (existingProcessed?.webhook_processed_at) {
      console.log('🟢 Company already processed recently, returning existing data for:', url);
      return {
        success: true,
        companyId: existingProcessed.id,
        data: existingProcessed.webhook_data?.raw_api_response,
        message: 'Datos de empresa ya procesados'
      };
    }
*/
    // Call external API to extract company info
    console.log('📡 Calling N8N API for company data extraction...');
    console.log('⛔ Modo sin reintentos: una sola llamada al webhook.');
    let apiData = null;
    let apiError = null;
    
    try {
      const apiUrl = `https://buildera.app.n8n.cloud/webhook/company-info-extractor?URL=${encodeURIComponent(normalizedUrl)}`;
      console.log('🔗 API URL:', apiUrl);
      
      // Get authentication credentials from environment
      const authUser = Deno.env.get('N8N_AUTH_USER');
      const authPass = Deno.env.get('N8N_AUTH_PASS');
      
      if (!authUser || !authPass) {
        console.error('❌ N8N authentication credentials not found');
        throw new Error('N8N authentication credentials not configured');
      }
      
      // Create basic auth header
      const credentials = btoa(`${authUser}:${authPass}`);

      // Single attempt (no retries). User can retry from UI if needed
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 250000); // 110s timeout
      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }).catch((err) => {
        throw new Error(`Network error calling N8N: ${(err as Error).message}`);
      });
      clearTimeout(timeout);

      const contentType = apiResponse.headers.get('content-type') || '';
      console.log(`📊 API Response status: ${apiResponse.status} ${apiResponse.statusText}, content-type: ${contentType}`);

      if (!apiResponse.ok) {
        const errText = await apiResponse.text().catch(() => '');
        throw new Error(`API ${apiResponse.status} ${apiResponse.statusText}: ${errText.slice(0,300)}`);
      }

      let apiResult: any = null;
      const rawBody = await apiResponse.text().catch(() => '');
      const bodySample = rawBody.slice(0, 2000);
      console.log('🧪 N8N raw body sample (truncated 2KB):', bodySample);

      const safeParse = (txt: string) => {
        try { return JSON.parse(txt); } catch { return null; }
      };
      
      // Helper function to clean streaming JSON data
      const cleanStreamingJson = (text: string): string => {
        // Remove streaming metadata lines that start with {"type":"begin",...} or {"type":"item",...}
        const lines = text.split('\n').filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          try {
            const parsed = JSON.parse(trimmed);
            // Skip N8N streaming metadata
            if (parsed.type === 'begin' || parsed.type === 'item' || parsed.type === 'end') {
              return false;
            }
            return true;
          } catch {
            // If it's not valid JSON, include it (might be part of larger structure)
            return true;
          }
        });
        return lines.join('\n');
      };

      // Clean the response first
      const cleanedBody = cleanStreamingJson(rawBody);
      console.log('🧹 Cleaned body sample:', cleanedBody.slice(0, 1000));

      // 1) Try full parse of cleaned body
      apiResult = safeParse(cleanedBody);

      // 2) If that fails, try original parsing methods
      if (!apiResult) {
        console.log('🔄 Cleaned parse failed, trying original methods...');
        apiResult = safeParse(rawBody);
      }

      // 3) Try extract array [] from cleaned body
      if (!apiResult) {
        const extractBalanced = (text: string, startIndex: number, openChar: string, closeChar: string) => {
          let depth = 0;
          let start = -1;
          for (let i = startIndex; i < text.length; i++) {
            const ch = text[i];
            if (ch === openChar) { if (start === -1) start = i; depth++; }
            else if (ch === closeChar) { depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
          }
          return null;
        };

        const firstArr = cleanedBody.indexOf('[');
        if (firstArr !== -1) {
          const arrStr = extractBalanced(cleanedBody, firstArr, '[', ']');
          apiResult = arrStr ? safeParse(arrStr) : null;
          if (apiResult) console.log('🧩 Parsed via balanced array extraction from cleaned body');
        }
      }

      // 4) Try extract object after "data": {...}
      if (!apiResult) {
        const dataIdx = cleanedBody.indexOf('"data"');
        if (dataIdx !== -1) {
          const braceIdx = cleanedBody.indexOf('{', dataIdx);
          if (braceIdx !== -1) {
            const extractBalanced = (text: string, startIndex: number, openChar: string, closeChar: string) => {
              let depth = 0;
              let start = -1;
              for (let i = startIndex; i < text.length; i++) {
                const ch = text[i];
                if (ch === openChar) { if (start === -1) start = i; depth++; }
                else if (ch === closeChar) { depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
              }
              return null;
            };
            const objStr = extractBalanced(cleanedBody, braceIdx, '{', '}');
            const obj = objStr ? safeParse(objStr) : null;
            if (obj) {
              apiResult = [{ data: obj }];
              console.log('🧩 Parsed via data-object extraction from cleaned body');
            }
          }
        }
      }

      console.log('🧩 Parsed shape:', Array.isArray(apiResult) ? `array(len=${apiResult.length})` : typeof apiResult, Array.isArray(apiResult) ? undefined : (apiResult && typeof apiResult === 'object' ? Object.keys(apiResult).slice(0,10) : undefined));

      // Normalize the specific N8N response structure: [{ url, fetch_date, data: {...} }]
      let extracted: any = null;
      if (Array.isArray(apiResult) && apiResult.length > 0) {
        const firstItem = apiResult[0];
        console.log('🔎 First array item keys:', firstItem && typeof firstItem === 'object' ? Object.keys(firstItem) : typeof firstItem);
        
        // N8N specific structure: item has { url, fetch_date, data }
        if (firstItem && typeof firstItem === 'object' && firstItem.data) {
          extracted = firstItem.data;
          console.log('✅ Extracted company data from array[0].data');
          console.log('📊 Company data keys found:', Object.keys(extracted));
        }
        // Fallback: try other common structures
        else if (firstItem?.output?.data) {
          extracted = firstItem.output.data;
          console.log('✅ Extracted from array[0].output.data');
        }
        else if (firstItem?.output) {
          extracted = firstItem.output;
          console.log('✅ Extracted from array[0].output');
        }
        else if (firstItem && typeof firstItem === 'object' && (firstItem.company_name || firstItem.business_description)) {
          // Direct company data in first item
          extracted = firstItem;
          console.log('✅ Using array[0] directly as company data');
        }
        else {
          extracted = firstItem;
          console.log('⚠️ Using array[0] as fallback (keys:', Object.keys(firstItem || {}), ')');
        }
      } else if (apiResult && typeof apiResult === 'object') {
        // Single object response
        const asAny = apiResult as any;
        extracted = asAny.data ?? (asAny.output?.data ?? asAny.output) ?? apiResult;
        console.log('✅ Extracted from single object response');
      }

      if (!extracted || (typeof extracted === 'string' && extracted.trim().length === 0)) {
        console.warn('⚠️ N8N response had no structured data, falling back to URL-derived basics.');
        extracted = null;
      }
      
      apiData = extracted || null;
      console.log('🎯 Final extracted data keys:', apiData && typeof apiData === 'object' ? Object.keys(apiData) : typeof apiData);

      // Validate minimal content only if we actually got structured data
      if (apiData && !apiData.company_name && !apiData.legal_name && !apiData.business_description) {
        console.warn('⚠️ N8N returned insufficient fields, will use fallbacks and partial enrichment.');
        // keep apiData but allow fallbacks below
      }
    } catch (error) {
      console.error('💥 Error calling external API:', error);
      throw error;
    }

    // Extract basic info from URL as fallback (reuse computed domain)
    const fallbackName = domain.split('.')[0];

    // Helper function to extract country from address
    function extractCountryFromAddress(address: string): string | null {
      if (!address) return null;
      const parts = address.split(',');
      return parts[parts.length - 1]?.trim() || null;
    }

    // Use API data if available, otherwise use fallback
    const companyData = {
      name: apiData?.company_name || apiData?.legal_name || fallbackName,
      description: apiData?.business_description || `Empresa líder en el sector de ${fallbackName}`,
      website_url: apiData?.website || normalizedUrl,
      industry_sector: Array.isArray(apiData?.industries) && apiData.industries.length > 0 
        ? apiData.industries.join(', ') 
        : 'General',
      company_size: apiData?.num_employees && apiData.num_employees !== null ? 
        (typeof apiData.num_employees === 'string' ? 
          (parseInt(apiData.num_employees.replace(/[^0-9]/g, '')) > 250 ? 'large' : 
           parseInt(apiData.num_employees.replace(/[^0-9]/g, '')) > 50 ? 'medium' : 'small') :
          (apiData.num_employees > 250 ? 'large' : 
           apiData.num_employees > 50 ? 'medium' : 'small')
        ) : null,
      country: apiData?.address ? extractCountryFromAddress(apiData.address) : null,
      logo_url: apiData?.logo_url || null,
      linkedin_url: apiData?.social_links?.linkedin || null,
      facebook_url: apiData?.social_links?.facebook || null,
      twitter_url: apiData?.social_links?.twitter || null,
      instagram_url: apiData?.social_links?.instagram || null,
      youtube_url: apiData?.social_links?.youtube || null,
      tiktok_url: apiData?.social_links?.tiktok || null,
      webhook_data: apiData ? {
        raw_api_response: apiData,
        processed_at: new Date().toISOString(),
        tax_id: apiData.tax_id || null,
        phone: apiData.phone || null,
        email: apiData.email || null,
        founded_date: apiData.founded_date || null,
        annual_revenue: apiData.annual_revenue || null,
        revenue_currency: apiData.revenue_currency || null,
        value_proposition: apiData.value_proposition || null,
        address: apiData.address || null,
        products_services: apiData.products_services || null,
        key_people: apiData.key_people || null,
        corporate_values: apiData.corporate_values || null,
        legal_name: apiData.legal_name || null
      } : null,
      webhook_processed_at: apiData ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    console.log('📋 Mapped company data:', {
      name: companyData.name,
      description: companyData.description?.substring(0, 100) + '...',
      website_url: companyData.website_url,
      industry_sector: companyData.industry_sector,
      logo_url: companyData.logo_url,
      hasWebhookData: !!companyData.webhook_data
    });

    // Check for existing company (match by domain to avoid scheme/WWW mismatches)
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('created_by', userId)
      .ilike('website_url', `%${domain}%`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let companyId;
    
    if (existingCompany) {
      companyId = existingCompany.id;
      console.log('✅ Updating existing company:', companyId);
      
      // Only update non-null fields to preserve existing data
      const updateFields = Object.fromEntries(
        Object.entries(companyData).filter(([key, value]) => {
          // Always update these fields
          if (['updated_at', 'webhook_processed_at', 'webhook_data'].includes(key)) {
            return true;
          }
          // Only update other fields if they have meaningful values
          return value !== null && value !== undefined && value !== '';
        })
      );
      
      console.log('📝 Updating company with fields:', Object.keys(updateFields));
      
      // Update existing company with new data
      const { error: updateError } = await supabase
        .from('companies')
        .update(updateFields)
        .eq('id', companyId);

      if (updateError) {
        console.error('❌ Error updating company:', updateError);
        throw updateError;
      }

      console.log('✅ Company updated successfully with API data');
    } else {
      console.log('🆕 Creating new company with data:', {
        name: companyData.name,
        industry_sector: companyData.industry_sector,
        hasWebhookData: !!companyData.webhook_data
      });
      
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          created_by: userId
        })
        .select('id')
        .single();

      if (companyError) {
        console.error('❌ Error creating company:', companyError);
        throw companyError;
      }

      companyId = newCompany.id;
      console.log('✅ Created new company:', companyId);
    }

    console.log('🎉 Extraction completed successfully for:', url);
    
    return {
      success: true,
      companyId,
      data: apiData,
      message: 'Información de empresa procesada exitosamente'
    };

  } catch (error) {
    console.error('💥 Error in extraction:', error);
    throw error;
  }
}