import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react';
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
  tools_config: any;
  permissions_template: any;
}

const AdminAgentTemplateEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [template, setTemplate] = useState<AgentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions_template: '',
    category: '',
    pricing_model: 'free',
    pricing_amount: 0,
    icon: '',
    is_active: true,
    is_featured: false,
    version: '1.0.0'
  });

  const categories = [
    { value: 'recursos_humanos', label: 'Recursos Humanos' },
    { value: 'servicio_cliente', label: 'Servicio al Cliente' },
    { value: 'contabilidad', label: 'Contabilidad' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'general', label: 'General' }
  ];

  const pricingModels = [
    { value: 'free', label: 'Gratis' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' }
  ];

  const icons = [
    { emoji: '🤖', name: 'Robot' },
    { emoji: '🧠', name: 'Cerebro' },
    { emoji: '💼', name: 'Negocios' },
    { emoji: '📊', name: 'Analytics' },
    { emoji: '🔍', name: 'Investigación' },
    { emoji: '⚡', name: 'Automatización' },
    { emoji: '🎯', name: 'Objetivos' },
    { emoji: '🚀', name: 'Productividad' },
    { emoji: '💡', name: 'Ideas' },
    { emoji: '🔧', name: 'Herramientas' },
    { emoji: '👥', name: 'Recursos Humanos' },
    { emoji: '💬', name: 'Comunicación' },
    { emoji: '📈', name: 'Crecimiento' },
    { emoji: '🏆', name: 'Éxito' },
    { emoji: '📱', name: 'Digital' },
    { emoji: '💳', name: 'Finanzas' },
    { emoji: '📋', name: 'Gestión' },
    { emoji: '🌐', name: 'Global' },
    { emoji: '📞', name: 'Soporte' },
    { emoji: '🔒', name: 'Seguridad' }
  ];

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
      setFormData({
        name: data.name || '',
        description: data.description || '',
        instructions_template: data.instructions_template || '',
        category: data.category || '',
        pricing_model: data.pricing_model || 'free',
        pricing_amount: data.pricing_amount || 0,
        icon: data.icon || '',
        is_active: data.is_active ?? true,
        is_featured: data.is_featured ?? false,
        version: data.version || '1.0.0'
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('agent_templates')
        .update({
          name: formData.name,
          description: formData.description,
          instructions_template: formData.instructions_template,
          category: formData.category,
          pricing_model: formData.pricing_model,
          pricing_amount: formData.pricing_amount,
          icon: formData.icon,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          version: formData.version,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Plantilla actualizada correctamente",
      });

      navigate(`/admin/agent-templates/${template.id}`);
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la plantilla",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async () => {
    if (!template) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('agent_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Plantilla eliminada correctamente",
      });

      navigate('/admin/agent-templates');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla",
        variant: "destructive",
      });
    }
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
                <span className="hidden sm:inline">Cancelar</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-lg">{formData.icon || '🤖'}</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">
                    Editar: {formData.name || 'Sin nombre'}
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/agent-templates/${template.id}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteTemplate}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Configura la información principal de la plantilla de agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Plantilla</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Asistente de Marketing IA"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="icon">Icono del Agente</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {icons.map(iconData => (
                      <button
                        key={iconData.emoji}
                        type="button"
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:border-primary transition-colors ${
                          formData.icon === iconData.emoji ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                        onClick={() => setFormData({ ...formData, icon: iconData.emoji })}
                        title={iconData.name}
                      >
                        {iconData.emoji}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seleccionado: {formData.icon} {icons.find(i => i.emoji === formData.icon)?.name || 'Desconocido'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe las capacidades y funciones de este agente..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing_model">Modelo de Precio</Label>
                  <Select 
                    value={formData.pricing_model} 
                    onValueChange={(value) => setFormData({ ...formData, pricing_model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing_amount">Precio ($)</Label>
                  <Input
                    id="pricing_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricing_amount}
                    onChange={(e) => setFormData({ ...formData, pricing_amount: parseFloat(e.target.value) || 0 })}
                    disabled={formData.pricing_model === 'free'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Versión</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0.0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Instrucciones */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones de la Plantilla</CardTitle>
              <CardDescription>
                Define las instrucciones base que recibirá el agente. Usa variables entre llaves dobles para valores dinámicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions_template}
                  onChange={(e) => setFormData({ ...formData, instructions_template: e.target.value })}
                  placeholder="Eres un asistente especializado en {{area}}. Tu misión es..."
                  rows={10}
                  className="font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Variables disponibles: company_name, company_context, industry, etc. (usar entre llaves dobles)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estado y configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Estado y Configuración</CardTitle>
              <CardDescription>
                Configura el estado y visibilidad de la plantilla
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Plantilla Activa</Label>
                  <p className="text-sm text-muted-foreground">
                    Si está activa, aparecerá en el marketplace para las empresas
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_featured">Plantilla Destacada</Label>
                  <p className="text-sm text-muted-foreground">
                    Las plantillas destacadas aparecen primero en el marketplace
                  </p>
                </div>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/agent-templates/${template.id}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminAgentTemplateEdit;