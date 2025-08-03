import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationEmailRequest {
  email: string;
  fullName: string;
  confirmationUrl: string;
  userType?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, fullName, confirmationUrl, userType }: VerificationEmailRequest = await req.json();

    console.log('Enviando email de verificación a:', email);

    // Obtener la configuración de email por defecto
    const { data: emailConfig, error: configError } = await supabase
      .from('email_configurations')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    if (configError) {
      console.error('Error obteniendo configuración de email:', configError);
      throw new Error('No se pudo obtener la configuración de email');
    }

    if (!emailConfig) {
      console.error('No hay configuración de email por defecto activa');
      throw new Error('No hay configuración de email disponible');
    }

    // Obtener plantilla de verificación de email
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', 'email_verification')
      .eq('is_active', true)
      .maybeSingle();

    let emailSubject = 'Verifica tu cuenta en Buildera';
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://buildera.io/logo.png" alt="Buildera" style="height: 50px;">
        </div>
        
        <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
          ¡Bienvenido a Buildera, ${fullName}!
        </h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
          Gracias por registrarte en Buildera. Para completar tu registro y activar tu cuenta, 
          necesitas verificar tu dirección de email.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" 
             style="background-color: #2563eb; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold; 
                    display: inline-block; font-size: 16px;">
            Verificar mi cuenta
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
        </p>
        <p style="font-size: 14px; color: #2563eb; word-break: break-all;">
          ${confirmationUrl}
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          Si no creaste esta cuenta, puedes ignorar este email de forma segura.
        </p>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 14px; color: #6b7280;">
            ¡Gracias por elegir Buildera!<br>
            El equipo de Buildera
          </p>
        </div>
      </div>
    `;

    // Si hay plantilla personalizada, usarla
    if (template) {
      emailSubject = template.subject || emailSubject;
      emailContent = template.html_content || emailContent;
      
      // Reemplazar variables en la plantilla
      emailContent = emailContent
        .replace(/\{\{\s*user_name\s*\}\}/g, fullName)
        .replace(/\{\{\s*full_name\s*\}\}/g, fullName)
        .replace(/\{\{\s*confirmation_url\s*\}\}/g, confirmationUrl)
        .replace(/\{\{\s*verification_url\s*\}\}/g, confirmationUrl)
        .replace(/\{\{\s*user_type\s*\}\}/g, userType || 'usuario')
        .replace(/\{\{\s*company_name\s*\}\}/g, 'Buildera')
        .replace(/\{\{\s*support_email\s*\}\}/g, 'soporte@buildera.io');
    }

    // Enviar email usando el sistema de Buildera
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-buildera-email', {
      body: {
        configurationId: emailConfig.id,
        to: email,
        subject: emailSubject,
        htmlContent: emailContent,
        variables: {
          user_name: fullName,
          full_name: fullName,
          confirmation_url: confirmationUrl,
          verification_url: confirmationUrl,
          user_type: userType || 'usuario',
          company_name: 'Buildera',
          support_email: 'soporte@buildera.io'
        }
      }
    });

    if (emailError) {
      console.error('Error enviando email de verificación:', emailError);
      throw emailError;
    }

    console.log('Email de verificación enviado exitosamente:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de verificación enviado',
        emailSent: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error en send-verification-email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor',
        emailSent: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});