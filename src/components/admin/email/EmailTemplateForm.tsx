import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmailTemplate, useEmailSystem } from "@/hooks/useEmailSystem";

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

  const getDefaultTemplate = (type: string) => {
    switch (type) {
      case "registration":
        return {
          subject: "¡Bienvenido a {{buildera_name}}!",
          html_content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="max-width: 200px;">
              </div>
              
              <h1 style="color: #2563eb; text-align: center;">¡Bienvenido a {{buildera_name}}!</h1>
              
              <p>Hola {{user_name}},</p>
              
              <p>¡Gracias por registrarte en {{buildera_name}}! Estamos emocionados de tenerte en nuestra plataforma.</p>
              
              <p>Tu cuenta ha sido creada exitosamente con el email: <strong>{{user_email}}</strong></p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{login_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Iniciar Sesión
                </a>
              </div>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              
              <p>¡Saludos!<br>El equipo de {{buildera_name}}</p>
              
              <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                © {{current_year}} {{buildera_name}}. Todos los derechos reservados.<br>
                <a href="{{buildera_website}}" style="color: #2563eb;">{{buildera_website}}</a>
              </p>
            </div>
          `,
        };
      case "password_reset":
        return {
          subject: "Restablecimiento de contraseña - {{buildera_name}}",
          html_content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="max-width: 200px;">
              </div>
              
              <h1 style="color: #2563eb; text-align: center;">Restablecimiento de Contraseña</h1>
              
              <p>Hola {{user_name}},</p>
              
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en {{buildera_name}}.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Restablecer Contraseña
                </a>
              </div>
              
              <p><strong>Este enlace expirará en {{expiry_time}} horas.</strong></p>
              
              <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
              
              <p>¡Saludos!<br>El equipo de {{buildera_name}}</p>
              
              <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                © {{current_year}} {{buildera_name}}. Todos los derechos reservados.
              </p>
            </div>
          `,
        };
      case "periodic_report":
        return {
          subject: "Reporte Periódico - {{report_period}} | {{buildera_name}}",
          html_content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="max-width: 200px;">
              </div>
              
              <h1 style="color: #2563eb; text-align: center;">Reporte {{report_period}}</h1>
              
              <p>Hola {{user_name}},</p>
              
              <p>Aquí tienes tu reporte de actividad para el período {{report_period}}:</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Resumen de Actividad</h3>
                <ul>
                  <li>Total de acciones: {{total_actions}}</li>
                  <li>Nuevos proyectos: {{new_projects}}</li>
                  <li>Usuarios activos: {{active_users}}</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboard_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ver Dashboard Completo
                </a>
              </div>
              
              <p>¡Gracias por usar {{buildera_name}}!</p>
              
              <p>¡Saludos!<br>El equipo de {{buildera_name}}</p>
              
              <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                © {{current_year}} {{buildera_name}}. Todos los derechos reservados.
              </p>
            </div>
          `,
        };
      default:
        return {
          subject: "{{buildera_name}} - {{subject_here}}",
          html_content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="{{buildera_logo}}" alt="{{buildera_name}}" style="max-width: 200px;">
              </div>
              
              <h1 style="color: #2563eb; text-align: center;">{{title_here}}</h1>
              
              <p>Hola {{user_name}},</p>
              
              <p>{{content_here}}</p>
              
              <p>¡Saludos!<br>El equipo de {{buildera_name}}</p>
              
              <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                © {{current_year}} {{buildera_name}}. Todos los derechos reservados.<br>
                <a href="{{buildera_website}}" style="color: #2563eb;">{{buildera_website}}</a>
              </p>
            </div>
          `,
        };
    }
  };

  const handleTypeChange = (type: string) => {
    updateField("template_type", type);
    
    if (!formData.name && !formData.subject && !formData.html_content) {
      const defaultTemplate = getDefaultTemplate(type);
      updateField("subject", defaultTemplate.subject);
      updateField("html_content", defaultTemplate.html_content);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Plantilla" : "Nueva Plantilla"}
          </DialogTitle>
          <DialogDescription>
            Crea o edita plantillas de email con variables dinámicas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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
              className="min-h-[100px]"
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Variables disponibles</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Generales:</strong> {`{{buildera_name}}, {{buildera_logo}}, {{buildera_website}}, {{current_year}}`}</p>
              <p><strong>Usuario:</strong> {`{{user_name}}, {{user_email}}`}</p>
              <p><strong>URLs:</strong> {`{{login_url}}, {{dashboard_url}}, {{reset_url}}`}</p>
              <p><strong>Reportes:</strong> {`{{report_period}}, {{total_actions}}, {{new_projects}}`}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};