import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate, EmailConfiguration, useEmailSystem } from "@/hooks/useEmailSystem";
import { Send, Eye } from "lucide-react";
import { useSafeEmailHtml } from "@/utils/sanitizer";

interface EmailTemplateEditorProps {
  templates: EmailTemplate[];
  configurations: EmailConfiguration[];
  selectedTemplate?: EmailTemplate;
  onTemplateChange?: () => void;
  onClose?: () => void;
}

export const EmailTemplateEditor = ({ 
  templates, 
  configurations, 
  selectedTemplate,
  onTemplateChange,
  onClose 
}: EmailTemplateEditorProps) => {
  const [templateId, setTemplateId] = useState(selectedTemplate?.id || "");
  const [configId, setConfigId] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState("");

  const { toast } = useToast();
  const { sendEmail, loading } = useEmailSystem();

  const currentTemplate = templates.find(t => t.id === templateId);

  const handlePreview = () => {
    if (!currentTemplate) return;
    
    let content = currentTemplate.html_content;
    const allVars = { ...variables, 
      buildera_name: "Buildera",
      buildera_logo: "https://buildera.io/logo.png",
      buildera_website: "https://buildera.io",
      current_year: "2024"
    };
    
    Object.entries(allVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });
    
    setPreview(content);
  };

  const handleSendTest = async () => {
    if (!templateId || !testEmail) {
      toast({
        title: "Error",
        description: "Selecciona una plantilla y proporciona un email de prueba",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendEmail({
        templateId,
        configurationId: configId || undefined,
        to: testEmail,
        variables: {
          ...variables,
          user_name: "Usuario de Prueba",
          user_email: testEmail,
        },
      });

      toast({
        title: "¡Email enviado!",
        description: "El email de prueba se envió correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error enviando email",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Editor de Plantillas</h2>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Envío</CardTitle>
            <CardDescription>
              Configura y prueba el envío de emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Plantilla</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Configuración SMTP (opcional)</Label>
              <Select value={configId} onValueChange={setConfigId}>
                <SelectTrigger>
                  <SelectValue placeholder="Usar configuración por defecto" />
                </SelectTrigger>
                <SelectContent>
                  {configurations.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email de prueba</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            {currentTemplate && currentTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Variables</Label>
                {currentTemplate.variables.map((variable) => (
                  <Input
                    key={variable}
                    placeholder={variable}
                    value={variables[variable] || ""}
                    onChange={(e) => setVariables(prev => ({
                      ...prev,
                      [variable]: e.target.value
                    }))}
                  />
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={handlePreview} 
                variant="outline"
                disabled={!currentTemplate}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              <Button 
                onClick={handleSendTest}
                disabled={loading || !templateId || !testEmail}
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Enviando..." : "Enviar Prueba"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div 
                className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={useSafeEmailHtml(preview)}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Selecciona una plantilla y haz clic en "Vista Previa" para ver el contenido
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};