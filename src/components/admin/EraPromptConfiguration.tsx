import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Edit, Trash2, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EraPromptTemplate {
  id: string;
  field_type: string;
  system_prompt: string;
  specific_instructions: string;
  max_words: number;
  tone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Profesional' },
  { value: 'inspirational', label: 'Inspiracional' },
  { value: 'aspirational', label: 'Aspiracional' },
  { value: 'persuasive', label: 'Persuasivo' },
  { value: 'principled', label: 'Basado en principios' },
  { value: 'focused', label: 'Enfocado' },
  { value: 'friendly', label: 'Amigable' },
  { value: 'technical', label: 'Técnico' },
];

const FIELD_TYPE_OPTIONS = [
  { value: 'misión', label: 'Misión' },
  { value: 'visión', label: 'Visión' },
  { value: 'valores', label: 'Valores' },
  { value: 'descripción de producto', label: 'Descripción de Producto' },
  { value: 'objetivo empresarial', label: 'Objetivo Empresarial' },
  { value: 'descripción de empresa', label: 'Descripción de Empresa' },
  { value: 'propuesta de valor', label: 'Propuesta de Valor' },
  { value: 'default', label: 'Predeterminado' },
];

export default function EraPromptConfiguration() {
  const [templates, setTemplates] = useState<EraPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EraPromptTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    field_type: '',
    system_prompt: '',
    specific_instructions: '',
    max_words: 200,
    tone: 'professional',
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('era_prompt_templates')
        .select('*')
        .order('field_type');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading prompt templates:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los templates de prompts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('era_prompt_templates')
          .update({
            system_prompt: formData.system_prompt,
            specific_instructions: formData.specific_instructions,
            max_words: formData.max_words,
            tone: formData.tone,
            is_active: formData.is_active,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Template actualizado",
          description: "El template de prompt ha sido actualizado exitosamente",
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('era_prompt_templates')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Template creado",
          description: "El nuevo template de prompt ha sido creado exitosamente",
        });
      }

      await loadTemplates();
      resetForm();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: EraPromptTemplate) => {
    setEditingTemplate(template);
    setFormData({
      field_type: template.field_type,
      system_prompt: template.system_prompt,
      specific_instructions: template.specific_instructions,
      max_words: template.max_words,
      tone: template.tone,
      is_active: template.is_active,
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este template?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('era_prompt_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Template eliminado",
        description: "El template ha sido eliminado exitosamente",
      });

      await loadTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el template",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setFormData({
      field_type: '',
      system_prompt: '',
      specific_instructions: '',
      max_words: 200,
      tone: 'professional',
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando templates de prompts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Configuración de Prompts de Era</h3>
            <p className="text-sm text-muted-foreground">
              Gestiona los prompts que utiliza Era para optimizar contenido
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Template
        </Button>
      </div>

      {/* Alert Info */}
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          Los prompts de Era definen cómo la IA optimiza diferentes tipos de contenido empresarial. 
          Personaliza estas instrucciones para adaptar el comportamiento de Era a tus necesidades específicas.
        </AlertDescription>
      </Alert>

      {/* Form for creating/editing */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTemplate ? 'Editar Template' : 'Crear Nuevo Template'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="field_type">Tipo de Campo</Label>
                  <Select 
                    value={formData.field_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, field_type: value }))}
                    disabled={!!editingTemplate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Tono</Label>
                  <Select 
                    value={formData.tone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_words">Máximo de Palabras</Label>
                  <Input
                    type="number"
                    value={formData.max_words}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_words: parseInt(e.target.value) || 200 }))}
                    min="50"
                    max="1000"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Activo</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="system_prompt">Prompt del Sistema</Label>
                <Textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                  placeholder="Define la personalidad y rol de Era..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="specific_instructions">Instrucciones Específicas</Label>
                <Textarea
                  value={formData.specific_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, specific_instructions: e.target.value }))}
                  placeholder="Instrucciones específicas para este tipo de contenido..."
                  rows={5}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving || !formData.field_type || !formData.system_prompt}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingTemplate ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="capitalize">
                    {FIELD_TYPE_OPTIONS.find(opt => opt.value === template.field_type)?.label || template.field_type}
                  </CardTitle>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge variant="outline">
                    {TONE_OPTIONS.find(opt => opt.value === template.tone)?.label || template.tone}
                  </Badge>
                  <Badge variant="outline">
                    {template.max_words} palabras max
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Prompt del Sistema:</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.system_prompt.length > 150 
                      ? `${template.system_prompt.substring(0, 150)}...`
                      : template.system_prompt
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Instrucciones Específicas:</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.specific_instructions.length > 200 
                      ? `${template.specific_instructions.substring(0, 200)}...`
                      : template.specific_instructions
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay templates configurados</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer template de prompt para Era
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}