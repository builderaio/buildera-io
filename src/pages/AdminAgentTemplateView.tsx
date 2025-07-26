import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Copy, Eye, Users } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ThemeSelector from '@/components/ThemeSelector';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  instructions_template: string;
  category: string;
  pricing_model: string;
  pricing_amount: number;
  icon: string;
  is_active: boolean;
  is_featured: boolean;
  version: string;
  created_at: string;
  updated_at: string;
  tools_config: any;
  permissions_template: any;
  created_by: string;
}

const AdminAgentTemplateView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [template, setTemplate] = useState<AgentTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la plantilla de agente",
        variant: "destructive",
      });
      navigate('/admin/agent-templates');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'recursos_humanos': 'bg-category-recursos-humanos/10 text-category-recursos-humanos border-category-recursos-humanos/20',
      'servicio_cliente': 'bg-category-servicio-cliente/10 text-category-servicio-cliente border-category-servicio-cliente/20',
      'contabilidad': 'bg-category-contabilidad/10 text-category-contabilidad border-category-contabilidad/20',
      'marketing': 'bg-category-marketing/10 text-category-marketing border-category-marketing/20',
      'analytics': 'bg-category-analytics/10 text-category-analytics border-category-analytics/20',
      'general': 'bg-category-general/10 text-category-general border-category-general/20',
    };
    return colors[category] || colors.general;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado al portapapeles",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando plantilla...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Plantilla no encontrada</h2>
          <p className="text-muted-foreground mb-4">La plantilla solicitada no existe</p>
          <Button onClick={() => navigate('/admin/agent-templates')}>
            Volver a Plantillas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/agent-templates')}
                className="flex items-center p-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver a Plantillas</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Ver Plantilla</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Button
                onClick={() => navigate(`/admin/agent-templates/${template.id}/edit`)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-6">
          {/* Header de la plantilla */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-3xl">{template.icon || '🤖'}</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{template.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {template.is_featured && (
                    <Badge variant="outline" className="border-warning text-warning">
                      Destacado
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">v{template.version}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de información */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información básica */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                    <p className="mt-1 text-foreground">{template.description}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Modelo de Precio</label>
                    <p className="mt-1 text-foreground capitalize">
                      {template.pricing_model === 'free' ? 'Gratis' : template.pricing_model}
                      {template.pricing_amount > 0 && ` - $${template.pricing_amount}`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                      <p className="mt-1 text-foreground">
                        {new Date(template.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Última Actualización</label>
                      <p className="mt-1 text-foreground">
                        {new Date(template.updated_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Instrucciones de la Plantilla</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(template.instructions_template)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                      {template.instructions_template}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Herramientas configuradas */}
              <Card>
                <CardHeader>
                  <CardTitle>Herramientas Configuradas</CardTitle>
                </CardHeader>
                <CardContent>
                  {template.tools_config && Array.isArray(template.tools_config) ? (
                    <div className="space-y-3">
                      {template.tools_config.map((tool: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{tool.name}</h4>
                            <Badge variant={tool.enabled ? "default" : "secondary"}>
                              {tool.enabled ? 'Habilitada' : 'Deshabilitada'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hay herramientas configuradas</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar con metadatos */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Metadatos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID de Plantilla</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                        {template.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(template.id)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                    <p className="mt-1 text-foreground capitalize">{template.category}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Versión</label>
                    <p className="mt-1 text-foreground">{template.version}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Interfaces de interacción */}
              <Card>
                <CardHeader>
                  <CardTitle>Interfaces de Interacción</CardTitle>
                </CardHeader>
                <CardContent>
                  {template.permissions_template?.interaction_interfaces ? (
                    <div className="space-y-2">
                      {Object.entries(template.permissions_template.interaction_interfaces).map(([key, interface_data]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                          <Badge variant={interface_data.enabled ? "default" : "secondary"}>
                            {interface_data.enabled ? 'Habilitada' : 'Deshabilitada'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No configuradas</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${template.is_active ? 'bg-success' : 'bg-destructive'}`} />
                      <span className="text-sm">{template.is_active ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Destacado</span>
                    <span className="text-sm">{template.is_featured ? 'Sí' : 'No'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAgentTemplateView;