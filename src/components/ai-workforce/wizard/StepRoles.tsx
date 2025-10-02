import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Brain, Palette, PenTool, BarChart3, Search, MessageCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold mb-4">Tu Equipo ({selected.length} miembros)</h3>
        {selected.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecciona agentes de la lista disponible para construir tu equipo</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selected.map((agent, idx) => {
              const Icon = getIcon(agent.avatar_icon);
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                >
                  <Card className="relative bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                    <CardContent className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 hover:bg-destructive/10"
                        onClick={() => handleToggleAgent(agent.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex items-start gap-3 pr-8">
                        <motion.div
                          className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className="h-6 w-6 text-primary" />
                        </motion.div>
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
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Roles Disponibles ({available.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
          {available.map((agent, idx) => {
            const Icon = getIcon(agent.avatar_icon);
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                  onClick={() => handleToggleAgent(agent.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <motion.div
                        className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
                        whileHover={{ rotate: 15 }}
                      >
                        <Icon className="h-6 w-6 text-primary" />
                      </motion.div>
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
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button variant="ghost" size="sm" className="text-primary">
                          <Plus className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
