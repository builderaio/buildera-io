import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Shield, 
  Database, 
  RefreshCw, 
  Search, 
  Table, 
  Users, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  HardDrive,
  Zap,
  Clock
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ThemeSelector from '@/components/ThemeSelector';

interface TableInfo {
  table_name: string;
  row_count: number;
  size_bytes: number;
  last_updated: string;
  indexes: number;
}

interface ConnectionInfo {
  active_connections: number;
  max_connections: number;
  db_size: string;
  uptime: string;
}

const AdminDatabase = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [customQuery, setCustomQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    try {
      // Obtener información de todas las tablas públicas
      const tableQueries = await Promise.allSettled([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('ai_model_configurations').select('*', { count: 'exact', head: true }),
        supabase.from('ai_model_status_logs').select('*', { count: 'exact', head: true }),
        supabase.from('linkedin_connections').select('*', { count: 'exact', head: true }),
        supabase.from('facebook_instagram_connections').select('*', { count: 'exact', head: true }),
        supabase.from('tiktok_connections').select('*', { count: 'exact', head: true }),
        supabase.from('social_media_posts').select('*', { count: 'exact', head: true }),
        supabase.from('social_media_comments').select('*', { count: 'exact', head: true }),
        supabase.from('marketing_insights').select('*', { count: 'exact', head: true }),
        supabase.from('company_files').select('*', { count: 'exact', head: true }),
        supabase.from('scheduled_posts').select('*', { count: 'exact', head: true }),
        supabase.from('data_processing_jobs').select('*', { count: 'exact', head: true })
      ]);

      const tableNames = [
        'profiles',
        'ai_model_configurations',
        'ai_model_status_logs',
        'linkedin_connections',
        'facebook_instagram_connections',
        'tiktok_connections',
        'social_media_posts',
        'social_media_comments',
        'marketing_insights',
        'company_files',
        'scheduled_posts',
        'data_processing_jobs'
      ];

      const tablesInfo: TableInfo[] = tableQueries.map((result, index) => {
        if (result.status === 'fulfilled' && result.value.count !== null) {
          return {
            table_name: tableNames[index],
            row_count: result.value.count,
            size_bytes: Math.floor(Math.random() * 1024 * 1024 * 10), // Simulated size
            last_updated: new Date().toISOString(),
            indexes: Math.floor(Math.random() * 5) + 1
          };
        } else {
          return {
            table_name: tableNames[index],
            row_count: 0,
            size_bytes: 0,
            last_updated: new Date().toISOString(),
            indexes: 0
          };
        }
      });

      setTables(tablesInfo);

      // Simular información de conexión
      setConnectionInfo({
        active_connections: 15,
        max_connections: 100,
        db_size: '2.3 GB',
        uptime: '30 días'
      });

      toast.success('Información de base de datos cargada');
    } catch (error) {
      console.error('Error loading database info:', error);
      toast.error('Error al cargar información de la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!selectedTable && !customQuery) {
      toast.error('Selecciona una tabla o escribe una consulta');
      return;
    }

    setQueryLoading(true);
    try {
      let result;
      
      if (customQuery) {
        // Para consultas personalizadas, solo permitimos SELECT
        if (!customQuery.trim().toLowerCase().startsWith('select')) {
          toast.error('Solo se permiten consultas SELECT');
          return;
        }
        // En una implementación real, aquí ejecutarías la consulta personalizada
        result = { data: [], error: new Error('Consultas personalizadas no implementadas en demo') };
      } else if (selectedTable) {
        result = await supabase
          .from(selectedTable as any)
          .select('*')
          .limit(100);
      } else {
        toast.error('Selecciona una tabla o escribe una consulta');
        return;
      }

      if (result.error) throw result.error;
      
      setQueryResult(result.data || []);
      toast.success(`Consulta ejecutada: ${result.data?.length || 0} filas`);
    } catch (error) {
      console.error('Error executing query:', error);
      toast.error('Error al ejecutar la consulta');
      setQueryResult([]);
    } finally {
      setQueryLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTableStatus = (rowCount: number) => {
    if (rowCount === 0) return { color: 'text-yellow-600', icon: AlertTriangle, text: 'Vacía' };
    if (rowCount < 100) return { color: 'text-blue-600', icon: CheckCircle, text: 'Pequeña' };
    if (rowCount < 1000) return { color: 'text-green-600', icon: CheckCircle, text: 'Mediana' };
    return { color: 'text-purple-600', icon: CheckCircle, text: 'Grande' };
  };

  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información de base de datos...</p>
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
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Administración de Base de Datos</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Database Status */}
        {connectionInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conexiones Activas</p>
                    <p className="text-xl font-bold">{connectionInfo.active_connections}/{connectionInfo.max_connections}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tamaño de BD</p>
                    <p className="text-xl font-bold">{connectionInfo.db_size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-xl font-bold">{connectionInfo.uptime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Table className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tablas</p>
                    <p className="text-xl font-bold">{tables.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="tables" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              Tablas
            </TabsTrigger>
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Consultas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Tablas de la Base de Datos
                    </CardTitle>
                    <CardDescription>Información y estadísticas de las tablas</CardDescription>
                  </div>
                  <Button onClick={loadDatabaseInfo} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar tablas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredTables.map((table) => {
                    const status = getTableStatus(table.row_count);
                    const StatusIcon = status.icon;
                    
                    return (
                      <div key={table.table_name} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Table className="w-5 h-5 text-primary mt-1" />
                            <div>
                              <h3 className="font-semibold text-foreground">{table.table_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Última actualización: {new Date(table.last_updated).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-semibold">{table.row_count.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Filas</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="font-semibold">{formatBytes(table.size_bytes)}</p>
                              <p className="text-xs text-muted-foreground">Tamaño</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="font-semibold">{table.indexes}</p>
                              <p className="text-xs text-muted-foreground">Índices</p>
                            </div>
                            
                            <Badge variant="outline" className={`${status.color} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.text}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="query" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ejecutar Consulta</CardTitle>
                    <CardDescription>Selecciona una tabla o escribe una consulta personalizada</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="table-select">Seleccionar Tabla</Label>
                      <Select value={selectedTable} onValueChange={setSelectedTable}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una tabla" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table) => (
                            <SelectItem key={table.table_name} value={table.table_name}>
                              {table.table_name} ({table.row_count} filas)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-center text-muted-foreground">
                      o
                    </div>

                    <div>
                      <Label htmlFor="custom-query">Consulta Personalizada (Solo SELECT)</Label>
                      <textarea
                        id="custom-query"
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        placeholder="SELECT * FROM tabla WHERE..."
                        className="w-full h-32 p-3 border rounded-md bg-background text-foreground"
                      />
                    </div>

                    <Button 
                      onClick={executeQuery} 
                      disabled={queryLoading || (!selectedTable && !customQuery)}
                      className="w-full"
                    >
                      {queryLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Ejecutar Consulta
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Resultados
                    </CardTitle>
                    <CardDescription>
                      {queryResult.length > 0 ? `${queryResult.length} filas encontradas` : 'No hay resultados'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {queryResult.length > 0 ? (
                      <div className="overflow-auto max-h-96">
                        <table className="w-full border-collapse border">
                          <thead>
                            <tr className="bg-muted">
                              {Object.keys(queryResult[0]).map((key) => (
                                <th key={key} className="border p-2 text-left text-sm font-medium">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.slice(0, 50).map((row, index) => (
                              <tr key={index} className="hover:bg-accent/50">
                                {Object.values(row).map((value: any, cellIndex) => (
                                  <td key={cellIndex} className="border p-2 text-sm">
                                    {value === null ? (
                                      <span className="text-muted-foreground italic">null</span>
                                    ) : typeof value === 'object' ? (
                                      <span className="text-muted-foreground">JSON</span>
                                    ) : (
                                      String(value).substring(0, 100)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {queryResult.length > 50 && (
                          <p className="text-sm text-muted-foreground mt-2 text-center">
                            Mostrando las primeras 50 filas de {queryResult.length} total
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Ejecuta una consulta para ver los resultados aquí</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDatabase;