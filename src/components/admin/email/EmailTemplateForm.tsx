import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Code, Smartphone } from "lucide-react";
import { EmailTemplate, useEmailSystem } from "@/hooks/useEmailSystem";
import { useSafeEmailHtml } from "@/utils/sanitizer";

interface EmailTemplateFormProps {
  template?: EmailTemplate | null;
  onClose: () => void;
  onSave: (template: Partial<EmailTemplate>) => Promise<void>;
}

const TEMPLATE_TYPES = [
  { value: "registration", label: "Registro de usuario" },
  { value: "password_reset", label: "Restablecimiento de contraseña" },
  { value: "forgot_password", label: "Olvido de contraseña" },
  { value: "periodic_report", label: "Informe periódico" },
  { value: "welcome", label: "Bienvenida" },
  { value: "verification", label: "Verificación" },
  { value: "notification", label: "Notificación" },
  { value: "custom", label: "Personalizada" },
];

export const EmailTemplateForm = ({ template, onClose, onSave }: EmailTemplateFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    html_content: "",
    text_content: "",
    template_type: "custom",
    variables: [] as string[],
    attachments: [] as any[],
    is_active: true,
  });

  const { extractVariables } = useEmailSystem();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content || "",
        template_type: template.template_type,
        variables: template.variables,
        attachments: template.attachments,
        is_active: template.is_active,
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Extract variables from content
      const subjectVars = extractVariables(formData.subject);
      const htmlVars = extractVariables(formData.html_content);
      const textVars = formData.text_content ? extractVariables(formData.text_content) : [];
      
      const allVariables = Array.from(new Set([...subjectVars, ...htmlVars, ...textVars]));
      
      await onSave({
        ...formData,
        variables: allVariables,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Sample data for preview
  const getSampleVariables = () => ({
    buildera_name: "Buildera",
    buildera_logo: "https://buildera.io/logo.png",
    buildera_website: "https://buildera.io",
    current_year: new Date().getFullYear().toString(),
    user_name: "Juan Pérez",
    user_email: "juan.perez@ejemplo.com",
    login_url: "https://buildera.io/login",
    dashboard_url: "https://buildera.io/dashboard",
    reset_url: "https://buildera.io/reset-password",
    report_period: "Enero 2025",
    total_actions: "156",
    new_projects: "12",
    active_users: "1,234",
    expiry_time: "24",
    subject_here: "Notificación importante",
    title_here: "Título del mensaje",
    content_here: "Aquí va el contenido principal del mensaje."
  });

  const replaceVariables = (content: string) => {
    const variables = getSampleVariables();
    let result = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    
    return result;
  };

  const getPreviewContent = () => {
    return {
      subject: replaceVariables(formData.subject),
      html: replaceVariables(formData.html_content),
      text: replaceVariables(formData.text_content)
    };
  };

  const getDefaultTemplate = (type: string) => {
    switch (type) {
      case "registration":
        return {
          subject: "🚀 ¡Bienvenido al futuro de la IA empresarial con {{buildera_name}}!",
          html_content: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Bienvenido a Buildera</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
              
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
                          <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: linear-gradient(135deg, #2563eb20, #7c3aed20); border-radius: 50%; opacity: 0.5;"></div>
                          
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

                        <!-- Features destacados -->
                        <div style="margin-bottom: 30px;">
                          <div style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px; text-align: center;">
                            🚀 Lo que puedes hacer ahora:
                          </div>
                          
                          <div style="display: grid; gap: 15px;">
                            <div style="display: flex; align-items: center; background: #fefefe; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;">
                              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #2563eb, #1e40af); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                <span style="color: white; font-size: 20px;">🤖</span>
                              </div>
                              <div>
                                <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">Agentes IA Personalizados</div>
                                <div style="font-size: 14px; color: #64748b;">Crea asistentes inteligentes para tu empresa</div>
                              </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; background: #fefefe; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;">
                              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                <span style="color: white; font-size: 20px;">📊</span>
                              </div>
                              <div>
                                <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">Analytics Avanzados</div>
                                <div style="font-size: 14px; color: #64748b;">Insights profundos de tus redes sociales</div>
                              </div>
                            </div>
                            
                            <div style="display: flex; align-items: center; background: #fefefe; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;">
                              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ec4899, #db2777); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                <span style="color: white; font-size: 20px;">🎯</span>
                              </div>
                              <div>
                                <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">Automatización Inteligente</div>
                                <div style="font-size: 14px; color: #64748b;">Optimiza tus procesos empresariales</div>
                              </div>
                            </div>
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
            </html>
          `,
        };
      case "password_reset":
        return {
          subject: "🔐 Restablece tu contraseña de {{buildera_name}} - Acceso Seguro",
          html_content: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Restablecimiento de Contraseña</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc;">
              
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
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
                      
                      <!-- Alerta de seguridad -->
                      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); padding: 20px; text-align: center; border-bottom: 1px solid #f59e0b;">
                        <div style="font-size: 18px; font-weight: 600; color: #92400e; margin-bottom: 5px;">
                          ⚠️ Solicitud de Restablecimiento de Contraseña
                        </div>
                        <div style="font-size: 14px; color: #a16207;">
                          Solo tienes {{expiry_time}} horas para completar este proceso
                        </div>
                      </div>

                      <div style="padding: 40px;">
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                          <div style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">
                            Restablece tu contraseña
                          </div>
                          <div style="color: #64748b; font-size: 16px;">
                            Mantén tu cuenta segura con {{buildera_name}}
                          </div>
                        </div>

                        <div style="background: #f8fafc; border-radius: 16px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #dc2626;">
                          <div style="font-size: 16px; color: #1e293b; margin-bottom: 15px;">
                            <strong>Hola {{user_name}},</strong>
                          </div>
                          
                          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>{{buildera_name}}</strong>. 
                            Si no fuiste tú quien solicitó este cambio, puedes ignorar este email de forma segura.
                          </p>
                        </div>

                        <!-- Información de seguridad -->
                        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #3b82f6;">
                          <div style="display: flex; align-items: center; margin-bottom: 15px;">
                            <div style="width: 40px; height: 40px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                              <span style="color: white; font-size: 18px;">🛡️</span>
                            </div>
                            <div>
                              <div style="font-weight: 600; color: #1e40af; font-size: 16px;">Medidas de Seguridad</div>
                              <div style="font-size: 14px; color: #1e40af;">Tu seguridad es nuestra prioridad</div>
                            </div>
                          </div>
                          
                          <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px;">
                            <li style="margin-bottom: 5px;">Este enlace expira en <strong>{{expiry_time}} horas</strong></li>
                            <li style="margin-bottom: 5px;">Solo funciona una vez</li>
                            <li style="margin-bottom: 5px;">Enviado a: <strong>{{user_email}}</strong></li>
                          </ul>
                        </div>

                        <!-- CTA Principal -->
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="{{reset_url}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);">
                            🔐 Restablecer mi Contraseña
                          </a>
                          <div style="margin-top: 15px; font-size: 12px; color: #64748b;">
                            Este enlace es válido por {{expiry_time}} horas
                          </div>
                        </div>

                        <!-- URL alternativa -->
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 15px; margin-top: 20px;">
                          <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">Si el botón no funciona, copia este enlace:</div>
                          <div style="font-size: 12px; color: #2563eb; word-break: break-all; font-family: monospace;">{{reset_url}}</div>
                        </div>

                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; padding: 30px 0; margin-top: 40px;">
                <tr>
                  <td align="center">
                    <div style="color: #64748b; font-size: 12px; text-align: center;">
                      © {{current_year}} {{buildera_name}}. Seguridad y confianza garantizada.
                    </div>
                  </td>
                </tr>
              </table>

            </body>
            </html>
          `,
        };
      case "periodic_report":
        return {
          subject: "📊 Tu Reporte {{report_period}} está listo - {{buildera_name}} Analytics",
          html_content: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reporte Periódico</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc;">
              
              <!-- Header con gradiente analytics -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); padding: 40px 0;">
                <tr>
                  <td align="center">
                    <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 25px; display: inline-block; border: 1px solid rgba(255,255,255,0.2);">
                      <div style="color: white; font-size: 24px; font-weight: 700; margin-bottom: 10px;">📊 Analytics Report</div>
                      <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="height: 50px; width: auto; filter: brightness(0) invert(1);">
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Contenido principal -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
                      
                      <!-- Header del reporte -->
                      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; text-align: center; border-bottom: 1px solid #22c55e;">
                        <div style="font-size: 32px; font-weight: 800; color: #14532d; margin-bottom: 10px;">
                          Reporte {{report_period}}
                        </div>
                        <div style="color: #16a34a; font-size: 16px; font-weight: 500;">
                          Tu progreso empresarial con IA
                        </div>
                      </div>

                      <div style="padding: 40px;">
                        
                        <div style="margin-bottom: 30px;">
                          <div style="font-size: 18px; color: #1e293b; margin-bottom: 15px;">
                            <strong>Hola {{user_name}},</strong>
                          </div>
                          
                          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                            🎉 ¡Increíbles resultados! Aquí tienes tu reporte de actividad para <strong>{{report_period}}</strong>. 
                            Tus métricas muestran un crecimiento excepcional con {{buildera_name}}.
                          </p>
                        </div>

                        <!-- Métricas principales -->
                        <div style="margin-bottom: 35px;">
                          <div style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px; text-align: center;">
                            📈 Métricas Destacadas
                          </div>
                          
                          <div style="display: grid; gap: 20px;">
                            <!-- Métrica 1 -->
                            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 16px; padding: 25px; border: 1px solid #3b82f6; position: relative; overflow: hidden;">
                              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: #3b82f620; border-radius: 50%;"></div>
                              <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                  <div style="font-size: 14px; color: #1e40af; font-weight: 500; margin-bottom: 5px;">Total de Acciones</div>
                                  <div style="font-size: 32px; font-weight: 800; color: #1e40af;">{{total_actions}}</div>
                                  <div style="font-size: 12px; color: #3b82f6;">↗️ +23% vs mes anterior</div>
                                </div>
                                <div style="width: 50px; height: 50px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                  <span style="color: white; font-size: 24px;">⚡</span>
                                </div>
                              </div>
                            </div>

                            <!-- Métrica 2 -->
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 25px; border: 1px solid #22c55e; position: relative; overflow: hidden;">
                              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: #22c55e20; border-radius: 50%;"></div>
                              <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                  <div style="font-size: 14px; color: #14532d; font-weight: 500; margin-bottom: 5px;">Nuevos Proyectos</div>
                                  <div style="font-size: 32px; font-weight: 800; color: #14532d;">{{new_projects}}</div>
                                  <div style="font-size: 12px; color: #16a34a;">🚀 Excelente progreso</div>
                                </div>
                                <div style="width: 50px; height: 50px; background: #22c55e; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                  <span style="color: white; font-size: 24px;">📊</span>
                                </div>
                              </div>
                            </div>

                            <!-- Métrica 3 -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 16px; padding: 25px; border: 1px solid #f59e0b; position: relative; overflow: hidden;">
                              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: #f59e0b20; border-radius: 50%;"></div>
                              <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                  <div style="font-size: 14px; color: #92400e; font-weight: 500; margin-bottom: 5px;">Usuarios Activos</div>
                                  <div style="font-size: 32px; font-weight: 800; color: #92400e;">{{active_users}}</div>
                                  <div style="font-size: 12px; color: #d97706;">👥 Comunidad creciente</div>
                                </div>
                                <div style="width: 50px; height: 50px; background: #f59e0b; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                  <span style="color: white; font-size: 24px;">👥</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Insights -->
                        <div style="background: linear-gradient(135deg, #fefbff 0%, #f3e8ff 100%); border-radius: 16px; padding: 25px; margin-bottom: 30px; border: 1px solid #a855f7;">
                          <div style="display: flex; align-items: center; margin-bottom: 15px;">
                            <div style="width: 40px; height: 40px; background: #a855f7; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                              <span style="color: white; font-size: 20px;">💡</span>
                            </div>
                            <div>
                              <div style="font-weight: 600; color: #581c87; font-size: 16px;">Insight del Período</div>
                              <div style="font-size: 14px; color: #7c3aed;">Análisis automático con IA</div>
                            </div>
                          </div>
                          
                          <p style="color: #581c87; font-size: 15px; line-height: 1.6; margin: 0;">
                            🎯 <strong>Excelente rendimiento:</strong> Tu actividad ha aumentado un 23% comparado con el período anterior. 
                            Los proyectos nuevos muestran una tendencia muy positiva, y la participación de usuarios está en su punto más alto.
                          </p>
                        </div>

                        <!-- CTA Principal -->
                        <div style="text-align: center; margin: 35px 0;">
                          <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);">
                            📊 Ver Dashboard Completo
                          </a>
                          <div style="margin-top: 15px; font-size: 14px; color: #64748b;">
                            Explora todos tus datos y métricas detalladas
                          </div>
                        </div>

                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; padding: 30px 0; margin-top: 40px;">
                <tr>
                  <td align="center">
                    <div style="max-width: 600px; margin: 0 auto; text-align: center;">
                      <div style="color: #94a3b8; font-size: 14px; margin-bottom: 10px;">
                        ¿Quieres reportes personalizados? <a href="mailto:analytics@buildera.io" style="color: #60a5fa;">Contáctanos</a>
                      </div>
                      <div style="color: #64748b; font-size: 12px;">
                        © {{current_year}} {{buildera_name}}. Impulsando el crecimiento empresarial con IA.
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

            </body>
            </html>
          `,
        };
      default:
        return {
          subject: "✨ {{buildera_name}} - {{subject_here}}",
          html_content: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>{{buildera_name}}</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc;">
              
              <!-- Header moderno -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 20px; display: inline-block;">
                      <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="height: 50px; width: auto; filter: brightness(0) invert(1);">
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Contenido principal -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
                      
                      <div style="padding: 40px;">
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                          <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 28px; font-weight: 800; margin-bottom: 10px;">
                            {{title_here}}
                          </div>
                          <div style="color: #64748b; font-size: 16px;">
                            Mensaje desde {{buildera_name}}
                          </div>
                        </div>

                        <div style="background: #f8fafc; border-radius: 16px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #2563eb;">
                          <div style="font-size: 16px; color: #1e293b; margin-bottom: 15px;">
                            <strong>Hola {{user_name}},</strong>
                          </div>
                          
                          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
                            {{content_here}}
                          </p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                          <div style="color: #475569; font-size: 15px; line-height: 1.6;">
                            Gracias por confiar en <strong>{{buildera_name}}</strong> para transformar tu negocio con inteligencia artificial.
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
                    <div style="max-width: 600px; margin: 0 auto; text-align: center; padding: 0 20px;">
                      <div style="color: #94a3b8; font-size: 14px; margin-bottom: 15px;">
                        ¿Necesitas ayuda? Contáctanos en <a href="mailto:soporte@buildera.io" style="color: #60a5fa;">soporte@buildera.io</a>
                      </div>
                      <div style="color: #64748b; font-size: 12px; margin-bottom: 10px;">
                        © {{current_year}} {{buildera_name}}. Revolucionando empresas con IA.
                      </div>
                      <div>
                        <a href="{{buildera_website}}" style="color: #60a5fa; text-decoration: none; font-size: 12px;">{{buildera_website}}</a>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

            </body>
            </html>
          `,
        };
    }
  };

  const handleTypeChange = (type: string) => {
    updateField("template_type", type);
    
    // Siempre cargar plantilla por defecto al cambiar tipo, a menos que ya haya contenido significativo
    const hasSignificantContent = formData.html_content.length > 100 || 
                                 formData.subject.length > 10 || 
                                 formData.name.length > 0;
    
    if (!hasSignificantContent || 
        confirm("¿Deseas cargar la plantilla predefinida? Esto reemplazará el contenido actual.")) {
      const defaultTemplate = getDefaultTemplate(type);
      if (defaultTemplate) {
        updateField("subject", defaultTemplate.subject);
        updateField("html_content", defaultTemplate.html_content);
        
        // Generar un nombre por defecto basado en el tipo
        const typeName = TEMPLATE_TYPES.find(t => t.value === type)?.label || "Plantilla";
        if (!formData.name) {
          updateField("name", `${typeName} - ${new Date().toLocaleDateString()}`);
        }
      }
    }
  };

  const previewContent = getPreviewContent();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Plantilla" : "Nueva Plantilla"}
          </DialogTitle>
          <DialogDescription>
            Crea o edita plantillas de email con variables dinámicas y ve el preview en tiempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[calc(95vh-120px)]">
          {/* Panel izquierdo - Formulario */}
          <div className="overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la plantilla</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Ej: Bienvenida nuevos usuarios"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_type">Tipo de plantilla</Label>
                  <Select value={formData.template_type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Asunto del email</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  placeholder="Ej: ¡Bienvenido a {{buildera_name}}!"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="html_content">Contenido HTML</Label>
                <Textarea
                  id="html_content"
                  value={formData.html_content}
                  onChange={(e) => updateField("html_content", e.target.value)}
                  placeholder="Contenido HTML del email con variables como {{user_name}}"
                  className="min-h-[200px] font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_content">Contenido de texto (opcional)</Label>
                <Textarea
                  id="text_content"
                  value={formData.text_content}
                  onChange={(e) => updateField("text_content", e.target.value)}
                  placeholder="Versión en texto plano del email"
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Plantilla activa</Label>
                  <p className="text-sm text-muted-foreground">
                    Esta plantilla estará disponible para envío de emails
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateField("is_active", checked)}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 text-sm">Variables disponibles</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Generales:</strong> {`{{buildera_name}}, {{buildera_logo}}, {{buildera_website}}, {{current_year}}`}</p>
                  <p><strong>Usuario:</strong> {`{{user_name}}, {{user_email}}`}</p>
                  <p><strong>URLs:</strong> {`{{login_url}}, {{dashboard_url}}, {{reset_url}}`}</p>
                  <p><strong>Reportes:</strong> {`{{report_period}}, {{total_actions}}, {{new_projects}}`}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>

          {/* Panel derecho - Preview */}
          <div className="border-l pl-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Preview del Email</h3>
              </div>

              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    HTML
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Asunto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium border p-2 rounded bg-gray-50">
                        {previewContent.subject || "Sin asunto"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Contenido del Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="border rounded p-4 bg-white min-h-[400px] overflow-auto"
                        style={{ maxHeight: '500px' }}
                        dangerouslySetInnerHTML={useSafeEmailHtml(previewContent.html || "<p>Sin contenido HTML</p>")}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="mobile" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Vista Mobile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mx-auto" style={{ width: '320px' }}>
                        <div className="border rounded-lg p-2 bg-gray-100">
                          <div className="bg-white rounded p-2 mb-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">Asunto:</p>
                            <p className="text-sm font-medium">
                              {previewContent.subject || "Sin asunto"}
                            </p>
                          </div>
                          <div 
                            className="bg-white rounded p-2 text-sm overflow-auto"
                            style={{ maxHeight: '400px', fontSize: '12px' }}
                            dangerouslySetInnerHTML={useSafeEmailHtml(previewContent.html || "<p>Sin contenido HTML</p>")}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="code" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Código HTML</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-[500px] whitespace-pre-wrap">
                        {previewContent.html || "Sin contenido HTML"}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};