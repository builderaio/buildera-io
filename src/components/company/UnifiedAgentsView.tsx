import { useState, useEffect, useMemo } from "react";
import { 
  Bot, 
  Zap, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Star,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { usePlatformAgents, PlatformAgent } from "@/hooks/usePlatformAgents";
import { useCompanyCredits } from "@/hooks/useCompanyCredits";
import { AgentInteractionPanel } from "@/components/agents/AgentInteractionPanel";
import { AgentIconRenderer } from "@/components/agents/AgentIconRenderer";
import { cn } from "@/lib/utils";

interface UnifiedAgentsViewProps {
  profile: any;
}

interface AgentUsageStats {
  agentId: string;
  totalExecutions: number;
  successRate: number;
  creditsConsumed: number;
  lastUsed: string | null;
}

const UnifiedAgentsView = ({ profile }: UnifiedAgentsViewProps) => {
  const { t } = useTranslation(['common', 'company']);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<PlatformAgent | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<Map<string, AgentUsageStats>>(new Map());
  const [activeTab, setActiveTab] = useState("mis-agentes");

  const { agents, enabledAgents: enabledAgentIds, loading: agentsLoading } = usePlatformAgents(companyId || undefined);
  const { availableCredits, refetch: refetchCredits } = useCompanyCredits(companyId || undefined, profile?.user_id);

  const enabledAgentsList = useMemo(() => 
    agents.filter(agent => enabledAgentIds.includes(agent.id)),
    [agents, enabledAgentIds]
  );

  const availableAgentsList = useMemo(() => 
    agents.filter(agent => !enabledAgentIds.includes(agent.id)),
    [agents, enabledAgentIds]
  );

  const categories = useMemo(() => {
    const cats = new Set(agents.map(a => a.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [agents]);

  useEffect(() => {
    if (profile?.user_id) {
      loadCompanyData();
    } else {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    if (companyId) {
      loadUsageStats();
    }
  }, [companyId]);

  const loadCompanyData = async () => {
    setLoading(true);
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('created_by', profile.user_id)
        .maybeSingle();
      
      setCompanyId(company?.id || null);
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    if (!companyId) return;

    try {
      const { data: logs } = await supabase
        .from('agent_usage_log')
        .select('agent_id, status, credits_consumed, created_at')
        .eq('company_id', companyId);

      if (logs) {
        const statsMap = new Map<string, AgentUsageStats>();
        
        logs.forEach(log => {
          if (!log.agent_id) return;
          
          const existing = statsMap.get(log.agent_id) || {
            agentId: log.agent_id,
            totalExecutions: 0,
            successRate: 0,
            creditsConsumed: 0,
            lastUsed: null,
          };
          
          existing.totalExecutions++;
          existing.creditsConsumed += log.credits_consumed || 0;
          
          if (!existing.lastUsed || new Date(log.created_at) > new Date(existing.lastUsed)) {
            existing.lastUsed = log.created_at;
          }
          
          statsMap.set(log.agent_id, existing);
        });

        // Calculate success rates
        statsMap.forEach((stats, agentId) => {
          const agentLogs = logs.filter(l => l.agent_id === agentId);
          const successCount = agentLogs.filter(l => l.status === 'completed').length;
          stats.successRate = agentLogs.length > 0 ? Math.round((successCount / agentLogs.length) * 100) : 0;
        });

        setUsageStats(statsMap);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const handleAgentClick = (agent: PlatformAgent) => {
    setSelectedAgent(agent);
    setAgentPanelOpen(true);
  };

  const filteredAgents = (agentList: PlatformAgent[]) => {
    return agentList.filter(agent => {
      const matchesSearch = !searchQuery || 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
    return `${Math.floor(diffDays / 30)}m`;
  };

  const AgentCard = ({ agent, isEnabled }: { agent: PlatformAgent; isEnabled: boolean }) => {
    const stats = usageStats.get(agent.id);
    
    return (
      <Card 
        className={cn(
          "group cursor-pointer transition-all hover:shadow-md",
          isEnabled ? "hover:border-primary/50" : "hover:border-secondary/50"
        )}
        onClick={() => handleAgentClick(agent)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isEnabled 
                ? "bg-gradient-to-br from-primary/20 to-secondary/20" 
                : "bg-muted"
            )}>
              <AgentIconRenderer icon={agent.icon} className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{agent.name}</h3>
                {isEnabled && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {agent.description}
              </p>
              
              <div className="flex items-center gap-3 text-xs">
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  <Zap className="w-3 h-3 mr-1" />
                  {agent.credits_per_use || 1} cr
                </Badge>
                
                {stats && isEnabled && (
                  <>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stats.totalExecutions}x
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(stats.lastUsed)}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading || agentsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="w-8 h-8 animate-pulse text-primary mx-auto" />
          <p className="text-muted-foreground">{t('common:status.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Mis Agentes</h1>
          <p className="text-sm text-muted-foreground">
            {enabledAgentsList.length} agentes activos de {agents.length} disponibles
          </p>
        </div>
        
        <Badge variant="outline" className="w-fit h-8 px-3 gap-2 text-sm bg-amber-500/10 border-amber-500/30 text-amber-600">
          <Zap className="w-4 h-4" />
          {availableCredits} créditos disponibles
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="shrink-0"
            >
              {cat === 'all' ? 'Todos' : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="mis-agentes" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Mis Agentes ({enabledAgentsList.length})
          </TabsTrigger>
          <TabsTrigger value="descubrir" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Descubrir ({availableAgentsList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mis-agentes" className="mt-4">
          {filteredAgents(enabledAgentsList).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredAgents(enabledAgentsList).map((agent) => (
                <AgentCard key={agent.id} agent={agent} isEnabled={true} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-medium mb-1">No tienes agentes habilitados</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Explora el catálogo para activar agentes que te ayuden
                </p>
                <Button onClick={() => setActiveTab('descubrir')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Descubrir Agentes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="descubrir" className="mt-4">
          {filteredAgents(availableAgentsList).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredAgents(availableAgentsList).map((agent) => (
                <AgentCard key={agent.id} agent={agent} isEnabled={false} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/30 mb-4" />
                <h3 className="font-medium">¡Ya tienes todos los agentes!</h3>
                <p className="text-sm text-muted-foreground">
                  Has habilitado todos los agentes disponibles
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Agent Interaction Panel */}
      <AgentInteractionPanel
        agent={selectedAgent}
        isOpen={agentPanelOpen}
        onClose={() => {
          setAgentPanelOpen(false);
          setSelectedAgent(null);
        }}
        isEnabled={selectedAgent ? enabledAgentIds.includes(selectedAgent.id) : false}
        creditsAvailable={availableCredits}
        companyId={companyId || undefined}
        userId={profile?.user_id}
        onExecutionComplete={() => {
          refetchCredits();
          loadUsageStats();
        }}
      />
    </div>
  );
};

export default UnifiedAgentsView;
