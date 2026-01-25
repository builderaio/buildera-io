import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Search, Play, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TableInfo {
  name: string;
  row_count: number;
  size: string;
}

const DatabasePanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [query, setQuery] = useState('SELECT * FROM profiles LIMIT 10');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    try {
      // Get main tables from the database
      const mainTables = [
        'profiles', 'companies', 'company_members', 'platform_agents', 
        'agent_usage_log', 'user_subscriptions', 'subscription_plans',
        'ai_function_configurations', 'company_branding', 'company_audiences'
      ];

      const tableInfo: TableInfo[] = [];
      
      for (const tableName of mainTables) {
        try {
          const { count, error } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            tableInfo.push({
              name: tableName,
              row_count: count || 0,
              size: '-'
            });
          }
        } catch {
          // Table might not exist or no access
        }
      }

      setTables(tableInfo);
    } catch (error) {
      console.error('Error loading database info:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    // Security: Only allow SELECT queries
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery.startsWith('select')) {
      toast({
        title: "Error",
        description: "Solo se permiten consultas SELECT",
        variant: "destructive"
      });
      return;
    }

    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      // Parse table name from query
      const tableMatch = query.match(/from\s+(\w+)/i);
      if (!tableMatch) {
        throw new Error('No se pudo identificar la tabla');
      }

      const tableName = tableMatch[1];
      
      // Execute simple query (limited functionality for security)
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(50);

      if (error) throw error;
      setQueryResult(data || []);
    } catch (error: any) {
      setQueryError(error.message);
    } finally {
      setExecuting(false);
    }
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tablas</p>
                <p className="text-2xl font-bold">{tables.length}</p>
              </div>
              <Database className="w-6 h-6 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Filas</p>
                <p className="text-2xl font-bold">{tables.reduce((sum, t) => sum + t.row_count, 0).toLocaleString()}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">Tablas</TabsTrigger>
          <TabsTrigger value="query">Consultas</TabsTrigger>
        </TabsList>

        <TabsContent value="tables">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tablas Principales</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tabla..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={loadDatabaseInfo}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tabla</TableHead>
                    <TableHead className="text-right">Filas</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTables.map(table => (
                    <TableRow key={table.name}>
                      <TableCell className="font-mono text-sm">{table.name}</TableCell>
                      <TableCell className="text-right">{table.row_count.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          OK
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Explorador de Consultas</CardTitle>
              <CardDescription>Ejecuta consultas SELECT de solo lectura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT * FROM profiles LIMIT 10"
                  className="font-mono text-sm min-h-[100px]"
                />
                <Button 
                  onClick={executeQuery} 
                  disabled={executing}
                  className="w-full sm:w-auto"
                >
                  {executing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Ejecutando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Ejecutar
                    </>
                  )}
                </Button>
              </div>

              {queryError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-sm mt-1">{queryError}</p>
                </div>
              )}

              {queryResult && (
                <div className="border rounded-lg overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {queryResult[0] && Object.keys(queryResult[0]).slice(0, 6).map(key => (
                          <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryResult.slice(0, 50).map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).slice(0, 6).map((val: any, j) => (
                            <TableCell key={j} className="font-mono text-xs max-w-[200px] truncate">
                              {typeof val === 'object' ? JSON.stringify(val).substring(0, 50) : String(val || '-')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-2 bg-muted text-xs text-muted-foreground">
                    {queryResult.length} resultados
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabasePanel;
