import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Building2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompanyCredit {
  id: string;
  company_id: string;
  company_name: string;
  total_credits_purchased: number;
  total_credits_consumed: number;
  available_credits: number;
  last_recharge_at: string | null;
}

const CreditsPanel = () => {
  const { toast } = useToast();
  const [credits, setCredits] = useState<CompanyCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; companyId?: string; companyName?: string }>({ open: false });
  const [assignAmount, setAssignAmount] = useState('');

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    setLoading(true);
    try {
      const { data: creditsData, error } = await supabase
        .from('company_credits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const companyIds = [...new Set(creditsData?.map(c => c.company_id) || [])];
      let companyNames: Record<string, string> = {};

      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);
        companyNames = (companies || []).reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {} as Record<string, string>);
      }

      const mapped: CompanyCredit[] = (creditsData || []).map(c => ({
        id: c.id,
        company_id: c.company_id,
        company_name: companyNames[c.company_id] || 'Empresa desconocida',
        total_credits_purchased: c.total_credits_purchased || 0,
        total_credits_consumed: c.total_credits_consumed || 0,
        available_credits: c.available_credits || 0,
        last_recharge_at: c.last_recharge_at,
      }));

      setCredits(mapped);
    } catch (error: any) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCredits = async () => {
    if (!assignDialog.companyId || !assignAmount) return;
    
    try {
      const amount = parseInt(assignAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({ title: 'Error', description: 'Ingresa una cantidad válida', variant: 'destructive' });
        return;
      }

      const existing = credits.find(c => c.company_id === assignDialog.companyId);
      const newPurchased = (existing?.total_credits_purchased || 0) + amount;
      const newAvailable = (existing?.available_credits || 0) + amount;

      const { error } = await supabase
        .from('company_credits')
        .update({ 
          total_credits_purchased: newPurchased, 
          available_credits: newAvailable,
          last_recharge_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('company_id', assignDialog.companyId);

      if (error) throw error;

      toast({ title: 'Éxito', description: `${amount} créditos asignados a ${assignDialog.companyName}` });
      setAssignDialog({ open: false });
      setAssignAmount('');
      loadCredits();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredCredits = credits.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Comprados</p>
            <p className="text-2xl font-bold">{credits.reduce((s, c) => s + c.total_credits_purchased, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Consumidos</p>
            <p className="text-2xl font-bold">{credits.reduce((s, c) => s + c.total_credits_consumed, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Empresas con Créditos</p>
            <p className="text-2xl font-bold">{credits.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" variant="outline" onClick={loadCredits}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCredits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Comprados</TableHead>
                  <TableHead className="text-right">Consumidos</TableHead>
                  <TableHead className="text-right">Disponibles</TableHead>
                  <TableHead className="text-right">Última Recarga</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredits.map(credit => (
                  <TableRow key={credit.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {credit.company_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{credit.total_credits_purchased.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{credit.total_credits_consumed.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={credit.available_credits > 10 ? 'default' : 'destructive'}>
                        {credit.available_credits.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {credit.last_recharge_at ? new Date(credit.last_recharge_at).toLocaleDateString('es-ES') : '-'}
                    </TableCell>
                    <TableCell>
                      <Dialog open={assignDialog.open && assignDialog.companyId === credit.company_id} onOpenChange={open => setAssignDialog(open ? { open, companyId: credit.company_id, companyName: credit.company_name } : { open: false })}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Plus className="w-3 h-3" />
                            Asignar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Asignar Créditos a {credit.company_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>Cantidad de créditos</Label>
                              <Input type="number" min="1" value={assignAmount} onChange={e => setAssignAmount(e.target.value)} placeholder="100" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Disponibles: {credit.available_credits} → Nuevo: {credit.available_credits + (parseInt(assignAmount) || 0)}
                            </p>
                            <Button onClick={handleAssignCredits} className="w-full">Confirmar Asignación</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No se encontraron resultados' : 'No hay empresas con créditos configurados'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsPanel;
