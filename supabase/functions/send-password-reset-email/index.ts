import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetEmailRequest {
  email: string;
  resetUrl: string;
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

    const { email, resetUrl, userType }: PasswordResetEmailRequest = await req.json();

    console.log('Enviando email de reset de contraseña a:', email);

    // Obtener el perfil del usuario para personalizar el email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, user_type')
      .eq('email', email)
      .maybeSingle();

    const userName = profile?.full_name || 'Usuario';
    const userTypeForTemplate = userType || profile?.user_type || 'usuario';

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

    // Obtener plantilla de reset de contraseña
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', 'password_reset')
      .eq('is_active', true)
      .maybeSingle();

    let emailSubject = `🔐 Restablece tu contraseña de Buildera - Acceso Seguro`;
    let emailContent = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0;">
        
        <!-- Header de seguridad -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 0;">
          <tr>
            <td align="center">
              <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; display: inline-block;">
                <div style="color: white; font-size: 24px; font-weight: 700; margin-bottom: 5px;">🔐 Acceso Seguro</div>
                <div style="color: white; font-size: 18px; font-weight: 600;">Buildera</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Contenido principal -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <div style="max-width: 600px; margin: 0 auto;">
                
                <div style="background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                  
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">
                      Restablecimiento de Contraseña
                    </div>
                    <div style="color: #64748b; font-size: 16px;">
                      Recupera el acceso a tu cuenta de forma segura
                    </div>
                  </div>

                  <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #dc2626;">
                    <div style="font-size: 16px; color: #1e293b; margin-bottom: 10px;">
                      <strong>Hola ${userName},</strong>
                    </div>
                    <p style="color: #475569; margin: 0; line-height: 1.6;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Buildera</strong>.
                    </p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);">
                      🔐 Restablecer Contraseña
                    </a>
                    <div style="margin-top: 15px; font-size: 14px; color: #64748b;">
                      Este enlace expira en 1 hora por seguridad
                    </div>
                  </div>

                  <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 30px 0;">
                    <div style="font-weight: 600; color: #1e293b; margin-bottom: 10px;">
                      🛡️ Medidas de seguridad:
                    </div>
                    <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.6;">
                      <li>Este enlace es de un solo uso</li>
                      <li>Expira automáticamente por seguridad</li>
                      <li>Solo tú puedes acceder a este enlace</li>
                    </ul>
                  </div>

                  <div style="background: #fffbeb; border-radius: 12px; padding: 20px; border: 1px solid #fbbf24;">
                    <div style="font-weight: 600; color: #92400e; margin-bottom: 5px;">
                      ⚠️ ¿No solicitaste este cambio?
                    </div>
                    <div style="color: #92400e; font-size: 14px;">
                      Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.
                    </div>
                  </div>

                  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="font-size: 14px; color: #64748b; margin: 0;">
                      Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="font-size: 12px; color: #2563eb; word-break: break-all; margin: 10px 0 0 0;">
                      ${resetUrl}
                    </p>
                  </div>

                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; padding: 30px 0;">
          <tr>
            <td align="center">
              <div style="color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} Buildera - Seguridad y confianza garantizada
              </div>
            </td>
          </tr>
        </table>

      </div>
    `;

    // Si hay plantilla personalizada, usarla
    if (template) {
      emailSubject = template.subject || emailSubject;
      emailContent = template.html_content || emailContent;
      
      // Reemplazar variables en la plantilla
      const currentYear = new Date().getFullYear().toString();
      emailContent = emailContent
        .replace(/\{\{\s*user_name\s*\}\}/g, userName)
        .replace(/\{\{\s*reset_url\s*\}\}/g, resetUrl)
        .replace(/\{\{\s*user_type\s*\}\}/g, userTypeForTemplate)
        .replace(/\{\{\s*buildera_name\s*\}\}/g, 'Buildera')
        .replace(/\{\{\s*current_year\s*\}\}/g, currentYear)
        .replace(/\{\{\s*expiry_time\s*\}\}/g, '1')
        .replace(/\{\{\s*support_email\s*\}\}/g, 'soporte@buildera.io')
        .replace(/\{\{\s*buildera_logo\s*\}\}/g, 'https://buildera.io/logo.png');
      
      emailSubject = emailSubject
        .replace(/\{\{\s*buildera_name\s*\}\}/g, 'Buildera')
        .replace(/\{\{\s*user_name\s*\}\}/g, userName);
    }

    // Enviar email usando el sistema de Buildera
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-buildera-email', {
      body: {
        configurationId: emailConfig.id,
        to: email,
        subject: emailSubject,
        htmlContent: emailContent,
        variables: {
          user_name: userName,
          reset_url: resetUrl,
          user_type: userTypeForTemplate,
          buildera_name: 'Buildera',
          current_year: new Date().getFullYear().toString(),
          expiry_time: '1',
          support_email: 'soporte@buildera.io',
          buildera_logo: 'https://buildera.io/logo.png'
        }
      }
    });

    if (emailError) {
      console.error('Error enviando email de reset de contraseña:', emailError);
      throw emailError;
    }

    console.log('Email de reset de contraseña enviado exitosamente:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de reset de contraseña enviado',
        emailSent: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error en send-password-reset-email:', error);
    
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