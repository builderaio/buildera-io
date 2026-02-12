import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data } = await req.json();

    // ── PUBLIC: Serve landing page data ──
    if (action === "get_landing") {
      const { slug } = data;
      const { data: link, error } = await supabase
        .from("smart_links")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !link) {
        return new Response(JSON.stringify({ error: "Link not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Increment click count
      await supabase
        .from("smart_links")
        .update({ total_clicks: (link.total_clicks || 0) + 1 })
        .eq("id", link.id);

      return new Response(JSON.stringify({ success: true, link }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PUBLIC: Capture lead ──
    if (action === "capture_lead") {
      const { slug, email, name, phone, custom_fields, source_platform, utm_source, utm_medium, utm_campaign } = data;

      const { data: link } = await supabase
        .from("smart_links")
        .select("id")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!link) {
        return new Response(JSON.stringify({ error: "Link not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insertError } = await supabase.from("smart_link_leads").insert({
        link_id: link.id,
        email,
        name,
        phone,
        custom_fields: custom_fields || {},
        source_platform,
        utm_source,
        utm_medium,
        utm_campaign,
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent") || "unknown",
      });

      if (insertError) throw insertError;

      // Increment leads count
      await supabase.rpc("increment_smart_link_leads", { link_uuid: link.id }).catch(() => {
        // Fallback: manual increment
        supabase
          .from("smart_links")
          .select("total_leads")
          .eq("id", link.id)
          .single()
          .then(({ data: current }) => {
            if (current) {
              supabase
                .from("smart_links")
                .update({ total_leads: (current.total_leads || 0) + 1 })
                .eq("id", link.id);
            }
          });
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── AUTH REQUIRED: CRUD operations ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── List smart links ──
    if (action === "list") {
      const { company_id } = data;
      const { data: links, error } = await supabase
        .from("smart_links")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, links }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Create smart link ──
    if (action === "create") {
      const { company_id, title, description, destination_url, template_type, form_fields, page_config, utm_params } = data;

      // Generate unique slug
      const slug = generateSlug(title);

      const { data: link, error } = await supabase
        .from("smart_links")
        .insert({
          company_id,
          user_id: user.id,
          slug,
          title,
          description,
          destination_url,
          template_type: template_type || "email_capture",
          form_fields: form_fields || [{ name: "email", type: "email", label: "Email", required: true }],
          page_config: page_config || {},
          utm_params: utm_params || {},
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, link }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Update smart link ──
    if (action === "update") {
      const { id, ...updates } = data;
      const { data: link, error } = await supabase
        .from("smart_links")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, link }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Delete smart link ──
    if (action === "delete") {
      const { id } = data;
      const { error } = await supabase
        .from("smart_links")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get leads for a smart link ──
    if (action === "get_leads") {
      const { link_id, limit = 100 } = data;
      const { data: leads, error } = await supabase
        .from("smart_link_leads")
        .select("*")
        .eq("link_id", link_id)
        .order("captured_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, leads }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Analytics for a smart link ──
    if (action === "analytics") {
      const { company_id } = data;

      const { data: links } = await supabase
        .from("smart_links")
        .select("id, title, slug, template_type, total_clicks, total_leads, created_at")
        .eq("company_id", company_id)
        .order("total_clicks", { ascending: false });

      const totalClicks = (links || []).reduce((s, l) => s + (l.total_clicks || 0), 0);
      const totalLeads = (links || []).reduce((s, l) => s + (l.total_leads || 0), 0);
      const conversionRate = totalClicks > 0 ? ((totalLeads / totalClicks) * 100).toFixed(1) : "0";

      return new Response(
        JSON.stringify({
          success: true,
          analytics: { totalClicks, totalLeads, conversionRate, links: links || [] },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("smart-link-manager error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 30);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}
