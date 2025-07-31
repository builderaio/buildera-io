import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Company {
  id: string;
  name: string;
  description?: string;
  website_url?: string;
  industry_sector?: string;
  company_size?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  is_primary: boolean;
}

export const useCompanyManagement = () => {
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [primaryCompany, setPrimaryCompany] = useState<Company | null>(null);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCompanies = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select(`
          *,
          companies (*)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (memberError) {
        console.error('Error fetching user companies:', memberError);
        return;
      }

      const companies = memberData?.map(member => member.companies) || [];
      const primaryCompanyData = memberData?.find(member => member.is_primary)?.companies;

      setUserCompanies(companies);
      setPrimaryCompany(primaryCompanyData || null);
    } catch (error) {
      console.error('Error in fetchUserCompanies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyMembers = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching company members:', error);
        return;
      }

      setCompanyMembers((data || []) as CompanyMember[]);
    } catch (error) {
      console.error('Error in fetchCompanyMembers:', error);
    }
  };

  const createCompany = async (companyData: {
    name: string;
    description?: string;
    website_url?: string;
    industry_sector?: string;
    company_size?: string;
  }) => {
    try {
      const { data, error } = await supabase.rpc('create_company_with_owner', {
        company_name: companyData.name,
        company_description: companyData.description,
        website_url: companyData.website_url,
        industry_sector: companyData.industry_sector,
        company_size: companyData.company_size
      });

      if (error) {
        console.error('Error creating company:', error);
        return { success: false, error };
      }

      await fetchUserCompanies();
      return { success: true, data };
    } catch (error) {
      console.error('Error in createCompany:', error);
      return { success: false, error };
    }
  };

  const updateCompany = async (companyId: string, updates: Partial<Company>) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);

      if (error) {
        console.error('Error updating company:', error);
        return { success: false, error };
      }

      await fetchUserCompanies();
      return { success: true };
    } catch (error) {
      console.error('Error in updateCompany:', error);
      return { success: false, error };
    }
  };

  const addCompanyMember = async (companyId: string, userId: string, role: 'admin' | 'member' = 'member') => {
    try {
      const { error } = await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: userId,
          role
        });

      if (error) {
        console.error('Error adding company member:', error);
        return { success: false, error };
      }

      await fetchCompanyMembers(companyId);
      return { success: true };
    } catch (error) {
      console.error('Error in addCompanyMember:', error);
      return { success: false, error };
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'owner' | 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) {
        console.error('Error updating member role:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateMemberRole:', error);
      return { success: false, error };
    }
  };

  const removeCompanyMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error removing company member:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in removeCompanyMember:', error);
      return { success: false, error };
    }
  };

  const setPrimaryCompanyForUser = async (companyId: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return { success: false, error: 'User not authenticated' };

      // Remover primary de todas las membresías del usuario
      const { error: resetError } = await supabase
        .from('company_members')
        .update({ is_primary: false })
        .eq('user_id', userId);

      if (resetError) {
        console.error('Error resetting primary company:', resetError);
        return { success: false, error: resetError };
      }

      // Establecer la nueva empresa como primary
      const { error: setPrimaryError } = await supabase
        .from('company_members')
        .update({ is_primary: true })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (setPrimaryError) {
        console.error('Error setting primary company:', setPrimaryError);
        return { success: false, error: setPrimaryError };
      }

      await fetchUserCompanies();
      return { success: true };
    } catch (error) {
      console.error('Error in setPrimaryCompanyForUser:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchUserCompanies();
  }, []);

  return {
    userCompanies,
    primaryCompany,
    companyMembers,
    loading,
    fetchUserCompanies,
    fetchCompanyMembers,
    createCompany,
    updateCompany,
    addCompanyMember,
    updateMemberRole,
    removeCompanyMember,
    setPrimaryCompanyForUser
  };
};