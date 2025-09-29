import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FlaskConical, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  Plus,
  Settings,
  Play,
  Pause,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';

const WhiteLabelABTesting = () => {
  const { toast } = useToast();
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null);

  // Mock A/B testing data
  const mockExperiments = [
    {
      id: 1,
      name: 'Response Tone Optimization',
      status: 'running',
      variants: [
        { name: 'Formal', traffic: 50, conversions: 124, conversionRate: 12.4 },
        { name: 'Casual', traffic: 50, conversions: 156, conversionRate: 15.6 }
      ],
      startDate: '2024-09-20',
      endDate: '2024-10-05',
      confidence: 85,
      winner: 'Casual'
    },
    {
      id: 2,
      name: 'Greeting Message Test',
      status: 'completed',
      variants: [
        { name: 'Standard', traffic: 33, conversions: 87, conversionRate: 8.7 },
        { name: 'Personalized', traffic: 33, conversions: 102, conversionRate: 10.2 },
        { name: 'Question-based', traffic: 34, conversions: 118, conversionRate: 11.8 }
      ],
      startDate: '2024-09-01',
      endDate: '2024-09-15',
      confidence: 95,
      winner: 'Question-based'
    },
    {
      id: 3,
      name: 'Knowledge Base Prompts',
      status: 'draft',
      variants: [
        { name: 'Detailed', traffic: 0, conversions: 0, conversionRate: 0 },
        { name: 'Concise', traffic: 0, conversions: 0, conversionRate: 0 }
      ],
      startDate: null,
      endDate: null,
      confidence: 0,
      winner: null
    }
  ];

  const performanceData = [
    { day: 'Day 1', control: 8.2, variant: 8.5 },
    { day: 'Day 2', control: 8.7, variant: 9.2 },
    { day: 'Day 3', control: 8.1, variant: 9.8 },
    { day: 'Day 4', control: 8.9, variant: 10.5 },
    { day: 'Day 5', control: 9.2, variant: 11.2 },
    { day: 'Day 6', control: 8.8, variant: 11.8 },
    { day: 'Day 7', control: 9.1, variant: 12.4 }
  ];

  useEffect(() => {
    setExperiments(mockExperiments);
    setSelectedExperiment(mockExperiments[0]);
  }, []);

  const createExperiment = () => {
    toast({
      title: "New experiment created",
      description: "Your A/B test has been set up and is ready to start",
    });
  };

  const startExperiment = (experimentId: number) => {
    setExperiments(prev => 
      prev.map(exp => 
        exp.id === experimentId 
          ? { ...exp, status: 'running' }
          : exp
      )
    );
    
    toast({
      title: "Experiment started",
      description: "A/B test is now live and collecting data",
    });
  };

  const stopExperiment = (experimentId: number) => {
    setExperiments(prev => 
      prev.map(exp => 
        exp.id === experimentId 
          ? { ...exp, status: 'completed' }
          : exp
      )
    );
    
    toast({
      title: "Experiment stopped",
      description: "A/B test has been stopped and results are available",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Settings className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">A/B Testing Framework</h1>
          <p className="text-muted-foreground">Optimize agent performance with data-driven experimentation</p>
        </div>
        <Button onClick={createExperiment} className="bg-gradient-to-r from-primary to-secondary">
          <Plus className="w-4 h-4 mr-2" />
          New Experiment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 running, 1 draft</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Total users tested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Significant Results</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Statistical confidence</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="experiments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="create">Create Test</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="experiments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Experiments List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold">All Experiments</h3>
              {experiments.map((experiment) => (
                <Card 
                  key={experiment.id} 
                  className={`cursor-pointer transition-all ${
                    selectedExperiment?.id === experiment.id 
                      ? 'ring-2 ring-primary' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedExperiment(experiment)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{experiment.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(experiment.status)} text-white`}
                        >
                          {getStatusIcon(experiment.status)}
                          <span className="ml-1 capitalize">{experiment.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Variants:</span>
                        <span>{experiment.variants.length}</span>
                      </div>
                      {experiment.confidence > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Confidence:</span>
                          <span className={experiment.confidence >= 95 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                            {experiment.confidence}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Experiment Details */}
            <div className="lg:col-span-2">
              {selectedExperiment && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedExperiment.name}</CardTitle>
                        <CardDescription>
                          {selectedExperiment.startDate && selectedExperiment.endDate
                            ? `${selectedExperiment.startDate} - ${selectedExperiment.endDate}`
                            : 'Not started'
                          }
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {selectedExperiment.status === 'draft' && (
                          <Button onClick={() => startExperiment(selectedExperiment.id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </Button>
                        )}
                        {selectedExperiment.status === 'running' && (
                          <Button variant="outline" onClick={() => stopExperiment(selectedExperiment.id)}>
                            <Pause className="w-4 h-4 mr-2" />
                            Stop
                          </Button>
                        )}
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Variants Performance */}
                    <div>
                      <h4 className="font-medium mb-4">Variant Performance</h4>
                      <div className="space-y-4">
                        {selectedExperiment.variants.map((variant: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{variant.name}</h5>
                              {selectedExperiment.winner === variant.name && (
                                <Badge className="bg-green-100 text-green-800">Winner</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Traffic Split</p>
                                <p className="font-medium">{variant.traffic}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Conversions</p>
                                <p className="font-medium">{variant.conversions}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Conversion Rate</p>
                                <p className="font-medium">{variant.conversionRate}%</p>
                              </div>
                            </div>

                            {variant.conversionRate > 0 && (
                              <div className="mt-3">
                                <Progress value={variant.conversionRate * 5} className="h-2" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Statistical Significance */}
                    {selectedExperiment.confidence > 0 && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Statistical Analysis</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Confidence Level</p>
                            <p className="font-medium text-lg">{selectedExperiment.confidence}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Significance</p>
                            <p className={`font-medium ${selectedExperiment.confidence >= 95 ? 'text-green-600' : 'text-orange-600'}`}>
                              {selectedExperiment.confidence >= 95 ? 'Significant' : 'Not Significant'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Daily conversion rate comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value}%`, name === 'control' ? 'Control' : 'Variant']} />
                  <Line 
                    type="monotone" 
                    dataKey="control" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    name="control"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="variant" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="variant"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Improvement:</span>
                    <span className="font-bold text-green-600">+23.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P-value:</span>
                    <span className="font-medium">0.012</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sample size:</span>
                    <span className="font-medium">1,247 users</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Test duration:</span>
                    <span className="font-medium">14 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-800">✅ Deploy Winner</h5>
                    <p className="text-sm text-green-700">Casual tone shows 23% improvement with 95% confidence</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-800">💡 Next Test</h5>
                    <p className="text-sm text-blue-700">Test different casual tone variations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New A/B Test</CardTitle>
              <CardDescription>Set up a new experiment to optimize your AI agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">Experiment Name</label>
                <Input placeholder="e.g., Response Style Optimization" className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium">Test Type</label>
                <select className="w-full border rounded px-3 py-2 mt-1">
                  <option>Prompt Variation</option>
                  <option>Response Tone</option>
                  <option>Knowledge Base Strategy</option>
                  <option>Conversation Flow</option>
                  <option>Custom</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Hypothesis</label>
                <Textarea 
                  placeholder="Describe what you expect to improve and why..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Traffic Split (%)</label>
                  <Input type="number" defaultValue="50" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Minimum Sample Size</label>
                  <Input type="number" defaultValue="100" className="mt-1" />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Variants</h4>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Control (Original)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea 
                        placeholder="Enter the original prompt or configuration..."
                        rows={3}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Variant A</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea 
                        placeholder="Enter the variant prompt or configuration..."
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Variant
                </Button>
              </div>

              <div className="flex gap-3">
                <Button onClick={createExperiment} className="flex-1">
                  Create Experiment
                </Button>
                <Button variant="outline" className="flex-1">
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">15</div>
                <p className="text-sm text-muted-foreground">3 active, 12 completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">67%</div>
                <p className="text-sm text-muted-foreground">Tests with positive results</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">+18%</div>
                <p className="text-sm text-muted-foreground">Performance increase</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Experiment History</CardTitle>
              <CardDescription>Results from past A/B tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockExperiments.filter(exp => exp.status === 'completed').map((experiment) => (
                  <div key={experiment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{experiment.name}</h4>
                      <p className="text-sm text-muted-foreground">{experiment.startDate} - {experiment.endDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">Winner: {experiment.winner}</p>
                      <p className="text-sm text-muted-foreground">{experiment.confidence}% confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing Configuration</CardTitle>
              <CardDescription>Configure default settings for experiments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Default Confidence Level</label>
                  <select className="w-full border rounded px-3 py-2 mt-1">
                    <option>95%</option>
                    <option>90%</option>
                    <option>85%</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Minimum Sample Size</label>
                  <Input type="number" defaultValue="100" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Experiment Duration</label>
                  <Input type="number" defaultValue="30" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Days</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Auto-Stop Threshold</label>
                  <Input type="number" defaultValue="99" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">% confidence</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Notifications</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Email me when experiment reaches significance
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Weekly A/B testing summary
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Slack notifications for experiment events
                  </label>
                </div>
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhiteLabelABTesting;