import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SOCIAL LISTENING ENGINE
 * 
 * Scans social platforms for brand mentions, competitor ads,
 * and keyword alerts. Persists all events to social_listening_events.
 * Triggers automation rules when relevant events are detected.
 * 
 * Actions:
 * - scan: Run a full scan for a company
 * - scan_all: Scan all active companies (cron-compatible)
 * - get_events: Retrieve persisted events
 * - update_config: Update listening configuration
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, company_id } = body;

    switch (action) {
      case 'scan':
        if (!company_id) return jsonResponse({ success: false, error: 'company_id required' }, 400);
        return await scanCompany(company_id);
      case 'scan_all':
        return await scanAllCompanies();
      case 'get_events':
        if (!company_id) return jsonResponse({ success: false, error: 'company_id required' }, 400);
        return await getEvents(company_id, body);
      case 'update_config':
        if (!company_id) return jsonResponse({ success: false, error: 'company_id required' }, 400);
        return await updateConfig(company_id, body.config);
      default:
        return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error('Social listening engine error:', error);
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
});

// ═══════════════════════════════════════
// SCAN A SINGLE COMPANY
// ═══════════════════════════════════════
async function scanCompany(companyId: string) {
  const startTime = Date.now();

  // Get config
  const { data: config } = await supabase
    .from('social_listening_config')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .single();

  if (!config) {
    return jsonResponse({ success: false, error: 'No active listening config for company' }, 404);
  }

  // Get company info for brand keywords
  const { data: company } = await supabase
    .from('companies')
    .select('name, instagram_url, facebook_url, linkedin_url, tiktok_url')
    .eq('id', companyId)
    .single();

  const keywords = [...(config.keywords || [])];
  if (company?.name) keywords.push(company.name.toLowerCase());

  // Get connected social accounts
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('platform, access_token, account_name')
    .eq('company_id', companyId)
    .eq('is_active', true);

  const scanResults = {
    mentions: 0,
    competitor_ads: 0,
    keyword_alerts: 0,
    events_created: 0,
    automations_triggered: 0,
  };

  // Scan each connected platform
  for (const account of (accounts || [])) {
    if (!config.platforms?.includes(account.platform)) continue;

    try {
      // Fetch mentions via platform-specific scrapers
      const mentionEvents = await fetchMentions(account, keywords, companyId);
      
      for (const event of mentionEvents) {
        // Deduplicate by source_url
        if (event.source_url) {
          const { data: existing } = await supabase
            .from('social_listening_events')
            .select('id')
            .eq('company_id', companyId)
            .eq('source_url', event.source_url)
            .limit(1);
          
          if (existing?.length) continue;
        }

        // Persist event
        const { data: inserted } = await supabase
          .from('social_listening_events')
          .insert({
            company_id: companyId,
            event_type: event.event_type,
            platform: account.platform,
            source_url: event.source_url,
            source_username: event.source_username,
            content_text: event.content_text,
            sentiment: event.sentiment,
            sentiment_score: event.sentiment_score,
            metadata: event.metadata || {},
            detected_at: event.detected_at || new Date().toISOString(),
          })
          .select()
          .single();

        if (inserted) {
          scanResults.events_created++;
          scanResults[event.event_type === 'mention' ? 'mentions' : 
                      event.event_type === 'competitor_ad' ? 'competitor_ads' : 'keyword_alerts']++;

          // Trigger automation rules for this event
          try {
            const autoResponse = await fetch(`${supabaseUrl}/functions/v1/social-automation-engine`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'evaluate_rules',
                company_id: companyId,
                event_data: {
                  platform: account.platform,
                  trigger_type: event.event_type === 'mention' ? 'mention' : 'keyword',
                  text: event.content_text,
                  username: event.source_username,
                  sentiment: event.sentiment,
                  post_id: event.metadata?.post_id,
                },
              }),
            });
            const autoResult = await autoResponse.json();
            scanResults.automations_triggered += (autoResult.results || []).filter((r: any) => r.status === 'executed').length;
          } catch (e) {
            console.error('Error triggering automation:', e);
          }
        }
      }

      // Fetch competitor ads if configured
      if (config.alert_on_competitor_ad && config.competitor_handles?.length > 0) {
        const adEvents = await fetchCompetitorAds(account, config.competitor_handles, companyId);
        for (const ad of adEvents) {
          if (ad.source_url) {
            const { data: existing } = await supabase
              .from('social_listening_events')
              .select('id')
              .eq('company_id', companyId)
              .eq('source_url', ad.source_url)
              .limit(1);
            if (existing?.length) continue;
          }

          await supabase.from('social_listening_events').insert({
            company_id: companyId,
            event_type: 'competitor_ad',
            platform: account.platform,
            source_url: ad.source_url,
            source_username: ad.source_username,
            content_text: ad.content_text,
            sentiment: 'neutral',
            metadata: ad.metadata || {},
            detected_at: new Date().toISOString(),
          });
          scanResults.competitor_ads++;
          scanResults.events_created++;
        }
      }

    } catch (err) {
      console.error(`Error scanning ${account.platform}:`, err);
    }
  }

  // Update last_scan_at
  await supabase
    .from('social_listening_config')
    .update({ last_scan_at: new Date().toISOString() })
    .eq('company_id', companyId);

  return jsonResponse({
    success: true,
    company_id: companyId,
    scan_results: scanResults,
    execution_time_ms: Date.now() - startTime,
  });
}

// ═══════════════════════════════════════
// SCAN ALL ACTIVE COMPANIES (cron)
// ═══════════════════════════════════════
async function scanAllCompanies() {
  const { data: configs } = await supabase
    .from('social_listening_config')
    .select('company_id, scan_frequency_minutes, last_scan_at')
    .eq('is_active', true);

  const results: any[] = [];

  for (const config of (configs || [])) {
    // Check if scan is due
    if (config.last_scan_at) {
      const nextScanAt = new Date(config.last_scan_at).getTime() + (config.scan_frequency_minutes || 60) * 60000;
      if (Date.now() < nextScanAt) {
        results.push({ company_id: config.company_id, status: 'skipped', reason: 'not_due' });
        continue;
      }
    }

    try {
      const response = await scanCompany(config.company_id);
      const result = await response.json();
      results.push({ company_id: config.company_id, status: 'scanned', ...result });
    } catch (err) {
      results.push({ company_id: config.company_id, status: 'error', error: (err as Error).message });
    }
  }

  return jsonResponse({ success: true, companies_processed: results.length, results });
}

// ═══════════════════════════════════════
// FETCH MENTIONS via platform scrapers
// ═══════════════════════════════════════
async function fetchMentions(account: any, keywords: string[], companyId: string) {
  const events: any[] = [];
  const scraperMap: Record<string, string> = {
    instagram: 'instagram-scraper',
    facebook: 'facebook-scraper',
    linkedin: 'linkedin-scraper',
    tiktok: 'tiktok-scraper',
  };

  const scraperFn = scraperMap[account.platform];
  if (!scraperFn) return events;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${scraperFn}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'search_mentions',
        keywords,
        account_name: account.account_name,
        access_token: account.access_token,
        limit: 20,
      }),
    });

    const data = await response.json();
    const mentions = data.mentions || data.results || data.data || [];

    for (const mention of mentions) {
      const text = mention.text || mention.caption || mention.content || '';
      const sentiment = analyzeSentimentSimple(text);

      events.push({
        event_type: 'mention',
        source_url: mention.url || mention.permalink || null,
        source_username: mention.username || mention.author || null,
        content_text: text.substring(0, 2000),
        sentiment: sentiment.label,
        sentiment_score: sentiment.score,
        metadata: {
          post_id: mention.id || mention.post_id,
          likes: mention.likes || mention.like_count,
          comments: mention.comments || mention.comment_count,
          media_type: mention.media_type,
        },
        detected_at: mention.timestamp || mention.created_at || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error(`Error fetching mentions from ${scraperFn}:`, err);
  }

  return events;
}

// ═══════════════════════════════════════
// FETCH COMPETITOR ADS
// ═══════════════════════════════════════
async function fetchCompetitorAds(account: any, competitorHandles: string[], companyId: string) {
  const events: any[] = [];

  // Use RapidAPI or platform-specific ad library search
  const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
  if (!rapidApiKey) return events;

  for (const handle of competitorHandles) {
    try {
      // Instagram ad library via RapidAPI
      if (account.platform === 'instagram' || account.platform === 'facebook') {
        const response = await fetch(
          `https://meta-ad-library.p.rapidapi.com/search?query=${encodeURIComponent(handle)}&limit=5`,
          {
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'meta-ad-library.p.rapidapi.com',
            },
          }
        );
        const data = await response.json();
        for (const ad of (data.ads || data.results || [])) {
          events.push({
            event_type: 'competitor_ad',
            source_url: ad.url || ad.ad_url || null,
            source_username: handle,
            content_text: ad.text || ad.body || ad.description || '',
            metadata: {
              ad_id: ad.id,
              start_date: ad.start_date,
              spend: ad.spend,
              impressions: ad.impressions,
              media_url: ad.image_url || ad.video_url,
            },
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching competitor ads for ${handle}:`, err);
    }
  }

  return events;
}

// ═══════════════════════════════════════
// SIMPLE SENTIMENT ANALYSIS
// ═══════════════════════════════════════
function analyzeSentimentSimple(text: string): { label: string; score: number } {
  const lower = text.toLowerCase();
  const positiveWords = ['great', 'love', 'amazing', 'excellent', 'awesome', 'best', 'fantastic', 'wonderful', 'good', 'gracias', 'genial', 'increíble', 'excelente', 'bueno', 'maravilloso'];
  const negativeWords = ['bad', 'terrible', 'worst', 'awful', 'hate', 'horrible', 'poor', 'scam', 'fraud', 'malo', 'terrible', 'pésimo', 'horrible', 'estafa', 'fraude'];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const w of positiveWords) if (lower.includes(w)) positiveCount++;
  for (const w of negativeWords) if (lower.includes(w)) negativeCount++;

  if (positiveCount > negativeCount) return { label: 'positive', score: Math.min(0.99, 0.5 + positiveCount * 0.1) };
  if (negativeCount > positiveCount) return { label: 'negative', score: Math.min(0.99, 0.5 + negativeCount * 0.1) };
  return { label: 'neutral', score: 0.5 };
}

// ═══════════════════════════════════════
// GET EVENTS
// ═══════════════════════════════════════
async function getEvents(companyId: string, params: any) {
  let query = supabase
    .from('social_listening_events')
    .select('*')
    .eq('company_id', companyId)
    .order('detected_at', { ascending: false })
    .limit(params.limit || 50);

  if (params.event_type) query = query.eq('event_type', params.event_type);
  if (params.platform) query = query.eq('platform', params.platform);
  if (params.sentiment) query = query.eq('sentiment', params.sentiment);
  if (params.is_read !== undefined) query = query.eq('is_read', params.is_read);

  const { data, error } = await query;
  if (error) throw error;

  // Summary stats
  const stats = {
    total: data?.length || 0,
    positive: data?.filter(e => e.sentiment === 'positive').length || 0,
    neutral: data?.filter(e => e.sentiment === 'neutral').length || 0,
    negative: data?.filter(e => e.sentiment === 'negative').length || 0,
    unread: data?.filter(e => !e.is_read).length || 0,
  };

  return jsonResponse({ success: true, events: data || [], stats });
}

// ═══════════════════════════════════════
// UPDATE CONFIG
// ═══════════════════════════════════════
async function updateConfig(companyId: string, configData: any) {
  if (!configData) return jsonResponse({ success: false, error: 'config data required' }, 400);

  const { data, error } = await supabase
    .from('social_listening_config')
    .upsert({
      company_id: companyId,
      ...configData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' })
    .select()
    .single();

  if (error) throw error;
  return jsonResponse({ success: true, config: data });
}

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
