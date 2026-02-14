import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  id: string;
  event_type: string;
  risk_level: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  details: any;
}

const SecurityEventsPanel = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setEvents((data || []).map(e => ({
        id: e.id,
        event_type: e.event_type,
        risk_level: e.risk_level || 'low',
        description: (e.details as any)?.description || e.event_type,
        ip_address: e.ip_address ? String(e.ip_address) : null,
        user_agent: e.user_agent,
        created_at: e.created_at || '',
        details: e.details,
      })));
    } catch (error: any) {
      console.error('Error loading security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [...new Set(events.map(e => e.event_type))];

  const filtered = events.filter(e => {
    const matchSearch = !search || 
      e.event_type.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      (e.ip_address && String(e.ip_address).includes(search));
    const matchRisk = riskFilter === 'all' || e.risk_level === riskFilter;
    const matchType = typeFilter === 'all' || e.event_type === typeFilter;
    return matchSearch && matchRisk && matchType;
  });

  const riskCounts = {
    high: events.filter(e => e.risk_level === 'high').length,
    medium: events.filter(e => e.risk_level === 'medium').length,
    low: events.filter(e => e.risk_level === 'low').length,
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Risk summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Alto Riesgo</p>
                <p className="text-xl font-bold text-destructive">{riskCounts.high}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Medio</p>
                <p className="text-xl font-bold">{riskCounts.medium}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Bajo</p>
                <p className="text-xl font-bold">{riskCounts.low}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar eventos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Riesgo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Medio</SelectItem>
                <SelectItem value="low">Bajo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {eventTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={loadEvents}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Riesgo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(event => (
                    <TableRow key={event.id} className={event.risk_level === 'high' ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(event.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(event.risk_level)} className="text-xs">
                          {event.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">
                        {event.description || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {event.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No se encontraron eventos de seguridad</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityEventsPanel;
