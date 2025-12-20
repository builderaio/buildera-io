import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CRMToolRequest {
  tool: string;
  company_id: string;
  params: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tool, company_id, params } = await req.json() as CRMToolRequest;

    if (!tool || !company_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tool, company_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: unknown;

    switch (tool) {
      // ==================== CONTACTS ====================
      case 'search_contacts': {
        const { query, filters, limit = 50 } = params as { query?: string; filters?: Record<string, unknown>; limit?: number };
        let dbQuery = supabase
          .from('crm_contacts')
          .select('*')
          .eq('company_id', company_id)
          .eq('is_active', true)
          .limit(limit);

        if (query) {
          dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
        }
        if (filters?.business_type) {
          dbQuery = dbQuery.eq('business_type', filters.business_type);
        }
        if (filters?.contact_type) {
          dbQuery = dbQuery.eq('contact_type', filters.contact_type);
        }

        const { data, error } = await dbQuery;
        if (error) throw error;
        result = { contacts: data, count: data?.length || 0 };
        break;
      }

      case 'get_contact_by_email': {
        const { email } = params as { email: string };
        const { data, error } = await supabase
          .from('crm_contacts')
          .select('*')
          .eq('company_id', company_id)
          .eq('email', email)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        result = { contact: data || null };
        break;
      }

      case 'create_contact': {
        const contactData = params as Record<string, unknown>;
        const { data, error } = await supabase
          .from('crm_contacts')
          .insert({ ...contactData, company_id })
          .select()
          .single();
        if (error) throw error;

        // Log activity
        await supabase.from('crm_activities').insert({
          company_id,
          contact_id: data.id,
          activity_type: 'ai_insight',
          subject: 'Contacto creado por IA',
          ai_generated: true,
        });

        result = { contact: data, message: 'Contact created successfully' };
        break;
      }

      case 'update_contact': {
        const { contact_id, ...updates } = params as { contact_id: string } & Record<string, unknown>;
        const { data, error } = await supabase
          .from('crm_contacts')
          .update(updates)
          .eq('id', contact_id)
          .eq('company_id', company_id)
          .select()
          .single();
        if (error) throw error;
        result = { contact: data, message: 'Contact updated successfully' };
        break;
      }

      // ==================== ACCOUNTS ====================
      case 'search_accounts': {
        const { query, limit = 50 } = params as { query?: string; limit?: number };
        let dbQuery = supabase
          .from('crm_accounts')
          .select('*')
          .eq('company_id', company_id)
          .eq('is_active', true)
          .limit(limit);

        if (query) {
          dbQuery = dbQuery.or(`account_name.ilike.%${query}%,legal_name.ilike.%${query}%`);
        }

        const { data, error } = await dbQuery;
        if (error) throw error;
        result = { accounts: data, count: data?.length || 0 };
        break;
      }

      case 'get_account_details': {
        const { account_id } = params as { account_id: string };
        const { data: account, error: accError } = await supabase
          .from('crm_accounts')
          .select('*')
          .eq('id', account_id)
          .eq('company_id', company_id)
          .single();
        if (accError) throw accError;

        const { data: contacts } = await supabase
          .from('crm_contacts')
          .select('id, first_name, last_name, email, job_title')
          .eq('account_id', account_id);

        const { data: deals } = await supabase
          .from('crm_deals')
          .select('id, deal_name, amount, status, stage_id')
          .eq('account_id', account_id);

        result = { account, contacts: contacts || [], deals: deals || [] };
        break;
      }

      // ==================== DEALS ====================
      case 'get_pipeline_deals': {
        const { pipeline_id, status } = params as { pipeline_id?: string; status?: string };
        let dbQuery = supabase
          .from('crm_deals')
          .select('*, crm_contacts(first_name, last_name, email)')
          .eq('company_id', company_id);

        if (pipeline_id) dbQuery = dbQuery.eq('pipeline_id', pipeline_id);
        if (status) dbQuery = dbQuery.eq('status', status);

        const { data, error } = await dbQuery;
        if (error) throw error;
        result = { deals: data };
        break;
      }

      case 'create_deal': {
        const dealData = params as Record<string, unknown>;
        const { data, error } = await supabase
          .from('crm_deals')
          .insert({ ...dealData, company_id })
          .select()
          .single();
        if (error) throw error;

        await supabase.from('crm_activities').insert({
          company_id,
          deal_id: data.id,
          contact_id: data.contact_id,
          activity_type: 'deal_created',
          subject: `Deal creado por IA: ${data.deal_name}`,
          ai_generated: true,
        });

        result = { deal: data, message: 'Deal created successfully' };
        break;
      }

      case 'move_deal_stage': {
        const { deal_id, stage_id } = params as { deal_id: string; stage_id: string };
        const { data, error } = await supabase
          .from('crm_deals')
          .update({ stage_id })
          .eq('id', deal_id)
          .eq('company_id', company_id)
          .select()
          .single();
        if (error) throw error;

        await supabase.from('crm_activities').insert({
          company_id,
          deal_id,
          activity_type: 'stage_change',
          subject: 'Etapa cambiada por IA',
          ai_generated: true,
          metadata: { new_stage_id: stage_id },
        });

        result = { deal: data, message: 'Deal stage updated' };
        break;
      }

      // ==================== ACTIVITIES ====================
      case 'log_activity': {
        const activityData = params as Record<string, unknown>;
        const { data, error } = await supabase
          .from('crm_activities')
          .insert({ ...activityData, company_id, ai_generated: true })
          .select()
          .single();
        if (error) throw error;
        result = { activity: data, message: 'Activity logged successfully' };
        break;
      }

      case 'get_contact_timeline': {
        const { contact_id, limit = 50 } = params as { contact_id: string; limit?: number };
        const { data, error } = await supabase
          .from('crm_activities')
          .select('*')
          .eq('contact_id', contact_id)
          .eq('company_id', company_id)
          .order('activity_date', { ascending: false })
          .limit(limit);
        if (error) throw error;
        result = { activities: data };
        break;
      }

      // ==================== ANALYTICS ====================
      case 'get_pipeline_metrics': {
        const { pipeline_id } = params as { pipeline_id: string };
        const { data: deals, error } = await supabase
          .from('crm_deals')
          .select('amount, weighted_amount, status')
          .eq('company_id', company_id)
          .eq('pipeline_id', pipeline_id);
        if (error) throw error;

        const openDeals = deals?.filter(d => d.status === 'open') || [];
        const wonDeals = deals?.filter(d => d.status === 'won') || [];
        const lostDeals = deals?.filter(d => d.status === 'lost') || [];

        result = {
          total_deals: deals?.length || 0,
          open_deals: openDeals.length,
          won_deals: wonDeals.length,
          lost_deals: lostDeals.length,
          total_value: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
          weighted_value: openDeals.reduce((sum, d) => sum + (d.weighted_amount || 0), 0),
          won_value: wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
          win_rate: deals && deals.length > 0 
            ? (wonDeals.length / (wonDeals.length + lostDeals.length) * 100) || 0
            : 0,
        };
        break;
      }

      case 'get_contact_stats': {
        const { data, error } = await supabase
          .from('crm_contacts')
          .select('contact_type, lifecycle_stage, business_type')
          .eq('company_id', company_id)
          .eq('is_active', true);
        if (error) throw error;

        const stats = {
          total: data?.length || 0,
          by_type: {} as Record<string, number>,
          by_stage: {} as Record<string, number>,
          b2c_count: data?.filter(c => c.business_type === 'b2c').length || 0,
          b2b_count: data?.filter(c => c.business_type === 'b2b').length || 0,
        };

        data?.forEach(c => {
          stats.by_type[c.contact_type] = (stats.by_type[c.contact_type] || 0) + 1;
          stats.by_stage[c.lifecycle_stage] = (stats.by_stage[c.lifecycle_stage] || 0) + 1;
        });

        result = stats;
        break;
      }

      // ==================== AI ENRICHMENT ====================
      case 'suggest_next_action': {
        const { contact_id } = params as { contact_id: string };
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('*')
          .eq('id', contact_id)
          .single();

        const { data: activities } = await supabase
          .from('crm_activities')
          .select('activity_type, activity_date')
          .eq('contact_id', contact_id)
          .order('activity_date', { ascending: false })
          .limit(5);

        // Simple rule-based suggestions (can be enhanced with AI)
        let suggestion = 'Enviar email de seguimiento';
        if (!activities || activities.length === 0) {
          suggestion = 'Hacer primer contacto';
        } else if (contact?.lifecycle_stage === 'lead') {
          suggestion = 'Programar llamada de calificación';
        } else if (contact?.lifecycle_stage === 'sql') {
          suggestion = 'Enviar propuesta comercial';
        }

        // Update contact with suggestion
        await supabase
          .from('crm_contacts')
          .update({ ai_next_best_action: suggestion, last_ai_analysis: new Date().toISOString() })
          .eq('id', contact_id);

        result = { suggestion, contact_id };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown tool: ${tool}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CRM AI Tools error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
