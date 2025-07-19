import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  ArrowLeft,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CompanyProfileForm from '@/components/company/CompanyProfileForm';

interface CompanyProfile {
  id: string;
  user_id: string;
  company_name?: string;
  nit?: string;
  business_objectives?: string;
  headquarters_address?: string;
  headquarters_lat?: number;
  headquarters_lng?: number;
  headquarters_city?: string;
  headquarters_country?: string;
  industry?: string;
  website_url?: string;
  company_size?: string;
  user_type: 'company' | 'developer' | 'expert';
  email: string;
  full_name: string;
}

const CompanyProfile = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      // Verificar que es una empresa
      if (profileData.user_type !== 'company') {
        toast({
          title: "Acceso denegado",
          description: "Esta sección es solo para empresas",
          variant: "destructive",
        });
        navigate('/profile');
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error cargando perfil de empresa:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil de la empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: CompanyProfile) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando perfil de empresa...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se pudo cargar el perfil de la empresa</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/company-dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Perfil de Empresa</h1>
                <p className="text-sm text-gray-500">Información corporativa y objetivos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800">
                <Building2 className="w-3 h-3 mr-1" />
                Empresa
              </Badge>
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => navigate('/profile')}
              >
                <User className="w-4 h-4 mr-2" />
                Perfil Personal
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {profile.company_name || 'Mi Empresa'}
          </h2>
          <p className="text-gray-600">
            Gestiona la información de tu empresa, ubicación de oficinas y objetivos estratégicos
          </p>
        </div>

        <CompanyProfileForm 
          profile={profile} 
          onProfileUpdate={handleProfileUpdate}
        />
      </main>
    </div>
  );
};

export default CompanyProfile;