import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Code, 
  DollarSign, 
  Users, 
  Zap, 
  ArrowRight,
  Star,
  TrendingUp,
  Rocket,
  Sparkles
} from 'lucide-react';

const DeveloperPortal = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Visual Flow Builder",
      description: "Drag & drop interface to create complex AI agent workflows"
    },
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: "Multi-Modal AI",
      description: "Voice, vision, and text capabilities in one platform"
    },
    {
      icon: <Code className="w-8 h-8 text-primary" />,
      title: "White-Label Ready",
      description: "Deploy branded agents for unlimited companies"
    },
    {
      icon: <DollarSign className="w-8 h-8 text-primary" />,
      title: "Revenue Sharing",
      description: "Earn 70% from every deployment of your agents"
    }
  ];

  const stats = [
    { label: "Active Developers", value: "1,200+", icon: <Users className="w-5 h-5" /> },
    { label: "Deployed Agents", value: "15,000+", icon: <Bot className="w-5 h-5" /> },
    { label: "Monthly Revenue", value: "$250k+", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Success Rate", value: "98%", icon: <Star className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Developer Portal
          </Badge>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Build AI Agents
            <br />
            <span className="text-5xl">That Scale Globally</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Create white-label AI agents with our cutting-edge platform. Deploy once, 
            earn forever from thousands of companies worldwide.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="xl" 
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              onClick={() => navigate('/developer/dashboard')}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Building
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="xl" 
              variant="outline"
              onClick={() => navigate('/developer/marketplace')}
            >
              Explore Marketplace
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-muted/50 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-2 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-glow hover:-translate-y-2 transition-all duration-300 border-muted/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Build the Future?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of developers earning passive income by creating 
              AI agents that companies love to deploy.
            </p>
            <Button 
              size="xl"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              onClick={() => navigate('/developer/onboarding')}
            >
              <Zap className="w-5 h-5 mr-2" />
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeveloperPortal;