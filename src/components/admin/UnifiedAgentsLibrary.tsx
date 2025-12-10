import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Search, Bot, Zap, Brain, Power, PowerOff, Star } from "lucide-react";
import { AgentIconRenderer } from "@/components/agents/AgentIconRenderer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UnifiedAgentsLibraryProps {
  onEditAgent: (agentId: string) => void;
}

interface PlatformAgent {
  id: string;
  internal_code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  agent_type: string;
  execution_type: string;
  credits_per_use: number;
  is_premium: boolean;
  is_active: boolean;
  is_onboarding_agent: boolean;
  model_name: string;
  sfia_skills: any[];
  average_sfia_level: number | null;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  marketing: { label: 'Marketing', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  analytics: { label: 'Analytics', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  content: { label: 'Contenido', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  strategy: { label: 'Estrategia', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  customer_service: { label: 'Atención', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  sales: { label: 'Ventas', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  operations: { label: 'Operaciones', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  general: { label: 'General', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
};

const AGENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  static: { label: 'Estático', icon: <Zap className="h-3 w-3" />, color: 'bg-amber-500/10 text-amber-600' },
  dynamic: { label: 'Dinámico', icon: <Brain className="h-3 w-3" />, color: 'bg-violet-500/10 text-violet-600' },
  hybrid: { label: 'Híbrido', icon: <Bot className="h-3 w-3" />, color: 'bg-emerald-500/10 text-emerald-600' },
};

export const UnifiedAgentsLibrary = ({ onEditAgent }: UnifiedAgentsLibraryProps) => {
  const [agents, setAgents] = useState<PlatformAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_agents")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setAgents((data || []) as PlatformAgent[]);
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

  const toggleAgentActive = async (agentId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("platform_agents")
        .update({ is_active: !currentActive })
        .eq("id", agentId);

      if (error) throw error;

      await loadAgents();
      toast({
        title: "Éxito",
        description: `Agente ${!currentActive ? 'activado' : 'desactivado'}`,
      });
    } catch (error) {
      console.error("Error updating agent:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el agente",
        variant: "destructive",
      });
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este agente?")) return;

    try {
      const { error } = await supabase
        .from("platform_agents")
        .delete()
        .eq("id", agentId);

      if (error) throw error;

      await loadAgents();
      toast({
        title: "Éxito",
        description: "Agente eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el agente",
        variant: "destructive",
      });
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.internal_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || agent.category === filterCategory;
    const matchesType = filterType === "all" || agent.agent_type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar agentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="static">Estático</SelectItem>
            <SelectItem value="dynamic">Dinámico</SelectItem>
            <SelectItem value="hybrid">Híbrido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-sm text-muted-foreground">Total Agentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {agents.filter(a => a.is_active).length}
            </div>
            <p className="text-sm text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-violet-600">
              {agents.filter(a => a.agent_type === 'dynamic').length}
            </div>
            <p className="text-sm text-muted-foreground">Dinámicos (SDK)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              {agents.filter(a => a.is_premium).length}
            </div>
            <p className="text-sm text-muted-foreground">Premium</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
          const categoryConfig = CATEGORY_CONFIG[agent.category] || CATEGORY_CONFIG.general;
          const typeConfig = AGENT_TYPE_CONFIG[agent.agent_type || 'static'];

          return (
            <Card key={agent.id} className={`relative ${!agent.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <AgentIconRenderer icon={agent.icon} size="lg" fallback="🤖" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <code className="text-xs text-muted-foreground">{agent.internal_code}</code>
                    </div>
                  </div>
                  {agent.is_premium && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {agent.description || "Sin descripción"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={categoryConfig.color}>
                    {categoryConfig.label}
                  </Badge>
                  <Badge variant="secondary" className={typeConfig.color}>
                    {typeConfig.icon}
                    <span className="ml-1">{typeConfig.label}</span>
                  </Badge>
                  {agent.is_onboarding_agent && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                      Onboarding
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {agent.credits_per_use} crédito{agent.credits_per_use !== 1 ? 's' : ''}
                  </span>
                  {agent.average_sfia_level && (
                    <span className="text-muted-foreground">
                      SFIA: {agent.average_sfia_level}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1">
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
                      onClick={() => toggleAgentActive(agent.id, agent.is_active)}
                    >
                      {agent.is_active ? (
                        <Power className="h-4 w-4 text-green-500" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAgent(agent.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <span className={`text-xs ${agent.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {agent.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No se encontraron agentes</h3>
          <p className="text-muted-foreground">Intenta ajustar los filtros o crea un nuevo agente</p>
        </div>
      )}
    </div>
  );
};
