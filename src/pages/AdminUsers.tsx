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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Shield className="w-8 h-8 text-slate-800 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-sm text-gray-500">Portal Admin - Buildera</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por email, nombre o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={userTypeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('all')}
                >
                  Todos ({users.length})
                </Button>
                <Button
                  variant={userTypeFilter === 'company' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('company')}
                >
                  Empresas ({users.filter(u => u.user_type === 'company').length})
                </Button>
                <Button
                  variant={userTypeFilter === 'developer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('developer')}
                >
                  Desarrolladores ({users.filter(u => u.user_type === 'developer').length})
                </Button>
                <Button
                  variant={userTypeFilter === 'expert' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTypeFilter('expert')}
                >
                  Expertos ({users.filter(u => u.user_type === 'expert').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Lista de Usuarios ({filteredUsers.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const UserTypeIcon = getUserTypeIcon(user.user_type);
                return (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          <UserTypeIcon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{user.full_name || 'Sin nombre'}</h3>
                            <Badge className={getUserTypeBadge(user.user_type)}>
                              {user.user_type}
                            </Badge>
                            {user.linked_providers.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Activity className="w-3 h-3 mr-1" />
                                {user.linked_providers.length} conexión(es)
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                            
                            {user.company_name && (
                              <div className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {user.company_name}
                              </div>
                            )}
                            
                            {user.website_url && (
                              <div className="flex items-center">
                                <Globe className="w-3 h-3 mr-1" />
                                <a 
                                  href={user.website_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Sitio web
                                </a>
                              </div>
                            )}
                            
                            {user.industry && (
                              <div className="flex items-center">
                                <Activity className="w-3 h-3 mr-1" />
                                {user.industry}
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(user.created_at).toLocaleDateString('es-ES')}
                            </div>
                          </div>

                          {user.linked_providers.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Conexiones activas:</p>
                              <div className="flex gap-1">
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
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron usuarios con los filtros aplicados</p>
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