import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Plus, 
  DollarSign, 
  Users, 
  TrendingUp,
  Star,
  Eye,
  Download,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DeveloperProfile {
  id: string;
  developer_name: string;
  company_name?: string;
  tier: string;
  total_agents_created: number;
  total_deployments: number;
  total_revenue: number;
}

interface AgentTemplate {
  id: string;
  template_name: string;
  description: string;
  category: string;
  total_deployments: number;
  average_rating: number;
  is_published: boolean;
  created_at: string;
}

const WhiteLabelDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeveloperData();
  }, []);

  const loadDeveloperData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load developer profile
      const { data: profileData, error: profileError } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profileData) {
        // Create developer profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('developer_profiles')
          .insert({
            user_id: user.id,
            developer_name: user.user_metadata?.full_name || 'Developer',
            tier: 'free'
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }

      // Load agent templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('whitelabel_agent_templates')
        .select('*')
        .eq('developer_id', profileData?.id || '')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

    } catch (error) {
      console.error('Error loading developer data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Agents",
      value: profile?.total_agents_created || 0,
      icon: <Bot className="w-5 h-5" />,
      color: "text-blue-500"
    },
    {
      title: "Deployments",
      value: profile?.total_deployments || 0,
      icon: <Download className="w-5 h-5" />,
      color: "text-green-500"
    },
    {
      title: "Revenue",
      value: `$${profile?.total_revenue || 0}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-purple-500"
    },
    {
      title: "Tier",
      value: profile?.tier?.toUpperCase() || 'FREE',
      icon: <Star className="w-5 h-5" />,
      color: "text-orange-500"
    }
  ];

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">WhiteLabel Agent Builder</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.developer_name}</p>
        </div>
        <Button 
          onClick={() => navigate('/whitelabel/agent-builder')}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="border-muted/50 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Your AI Agents</h2>
            <Button 
              onClick={() => navigate('/whitelabel/agent-builder')}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card className="border-dashed border-2 border-muted text-center p-12">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No agents created yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your first AI agent with our visual flow builder
              </p>
              <Button 
                onClick={() => navigate('/whitelabel/agent-builder')}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <Zap className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="group hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                        <CardDescription className="mt-2">
                          {template.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge variant={template.is_published ? "default" : "secondary"}>
                        {template.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          {template.total_deployments}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {template.average_rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate(`/whitelabel/agent-builder/${template.id}`)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/whitelabel/analytics/${template.id}`)}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Monitor your agents' performance and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Analytics dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Tracking</CardTitle>
              <CardDescription>
                Track your earnings from agent deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Revenue tracking coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle>Agent Marketplace</CardTitle>
              <CardDescription>
                Browse and discover successful agent templates
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Marketplace coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhiteLabelDashboard;