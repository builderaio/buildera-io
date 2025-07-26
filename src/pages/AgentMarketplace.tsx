import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, ShoppingCart, Check, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing_model: string;
  pricing_amount: number;
  icon: string;
  is_featured: boolean;
  tools_config: any;
  version: string;
  instructions_template: string;
}

interface UserAgent {
  id: string;
  template_id: string;
  name: string;
  status: string;
}

const AgentMarketplace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar plantillas activas
      const { data: templatesData, error: templatesError } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Cargar agentes del usuario
      const { data: userAgentsData, error: userAgentsError } = await supabase
        .from('agent_instances')
        .select('id, template_id, name, status')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (userAgentsError) throw userAgentsError;

      setTemplates(templatesData || []);
      setUserAgents(userAgentsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del marketplace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const contractAgent = async (template: AgentTemplate) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para contratar un agente",
          variant: "destructive",
        });
        return;
      }

      // Obtener el perfil del usuario para personalización
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, industry')
        .eq('user_id', user.id)
        .single();

      // Contextualizar las instrucciones
      const contextualizedInstructions = template.instructions_template
        ?.replace(/\{\{company_name\}\}/g, profile?.company_name || 'Tu empresa')
        .replace(/\{\{industry\}\}/g, profile?.industry || 'tu industria');

      const { error } = await supabase
        .from('agent_instances')
        .insert({
          template_id: template.id,
          user_id: user.id,
          name: `${template.name} - ${profile?.company_name || 'Mi Empresa'}`,
          contextualized_instructions: contextualizedInstructions || template.instructions_template,
          tenant_config: {
            company_name: profile?.company_name,
            industry: profile?.industry,
          },
          tools_permissions: template.tools_config,
        });

      if (error) throw error;

      toast({
        title: "¡Agente contratado!",
        description: `${template.name} ha sido añadido a tu equipo de agentes`,
      });

      loadData(); // Recargar datos
      navigate('/marketplace/agents/' + template.id + '/configure');
    } catch (error) {
      console.error('Error contracting agent:', error);
      toast({
        title: "Error",
        description: "No se pudo contratar el agente",
        variant: "destructive",
      });
    }
  };

  const isAgentOwned = (templateId: string) => {
    return userAgents.some(agent => agent.template_id === templateId);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = filteredTemplates.filter(t => t.is_featured);
  const regularTemplates = filteredTemplates.filter(t => !t.is_featured);

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'research', label: 'Research' },
    { value: 'automation', label: 'Automation' },
    { value: 'general', label: 'General' },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'marketing': 'bg-blue-100 text-blue-800',
      'analytics': 'bg-green-100 text-green-800',
      'research': 'bg-purple-100 text-purple-800',
      'automation': 'bg-orange-100 text-orange-800',
      'general': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.general;
  };

  const getToolsDescription = (toolsConfig: any) => {
    if (!Array.isArray(toolsConfig)) return '';
    
    const toolNames = toolsConfig
      .filter(tool => tool.enabled)
      .map(tool => {
        switch (tool.type) {
          case 'web_browser': return 'Navegación web';
          case 'code_interpreter': return 'Análisis de datos';
          case 'file_search': return 'Búsqueda en archivos';
          case 'function': return 'Funciones personalizadas';
          default: return tool.name;
        }
      });
    
    return toolNames.slice(0, 3).join(', ') + (toolNames.length > 3 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Marketplace de Agentes IA</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descubre y contrata agentes autónomos especializados para potenciar tu negocio
            </p>
          </div>

          {/* Búsqueda y filtros */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar agentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Filter className="w-4 h-4 text-muted-foreground mt-2" />
              {categories.map(category => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="featured" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="featured">Destacados</TabsTrigger>
              <TabsTrigger value="all">Todos los Agentes</TabsTrigger>
            </TabsList>

            <TabsContent value="featured" className="space-y-6">
              {featuredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredTemplates.map((template) => (
                    <Card key={template.id} className="relative overflow-hidden">
                      <div className="absolute top-2 right-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      </div>
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                            {template.icon}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge variant="outline" className={getCategoryColor(template.category)}>
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <CardDescription className="line-clamp-3">
                          {template.description}
                        </CardDescription>
                        
                        <div className="text-sm text-muted-foreground">
                          <strong>Capacidades:</strong> {getToolsDescription(template.tools_config)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {template.pricing_model === 'free' ? 'Gratis' : `$${template.pricing_amount}`}
                          </span>
                          <span className="text-sm text-muted-foreground">v{template.version}</span>
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => contractAgent(template)}
                          disabled={isAgentOwned(template.id)}
                        >
                          {isAgentOwned(template.id) ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Ya contratado
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Contratar Agente
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No hay agentes destacados disponibles</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-6">
              {regularTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularTemplates.map((template) => (
                    <Card key={template.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                            {template.icon}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge variant="outline" className={getCategoryColor(template.category)}>
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <CardDescription className="line-clamp-3">
                          {template.description}
                        </CardDescription>
                        
                        <div className="text-sm text-muted-foreground">
                          <strong>Capacidades:</strong> {getToolsDescription(template.tools_config)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {template.pricing_model === 'free' ? 'Gratis' : `$${template.pricing_amount}`}
                          </span>
                          <span className="text-sm text-muted-foreground">v{template.version}</span>
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => contractAgent(template)}
                          disabled={isAgentOwned(template.id)}
                        >
                          {isAgentOwned(template.id) ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Ya contratado
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Contratar Agente
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'No se encontraron agentes con los filtros seleccionados'
                      : 'No hay agentes disponibles'
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AgentMarketplace;