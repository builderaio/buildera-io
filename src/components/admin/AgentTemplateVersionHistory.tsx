import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { History, RotateCcw, Eye, Calendar, User, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: string;
  name: string;
  description: string;
  instructions_template: string;
  category: string;
  pricing_model: string;
  pricing_amount: number;
  icon: string;
  tools_config: any;
  permissions_template: any;
  is_active: boolean;
  is_featured: boolean;
  created_by: string;
  change_notes: string;
  created_at: string;
}

interface AgentTemplateVersionHistoryProps {
  templateId: string;
  currentVersion: string;
  onVersionRestored: () => void;
}

const AgentTemplateVersionHistory: React.FC<AgentTemplateVersionHistoryProps> = ({
  templateId,
  currentVersion,
  onVersionRestored
}) => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState('');

  useEffect(() => {
    loadVersions();
  }, [templateId]);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las versiones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewVersion = (currentVer: string): string => {
    const parts = currentVer.split('.');
    const major = parseInt(parts[0]) || 1;
    const minor = parseInt(parts[1]) || 0;
    const patch = parseInt(parts[2]) || 0;
    
    return `${major}.${minor}.${patch + 1}`;
  };

  const handleRestore = async (versionToRestore: TemplateVersion) => {
    if (!restoreVersion.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un número de versión válido",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('restore_agent_template_version', {
        template_id_param: templateId,
        version_number_param: versionToRestore.version_number,
        new_version_param: restoreVersion
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Plantilla restaurada a versión ${versionToRestore.version_number} como ${restoreVersion}`,
      });

      setSelectedVersion(null);
      setRestoreVersion('');
      onVersionRestored();
      loadVersions();
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: "Error",
        description: "No se pudo restaurar la versión",
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Historial de Versiones</h3>
        <Badge variant="outline">{versions.length} versiones</Badge>
      </div>

      {versions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay versiones en el historial</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <Card key={version.id} className={`transition-all ${version.version_number === currentVersion ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm">{version.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">v{version.version_number}</span>
                          {version.version_number === currentVersion && (
                            <Badge variant="default">Actual</Badge>
                          )}
                          <Badge variant="outline" className={getCategoryColor(version.category)}>
                            {version.category}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm">{version.name}</h4>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {version.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(version.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {version.change_notes && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {version.change_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {version.version_number !== currentVersion && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRestoreVersion(generateNewVersion(currentVersion))}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restaurar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restaurar Versión</AlertDialogTitle>
                            <AlertDialogDescription>
                              Vas a restaurar la plantilla a la versión {version.version_number}. 
                              Esto creará una nueva versión con el contenido seleccionado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <div className="space-y-2">
                            <Label htmlFor="newVersion">Nueva versión:</Label>
                            <Input
                              id="newVersion"
                              value={restoreVersion}
                              onChange={(e) => setRestoreVersion(e.target.value)}
                              placeholder="Ej: 1.0.1"
                            />
                          </div>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRestore(version)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              Restaurar Versión
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para ver detalles de versión */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedVersion?.icon}</span>
              Ver Versión v{selectedVersion?.version_number}
            </DialogTitle>
            <DialogDescription>
              Detalles completos de esta versión de la plantilla
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedVersion.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Categoría</Label>
                  <Badge variant="outline" className={getCategoryColor(selectedVersion.category)}>
                    {selectedVersion.category}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                <p className="mt-1">{selectedVersion.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Instrucciones</Label>
                <div className="mt-1 bg-muted p-3 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {selectedVersion.instructions_template}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Precio</Label>
                  <p>{selectedVersion.pricing_model === 'free' ? 'Gratis' : `$${selectedVersion.pricing_amount}`}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <Badge variant={selectedVersion.is_active ? "default" : "secondary"}>
                    {selectedVersion.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Destacado</Label>
                  <p>{selectedVersion.is_featured ? 'Sí' : 'No'}</p>
                </div>
              </div>

              {selectedVersion.change_notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notas de la Versión</Label>
                  <p className="mt-1 italic">{selectedVersion.change_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentTemplateVersionHistory;