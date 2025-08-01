-- Insertar plantillas predefinidas de email para Buildera
INSERT INTO public.email_templates (
  name,
  subject,
  html_content,
  text_content,
  template_type,
  variables,
  attachments,
  is_active,
  created_by
) VALUES
-- Plantilla de Registro/Bienvenida
(
  'Bienvenida - Registro de Usuario',
  '🚀 ¡Bienvenido al futuro de la IA empresarial con {{buildera_name}}!',
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Buildera</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  
  <!-- Header con gradiente -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #7c3aed 100%); padding: 40px 0;">
    <tr>
      <td align="center">
        <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 20px; display: inline-block; border: 1px solid rgba(255,255,255,0.2);">
          <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="height: 60px; width: auto;">
        </div>
      </td>
    </tr>
  </table>

  <!-- Contenido principal -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff;">
    <tr>
      <td align="center" style="padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; position: relative; overflow: hidden;">
          
          <!-- Decoración superior -->
          <div style="height: 8px; background: linear-gradient(90deg, #2563eb, #7c3aed, #ec4899, #f59e0b); margin-bottom: 40px;"></div>
          
          <div style="padding: 0 40px 40px 40px;">
            
            <!-- Título con efecto -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 32px; font-weight: 800; line-height: 1.2; margin-bottom: 10px;">
                ¡Bienvenido al futuro!
              </div>
              <div style="color: #64748b; font-size: 18px; font-weight: 500;">
                Tu viaje hacia la IA empresarial comienza aquí
              </div>
            </div>

            <!-- Card de bienvenida -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
              
              <div style="font-size: 18px; color: #1e293b; margin-bottom: 15px;">
                <strong>Hola {{user_name}},</strong>
              </div>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                🎉 <strong>¡Increíble!</strong> Acabas de unirte a la revolución de la inteligencia artificial empresarial. En <strong>{{buildera_name}}</strong>, transformamos la manera en que las empresas utilizan la IA.
              </p>
              
              <div style="background: #ffffff; border-radius: 12px; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Tu cuenta ha sido creada con:</div>
                <div style="font-size: 16px; font-weight: 600; color: #1e293b;">{{user_email}}</div>
              </div>
            </div>

            <!-- CTA Principal -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3); transition: all 0.3s ease; border: 2px solid transparent;">
                🚀 Comenzar mi viaje IA
              </a>
              <div style="margin-top: 15px; font-size: 14px; color: #64748b;">
                ¡Todo listo en menos de 2 minutos!
              </div>
            </div>

          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Footer moderno -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; padding: 40px 0;">
    <tr>
      <td align="center">
        <div style="max-width: 600px; margin: 0 auto; padding: 0 40px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="color: #94a3b8; font-size: 16px; margin-bottom: 15px;">
              ¿Tienes preguntas? Estamos aquí para ayudarte
            </div>
            <a href="mailto:soporte@buildera.io" style="color: #60a5fa; text-decoration: none; font-weight: 500;">
              soporte@buildera.io
            </a>
          </div>

          <div style="text-align: center; padding-top: 30px; border-top: 1px solid #334155;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 10px;">
              © {{current_year}} {{buildera_name}}. Transformando empresas con IA.
            </div>
            <div>
              <a href="{{buildera_website}}" style="color: #60a5fa; text-decoration: none; font-size: 12px;">{{buildera_website}}</a>
            </div>
          </div>
          
        </div>
      </td>
    </tr>
  </table>

</body>
</html>',
  'Hola {{user_name}},

¡Bienvenido a {{buildera_name}}!

Acabas de unirte a la revolución de la inteligencia artificial empresarial. Tu cuenta ha sido creada exitosamente con el email: {{user_email}}

Para comenzar, visita: {{login_url}}

Si tienes alguna pregunta, contáctanos en: soporte@buildera.io

¡Gracias por confiar en nosotros!

El equipo de {{buildera_name}}
{{buildera_website}}',
  'registration',
  '["buildera_name", "buildera_logo", "buildera_website", "current_year", "user_name", "user_email", "login_url"]'::jsonb,
  '[]'::jsonb,
  true,
  NULL
),

-- Plantilla de Restablecimiento de Contraseña
(
  'Restablecimiento de Contraseña',
  '🔐 Restablece tu contraseña de {{buildera_name}} - Acceso Seguro',
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecimiento de Contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; background: #f8fafc;">
  
  <!-- Header de seguridad -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 0;">
    <tr>
      <td align="center">
        <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; display: inline-block;">
          <div style="color: white; font-size: 24px; font-weight: 700; margin-bottom: 5px;">🔐 Acceso Seguro</div>
          <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="height: 40px; width: auto; filter: brightness(0) invert(1);">
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
                <strong>Hola {{user_name}},</strong>
              </div>
              <p style="color: #475569; margin: 0; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>{{buildera_name}}</strong>.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{reset_url}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);">
                🔐 Restablecer Contraseña
              </a>
              <div style="margin-top: 15px; font-size: 14px; color: #64748b;">
                Este enlace expira en {{expiry_time}} horas
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
          © {{current_year}} {{buildera_name}} - Seguridad y confianza garantizada
        </div>
      </td>
    </tr>
  </table>

</body>
</html>',
  'Hola {{user_name}},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en {{buildera_name}}.

Para restablecer tu contraseña, haz clic en el siguiente enlace:
{{reset_url}}

Este enlace expira en {{expiry_time}} horas por seguridad.

Si no solicitaste este cambio, puedes ignorar este email de forma segura.

Saludos,
El equipo de {{buildera_name}}',
  'password_reset',
  '["buildera_name", "buildera_logo", "buildera_website", "current_year", "user_name", "reset_url", "expiry_time"]'::jsonb,
  '[]'::jsonb,
  true,
  NULL
),

-- Plantilla de Informe Periódico
(
  'Informe Mensual de Actividad',
  '📊 Tu informe de {{report_period}} - {{buildera_name}} Analytics',
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe Mensual</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; background: #f8fafc;">
  
  <!-- Header analítico -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 0;">
    <tr>
      <td align="center">
        <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; display: inline-block;">
          <div style="color: white; font-size: 28px; font-weight: 800; margin-bottom: 10px;">
            📊 Informe de {{report_period}}
          </div>
          <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="height: 50px; width: auto; filter: brightness(0) invert(1);">
        </div>
      </td>
    </tr>
  </table>

  <!-- Contenido principal -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          
          <!-- Saludo personalizado -->
          <div style="background: #ffffff; border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 15px;">
              ¡Hola {{user_name}}! 👋
            </div>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
              Tu resumen de actividad de <strong>{{report_period}}</strong> está listo. Aquí tienes los highlights de tu crecimiento en {{buildera_name}}.
            </p>
          </div>

          <!-- Métricas destacadas -->
          <div style="display: grid; gap: 20px; margin-bottom: 30px;">
            
            <!-- Métrica 1 -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 25px; border: 1px solid #0ea5e9;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="color: #0c4a6e; font-size: 14px; font-weight: 600; margin-bottom: 5px;">
                    ACCIONES REALIZADAS
                  </div>
                  <div style="color: #0c4a6e; font-size: 32px; font-weight: 800;">
                    {{total_actions}}
                  </div>
                </div>
                <div style="background: #0ea5e9; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 24px;">🚀</span>
                </div>
              </div>
            </div>

            <!-- Métrica 2 -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 25px; border: 1px solid #22c55e;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="color: #14532d; font-size: 14px; font-weight: 600; margin-bottom: 5px;">
                    NUEVOS PROYECTOS
                  </div>
                  <div style="color: #14532d; font-size: 32px; font-weight: 800;">
                    {{new_projects}}
                  </div>
                </div>
                <div style="background: #22c55e; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 24px;">📈</span>
                </div>
              </div>
            </div>

            <!-- Métrica 3 -->
            <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border-radius: 16px; padding: 25px; border: 1px solid #eab308;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="color: #713f12; font-size: 14px; font-weight: 600; margin-bottom: 5px;">
                    USUARIOS ACTIVOS
                  </div>
                  <div style="color: #713f12; font-size: 32px; font-weight: 800;">
                    {{active_users}}
                  </div>
                </div>
                <div style="background: #eab308; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 24px;">👥</span>
                </div>
              </div>
            </div>

          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(14, 165, 233, 0.3);">
              📊 Ver Dashboard Completo
            </a>
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
          © {{current_year}} {{buildera_name}} - Impulsando tu crecimiento
        </div>
      </td>
    </tr>
  </table>

</body>
</html>',
  'Hola {{user_name}},

Tu resumen de actividad de {{report_period}} está listo:

📊 MÉTRICAS DESTACADAS:
- Acciones realizadas: {{total_actions}}
- Nuevos proyectos: {{new_projects}}  
- Usuarios activos: {{active_users}}

Ve tu dashboard completo en: {{dashboard_url}}

¡Sigue así! 

El equipo de {{buildera_name}}',
  'periodic_report',
  '["buildera_name", "buildera_logo", "buildera_website", "current_year", "user_name", "report_period", "total_actions", "new_projects", "active_users", "dashboard_url"]'::jsonb,
  '[]'::jsonb,
  true,
  NULL
),

-- Plantilla de Verificación
(
  'Verificación de Email',
  '✅ Verifica tu email en {{buildera_name}} - Un paso más',
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificación de Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; background: #f8fafc;">
  
  <!-- Header de verificación -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 0;">
    <tr>
      <td align="center">
        <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; display: inline-block;">
          <div style="color: white; font-size: 28px; font-weight: 800; margin-bottom: 10px;">
            ✅ Verificación de Email
          </div>
          <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="height: 50px; width: auto; filter: brightness(0) invert(1);">
        </div>
      </td>
    </tr>
  </table>

  <!-- Contenido principal -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          
          <div style="background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.1);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">
                ¡Ya casi estás dentro!
              </div>
              <div style="color: #64748b; font-size: 16px;">
                Solo necesitas verificar tu dirección de email
              </div>
            </div>

            <div style="background: #f0fdf4; border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #10b981;">
              <div style="font-size: 18px; color: #1e293b; margin-bottom: 10px;">
                <strong>Hola {{user_name}},</strong>
              </div>
              <p style="color: #475569; margin: 0; line-height: 1.6;">
                Para completar tu registro en <strong>{{buildera_name}}</strong> y activar todas las funcionalidades, necesitamos verificar tu dirección de email.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verification_url}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 18px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
                ✅ Verificar mi Email
              </a>
              <div style="margin-top: 15px; font-size: 14px; color: #64748b;">
                Verificación rápida y segura
              </div>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 10px;">
                🔒 ¿Por qué verificamos tu email?
              </div>
              <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Proteger tu cuenta de accesos no autorizados</li>
                <li>Enviarte notificaciones importantes</li>
                <li>Recuperar tu cuenta si olvidas la contraseña</li>
              </ul>
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
          © {{current_year}} {{buildera_name}} - Tu plataforma de IA empresarial
        </div>
      </td>
    </tr>
  </table>

</body>
</html>',
  'Hola {{user_name}},

Para completar tu registro en {{buildera_name}}, necesitas verificar tu dirección de email.

Haz clic en el siguiente enlace para verificar:
{{verification_url}}

¿Por qué verificamos tu email?
- Proteger tu cuenta
- Enviarte notificaciones importantes  
- Recuperar tu cuenta si es necesario

¡Gracias por confiar en {{buildera_name}}!

El equipo de {{buildera_name}}',
  'verification',
  '["buildera_name", "buildera_logo", "buildera_website", "current_year", "user_name", "verification_url"]'::jsonb,
  '[]'::jsonb,
  true,
  NULL
);

-- Establecer una configuración por defecto si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.email_configurations WHERE is_default = true) THEN
    INSERT INTO public.email_configurations (
      name,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_secure,
      from_email,
      from_name,
      is_active,
      is_default
    ) VALUES (
      'Configuración SMTP por Defecto - Buildera',
      'smtp.buildera.io',
      587,
      'noreply@buildera.io',
      'change_this_password',
      true,
      'noreply@buildera.io',
      'Buildera - Sistema de IA Empresarial',
      false,
      true
    );
  END IF;
END $$;