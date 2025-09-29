import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  Star, 
  Download, 
  Search,
  Filter,
  TrendingUp,
  Eye,
  DollarSign,
  Users,
  Zap,
  Crown,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AgentTemplate {
  id: string;
  template_name: string;
  description: string;
  category: string;
  total_deployments: number;
  average_rating: number;
  total_ratings: number;
  base_price: number;
  pricing_model: string;
  is_featured: boolean;
  tags: string[];
  developer: {
    developer_name: string;
    verified: boolean;
  };
}

const WhiteLabelMarketplace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        developer: {
          developer_name: item.developer_profiles.developer_name,
          verified: item.developer_profiles.verified
        }
      })) || [];

      setTemplates(formattedData);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'featured':
        return Number(b.is_featured) - Number(a.is_featured);
      case 'rating':
        return b.average_rating - a.average_rating;
      case 'deployments':
        return b.total_deployments - a.total_deployments;
      case 'price_low':
        return a.base_price - b.base_price;
      case 'price_high':
        return b.base_price - a.base_price;
      default:
        return 0;
    }
  });

  const categories = [
    'all',
    'customer-service',
    'sales',
    'marketing',
    'hr',
    'finance',
    'education',
    'healthcare',
    'e-commerce',
    'productivity'
  ];

  const deployAgent = async (templateId: string) => {
    try {
      // Here you would handle the deployment process
      toast({
        title: "Success",
        description: "Agent deployment started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deploy agent",
        variant: "destructive",
      });
    }
  };

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
        <h1 className="text-4xl font-bold mb-2">Agent Marketplace</h1>
        <p className="text-muted-foreground text-lg">
          Discover and deploy AI agents created by our developer community
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents, features, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="deployments">Most Popular</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Featured Section */}
      {sortedTemplates.some(t => t.is_featured) && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Featured Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTemplates
              .filter(template => template.is_featured)
              .slice(0, 3)
              .map((template) => (
                <Card key={template.id} className="group hover:shadow-glow hover:-translate-y-2 transition-all duration-300 border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-orange-50/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-yellow-500 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {template.template_name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            {template.average_rating.toFixed(1)} ({template.total_ratings})
                          </div>
                          <div className="flex items-center">
                            <Download className="w-4 h-4 text-muted-foreground mr-1" />
                            {template.total_deployments}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">by</span>
                          <span className="text-sm font-medium">{template.developer.developer_name}</span>
                          {template.developer.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-bold">
                          {template.pricing_model === 'free' ? 'Free' : `$${template.base_price}`}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => deployAgent(template.id)}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Deploy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/whitelabel/agent/${template.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All Agents */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">All Agents</h2>
        {sortedTemplates.length === 0 ? (
          <Card className="text-center p-12">
            <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No agents found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse different categories
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedTemplates.map((template) => (
              <Card key={template.id} className="group hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{template.category}</Badge>
                        {template.pricing_model === 'free' && (
                          <Badge className="bg-green-500 text-white">Free</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {template.template_name}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          {template.average_rating.toFixed(1)}
                        </div>
                        <div className="flex items-center">
                          <Download className="w-4 h-4 text-muted-foreground mr-1" />
                          {template.total_deployments}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">by</span>
                        <span className="text-sm font-medium">{template.developer.developer_name}</span>
                        {template.developer.verified && (
                          <Badge variant="secondary" className="text-xs">✓</Badge>
                        )}
                      </div>
                      <div className="text-lg font-bold">
                        {template.pricing_model === 'free' ? 'Free' : `$${template.base_price}`}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => deployAgent(template.id)}
                      >
                        Deploy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/whitelabel/agent/${template.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhiteLabelMarketplace;