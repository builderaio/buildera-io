import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Target, Plus, Edit, Trash2 } from "lucide-react";
import CompanyProfileForm from "./CompanyProfileForm";

interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const ADNEmpresa = ({ profile, onProfileUpdate }: ADNEmpresaProps) => {
  const [objectives, setObjectives] = useState<any[]>([]);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [objectiveForm, setObjectiveForm] = useState({
    title: "",
    description: "",
    objective_type: "financial",
    priority: 1,
    target_date: ""
  });
  const [loadingObjectives, setLoadingObjectives] = useState(false);
  
  const { toast } = useToast();

  // Cargar objetivos al montar el componente
  useEffect(() => {
    if (profile?.user_id) {
      fetchObjectives();
    }
  }, [profile?.user_id]);

  // Funciones para la gestión de objetivos
  const fetchObjectives = async () => {
    try {
      const { data, error } = await supabase
        .from('company_objectives')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setObjectives(data || []);
    } catch (error: any) {
      console.error('Error fetching objectives:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los objetivos",
        variant: "destructive",
      });
    }
  };

  const handleSaveObjective = async () => {
    if (!objectiveForm.title.trim()) {
      toast({
        title: "Error",
        description: "El título del objetivo es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setLoadingObjectives(true);
    try {
      if (editingObjective) {
        // Actualizar objetivo existente
        const { error } = await supabase
          .from('company_objectives')
          .update({
            title: objectiveForm.title,
            description: objectiveForm.description,
            objective_type: objectiveForm.objective_type,
            priority: objectiveForm.priority,
            target_date: objectiveForm.target_date || null
          })
          .eq('id', editingObjective.id)
          .eq('user_id', profile?.user_id);

        if (error) throw error;

        toast({
          title: "Objetivo actualizado",
          description: "El objetivo se ha actualizado correctamente",
        });
      } else {
        // Crear nuevo objetivo
        const { error } = await supabase
          .from('company_objectives')
          .insert({
            user_id: profile?.user_id,
            title: objectiveForm.title,
            description: objectiveForm.description,
            objective_type: objectiveForm.objective_type,
            priority: objectiveForm.priority,
            target_date: objectiveForm.target_date || null
          });

        if (error) throw error;

        toast({
          title: "Objetivo creado",
          description: "El objetivo se ha creado correctamente",
        });
      }

      // Recargar objetivos y cerrar formulario
      await fetchObjectives();
      handleCancelObjectiveForm();
    } catch (error: any) {
      console.error('Error saving objective:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el objetivo",
        variant: "destructive",
      });
    } finally {
      setLoadingObjectives(false);
    }
  };

  const handleEditObjective = (objective: any) => {
    setEditingObjective(objective);
    setObjectiveForm({
      title: objective.title,
      description: objective.description || "",
      objective_type: objective.objective_type,
      priority: objective.priority,
      target_date: objective.target_date || ""
    });
    setShowObjectiveForm(true);
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este objetivo?")) {
      return;
    }

    setLoadingObjectives(true);
    try {
      const { error } = await supabase
        .from('company_objectives')
        .delete()
        .eq('id', objectiveId)
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      toast({
        title: "Objetivo eliminado",
        description: "El objetivo se ha eliminado correctamente",
      });

      await fetchObjectives();
    } catch (error: any) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el objetivo",
        variant: "destructive",
      });
    } finally {
      setLoadingObjectives(false);
    }
  };

  const handleCancelObjectiveForm = () => {
    setShowObjectiveForm(false);
    setEditingObjective(null);
    setObjectiveForm({
      title: "",
      description: "",
      objective_type: "financial",
      priority: 1,
      target_date: ""
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
          <Building2 className="h-10 w-10 text-primary" />
          ADN de la Empresa
        </h1>
        <p className="text-lg text-muted-foreground">
          Define la identidad y objetivos estratégicos de tu empresa
        </p>
      </div>

      <Tabs defaultValue="informacion" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="informacion">Información de {profile?.company_name || "la Empresa"}</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos Empresariales</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de {profile?.company_name || "la Empresa"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyProfileForm profile={profile} onProfileUpdate={onProfileUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objetivos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Objetivos Empresariales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  Define los objetivos estratégicos de tu empresa
                </p>
                <Button onClick={() => setShowObjectiveForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Objetivo
                </Button>
              </div>

              {showObjectiveForm && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingObjective ? "Editar Objetivo" : "Nuevo Objetivo"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título del Objetivo *</Label>
                      <Input
                        id="title"
                        value={objectiveForm.title}
                        onChange={(e) => setObjectiveForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ej: Aumentar ventas en un 20%"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={objectiveForm.description}
                        onChange={(e) => setObjectiveForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe en detalle este objetivo..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="type">Tipo de Objetivo</Label>
                        <select
                          id="type"
                          className="w-full p-2 border rounded-md"
                          value={objectiveForm.objective_type}
                          onChange={(e) => setObjectiveForm(prev => ({ ...prev, objective_type: e.target.value }))}
                        >
                          <option value="financial">Financiero</option>
                          <option value="operational">Operacional</option>
                          <option value="growth">Crecimiento</option>
                          <option value="market">Mercado</option>
                          <option value="customer">Cliente</option>
                          <option value="innovation">Innovación</option>
                          <option value="sustainability">Sostenibilidad</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="priority">Prioridad</Label>
                        <select
                          id="priority"
                          className="w-full p-2 border rounded-md"
                          value={objectiveForm.priority}
                          onChange={(e) => setObjectiveForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                        >
                          <option value={1}>Alta</option>
                          <option value={2}>Media</option>
                          <option value={3}>Baja</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="target_date">Fecha Objetivo</Label>
                        <Input
                          id="target_date"
                          type="date"
                          value={objectiveForm.target_date}
                          onChange={(e) => setObjectiveForm(prev => ({ ...prev, target_date: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveObjective} disabled={loadingObjectives}>
                        {loadingObjectives ? "Guardando..." : editingObjective ? "Actualizar" : "Crear"}
                      </Button>
                      <Button variant="outline" onClick={handleCancelObjectiveForm}>
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {objectives.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay objetivos definidos</p>
                    <p className="text-sm">Comienza agregando el primer objetivo de tu empresa</p>
                  </div>
                ) : (
                  objectives.map((objective) => (
                    <Card key={objective.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{objective.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                objective.priority === 1 ? 'bg-red-100 text-red-700' :
                                objective.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {objective.priority === 1 ? 'Alta' : objective.priority === 2 ? 'Media' : 'Baja'}
                              </span>
                            </div>
                            {objective.description && (
                              <p className="text-muted-foreground text-sm mb-2">{objective.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="capitalize">{objective.objective_type}</span>
                              {objective.target_date && (
                                <span>Meta: {new Date(objective.target_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditObjective(objective)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteObjective(objective.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ADNEmpresa;