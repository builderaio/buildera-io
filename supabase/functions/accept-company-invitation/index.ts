import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('You must be logged in to accept an invitation');
    }

    const { token } = await req.json();

    if (!token) {
      throw new Error('Missing invitation token');
    }

    // Buscar la invitación
    const { data: invitation, error: invError } = await supabaseClient
      .from('company_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invError || !invitation) {
      throw new Error('Invitation not found');
    }

    // Verificar estado
    if (invitation.status !== 'pending') {
      throw new Error(`This invitation is ${invitation.status}`);
    }

    // Verificar expiración
    if (new Date(invitation.expires_at) < new Date()) {
      // Marcar como expirada
      await supabaseClient
        .from('company_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      
      throw new Error('This invitation has expired');
    }

    // Verificar que el email de la invitación coincida con el del usuario
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address');
    }

    // Verificar que no sea ya miembro
    const { data: existingMember } = await supabaseClient
      .from('company_members')
      .select('id')
      .eq('company_id', invitation.company_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      throw new Error('You are already a member of this company');
    }

    // Agregar usuario a company_members
    const { error: memberError } = await supabaseClient
      .from('company_members')
      .insert({
        company_id: invitation.company_id,
        user_id: user.id,
        role: invitation.role,
        is_primary: false
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      throw new Error('Failed to add you as a member');
    }

    // Marcar invitación como aceptada usando service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseAdmin
      .from('company_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: user.id
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      // No lanzamos error aquí porque el usuario ya fue agregado
    }

    // Obtener datos de la empresa
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, id')
      .eq('id', invitation.company_id)
      .single();

    console.log(`User ${user.id} accepted invitation to company ${invitation.company_id}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Invitation accepted successfully',
      company: company
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in accept-company-invitation:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An error occurred while accepting the invitation'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
