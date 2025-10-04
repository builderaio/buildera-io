import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface CompanyInvitation {
  id: string;
  company_id: string;
  inviter_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  inviter?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export const useCompanyInvitations = (companyId: string) => {
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation('marketing');

  const fetchInvitations = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch inviter profiles separately
      const invitationsWithProfiles = await Promise.all(
        (data || []).map(async (invitation: any) => {
          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('user_id', invitation.inviter_id)
            .maybeSingle();

          return {
            ...invitation,
            inviter: inviterProfile || undefined
          } as CompanyInvitation;
        })
      );

      setInvitations(invitationsWithProfiles);
      setPendingCount(invitationsWithProfiles.filter(inv => inv.status === 'pending').length);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      toast({
        title: t('common:status.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (email: string, role: 'admin' | 'member') => {
    try {
      const { data, error } = await supabase.functions.invoke('send-company-invitation', {
        body: { email: email.toLowerCase().trim(), companyId, role }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast({
        title: t('invitations.messages.inviteSent'),
        description: `Invitación enviada a ${email}`,
      });

      await fetchInvitations();
      return { success: true, data };
    } catch (error: any) {
      toast({
        title: t('common:status.error'),
        description: error.message || 'Error al enviar la invitación',
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('company_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: t('invitations.messages.inviteCancelled'),
      });

      await fetchInvitations();
      return { success: true };
    } catch (error: any) {
      toast({
        title: t('common:status.error'),
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const resendInvitation = async (invitationId: string) => {
    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) return { success: false, error: 'Invitation not found' };

    // Cancelar la invitación actual y crear una nueva
    await cancelInvitation(invitationId);
    return await sendInvitation(invitation.email, invitation.role);
  };

  useEffect(() => {
    if (companyId) {
      fetchInvitations();
    }
  }, [companyId]);

  return {
    invitations,
    pendingCount,
    loading,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    refetch: fetchInvitations
  };
};
