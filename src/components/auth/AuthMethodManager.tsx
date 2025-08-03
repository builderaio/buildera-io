import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Mail, Trash2, Plus, Search } from "lucide-react";

const AuthMethodManager = () => {
  const { authMethods, loading, refetch, removeAuthMethod } = useAuthMethods();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddProvider = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setActionLoading(provider);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/company-dashboard?action=link_provider`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveProvider = async (provider: string) => {
    if (authMethods.linkedProviders.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe mantener al menos un método de autenticación activo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(provider);
      const result = await removeAuthMethod(provider);
      
      if (result?.success) {
        toast({
          title: "Método eliminado",
          description: "El método de autenticación ha sido eliminado correctamente.",
        });
      } else {
        throw new Error(result?.error || "Error desconocido");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'email':
        return { name: 'Email/Contraseña', icon: Mail };
      case 'google':
        return { name: 'Google', icon: Search };
      case 'linkedin_oidc':
        return { name: 'LinkedIn', icon: Linkedin };
      default:
        return { name: provider, icon: Mail };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Autenticación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Autenticación</CardTitle>
        <CardDescription>
          Gestiona los métodos que puedes usar para iniciar sesión en tu cuenta.
          Debes mantener al menos un método activo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métodos activos */}
        <div className="space-y-3">
          <h4 className="font-medium">Métodos activos:</h4>
          {authMethods.linkedProviders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay métodos configurados</p>
          ) : (
            authMethods.linkedProviders.map((provider) => {
              const { name, icon: Icon } = getProviderInfo(provider);
              const isPrimary = provider === authMethods.authProvider;
              
              return (
                <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{name}</p>
                      {isPrimary && (
                        <p className="text-xs text-muted-foreground">Método principal</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveProvider(provider)}
                    disabled={actionLoading === provider || authMethods.linkedProviders.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Métodos disponibles para agregar */}
        <div className="space-y-3">
          <h4 className="font-medium">Agregar método:</h4>
          <div className="grid grid-cols-2 gap-3">
            {!authMethods.canUseGoogle && (
              <Button
                variant="outline"
                onClick={() => handleAddProvider('google')}
                disabled={actionLoading === 'google'}
                className="flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <Search className="h-4 w-4" />
                <span>Google</span>
              </Button>
            )}
            {!authMethods.canUseLinkedIn && (
              <Button
                variant="outline"
                onClick={() => handleAddProvider('linkedin_oidc')}
                disabled={actionLoading === 'linkedin_oidc'}
                className="flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthMethodManager;