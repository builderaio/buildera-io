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
      throw new Error('Unauthorized');
    }

    const { email, companyId, role } = await req.json();

    if (!email || !companyId || !role) {
      throw new Error('Missing required fields: email, companyId, role');
    }

    // Validar que el usuario sea admin/owner de la empresa
    const { data: membership, error: membershipError } = await supabaseClient
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      throw new Error('You are not a member of this company');
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      throw new Error('Insufficient permissions. Only owners and admins can invite members');
    }

    // Verificar que el email no sea ya miembro (buscando por email en profiles)
    const { data: existingMemberProfile } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingMemberProfile) {
      const { data: existingMember } = await supabaseClient
        .from('company_members')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', existingMemberProfile.user_id)
        .maybeSingle();

      if (existingMember) {
        throw new Error('User is already a member of this company');
      }
    }

    // Verificar invitaciones pendientes
    const { data: pendingInvite } = await supabaseClient
      .from('company_invitations')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingInvite) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Generar token seguro
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Crear invitación
    const { data: invitation, error: invError } = await supabaseClient
      .from('company_invitations')
      .insert({
        company_id: companyId,
        email: email.toLowerCase(),
        role: role,
        token: token,
        expires_at: expiresAt.toISOString(),
        inviter_id: user.id
      })
      .select()
      .single();

    if (invError) {
      console.error('Error creating invitation:', invError);
      throw new Error('Failed to create invitation');
    }

    // Obtener datos de la empresa e invitador
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const { data: inviter } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user.id)
      .single();

    // Enviar email
    const inviteUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/invite/${token}`;
    
    const { error: emailError } = await supabaseClient.functions.invoke('send-buildera-email', {
      body: {
        to: email,
        subject: `Invitación a ${company?.name || 'una empresa'} en Buildera`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Has sido invitado a ${company?.name || 'una empresa'}</h2>
            <p style="color: #666; font-size: 16px;">
              ${inviter?.full_name || 'Un miembro'} te ha invitado a unirte como ${role === 'admin' ? '<strong>Administrador</strong>' : '<strong>Miembro</strong>'}.
            </p>
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Aceptar invitación
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">Esta invitación expira en 7 días.</p>
            <p style="color: #999; font-size: 12px;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
          </div>
        `
      }
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      // No lanzamos error aquí porque la invitación ya fue creada
    }

    console.log(`Invitation sent successfully to ${email} for company ${companyId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      invitation,
      message: 'Invitation sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-company-invitation:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An error occurred while sending the invitation'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
