import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ThemeSelector from '@/components/ThemeSelector';
import AgentTemplateVersionHistory from '@/components/admin/AgentTemplateVersionHistory';

interface AgentTemplate {
  id: string;
  name: string;
  version: string;
  icon: string;
}

const AdminAgentTemplateVersions = () => {
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
        .select('id, name, version, icon')
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

  const handleVersionRestored = () => {
    // Recargar la información de la plantilla después de restaurar una versión
    loadTemplate();
    toast({
      title: "Versión Restaurada",
      description: "La plantilla se ha actualizado con la versión restaurada",
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
                onClick={() => navigate(`/admin/agent-templates/${template.id}`)}
                className="flex items-center p-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver a Plantilla</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-lg">{template.icon || '🤖'}</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">
                    Versiones: {template.name}
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Portal Admin - Buildera
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Versión actual: v{template.version}</span>
              </div>
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AgentTemplateVersionHistory
          templateId={template.id}
          currentVersion={template.version}
          onVersionRestored={handleVersionRestored}
        />
      </main>
    </div>
  );
};

export default AdminAgentTemplateVersions;