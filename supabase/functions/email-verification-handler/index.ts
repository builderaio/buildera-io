import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { email, fullName, userType } = await req.json();

    console.log('Procesando verificación de email para:', email);

    // Aquí podríamos agregar lógica adicional si necesitamos
    // procesar algo específico cuando se verifica el email

    // Enviar email de bienvenida después de la verificación
    const { data: emailConfig, error: configError } = await supabase
      .from('email_configurations')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    if (emailConfig) {
      try {
        // Obtener plantilla de bienvenida
        const { data: template, error: templateError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('template_type', 'registration')
          .eq('is_active', true)
          .maybeSingle();

        let emailSubject = '¡Bienvenido a Buildera!';
        let emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://buildera.io/logo.png" alt="Buildera" style="height: 50px;">
            </div>
            
            <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">
              ¡Tu cuenta ha sido verificada exitosamente!
            </h1>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
              Hola ${fullName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
              ¡Excelente! Tu dirección de email ha sido verificada exitosamente. 
              Ya puedes acceder a todas las funcionalidades de Buildera.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://buildera.io'}/auth?mode=signin" 
                 style="background-color: #2563eb; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold; 
                        display: inline-block; font-size: 16px;">
                Iniciar Sesión
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Ahora puedes iniciar sesión y comenzar a potenciar tu negocio con nuestras herramientas de IA.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 14px; color: #6b7280;">
                ¡Gracias por ser parte de Buildera!<br>
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
            .replace(/\{\{\s*user_type\s*\}\}/g, userType || 'usuario')
            .replace(/\{\{\s*company_name\s*\}\}/g, 'Buildera')
            .replace(/\{\{\s*support_email\s*\}\}/g, 'soporte@buildera.io');
        }

        // Enviar email de bienvenida usando el sistema de Buildera
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-buildera-email', {
          body: {
            configurationId: emailConfig.id,
            to: email,
            subject: emailSubject,
            htmlContent: emailContent,
            variables: {
              user_name: fullName,
              full_name: fullName,
              user_type: userType || 'usuario',
              company_name: 'Buildera',
              support_email: 'soporte@buildera.io'
            }
          }
        });

        if (emailError) {
          console.error('Error enviando email de bienvenida:', emailError);
        } else {
          console.log('Email de bienvenida enviado exitosamente');
        }
      } catch (emailError) {
        console.error('Error con email de bienvenida:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email verificado exitosamente'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error en email-verification-handler:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});