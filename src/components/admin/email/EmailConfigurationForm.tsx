import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Wifi } from "lucide-react";
import { EmailConfiguration, useEmailSystem } from "@/hooks/useEmailSystem";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailConfigurationFormProps {
  configuration?: EmailConfiguration | null;
  onClose: () => void;
  onSave: (config: Partial<EmailConfiguration>) => Promise<void>;
}

export const EmailConfigurationForm = ({ configuration, onClose, onSave }: EmailConfigurationFormProps) => {
  const { testEmailConfiguration } = useEmailSystem();
  const [formData, setFormData] = useState({
    name: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
    smtp_secure: true,
    from_email: "",
    from_name: "",
    is_active: true,
    is_default: false,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (configuration) {
      setFormData({
        name: configuration.name,
        smtp_host: configuration.smtp_host,
        smtp_port: configuration.smtp_port,
        smtp_user: configuration.smtp_user,
        smtp_password: configuration.smtp_password,
        smtp_secure: configuration.smtp_secure,
        from_email: configuration.from_email,
        from_name: configuration.from_name,
        is_active: configuration.is_active,
        is_default: configuration.is_default,
      });
    }
  }, [configuration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear test result when configuration changes
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!formData.smtp_host || !formData.smtp_user || !formData.smtp_password) {
      toast.error("Por favor completa todos los campos obligatorios antes de probar la conexión");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test the configuration directly using the edge function
      const { data, error } = await supabase.functions.invoke('send-buildera-email', {
        body: {
          to: formData.from_email,
          subject: 'Prueba de Configuración SMTP - Buildera',
          htmlContent: `
            <h2>Prueba de Configuración SMTP</h2>
            <p>Este correo confirma que tu configuración SMTP está funcionando correctamente.</p>
            <p><strong>Configuración probada:</strong></p>
            <ul>
              <li>Servidor: ${formData.smtp_host}:${formData.smtp_port}</li>
              <li>Usuario: ${formData.smtp_user}</li>
              <li>Seguro: ${formData.smtp_secure ? 'Sí' : 'No'}</li>
            </ul>
            <p>Si recibes este email, tu configuración es válida.</p>
          `,
          configuration: formData,
          test: true
        }
      });

      if (error) throw error;

      setTestResult({ 
        success: true, 
        message: "Conexión exitosa. Los parámetros SMTP son válidos." 
      });
      toast.success("Conexión SMTP verificada correctamente");
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.message || "Error al conectar con el servidor SMTP" 
      });
      toast.error("Error en la conexión SMTP");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {configuration ? "Editar Configuración" : "Nueva Configuración"}
          </DialogTitle>
          <DialogDescription>
            Configura los parámetros del servidor SMTP para el envío de emails.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la configuración</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Gmail, Outlook, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_name">Nombre del remitente</Label>
              <Input
                id="from_name"
                value={formData.from_name}
                onChange={(e) => updateField("from_name", e.target.value)}
                placeholder="Buildera"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from_email">Email del remitente</Label>
            <Input
              id="from_email"
              type="email"
              value={formData.from_email}
              onChange={(e) => updateField("from_email", e.target.value)}
              placeholder="noreply@buildera.io"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">Servidor SMTP</Label>
              <Input
                id="smtp_host"
                value={formData.smtp_host}
                onChange={(e) => updateField("smtp_host", e.target.value)}
                placeholder="smtp.gmail.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_port">Puerto</Label>
              <Input
                id="smtp_port"
                type="number"
                value={formData.smtp_port}
                onChange={(e) => updateField("smtp_port", parseInt(e.target.value))}
                placeholder="587"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_user">Usuario SMTP</Label>
              <Input
                id="smtp_user"
                value={formData.smtp_user}
                onChange={(e) => updateField("smtp_user", e.target.value)}
                placeholder="usuario@gmail.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_password">Contraseña SMTP</Label>
              <Input
                id="smtp_password"
                type="password"
                value={formData.smtp_password}
                onChange={(e) => updateField("smtp_password", e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Test Connection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Prueba de Conexión</Label>
                <p className="text-sm text-muted-foreground">
                  Verifica que los parámetros SMTP son correctos
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !formData.smtp_host || !formData.smtp_user || !formData.smtp_password}
              >
                <Wifi className="w-4 h-4 mr-2" />
                {testing ? "Probando..." : "Probar Conexión"}
              </Button>
            </div>

            {testResult && (
              <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    {testResult.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Conexión segura (TLS/SSL)</Label>
                <p className="text-sm text-muted-foreground">
                  Utilizar encriptación para la conexión SMTP
                </p>
              </div>
              <Switch
                checked={formData.smtp_secure}
                onCheckedChange={(checked) => updateField("smtp_secure", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Configuración activa</Label>
                <p className="text-sm text-muted-foreground">
                  Esta configuración estará disponible para envío de emails
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField("is_active", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Configuración por defecto</Label>
                <p className="text-sm text-muted-foreground">
                  Usar esta configuración cuando no se especifique otra
                </p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => updateField("is_default", checked)}
              />
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