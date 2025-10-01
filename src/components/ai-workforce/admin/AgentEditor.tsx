import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SfiaSkillSelector } from "./SfiaSkillSelector";

interface AgentEditorProps {
  agentId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

interface SfiaSkill {
  skill_code: string;
  level: number;
  custom_description?: string;
}

export const AgentEditor = ({ agentId, onSave, onCancel }: AgentEditorProps) => {
  const [formData, setFormData] = useState({
    internal_id: "",
    role_name: "",
    description: "",
    avatar_icon: "🤖",
    primary_function: "",
    key_skills_summary: [] as string[],
    sfia_skills: [] as SfiaSkill[],
    execution_type: "edge_function",
    execution_resource_id: "",
    is_active: true,
  });
  const [newSkillSummary, setNewSkillSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  const loadAgent = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_workforce_agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error) throw error;

      setFormData({
        internal_id: data.internal_id,
        role_name: data.role_name,
        description: data.description || "",
        avatar_icon: data.avatar_icon || "🤖",
        primary_function: data.primary_function || "",
        key_skills_summary: data.key_skills_summary || [],
        sfia_skills: (data.sfia_skills as any) || [],
        execution_type: data.execution_type || "edge_function",
        execution_resource_id: data.execution_resource_id || "",
        is_active: data.is_active,
      });
    } catch (error) {
      console.error("Error loading agent:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el agente",
        variant: "destructive",
      });
    }
  };

  const handleAddSkillSummary = () => {
    if (!newSkillSummary.trim()) return;
    setFormData({
      ...formData,
      key_skills_summary: [...formData.key_skills_summary, newSkillSummary.trim()],
    });
    setNewSkillSummary("");
  };

  const handleRemoveSkillSummary = (index: number) => {
    setFormData({
      ...formData,
      key_skills_summary: formData.key_skills_summary.filter((_, i) => i !== index),
    });
  };

  const handleAddSfiaSkill = (skill: SfiaSkill) => {
    setFormData({
      ...formData,
      sfia_skills: [...formData.sfia_skills, skill],
    });
  };

  const handleRemoveSfiaSkill = (index: number) => {
    setFormData({
      ...formData,
      sfia_skills: formData.sfia_skills.filter((_, i) => i !== index),
    });
  };

  const calculateAverageLevel = (): number | null => {
    if (formData.sfia_skills.length === 0) return null;
    const sum = formData.sfia_skills.reduce((acc, skill) => acc + skill.level, 0);
    return parseFloat((sum / formData.sfia_skills.length).toFixed(1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const agentData = {
        internal_id: formData.internal_id,
        role_name: formData.role_name,
        description: formData.description,
        avatar_icon: formData.avatar_icon,
        primary_function: formData.primary_function,
        key_skills_summary: formData.key_skills_summary,
        sfia_skills: formData.sfia_skills as any,
        average_sfia_level: calculateAverageLevel(),
        execution_type: formData.execution_type,
        execution_resource_id: formData.execution_resource_id,
        is_active: formData.is_active,
        created_by: user.id,
      };

      if (agentId) {
        const { error } = await supabase
          .from("ai_workforce_agents")
          .update(agentData)
          .eq("id", agentId);

        if (error) throw error;

        toast({
          title: "Agente actualizado",
          description: "Los cambios se han guardado correctamente",
        });
      } else {
        const { error } = await supabase
          .from("ai_workforce_agents")
          .insert(agentData);

        if (error) throw error;

        toast({
          title: "Agente creado",
          description: "El nuevo agente ha sido creado correctamente",
        });
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving agent:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el agente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="internal_id">ID Interno</Label>
              <Input
                id="internal_id"
                value={formData.internal_id}
                onChange={(e) => setFormData({ ...formData, internal_id: e.target.value })}
                placeholder="AGENT_MKTG_STRATEGIST"
                required
              />
            </div>
            <div>
              <Label htmlFor="role_name">Nombre del Rol</Label>
              <Input
                id="role_name"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                placeholder="Estratega de Marketing"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="avatar_icon">Avatar (Emoji)</Label>
              <Input
                id="avatar_icon"
                value={formData.avatar_icon}
                onChange={(e) => setFormData({ ...formData, avatar_icon: e.target.value })}
                placeholder="🧠"
              />
            </div>
            <div>
              <Label htmlFor="primary_function">Función Principal</Label>
              <Input
                id="primary_function"
                value={formData.primary_function}
                onChange={(e) => setFormData({ ...formData, primary_function: e.target.value })}
                placeholder="Define la estrategia y los KPIs"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del agente"
            />
          </div>

          <div>
            <Label>Habilidades Clave (Simplificadas)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSkillSummary}
                onChange={(e) => setNewSkillSummary(e.target.value)}
                placeholder="Ej: Análisis de Mercado"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkillSummary())}
              />
              <Button type="button" onClick={handleAddSkillSummary}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.key_skills_summary.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkillSummary(index)}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapeo de Habilidades SFIA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SfiaSkillSelector onSkillAdded={handleAddSfiaSkill} />
          
          <div className="space-y-2">
            {formData.sfia_skills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge>{skill.skill_code}</Badge>
                    <Badge variant="outline">Nivel {skill.level}</Badge>
                  </div>
                  {skill.custom_description && (
                    <p className="text-sm text-muted-foreground">{skill.custom_description}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSfiaSkill(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {formData.sfia_skills.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Nivel promedio: <strong>{calculateAverageLevel()}</strong>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración Técnica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="execution_type">Tipo de Ejecución</Label>
            <Select
              value={formData.execution_type}
              onValueChange={(value) => setFormData({ ...formData, execution_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edge_function">Edge Function</SelectItem>
                <SelectItem value="n8n_workflow">Workflow n8n</SelectItem>
                <SelectItem value="ai_chain">Cadena de Prompts IA</SelectItem>
                <SelectItem value="api_endpoint">API Endpoint Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="execution_resource_id">ID/URL del Recurso</Label>
            <Input
              id="execution_resource_id"
              value={formData.execution_resource_id}
              onChange={(e) => setFormData({ ...formData, execution_resource_id: e.target.value })}
              placeholder="https://api.example.com/webhook o function-name"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Guardando..." : agentId ? "Actualizar Agente" : "Crear Agente"}
        </Button>
      </div>
    </form>
  );
};
