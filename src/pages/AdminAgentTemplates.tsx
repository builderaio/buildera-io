import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Settings, Eye, Trash2, Star } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ThemeSelector from '@/components/ThemeSelector';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing_model: string;
  pricing_amount: number;
  icon: string;
  is_active: boolean;
  is_featured: boolean;
  version: string;
  created_at: string;
  tools_config: any;
}

const AdminAgentTemplates = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas de agentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (templateId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('agent_templates')
        .update({ is_featured: !currentFeatured })
        .eq('id', templateId);

      if (error) throw error;
      
      await loadTemplates();
      toast({
        title: "Éxito",
        description: `Template ${!currentFeatured ? 'marcado como destacado' : 'removido de destacados'}`,
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el template",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (templateId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('agent_templates')
        .update({ is_active: !currentActive })
        .eq('id', templateId);

      if (error) throw error;
      
      await loadTemplates();
      toast({
        title: "Éxito",
        description: `Template ${!currentActive ? 'activado' : 'desactivado'}`,
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) return;

    try {
      const { error } = await supabase
        .from('agent_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      await loadTemplates();
      toast({
        title: "Éxito",
        description: "Template eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el template",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando plantillas...</p>
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
                onClick={() => navigate('/admin')}
                className="flex items-center p-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver al Dashboard</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Plantillas de Agentes</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-6">
          {/* Header con botón crear */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Gestión de Plantillas de Agentes</h2>
              <p className="text-muted-foreground">
                Crea y gestiona plantillas de agentes para el marketplace
              </p>
            </div>
            <Button 
              onClick={() => navigate('/admin/agent-templates/create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Plantilla
            </Button>
          </div>

          {/* Grid de plantillas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{template.icon || '🤖'}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                          {template.is_featured && (
                            <Star className="w-4 h-4 text-warning fill-current" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {template.pricing_model === 'free' ? 'Gratis' : `$${template.pricing_amount}`}
                    </span>
                    <span className="text-muted-foreground">v{template.version}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${template.is_active ? 'bg-success' : 'bg-destructive'}`} />
                      <span className="text-sm text-muted-foreground">
                        {template.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/agent-templates/${template.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/agent-templates/${template.id}/edit`)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeatured(template.id, template.is_featured)}
                      >
                        <Star className={`w-4 h-4 ${template.is_featured ? 'text-warning fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleActive(template.id, template.is_active)}
                    >
                      {template.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No hay plantillas de agentes</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera plantilla para comenzar a ofrecer agentes en el marketplace
              </p>
              <Button onClick={() => navigate('/admin/agent-templates/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Plantilla
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAgentTemplates;