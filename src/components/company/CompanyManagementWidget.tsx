import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Building, Settings, UserPlus } from 'lucide-react';
import { useCompanyManagement, Company, CompanyMember } from '@/hooks/useCompanyManagement';
import { CreateCompanyDialog } from './CreateCompanyDialog';
import { CompanyMembersDialog } from './CompanyMembersDialog';

import { useToast } from '@/hooks/use-toast';

export const CompanyManagementWidget = () => {
  const { 
    userCompanies, 
    primaryCompany, 
    loading, 
    setPrimaryCompanyForUser,
    fetchCompanyMembers,
    companyMembers
  } = useCompanyManagement();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const { toast } = useToast();

  const handleSetPrimary = async (companyId: string) => {
    const result = await setPrimaryCompanyForUser(companyId);
    if (result.success) {
      toast({
        title: "Empresa principal actualizada",
        description: "La empresa ha sido establecida como principal.",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo establecer como empresa principal.",
        variant: "destructive",
      });
    }
  };

  const handleShowMembers = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    await fetchCompanyMembers(companyId);
    setShowMembersDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Gestión de Empresas
              </CardTitle>
              <CardDescription>
                Administra tus empresas y equipos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {primaryCompany && (
            <div className="border rounded-lg p-4 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={primaryCompany.logo_url} />
                    <AvatarFallback>
                      {primaryCompany.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{primaryCompany.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {primaryCompany.industry_sector} • {primaryCompany.company_size}
                    </p>
                    <Badge variant="default" className="mt-1">
                      Empresa Principal
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowMembers(primaryCompany.id)}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {userCompanies.filter(company => company.id !== primaryCompany?.id).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Otras Empresas</h4>
              {userCompanies
                .filter(company => company.id !== primaryCompany?.id)
                .map((company) => (
                  <div key={company.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={company.logo_url} />
                          <AvatarFallback className="text-xs">
                            {company.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-medium">{company.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {company.industry_sector}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPrimary(company.id)}
                        >
                          Usar Principal
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowMembers(company.id)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {userCompanies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes empresas registradas</p>
              <p className="text-sm">Crea tu primera empresa para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>


      <CreateCompanyDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />

      <CompanyMembersDialog
        open={showMembersDialog}
        onOpenChange={setShowMembersDialog}
        companyId={selectedCompanyId}
        members={companyMembers}
      />
    </>
  );
};