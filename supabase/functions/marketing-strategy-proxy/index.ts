import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_URL = 'https://buildera.app.n8n.cloud/webhook/marketing-strategy';
const N8N_AUTH_USER = Deno.env.get('N8N_AUTH_USER');
const N8N_AUTH_PASS = Deno.env.get('N8N_AUTH_PASS');

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch (_) {
      payload = {};
    }

    // Accept direct object or { input: ... }
    const input = (payload && typeof payload === 'object' && 'input' in payload)
      ? (payload as any).input
      : payload;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (N8N_AUTH_USER && N8N_AUTH_PASS) {
      const credentials = btoa(`${N8N_AUTH_USER}:${N8N_AUTH_PASS}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    console.log('➡️ Forwarding to N8N webhook', { url: N8N_URL });
    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(input ?? {}),
      signal: controller.signal
    });

    clearTimeout(timeout);

    console.log('⬅️ N8N response', { status: res.status, statusText: res.statusText });

    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();

    let body: any;
    try {
      body = contentType.includes('application/json') ? JSON.parse(raw) : { raw };
    } catch (_) {
      body = { raw };
    }

    if (!res.ok) {
      return new Response(JSON.stringify({
        ok: false,
        status: res.status,
        statusText: res.statusText,
        body
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, data: body }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError';
    return new Response(JSON.stringify({
      ok: false,
      error: isAbort ? 'timeout' : 'unexpected',
      message: String(e?.message || e)
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
