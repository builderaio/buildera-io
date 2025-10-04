import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('marketing');
  const [invitation, setInvitation] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    validateInvitation();
  }, [token]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const validateInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('token', token)
        .single();

      if (error) throw error;

      if (data.status !== 'pending') {
        setError(t('invitations.messages.inviteExpired'));
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError(t('invitations.messages.inviteExpired'));
        return;
      }

      setInvitation(data);
      setCompany(data.company);
    } catch (error: any) {
      console.error('Error validating invitation:', error);
      setError('Invitación inválida o no encontrada');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-company-invitation', {
        body: { token }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      toast({
        title: t('invitations.messages.inviteAccepted'),
        description: `Ahora eres miembro de ${company.name}`,
      });

      navigate('/company-dashboard');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: t('common:status.error'),
        description: error.message || 'Error al aceptar la invitación',
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invitación no válida</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-6">
        <div className="text-center mb-6">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Invitación a empresa</h1>
          <p className="text-muted-foreground">
            Has sido invitado a unirte a <strong>{company.name}</strong>
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{invitation.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span>
              Rol: {invitation.role === 'admin' ? t('invitations.admin') : t('invitations.member')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              Expira: {new Date(invitation.expires_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {isAuthenticated ? (
          <Button 
            className="w-full" 
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aceptando...
              </>
            ) : (
              'Aceptar invitación'
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              Para aceptar la invitación, primero debes crear una cuenta o iniciar sesión
            </p>
            <Button 
              className="w-full" 
              onClick={() => navigate(`/auth?invite=${token}`)}
            >
              Crear cuenta / Iniciar sesión
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InviteAccept;
