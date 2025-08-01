import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmailConfiguration } from "@/hooks/useEmailSystem";

interface EmailConfigurationFormProps {
  configuration?: EmailConfiguration | null;
  onClose: () => void;
  onSave: (config: Partial<EmailConfiguration>) => Promise<void>;
}

export const EmailConfigurationForm = ({ configuration, onClose, onSave }: EmailConfigurationFormProps) => {
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