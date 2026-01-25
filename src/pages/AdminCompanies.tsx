import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Building2, 
  Search, 
  Users,
  Calendar,
  Mail,
  ExternalLink,
  Activity,
  Power,
  PowerOff,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface CompanyProfile {
  id: string;
  name: string;
  description?: string;
  website_url?: string;
  industry_sector?: string;
  company_size?: string;
  country?: string;
  logo_url?: string;
  created_at: string;
  is_active: boolean;
  deactivated_at?: string;
  member_count: number;
  owner_name: string;
  owner_email: string;
}

const AdminCompanies = () => {
  const { isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    
    loadCompanies();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, statusFilter, companies]);

  const loadCompanies = async () => {
    try {
      // Usar la función RPC segura que bypasea RLS para admins
      const { data, error } = await supabase.rpc('get_all_companies_admin');

      if (error) throw error;

      const companiesData = (data || []).map((company: any) => ({
        id: company.id,
        name: company.name,
        description: company.description,
        website_url: company.website_url,
        industry_sector: company.industry_sector,
        company_size: company.company_size,
        country: company.country,
        logo_url: company.logo_url,
        created_at: company.created_at,
        is_active: company.is_active,
        deactivated_at: company.deactivated_at,
        member_count: Number(company.member_count) || 0,
        owner_name: company.owner_name || 'Sin propietario',
        owner_email: company.owner_email || '',
      }));

      setCompanies(companiesData);
    } catch (error: any) {
      console.error('Error cargando empresas:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar las empresas: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    if (searchTerm) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.owner_name && company.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (company.industry_sector && company.industry_sector.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => 
        statusFilter === 'active' ? company.is_active : !company.is_active
      );
    }

    setFilteredCompanies(filtered);
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'deactivate_company' : 'reactivate_company';
      const { error } = await supabase.rpc(action, { target_company_id: companyId });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Empresa ${currentStatus ? 'inactivada' : 'reactivada'} exitosamente`,
      });

      loadCompanies();
    } catch (error: any) {
      console.error('Error cambiando estado de empresa:', error);
      toast({
        title: "Error",
        description: `Error al cambiar estado: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (company: CompanyProfile) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.rpc('delete_company_cascade', { 
        target_company_id: companyToDelete.id 
      });

      if (error) throw error;

      toast({
        title: "Empresa eliminada",
        description: `"${companyToDelete.name}" y todos sus datos han sido eliminados permanentemente.`,
      });

      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      loadCompanies();
    } catch (error: any) {
      console.error('Error eliminando empresa:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || 'No se pudo eliminar la empresa',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Cargando empresas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Gestión de Empresas"
        subtitle="Administrar todas las empresas del sistema"
        icon={Building2}
        showBackButton={true}
        onRefresh={loadCompanies}
        refreshing={loading}
        badge={{
          text: `${filteredCompanies.length} empresas`,
          variant: "secondary"
        }}
      />
      
      <main className="flex-1 p-6 overflow-auto">
        {/* Filters */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre, propietario o industria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Todas ({companies.length})
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Activas ({companies.filter(c => c.is_active).length})
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Inactivas ({companies.filter(c => !c.is_active).length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies List */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span className="flex items-center min-w-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="truncate">Lista de Empresas ({filteredCompanies.length})</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="bg-muted p-2 rounded-lg flex-shrink-0">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                            {company.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={company.is_active ? "default" : "destructive"} className="text-xs">
                              {company.is_active ? 'Activa' : 'Inactiva'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {company.member_count} miembros
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                          <div className="flex items-center min-w-0">
                            <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate font-medium">{company.owner_name}</span>
                          </div>
                          
                          {company.owner_email && (
                            <div className="flex items-center min-w-0">
                              <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{company.owner_email}</span>
                            </div>
                          )}
                          
                          {company.industry_sector && (
                            <div className="flex items-center min-w-0">
                              <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{company.industry_sector}</span>
                            </div>
                          )}
                          
                          {company.website_url && (
                            <div className="flex items-center min-w-0">
                              <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{company.website_url}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{new Date(company.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>

                        {company.description && (
                          <p className="text-sm text-muted-foreground mb-2 truncate">
                            {company.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Button
                            size="sm"
                            variant={company.is_active ? "outline" : "default"}
                            onClick={() => handleToggleStatus(company.id, company.is_active)}
                            className="text-xs"
                          >
                            {company.is_active ? (
                              <>
                                <PowerOff className="w-3 h-3 mr-1" />
                                Inactivar
                              </>
                            ) : (
                              <>
                                <Power className="w-3 h-3 mr-1" />
                                Reactivar
                              </>
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(company)}
                            className="text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>

                        {!company.is_active && company.deactivated_at && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                            <div className="flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="w-3 h-3" />
                              Inactivada el {new Date(company.deactivated_at).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCompanies.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">No se encontraron empresas con los filtros aplicados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              ¿Eliminar empresa permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Estás a punto de eliminar <strong>"{companyToDelete?.name}"</strong> y todos sus datos asociados:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 bg-destructive/10 p-3 rounded-md">
                <li>Agentes y configuraciones</li>
                <li>Branding y estrategia</li>
                <li>Audiencias y competidores</li>
                <li>Emails y comunicaciones</li>
                <li>Métricas y dashboards</li>
                <li>Membresías de usuarios</li>
              </ul>
              <p className="font-semibold text-destructive">
                Esta acción NO se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar permanentemente
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCompanies;