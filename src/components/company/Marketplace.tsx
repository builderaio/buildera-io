import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, Star, Plus, Filter, TrendingUp, Target, BarChart3, 
  MessageCircle, Users, Lightbulb, Calculator, Settings, Crown,
  Zap, Heart, ShoppingCart, Brain
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  detailed_description: string;
  category_id: string;
  capabilities: string[];
  use_cases: string[];
  pricing_model: string;
  price_per_use: number;
  monthly_price: number;
  avatar_url?: string;
  is_active: boolean;
  popularity_score: number;
  rating: number;
  total_ratings: number;
  model_provider: string;
  model_name: string;
  sample_conversations: any[];
}

interface UserAgent {
  id: string;
  agent_id: string;
  custom_name?: string;
  is_favorite: boolean;
  usage_count: number;
}

const Marketplace: React.FC = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<AgentCategory[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AIAgent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [agents, selectedCategory, searchQuery]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Cargar plantillas de agentes activas desde el portal admin
      const { data: templatesData, error: templatesError } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Crear categorías únicas basadas en las plantillas
      const uniqueCategories = [...new Set((templatesData || []).map(t => t.category))].map(category => ({
        id: category,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        description: `Agentes especializados en ${category}`,
        icon: 'TrendingUp',
        color: 'primary'
      }));

      setCategories(uniqueCategories);

      // Transformar las plantillas al formato esperado por el marketplace
      const transformedAgents = (templatesData || []).map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        detailed_description: template.description,
        category_id: template.category,
        capabilities: Array.isArray(template.tools_config) ? template.tools_config.map((tool: any) => tool.name || tool.type || 'Herramienta') : [],
        use_cases: [template.description],
        pricing_model: template.pricing_model,
        price_per_use: template.pricing_amount || 0,
        monthly_price: template.pricing_amount || 0,
        avatar_url: undefined,
        is_active: template.is_active,
        popularity_score: template.is_featured ? 100 : 50,
        rating: 4.5,
        total_ratings: 10,
        model_provider: 'OpenAI',
        model_name: 'GPT-4',
        sample_conversations: []
      }));

      setAgents(transformedAgents);

      // Load user agents separately if user exists
      if (user) {
        const { data: userAgentsData, error: userAgentsError } = await supabase
          .from('user_agents')
          .select('*')
          .eq('user_id', user.id);
        
        if (userAgentsError) throw userAgentsError;
        setUserAgents(userAgentsData || []);
      } else {
        setUserAgents([]);
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast({
        title: "Error",
        description: "Error cargando el marketplace de agentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = agents;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(agent => agent.category_id === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredAgents(filtered);
  };

  const addAgentToWorkspace = async (agentId: string) => {
    if (!user) {
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para agregar agentes",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_agents')
        .insert({
          user_id: user.id,
          agent_id: agentId
        });

      if (error) throw error;

      await loadData(); // Recargar datos
      
      toast({
        title: "Agente agregado",
        description: "El agente ha sido agregado a tu workspace",
      });
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: "Agente ya agregado",
          description: "Este agente ya está en tu workspace",
          variant: "destructive",
        });
      } else {
        console.error('Error adding agent:', error);
        toast({
          title: "Error",
          description: "Error agregando el agente",
          variant: "destructive",
        });
      }
    }
  };

  const toggleFavorite = async (userAgentId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('user_agents')
        .update({ is_favorite: !isFavorite })
        .eq('id', userAgentId);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      TrendingUp, Target, BarChart3, MessageCircle, Users, 
      Lightbulb, Calculator, Settings, Crown, Zap, Brain
    };
    return icons[iconName] || TrendingUp;
  };

  const getPricingBadge = (agent: AIAgent) => {
    switch (agent.pricing_model) {
      case 'free':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Gratis</Badge>;
      case 'freemium':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Freemium</Badge>;
      case 'premium':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Premium</Badge>;
      case 'usage-based':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Por uso</Badge>;
      default:
        return <Badge variant="secondary">Freemium</Badge>;
    }
  };

  const isAgentAdded = (agentId: string) => {
    return userAgents.some(ua => ua.agent_id === agentId);
  };

  const getUserAgent = (agentId: string) => {
    return userAgents.find(ua => ua.agent_id === agentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Cargando marketplace...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text">Marketplace de Agentes IA</h1>
        <p className="text-muted-foreground mt-2">
          Descubre y agrega agentes especializados para potenciar tu negocio
        </p>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar agentes por nombre, descripción o capacidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              {category.name.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{agents.length}</div>
                <div className="text-sm text-muted-foreground">Agentes disponibles</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{categories.length}</div>
                <div className="text-sm text-muted-foreground">Categorías</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{userAgents.length}</div>
                <div className="text-sm text-muted-foreground">En tu workspace</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {agents.filter(a => a.pricing_model === 'free' || a.pricing_model === 'freemium').length}
                </div>
                <div className="text-sm text-muted-foreground">Gratis/Freemium</div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de agentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => {
              const IconComponent = getIconComponent(
                categories.find(c => c.id === agent.category_id)?.icon || 'TrendingUp'
              );
              const userAgent = getUserAgent(agent.id);
              const isAdded = isAgentAdded(agent.id);

              return (
                <Card key={agent.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={agent.avatar_url} />
                          <AvatarFallback>
                            <IconComponent className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">{agent.rating}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({agent.total_ratings})
                              </span>
                            </div>
                            {getPricingBadge(agent)}
                          </div>
                        </div>
                      </div>
                      {isAdded && userAgent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(userAgent.id, userAgent.is_favorite)}
                        >
                          <Heart 
                            className={`h-4 w-4 ${userAgent.is_favorite ? 'fill-red-500 text-red-500' : ''}`} 
                          />
                        </Button>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Capacidades destacadas */}
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map(capability => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.capabilities.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedAgent(agent)}
                          >
                            Ver detalles
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      
                      {isAdded ? (
                        <Button variant="secondary" size="sm" disabled className="flex-1">
                          <div className="flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Agregado
                          </div>
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => addAgentToWorkspace(agent.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No se encontraron agentes</h3>
              <p className="text-muted-foreground">
                Intenta con otros términos de búsqueda o selecciona una categoría diferente
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de detalles del agente */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedAgent.avatar_url} />
                  <AvatarFallback>
                    {React.createElement(getIconComponent(
                      categories.find(c => c.id === selectedAgent.category_id)?.icon || 'TrendingUp'
                    ), { className: "h-6 w-6" })}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div>{selectedAgent.name}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm">{selectedAgent.rating}</span>
                    </div>
                    {getPricingBadge(selectedAgent)}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                {selectedAgent.detailed_description || selectedAgent.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Capacidades */}
              <div>
                <h4 className="font-semibold mb-3">Capacidades principales</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAgent.capabilities.map(capability => (
                    <div key={capability} className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm">{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Casos de uso */}
              <div>
                <h4 className="font-semibold mb-3">Casos de uso</h4>
                <div className="space-y-2">
                  {selectedAgent.use_cases.map(useCase => (
                    <div key={useCase} className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-secondary" />
                      <span className="text-sm">{useCase}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversación de ejemplo */}
              {selectedAgent.sample_conversations && selectedAgent.sample_conversations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Conversación de ejemplo</h4>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    {selectedAgent.sample_conversations.map((conv, index) => (
                      <div key={index} className="space-y-2">
                        <div className="bg-background p-3 rounded-lg">
                          <div className="text-sm font-medium text-primary mb-1">Usuario:</div>
                          <div className="text-sm">{conv.user}</div>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-lg">
                          <div className="text-sm font-medium text-primary mb-1">{selectedAgent.name}:</div>
                          <div className="text-sm">{conv.assistant}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Precios */}
              <div>
                <h4 className="font-semibold mb-3">Modelo de precios</h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span>Modelo:</span>
                    <span className="font-medium">{selectedAgent.pricing_model}</span>
                  </div>
                  {selectedAgent.monthly_price > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Precio mensual:</span>
                      <span className="font-medium">${selectedAgent.monthly_price}/mes</span>
                    </div>
                  )}
                  {selectedAgent.price_per_use > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Precio por uso:</span>
                      <span className="font-medium">${selectedAgent.price_per_use}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acción */}
              <div className="flex space-x-3">
                {isAgentAdded(selectedAgent.id) ? (
                  <Button variant="secondary" disabled className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ya está en tu workspace
                  </Button>
                ) : (
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      addAgentToWorkspace(selectedAgent.id);
                      setSelectedAgent(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar a mi workspace
                  </Button>
                )}
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Probar gratis
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Marketplace;