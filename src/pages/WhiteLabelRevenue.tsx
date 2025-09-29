import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Download,
  Eye,
  Calendar,
  Users,
  Percent,
  Banknote,
  PiggyBank
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const WhiteLabelRevenue = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>({});

  // Mock revenue data - replace with real API calls
  const monthlyRevenue = [
    { month: 'Jan', revenue: 1200, deployments: 5, commission: 360 },
    { month: 'Feb', revenue: 1800, deployments: 8, commission: 540 },
    { month: 'Mar', revenue: 2400, deployments: 12, commission: 720 },
    { month: 'Apr', revenue: 3200, deployments: 16, commission: 960 },
    { month: 'May', revenue: 4100, deployments: 22, commission: 1230 },
    { month: 'Jun', revenue: 5300, deployments: 28, commission: 1590 }
  ];

  const revenueBreakdown = [
    { template: 'Customer Support Pro', deployments: 45, revenue: 8900, growth: '+15%' },
    { template: 'Sales Assistant Elite', deployments: 32, revenue: 6400, growth: '+8%' },
    { template: 'Marketing Companion', deployments: 28, revenue: 4200, growth: '+12%' },
    { template: 'HR Helper Plus', deployments: 18, revenue: 2700, growth: '+25%' },
    { template: 'E-commerce Specialist', deployments: 12, revenue: 1800, growth: '+5%' }
  ];

  const payouts = [
    { date: '2024-09-01', amount: 1250.00, status: 'Paid', method: 'Bank Transfer' },
    { date: '2024-08-01', amount: 980.00, status: 'Paid', method: 'PayPal' },
    { date: '2024-07-01', amount: 750.00, status: 'Paid', method: 'Bank Transfer' },
    { date: '2024-06-01', amount: 520.00, status: 'Processing', method: 'Stripe' }
  ];

  const metrics = [
    { title: 'Total Revenue', value: '$24,200', change: '+22%', icon: DollarSign, color: 'text-green-600' },
    { title: 'Monthly Recurring', value: '$5,300', change: '+18%', icon: TrendingUp, color: 'text-blue-600' },
    { title: 'Commission Rate', value: '30%', change: '0%', icon: Percent, color: 'text-purple-600' },
    { title: 'Pending Payout', value: '$1,590', change: '+8%', icon: PiggyBank, color: 'text-orange-600' }
  ];

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      // Load revenue data from API
      setLoading(false);
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast({
        title: "Error",
        description: "Failed to load revenue data",
        variant: "destructive",
      });
    }
  };

  const handleRequestPayout = async () => {
    toast({
      title: "Payout Requested",
      description: "Your payout request has been submitted and will be processed within 2-3 business days.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Revenue Management</h1>
          <p className="text-muted-foreground">Track earnings, payouts, and financial performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleRequestPayout} className="bg-gradient-to-r from-green-600 to-green-700">
            <Banknote className="w-4 h-4 mr-2" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={`text-xs ${
                metric.change.startsWith('+') ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {metric.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Template Performance</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
                <CardDescription>Monthly revenue and commission trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`$${value}`, name]} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={3}
                      name="Total Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="commission" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={3}
                      name="Your Commission"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Growth</CardTitle>
                <CardDescription>Monthly template deployments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deployments" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Revenue Activity</CardTitle>
              <CardDescription>Latest deployments and earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Template deployed by TechCorp Inc.</p>
                        <p className="text-sm text-muted-foreground">Customer Support Pro - 2 hours ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+$45.00</p>
                      <p className="text-sm text-muted-foreground">Commission</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
              <CardDescription>Revenue breakdown by template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueBreakdown.map((template, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{template.template}</h4>
                        <p className="text-sm text-muted-foreground">{template.deployments} deployments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${template.revenue.toLocaleString()}</p>
                      <Badge variant={template.growth.startsWith('+') ? 'default' : 'secondary'}>
                        {template.growth}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Track your commission payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payouts.map((payout, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">${payout.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{payout.method} • {payout.date}</p>
                      </div>
                    </div>
                    <Badge variant={payout.status === 'Paid' ? 'default' : 'secondary'}>
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Revenue Per Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$487</div>
                <p className="text-sm text-green-600">+12% this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">24%</div>
                <p className="text-sm text-green-600">+3% this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$1,250</div>
                <p className="text-sm text-green-600">+8% this month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>Configure your payment preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Minimum Payout</label>
                  <p className="text-2xl font-bold">$100</p>
                  <p className="text-sm text-muted-foreground">Current threshold</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Payout Schedule</label>
                  <p className="text-2xl font-bold">Monthly</p>
                  <p className="text-sm text-muted-foreground">Automatic payouts</p>
                </div>
              </div>
              <Button className="w-full md:w-auto">
                Update Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhiteLabelRevenue;