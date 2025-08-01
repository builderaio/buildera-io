import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEmailSystem, EmailConfiguration, EmailTemplate, EmailSendHistory } from "@/hooks/useEmailSystem";
import { EmailConfigurationForm } from "./email/EmailConfigurationForm";
import { EmailTemplateForm } from "./email/EmailTemplateForm";
import { EmailTemplateEditor } from "./email/EmailTemplateEditor";
import { EmailHistory } from "./email/EmailHistory";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  Mail, 
  Clock, 
  CheckCircle,
  XCircle,
  FileText
} from "lucide-react";

export const EmailSystemConfig = () => {
  const [configurations, setConfigurations] = useState<EmailConfiguration[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [history, setHistory] = useState<EmailSendHistory[]>([]);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfiguration | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  
  const { toast } = useToast();
  const {
    loading,
    getEmailConfigurations,
    createEmailConfiguration,
    updateEmailConfiguration,
    deleteEmailConfiguration,
    testEmailConfiguration,
    getEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    getEmailHistory,
  } = useEmailSystem();

  const loadData = async () => {
    try {
      const [configsData, templatesData, historyData] = await Promise.all([
        getEmailConfigurations(),
        getEmailTemplates(),
        getEmailHistory(),
      ]);
      setConfigurations(configsData);
      setTemplates(templatesData);
      setHistory(historyData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestConfig = async (id: string) => {
    try {
      await testEmailConfiguration(id);
      toast({
        title: "¡Prueba exitosa!",
        description: "La configuración SMTP está funcionando correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error en la prueba",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await deleteEmailConfiguration(id);
      await loadData();
      toast({
        title: "Configuración eliminada",
        description: "La configuración de email ha sido eliminada.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteEmailTemplate(id);
      await loadData();
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla de email ha sido eliminada.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Email</h1>
          <p className="text-muted-foreground">
            Gestiona configuraciones SMTP, plantillas y envíos de email
          </p>
        </div>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configurations">Configuraciones</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Configuraciones SMTP</h2>
            <Button onClick={() => setShowConfigForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Configuración
            </Button>
          </div>

          <div className="grid gap-4">
            {configurations.map((config) => (
              <Card key={config.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription>{config.from_email}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {config.is_default && (
                      <Badge variant="secondary">Por defecto</Badge>
                    )}
                    {config.is_active ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {config.smtp_host}:{config.smtp_port}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConfig(config.id)}
                        disabled={loading}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Probar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingConfig(config);
                          setShowConfigForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Plantillas de Email</h2>
            <Button onClick={() => setShowTemplateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.subject}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{template.template_type}</Badge>
                    {template.is_active ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Variables: {template.variables.join(", ") || "Ninguna"}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateEditor(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <EmailTemplateEditor
            templates={templates}
            configurations={configurations}
            onTemplateChange={loadData}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <EmailHistory history={history} onRefresh={loadData} />
        </TabsContent>
      </Tabs>

      {showConfigForm && (
        <EmailConfigurationForm
          configuration={editingConfig}
          onClose={() => {
            setShowConfigForm(false);
            setEditingConfig(null);
          }}
          onSave={async (configData) => {
            try {
              if (editingConfig) {
                await updateEmailConfiguration(editingConfig.id, configData);
              } else {
                await createEmailConfiguration(configData as any);
              }
              await loadData();
              setShowConfigForm(false);
              setEditingConfig(null);
              toast({
                title: "Configuración guardada",
                description: "La configuración de email ha sido guardada exitosamente.",
              });
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {showTemplateForm && (
        <EmailTemplateForm
          template={editingTemplate}
          onClose={() => {
            setShowTemplateForm(false);
            setEditingTemplate(null);
          }}
          onSave={async (templateData) => {
            try {
              if (editingTemplate) {
                await updateEmailTemplate(editingTemplate.id, templateData);
              } else {
                await createEmailTemplate(templateData as any);
              }
              await loadData();
              setShowTemplateForm(false);
              setEditingTemplate(null);
              toast({
                title: "Plantilla guardada",
                description: "La plantilla de email ha sido guardada exitosamente.",
              });
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {showTemplateEditor && editingTemplate && (
        <EmailTemplateEditor
          templates={templates}
          configurations={configurations}
          selectedTemplate={editingTemplate}
          onTemplateChange={loadData}
          onClose={() => {
            setShowTemplateEditor(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
};