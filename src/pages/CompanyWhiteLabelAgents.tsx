import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bot, 
  Star, 
  Download, 
  Search,
  Settings,
  Play,
  Pause,
  BarChart3,
  Globe,
  Palette,
  Key,
  Users,
  DollarSign,
  Zap,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface WhiteLabelDeployment {
  id: string;
  deployment_name: string;
  custom_domain?: string;
  status: string;
  deployment_url?: string;
  api_key: string;
  usage_stats: any;
  last_activity_at?: string;
  created_at: string;
  template: {
    template_name: string;
    description: string;
    category: string;
    average_rating: number;
  };
}

interface AgentTemplate {
  id: string;
  template_name: string;
  description: string;
  category: string;
  base_price: number;
  pricing_model: string;
  average_rating: number;
  total_deployments: number;
  developer: {
    developer_name: string;
    verified: boolean;
  };
}

const CompanyWhiteLabelAgents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deployments, setDeployments] = useState<WhiteLabelDeployment[]>([]);
  const [marketplaceAgents, setMarketplaceAgents] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [deploymentName, setDeploymentName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's primary company
      const { data: companyData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (!companyData) return;

      // Load existing deployments
      const { data: deploymentsData, error: deploymentsError } = await supabase
        .from('whitelabel_deployments')
        .select(`
          *,
          whitelabel_agent_templates(
            template_name,
            description,
            category,
            average_rating
          )
        `)
        .eq('company_id', companyData.company_id);

      if (deploymentsError) throw deploymentsError;

      const formattedDeployments = deploymentsData?.map(deployment => ({
        ...deployment,
        template: deployment.whitelabel_agent_templates
      })) || [];

      setDeployments(formattedDeployments);

      // Load marketplace agents
      const { data: marketplaceData, error: marketplaceError } = await supabase
        .from('whitelabel_agent_templates')
        .select(`
          *,
          developer_profiles!inner(
            developer_name,
            verified
          )
        `)
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('total_deployments', { ascending: false });

      if (marketplaceError) throw marketplaceError;

      const formattedMarketplace = marketplaceData?.map(item => ({
        ...item,
        developer: {
          developer_name: item.developer_profiles.developer_name,
          verified: item.developer_profiles.verified
        }
      })) || [];

      setMarketplaceAgents(formattedMarketplace);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deployAgent = async () => {
    if (!selectedTemplate || !deploymentName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (!companyData) return;

      const { data, error } = await supabase
        .from('whitelabel_deployments')
        .insert({
          template_id: selectedTemplate.id,
          company_id: companyData.company_id,
          deployment_name: deploymentName,
          custom_domain: customDomain || null,
          branding_config: {
            primary_color: primaryColor,
            // Additional branding options would go here
          },
          status: 'active',
          api_key: `wl_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          deployment_url: `https://${deploymentName.toLowerCase().replace(/\s+/g, '-')}.agents.buildera.ai`
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent deployed successfully!",
      });

      setShowDeployDialog(false);
      setDeploymentName('');
      setCustomDomain('');
      setPrimaryColor('#6366f1');
      setSelectedTemplate(null);
      loadData();

    } catch (error) {
      console.error('Error deploying agent:', error);
      toast({
        title: "Error",
        description: "Failed to deploy agent",
        variant: "destructive",
      });
    }
  };

  const toggleDeploymentStatus = async (deploymentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('whitelabel_deployments')
        .update({ status: newStatus })
        .eq('id', deploymentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deployment ${newStatus}`,
      });

      loadData();
    } catch (error) {
      console.error('Error updating deployment:', error);
      toast({
        title: "Error",
        description: "Failed to update deployment",
        variant: "destructive",
      });
    }
  };

  const filteredMarketplaceAgents = marketplaceAgents.filter(agent =>
    agent.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">WhiteLabel AI Agents</h1>
        <p className="text-muted-foreground text-lg">
          Deploy and manage AI agents for your company
        </p>
      </div>

      <Tabs defaultValue="deployments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deployments">My Deployments</TabsTrigger>
          <TabsTrigger value="marketplace">Agent Marketplace</TabsTrigger>
        </TabsList>

        {/* Existing Deployments */}
        <TabsContent value="deployments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Active Deployments</h2>
            <Button onClick={() => navigate('/company/whitelabel-agents?tab=marketplace')}>
              <Bot className="w-4 h-4 mr-2" />
              Deploy New Agent
            </Button>
          </div>

          {deployments.length === 0 ? (
            <Card className="border-dashed border-2 border-muted text-center p-12">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No agents deployed yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse our marketplace to deploy your first AI agent
              </p>
              <Button onClick={() => navigate('/company/whitelabel-agents?tab=marketplace')}>
                <Zap className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deployments.map((deployment) => (
                <Card key={deployment.id} className="group hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{deployment.deployment_name}</CardTitle>
                        <CardDescription className="mt-1">
                          {deployment.template.template_name}
                        </CardDescription>
                      </div>
                      <Badge variant={deployment.status === 'active' ? "default" : "secondary"}>
                        {deployment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-muted-foreground">URL:</span>
                          <span className="font-mono text-xs">{deployment.deployment_url}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-muted-foreground">API Key:</span>
                          <span className="font-mono text-xs">{deployment.api_key.substring(0, 8)}...</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Rating:</span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            {deployment.template.average_rating.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => window.open(deployment.deployment_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleDeploymentStatus(deployment.id, deployment.status)}
                        >
                          {deployment.status === 'active' ? 
                            <Pause className="w-4 h-4" /> : 
                            <Play className="w-4 h-4" />
                          }
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/company/whitelabel-agents/${deployment.id}/settings`)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Marketplace */}
        <TabsContent value="marketplace" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Agent Marketplace</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarketplaceAgents.map((agent) => (
              <Card key={agent.id} className="group hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{agent.template_name}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {agent.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{agent.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          {agent.average_rating.toFixed(1)}
                        </div>
                        <div className="flex items-center">
                          <Download className="w-4 h-4 text-muted-foreground mr-1" />
                          {agent.total_deployments}
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        {agent.pricing_model === 'free' ? 'Free' : `$${agent.base_price}`}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">by</span>
                      <span className="text-sm font-medium">{agent.developer.developer_name}</span>
                      {agent.developer.verified && (
                        <Badge variant="secondary" className="text-xs">✓</Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedTemplate(agent);
                          setShowDeployDialog(true);
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Deploy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/whitelabel/agent/${agent.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Deploy Agent Dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deploy Agent</DialogTitle>
            <DialogDescription>
              Configure your deployment of {selectedTemplate?.template_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deployment-name">Deployment Name</Label>
              <Input
                id="deployment-name"
                placeholder="My Customer Service Bot"
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="custom-domain">Custom Domain (Optional)</Label>
              <Input
                id="custom-domain"
                placeholder="chat.mycompany.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeployDialog(false)}>
                Cancel
              </Button>
              <Button onClick={deployAgent} disabled={!deploymentName}>
                <Zap className="w-4 h-4 mr-2" />
                Deploy Agent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyWhiteLabelAgents;
