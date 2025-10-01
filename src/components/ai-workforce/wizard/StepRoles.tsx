import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Brain, Palette, PenTool, BarChart3, Search, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  role_name: string;
  primary_function: string;
  key_skills_summary: string[];
  avatar_icon: string;
}

interface StepRolesProps {
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
}

const iconMap: Record<string, any> = {
  brain: Brain,
  palette: Palette,
  pen: PenTool,
  chart: BarChart3,
  search: Search,
  message: MessageCircle,
};

export const StepRoles = ({ selectedAgents, onAgentsChange }: StepRolesProps) => {
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
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
        .eq("is_active", true)
        .order("role_name");

      if (error) throw error;
      setAvailableAgents(data || []);
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

  const handleToggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      onAgentsChange(selectedAgents.filter((id) => id !== agentId));
    } else {
      onAgentsChange([...selectedAgents, agentId]);
    }
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Brain;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando agentes disponibles...</div>;
  }

  const selected = availableAgents.filter((agent) =>
    selectedAgents.includes(agent.id)
  );
  const available = availableAgents.filter(
    (agent) => !selectedAgents.includes(agent.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tu Equipo ({selected.length})</h3>
        {selected.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Selecciona agentes de la lista disponible
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selected.map((agent) => {
              const Icon = getIcon(agent.avatar_icon);
              return (
                <Card key={agent.id} className="relative">
                  <CardContent className="p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleToggleAgent(agent.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{agent.role_name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {agent.primary_function}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {agent.key_skills_summary?.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Roles Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {available.map((agent) => {
            const Icon = getIcon(agent.avatar_icon);
            return (
              <Card
                key={agent.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleToggleAgent(agent.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{agent.role_name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {agent.primary_function}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {agent.key_skills_summary?.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
