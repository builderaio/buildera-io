import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Shield,
  ArrowLeft,
  Building2,
  Code,
  User,
  Calendar,
  Mail,
  Globe,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import ThemeSelector from '@/components/ThemeSelector';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  user_type: 'company' | 'developer' | 'expert';
  company_name?: string;
  website_url?: string;
  industry?: string;
  created_at: string;
  linked_providers: string[];
}

const AdminUsers = () => {
  const { isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    
    loadUsers();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, userTypeFilter, users]);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.user_type === userTypeFilter);
    }

    setFilteredUsers(filtered);
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'company':
        return Building2;
      case 'developer':
        return Code;
      case 'expert':
        return User;
      default:
        return User;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const colors = {
      company: "bg-blue-100 text-blue-800",
      developer: "bg-green-100 text-green-800",
      expert: "bg-purple-100 text-purple-800"
    };
    return colors[userType as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando usuarios...</p>
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
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center p-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <Shield className="w-5 h-5 sm:w-8 sm:h-8 text-primary mr-2 sm:mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-xl font-bold text-foreground truncate">Gestión de Usuarios</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <ThemeSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Filters */}
        <Card className="mb-4 sm:mb-6 animate-fade-in">
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
                  placeholder="Buscar por email, nombre o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={userTypeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('all')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Todos ({users.length})
                </Button>
                <Button
                  variant={userTypeFilter === 'company' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('company')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Empresas ({users.filter(u => u.user_type === 'company').length})
                </Button>
                <Button
                  variant={userTypeFilter === 'developer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('developer')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Dev ({users.filter(u => u.user_type === 'developer').length})
                </Button>
                <Button
                  variant={userTypeFilter === 'expert' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('expert')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Expertos ({users.filter(u => u.user_type === 'expert').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span className="flex items-center min-w-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="truncate">Lista de Usuarios ({filteredUsers.length})</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {filteredUsers.map((user) => {
                const UserTypeIcon = getUserTypeIcon(user.user_type);
                return (
                  <div key={user.id} className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 active:bg-accent transition-colors hover-scale">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="bg-muted p-2 rounded-lg flex-shrink-0">
                          <UserTypeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{user.full_name || 'Sin nombre'}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${getUserTypeBadge(user.user_type)} text-xs`}>
                                {user.user_type}
                              </Badge>
                              {user.linked_providers.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Activity className="w-3 h-3 mr-1" />
                                  {user.linked_providers.length} conexión(es)
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center min-w-0">
                              <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            
                            {user.company_name && (
                              <div className="flex items-center min-w-0">
                                <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{user.company_name}</span>
                              </div>
                            )}
                            
                            {user.website_url && (
                              <div className="flex items-center min-w-0">
                                <Globe className="w-3 h-3 mr-1 flex-shrink-0" />
                                <a 
                                  href={user.website_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate"
                                >
                                  Sitio web
                                </a>
                              </div>
                            )}
                            
                            {user.industry && (
                              <div className="flex items-center min-w-0">
                                <Activity className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{user.industry}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{new Date(user.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                          </div>

                          {user.linked_providers.length > 0 && (
                            <div className="mt-2 sm:mt-3">
                              <p className="text-xs text-gray-500 mb-1">Conexiones activas:</p>
                              <div className="flex gap-1 flex-wrap">
                                {user.linked_providers.map((provider, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {provider}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">No se encontraron usuarios con los filtros aplicados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUsers;