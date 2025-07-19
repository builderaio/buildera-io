import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Settings, 
  Activity, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import ThemeSelector from '@/components/ThemeSelector';

interface APIKey {
  id: string;
  provider: string;
  model_name?: string; // Modelo por defecto (opcional)
  available_models?: string[]; // Modelos disponibles
  api_key_name: string;
  api_key_hash: string;
  key_last_four: string;
  status: string;
  usage_limit_monthly?: number;
  cost_limit_monthly?: number;
  created_at: string;
  updated_at: string;
  last_usage_check?: string;
  notes?: string;
}

interface UsageData {
  api_key_id: string;
  total_tokens: number;
  total_requests: number;
  total_cost: number;
  usage_date: string;
}

interface BillingData {
  api_key_id: string;
  total_usage_tokens: number;
  total_cost: number;
  status: string;
  billing_period_start: string;
  billing_period_end: string;
}

const AdminAPIKeys = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [billingData, setBillingData] = useState<BillingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState({
    provider: '',
    default_model: '',
    available_models: [] as string[],
    api_key_name: '',
    api_key: '',
    usage_limit_monthly: '',
    cost_limit_monthly: '',
    notes: ''
  });

  useEffect(() => {
    loadAPIKeys();
    loadUsageData();
    loadBillingData();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las API keys",
        variant: "destructive",
      });
    }
  };

  const loadUsageData = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_api_usage')
        .select('*')
        .gte('usage_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) throw error;
      setUsageData(data || []);
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  };

  const loadBillingData = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_api_billing')
        .select('*')
        .order('billing_period_start', { ascending: false });

      if (error) throw error;
      setBillingData(data || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAPIKey = async () => {
    try {
      if (!newApiKey.provider || !newApiKey.api_key_name || !newApiKey.api_key) {
        toast({
          title: "Error",
          description: "Los campos Proveedor, Nombre y API Key son obligatorios",
          variant: "destructive",
        });
        return;
      }

      const keyLastFour = newApiKey.api_key.slice(-4);
      const hashedKey = `***${keyLastFour}`;

      const { error } = await supabase
        .from('llm_api_keys')
        .insert({
          provider: newApiKey.provider,
          model_name: newApiKey.default_model || null,
          available_models: newApiKey.available_models,
          api_key_name: newApiKey.api_key_name,
          api_key_hash: hashedKey,
          key_last_four: keyLastFour,
          usage_limit_monthly: newApiKey.usage_limit_monthly ? parseInt(newApiKey.usage_limit_monthly) : null,
          cost_limit_monthly: newApiKey.cost_limit_monthly ? parseFloat(newApiKey.cost_limit_monthly) : null,
          notes: newApiKey.notes
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "API key agregada exitosamente",
      });

      setShowAddDialog(false);
      setNewApiKey({
        provider: '',
        default_model: '',
        available_models: [],
        api_key_name: '',
        api_key: '',
        usage_limit_monthly: '',
        cost_limit_monthly: '',
        notes: ''
      });
      loadAPIKeys();
    } catch (error) {
      console.error('Error adding API key:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la API key",
        variant: "destructive",
      });
    }
  };

  const refreshUsageData = async () => {
    try {
      setLoading(true);
      
      toast({
        title: "Sincronizando...",
        description: "Obteniendo datos de uso de todos los proveedores",
      });

      const { data, error } = await supabase.functions.invoke('sync-api-usage');
      
      if (error) throw error;

      const results = data?.results || [];
      const successCount = results.filter((r: any) => r.success).length;
      const totalCount = results.length;

      toast({
        title: `Sincronización completada`,
        description: `${successCount}/${totalCount} API keys sincronizadas exitosamente`,
      });

      await Promise.all([loadUsageData(), loadBillingData()]);
    } catch (error) {
      console.error('Error refreshing usage data:', error);
      toast({
        title: "Error en sincronización",
        description: "Hubo un problema al sincronizar los datos. Usando datos estimados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncSpecificProvider = async (provider: string) => {
    try {
      toast({
        title: "Sincronizando...",
        description: `Obteniendo datos de uso de ${provider}`,
      });

      // Filtrar solo las API keys de este proveedor
      const providerKeys = apiKeys.filter(key => key.provider === provider && key.status === 'active');
      
      if (providerKeys.length === 0) {
        toast({
          title: "Info",
          description: `No hay API keys activas para ${provider}`,
          variant: "default",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-api-usage');
      
      if (error) throw error;

      const results = data?.results || [];
      const providerResults = results.filter((r: any) => r.provider === provider);
      const successCount = providerResults.filter((r: any) => r.success).length;

      toast({
        title: `${provider} sincronizado`,
        description: `${successCount}/${providerResults.length} API keys actualizadas`,
      });

      await Promise.all([loadUsageData(), loadBillingData()]);
    } catch (error) {
      console.error(`Error syncing ${provider}:`, error);
      toast({
        title: "Error",
        description: `No se pudo sincronizar ${provider}`,
        variant: "destructive",
      });
    }
  };

  const getUsageForKey = (keyId: string) => {
    return usageData
      .filter(usage => usage.api_key_id === keyId)
      .reduce((acc, curr) => ({
        total_tokens: acc.total_tokens + curr.total_tokens,
        total_requests: acc.total_requests + curr.total_requests,
        total_cost: acc.total_cost + curr.total_cost
      }), { total_tokens: 0, total_requests: 0, total_cost: 0 });
  };

  const getBillingForKey = (keyId: string) => {
    return billingData.find(billing => billing.api_key_id === keyId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getProviderColor = (provider: string) => {
    const colors: { [key: string]: string } = {
      openai: 'bg-green-500',
      anthropic: 'bg-blue-500',
      google: 'bg-yellow-500',
      groq: 'bg-purple-500',
      xai: 'bg-gray-800', // Color distintivo para xAI
      default: 'bg-gray-500'
    };
    return colors[provider] || colors.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center p-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver al Dashboard</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <Key className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Gestión API Keys</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Button
                onClick={refreshUsageData}
                size="sm"
                variant="outline"
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar
              </Button>
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total API Keys</p>
                  <p className="text-2xl font-bold text-foreground">{apiKeys.length}</p>
                </div>
                <Key className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">APIs Activas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {apiKeys.filter(key => key.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Costo Total (30d)</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${usageData.reduce((acc, curr) => acc + curr.total_cost, 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tokens Usados</p>
                  <p className="text-2xl font-bold text-foreground">
                    {usageData.reduce((acc, curr) => acc + curr.total_tokens, 0).toLocaleString()}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="keys">API Keys</TabsTrigger>
              <TabsTrigger value="usage">Uso & Consumo</TabsTrigger>
              <TabsTrigger value="billing">Facturación</TabsTrigger>
              <TabsTrigger value="config">Configuración AI</TabsTrigger>
            </TabsList>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Nueva API Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Proveedor *</Label>
                    <Select
                      value={newApiKey.provider}
                      onValueChange={(value) => setNewApiKey({...newApiKey, provider: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="groq">Groq (Inferencia rápida)</SelectItem>
                        <SelectItem value="xai">xAI (Grok)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="model">Modelo por defecto (opcional)</Label>
                    <Input
                      id="model"
                      value={newApiKey.default_model}
                      onChange={(e) => setNewApiKey({...newApiKey, default_model: e.target.value})}
                      placeholder="ej: gpt-4o, claude-3-5-sonnet (opcional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Nombre descriptivo *</Label>
                    <Input
                      id="name"
                      value={newApiKey.api_key_name}
                      onChange={(e) => setNewApiKey({...newApiKey, api_key_name: e.target.value})}
                      placeholder="ej: Producción Principal"
                    />
                  </div>

                  <div>
                    <Label htmlFor="key">API Key *</Label>
                    <Input
                      id="key"
                      type="password"
                      value={newApiKey.api_key}
                      onChange={(e) => setNewApiKey({...newApiKey, api_key: e.target.value})}
                      placeholder="sk-..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="usage_limit">Límite tokens/mes</Label>
                      <Input
                        id="usage_limit"
                        type="number"
                        value={newApiKey.usage_limit_monthly}
                        onChange={(e) => setNewApiKey({...newApiKey, usage_limit_monthly: e.target.value})}
                        placeholder="1000000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cost_limit">Límite costo/mes ($)</Label>
                      <Input
                        id="cost_limit"
                        type="number"
                        step="0.01"
                        value={newApiKey.cost_limit_monthly}
                        onChange={(e) => setNewApiKey({...newApiKey, cost_limit_monthly: e.target.value})}
                        placeholder="500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={newApiKey.notes}
                      onChange={(e) => setNewApiKey({...newApiKey, notes: e.target.value})}
                      placeholder="Descripción adicional..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAddAPIKey}>
                      Agregar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="keys" className="space-y-4">
            {apiKeys.map((apiKey) => {
              const usage = getUsageForKey(apiKey.id);
              const billing = getBillingForKey(apiKey.id);
              
              return (
                <Card key={apiKey.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`${getProviderColor(apiKey.provider)} p-3 rounded-lg`}>
                          <Key className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{apiKey.api_key_name}</h3>
                            {getStatusIcon(apiKey.status)}
                            <Badge variant="secondary">
                              {apiKey.provider}
                            </Badge>
                          </div>
                          {apiKey.model_name && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Modelo por defecto: {apiKey.model_name}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Key: ***{apiKey.key_last_four}
                          </p>
                          {apiKey.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {apiKey.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:text-right">
                        <div>
                          <p className="text-sm text-muted-foreground">Tokens (30d)</p>
                          <p className="font-semibold">{usage.total_tokens.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Requests (30d)</p>
                          <p className="font-semibold">{usage.total_requests.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Costo (30d)</p>
                          <p className="font-semibold">${usage.total_cost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Límite mensual</p>
                          <p className="font-semibold">
                            {apiKey.cost_limit_monthly ? `$${apiKey.cost_limit_monthly}` : 'Sin límite'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            {/* Resumen por Proveedor */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Resumen por Proveedor (Últimos 30 días)</CardTitle>
                <Button
                  onClick={refreshUsageData}
                  size="sm"
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizar Todo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['openai', 'anthropic', 'google', 'groq', 'xai'].map(provider => {
                    const providerUsage = usageData
                      .filter(usage => apiKeys.find(key => key.id === usage.api_key_id && key.provider === provider))
                      .reduce((acc, curr) => ({
                        tokens: acc.tokens + curr.total_tokens,
                        requests: acc.requests + curr.total_requests,
                        cost: acc.cost + curr.total_cost
                      }), { tokens: 0, requests: 0, cost: 0 });

                    const hasApiKeys = apiKeys.filter(key => key.provider === provider && key.status === 'active').length > 0;

                    return (
                      <Card key={provider}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`${getProviderColor(provider)} p-2 rounded-lg`}>
                                <Activity className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="font-semibold">
                                {provider === 'xai' ? 'xAI (Grok)' : 
                                 provider === 'groq' ? 'Groq' : 
                                 provider.charAt(0).toUpperCase() + provider.slice(1)}
                              </h4>
                            </div>
                            {hasApiKeys && (
                              <Button
                                onClick={() => syncSpecificProvider(provider)}
                                size="sm"
                                variant="ghost"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Tokens:</span>
                              <span className="font-medium">{providerUsage.tokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Requests:</span>
                              <span className="font-medium">{providerUsage.requests.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Costo:</span>
                              <span className="font-medium">${providerUsage.cost.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Detalle por API Key */}
            <Card>
              <CardHeader>
                <CardTitle>Consumo Detallado por API Key</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiKeys.map(apiKey => {
                    const keyUsage = getUsageForKey(apiKey.id);
                    
                    return (
                      <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`${getProviderColor(apiKey.provider)} p-2 rounded-lg`}>
                            <Key className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{apiKey.api_key_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {apiKey.provider === 'xai' ? 'xAI (Grok)' : 
                               apiKey.provider === 'groq' ? 'Groq (Inferencia)' : 
                               apiKey.provider.charAt(0).toUpperCase() + apiKey.provider.slice(1)} 
                              {apiKey.model_name && ` • ${apiKey.model_name}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(apiKey.status)}
                              <span className="text-xs text-muted-foreground">•••{apiKey.key_last_four}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Tokens</p>
                              <p className="font-semibold">{keyUsage.total_tokens.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Requests</p>
                              <p className="font-semibold">{keyUsage.total_requests.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Costo</p>
                              <p className="font-semibold">${keyUsage.total_cost.toFixed(2)}</p>
                              {apiKey.cost_limit_monthly && (
                                <p className="text-xs text-muted-foreground">
                                  de ${apiKey.cost_limit_monthly}/mes
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {apiKeys.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No hay API keys configuradas. Agrega una API key para comenzar.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Facturación por API Key</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiKeys.map(apiKey => {
                    const billing = getBillingForKey(apiKey.id);
                    const usage = getUsageForKey(apiKey.id);
                    
                    return (
                      <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`${getProviderColor(apiKey.provider)} p-2 rounded-lg`}>
                            <DollarSign className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{apiKey.api_key_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {apiKey.provider === 'xai' ? 'xAI (Grok)' : 
                               apiKey.provider === 'groq' ? 'Groq (Inferencia)' : 
                               apiKey.provider.charAt(0).toUpperCase() + apiKey.provider.slice(1)}
                              {apiKey.model_name && ` • ${apiKey.model_name}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(apiKey.status)}
                              <span className="text-xs text-muted-foreground">•••{apiKey.key_last_four}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-sm text-muted-foreground">Tokens (30d)</p>
                              <p className="font-semibold">{usage.total_tokens.toLocaleString()}</p>
                              {apiKey.usage_limit_monthly && (
                                <p className="text-xs text-muted-foreground">
                                  de {apiKey.usage_limit_monthly.toLocaleString()}/mes
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Costo (30d)</p>
                              <p className="font-semibold">${usage.total_cost.toFixed(2)}</p>
                              {apiKey.cost_limit_monthly && (
                                <p className="text-xs text-muted-foreground">
                                  de ${apiKey.cost_limit_monthly}/mes
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Estado</p>
                              <Badge variant={billing?.status === 'paid' ? 'default' : 'secondary'}>
                                {billing?.status === 'paid' ? 'Pagado' : 'Pendiente'}
                              </Badge>
                              {billing && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(billing.billing_period_start).toLocaleDateString('es-ES')} - 
                                  {new Date(billing.billing_period_end).toLocaleDateString('es-ES')}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Límites</p>
                              <div className="flex flex-col gap-1">
                                {apiKey.usage_limit_monthly && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-16 h-1 bg-gray-200 rounded">
                                      <div 
                                        className="h-1 bg-blue-500 rounded"
                                        style={{ 
                                          width: `${Math.min(100, (usage.total_tokens / apiKey.usage_limit_monthly) * 100)}%` 
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs">
                                      {Math.round((usage.total_tokens / apiKey.usage_limit_monthly) * 100)}%
                                    </span>
                                  </div>
                                )}
                                {apiKey.cost_limit_monthly && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-16 h-1 bg-gray-200 rounded">
                                      <div 
                                        className="h-1 bg-green-500 rounded"
                                        style={{ 
                                          width: `${Math.min(100, (usage.total_cost / apiKey.cost_limit_monthly) * 100)}%` 
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs">
                                      {Math.round((usage.total_cost / apiKey.cost_limit_monthly) * 100)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {apiKeys.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No hay API keys configuradas para mostrar facturación.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Modelos IA</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configura los modelos de IA que utilizará la plataforma basándose en las API keys disponibles
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Configuración por Proveedor */}
                  {['openai', 'anthropic', 'google', 'groq', 'xai'].map(provider => {
                    const providerKeys = apiKeys.filter(key => key.provider === provider && key.status === 'active');
                    
                    if (providerKeys.length === 0) return null;

                    const getAvailableModels = (provider: string) => {
                      const modelMap: { [key: string]: string[] } = {
                        openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                        anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
                        google: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
                        groq: ['llama2-70b-4096', 'mixtral-8x7b-32768', 'gemma-7b-it'],
                        xai: ['grok-beta', 'grok-vision-beta']
                      };
                      return modelMap[provider] || [];
                    };

                    return (
                      <Card key={provider}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`${getProviderColor(provider)} p-2 rounded-lg`}>
                              <Settings className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold">
                                {provider === 'xai' ? 'xAI (Grok)' : 
                                 provider === 'groq' ? 'Groq (Inferencia)' : 
                                 provider.charAt(0).toUpperCase() + provider.slice(1)}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {providerKeys.length} API key{providerKeys.length > 1 ? 's' : ''} disponible{providerKeys.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Modelo por defecto para el proveedor */}
                            <div>
                              <Label htmlFor={`${provider}-default-model`}>Modelo por defecto</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar modelo por defecto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableModels(provider).map(model => (
                                    <SelectItem key={model} value={model}>
                                      {model}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Configuración de API keys específicas */}
                            <div>
                              <Label>Configuración por API Key</Label>
                              <div className="space-y-2 mt-2">
                                {providerKeys.map(apiKey => (
                                  <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                      <p className="font-medium">{apiKey.api_key_name}</p>
                                      <p className="text-sm text-muted-foreground">•••{apiKey.key_last_four}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Select defaultValue={apiKey.model_name || ''}>
                                        <SelectTrigger className="w-48">
                                          <SelectValue placeholder="Modelo asignado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {getAvailableModels(provider).map(model => (
                                            <SelectItem key={model} value={model}>
                                              {model}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                                        {apiKey.status === 'active' ? 'Activa' : 'Inactiva'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Configuración avanzada */}
                            <div className="border-t pt-4">
                              <h5 className="font-medium mb-3">Configuración Avanzada</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`${provider}-priority`}>Prioridad del proveedor</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar prioridad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="high">Alta</SelectItem>
                                      <SelectItem value="medium">Media</SelectItem>
                                      <SelectItem value="low">Baja</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor={`${provider}-fallback`}>Proveedor de respaldo</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar respaldo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {['openai', 'anthropic', 'google', 'groq', 'xai']
                                        .filter(p => p !== provider && apiKeys.some(k => k.provider === p && k.status === 'active'))
                                        .map(p => (
                                          <SelectItem key={p} value={p}>
                                            {p === 'xai' ? 'xAI (Grok)' : 
                                             p === 'groq' ? 'Groq' : 
                                             p.charAt(0).toUpperCase() + p.slice(1)}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {apiKeys.filter(key => key.status === 'active').length === 0 && (
                    <div className="text-center py-8">
                      <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-2">
                        No hay API keys activas para configurar
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Agrega y activa API keys en la pestaña "API Keys" para configurar los modelos de IA
                      </p>
                    </div>
                  )}

                  {/* Botones de acción */}
                  {apiKeys.filter(key => key.status === 'active').length > 0 && (
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline">
                        Restablecer por defecto
                      </Button>
                      <Button>
                        Guardar configuración
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminAPIKeys;