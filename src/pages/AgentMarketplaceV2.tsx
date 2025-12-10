import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Check, Coins, Zap, Brain, Bot, Lock, Sparkles, Settings, Play } from 'lucide-react';
import { AgentIconRenderer } from '@/components/agents/AgentIconRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

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
  min_plan_required: string;
  model_name: string;
  primary_function: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; gradient: string }> = {
  marketing: { label: 'Marketing', icon: '📣', gradient: 'from-blue-500 to-cyan-500' },
  analytics: { label: 'Analytics', icon: '📊', gradient: 'from-green-500 to-emerald-500' },
  content: { label: 'Contenido', icon: '✍️', gradient: 'from-purple-500 to-pink-500' },
  strategy: { label: 'Estrategia', icon: '🎯', gradient: 'from-orange-500 to-red-500' },
  customer_service: { label: 'Atención al Cliente', icon: '💬', gradient: 'from-pink-500 to-rose-500' },
  sales: { label: 'Ventas', icon: '💰', gradient: 'from-yellow-500 to-orange-500' },
  operations: { label: 'Operaciones', icon: '⚙️', gradient: 'from-cyan-500 to-blue-500' },
  general: { label: 'General', icon: '🤖', gradient: 'from-gray-500 to-slate-500' },
};

const AgentMarketplaceV2 = () => {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const { company } = useCompany();
  const [agents, setAgents] = useState<PlatformAgent[]>([]);
  const [enabledAgents, setEnabledAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const loadData = async () => {
    try {
      // Load active agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('platform_agents')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (agentsError) throw agentsError;

      // Load enabled agents for company
      if (company?.id) {
        const { data: enabledData, error: enabledError } = await supabase
          .from('company_enabled_agents')
          .select('agent_id')
          .eq('company_id', company.id);

        if (!enabledError) {
          setEnabledAgents((enabledData || []).map(e => e.agent_id));
        }
      }

      setAgents((agentsData || []) as PlatformAgent[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enableAgent = async (agent: PlatformAgent) => {
    if (!company?.id) {
      toast({
        title: "Error",
        description: "Selecciona una empresa primero",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('company_enabled_agents')
        .insert({
          company_id: company.id,
          agent_id: agent.id,
          enabled_by: user?.id
        });

      if (error) throw error;

      setEnabledAgents(prev => [...prev, agent.id]);
      toast({
        title: "¡Agente habilitado!",
        description: `${agent.name} ahora está disponible para tu empresa`,
      });
    } catch (error) {
      console.error('Error enabling agent:', error);
      toast({
        title: "Error",
        description: "No se pudo habilitar el agente",
        variant: "destructive",
      });
    }
  };

  const isAgentEnabled = (agentId: string) => enabledAgents.includes(agentId);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedByCategory = filteredAgents.reduce((acc, agent) => {
    const cat = agent.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(agent);
    return acc;
  }, {} as Record<string, PlatformAgent[]>);

  const premiumAgents = filteredAgents.filter(a => a.is_premium);
  const standardAgents = filteredAgents.filter(a => !a.is_premium);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          {t('agents.marketplace.title', 'Marketplace de Agentes IA')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          {t('agents.marketplace.subtitle', 'Habilita agentes especializados para potenciar tu negocio')}
        </motion.p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t('agents.marketplace.search', 'Buscar agentes...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Todos
          </Button>
          {Object.entries(CATEGORY_CONFIG).slice(0, 5).map(([key, config]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {config.icon} {config.label}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="all">
            <Bot className="w-4 h-4 mr-2" />
            Todos ({filteredAgents.length})
          </TabsTrigger>
          <TabsTrigger value="premium">
            <Star className="w-4 h-4 mr-2" />
            Premium ({premiumAgents.length})
          </TabsTrigger>
          <TabsTrigger value="enabled">
            <Check className="w-4 h-4 mr-2" />
            Habilitados ({enabledAgents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          {Object.entries(groupedByCategory).map(([category, categoryAgents]) => {
            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
            return (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span>{config.icon}</span>
                  {config.label}
                  <Badge variant="secondary">{categoryAgents.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isEnabled={isAgentEnabled(agent.id)}
                      onEnable={() => enableAgent(agent)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="premium">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isEnabled={isAgentEnabled(agent.id)}
                onEnable={() => enableAgent(agent)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="enabled">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents
              .filter(a => isAgentEnabled(a.id))
              .map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isEnabled={true}
                  onEnable={() => {}}
                />
              ))}
          </div>
          {enabledAgents.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tienes agentes habilitados aún</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface AgentCardProps {
  agent: PlatformAgent;
  isEnabled: boolean;
  onEnable: () => void;
}

const AgentCard = ({ agent, isEnabled, onEnable }: AgentCardProps) => {
  const navigate = useNavigate();
  const config = CATEGORY_CONFIG[agent.category] || CATEGORY_CONFIG.general;
  
  const handleConfigure = () => {
    navigate(`/company/agents/${agent.id}`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden h-full ${isEnabled ? 'ring-2 ring-primary/50' : ''}`}>
        {agent.is_premium && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
              <Star className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg text-white`}>
              <AgentIconRenderer icon={agent.icon} size="lg" fallback={config.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {agent.agent_type === 'dynamic' ? (
                    <><Brain className="w-3 h-3 mr-1" /> SDK</>
                  ) : agent.agent_type === 'hybrid' ? (
                    <><Sparkles className="w-3 h-3 mr-1" /> Híbrido</>
                  ) : (
                    <><Zap className="w-3 h-3 mr-1" /> Edge</>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="line-clamp-2 min-h-[40px]">
            {agent.description || agent.primary_function || 'Agente especializado'}
          </CardDescription>
          
          <div className="text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span>{agent.credits_per_use} crédito{agent.credits_per_use !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {isEnabled ? (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="default"
                onClick={handleConfigure}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleConfigure}
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              variant="default"
              onClick={onEnable}
            >
              {agent.is_premium ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Habilitar Premium
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Habilitar Agente
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AgentMarketplaceV2;
