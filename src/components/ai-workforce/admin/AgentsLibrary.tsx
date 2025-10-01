import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  internal_id: string;
  role_name: string;
  description: string;
  avatar_icon: string;
  sfia_skills: any;
  average_sfia_level: number;
  execution_type: string;
  is_active: boolean;
  is_featured: boolean;
}

interface AgentsLibraryProps {
  onEditAgent: (agentId: string) => void;
}

export const AgentsLibrary = ({ onEditAgent }: AgentsLibraryProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_workforce_agents")
        .select("*")
        .order("role_name");

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error loading agents:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este agente?")) return;

    try {
      const { error } = await supabase
        .from("ai_workforce_agents")
        .delete()
        .eq("id", agentId);

      if (error) throw error;

      toast({
        title: "Agente eliminado",
        description: "El agente ha sido eliminado correctamente",
      });

      loadAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el agente",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (agentId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_workforce_agents")
        .update({ is_featured: !currentValue })
        .eq("id", agentId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: !currentValue ? "Agente destacado" : "Agente ya no destacado",
      });

      loadAgents();
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando biblioteca de agentes...</div>;
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No hay agentes configurados</h3>
          <p className="text-muted-foreground">
            Crea tu primer agente para comenzar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Biblioteca de Agentes</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Rol</th>
              <th className="text-left py-3 px-4">ID Interno</th>
              <th className="text-left py-3 px-4">Habilidades SFIA</th>
              <th className="text-left py-3 px-4">Nivel Promedio</th>
              <th className="text-left py-3 px-4">Ejecución</th>
              <th className="text-left py-3 px-4">Estado</th>
              <th className="text-right py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{agent.avatar_icon || "🤖"}</span>
                    <span className="font-semibold">{agent.role_name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {agent.internal_id}
                  </code>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {agent.sfia_skills?.slice(0, 3).map((skill: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill.skill_code}
                      </Badge>
                    ))}
                    {agent.sfia_skills?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.sfia_skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge>{agent.average_sfia_level || "N/A"}</Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="outline">{agent.execution_type || "N/A"}</Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {agent.is_active && (
                      <Badge variant="default">Activo</Badge>
                    )}
                    {agent.is_featured && (
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFeatured(agent.id, agent.is_featured)}
                    >
                      <Star className={`h-4 w-4 ${agent.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditAgent(agent.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(agent.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
