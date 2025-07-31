import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEnrichedCompanyData } from '@/hooks/useEnrichedCompanyData';
import { Building, Globe, Users, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnrichedCompanyInfoProps {
  companyId: string;
}

export const EnrichedCompanyInfo = ({ companyId }: EnrichedCompanyInfoProps) => {
  const { 
    companyData, 
    loading, 
    error, 
    refreshCompanyData, 
    getSocialMediaLinks, 
    isDataEnriched,
    getEnrichmentStatus 
  } = useEnrichedCompanyData(companyId);
  const { toast } = useToast();

  const handleRefresh = () => {
    refreshCompanyData();
    toast({
      title: "Actualizando información",
      description: "Refrescando datos de la empresa...",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !companyData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Error cargando información de la empresa</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const socialLinks = getSocialMediaLinks();
  const enrichmentStatus = getEnrichmentStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {companyData.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              {companyData.company_size && (
                <>
                  <Users className="h-4 w-4" />
                  {companyData.company_size}
                </>
              )}
              {companyData.website_url && (
                <>
                  <Globe className="h-4 w-4 ml-3" />
                  <a 
                    href={companyData.website_url.startsWith('http') ? companyData.website_url : `https://${companyData.website_url}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {companyData.website_url}
                  </a>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={enrichmentStatus === 'enriched' ? 'default' : 'secondary'}>
              {enrichmentStatus === 'enriched' ? 'Datos Enriquecidos' : 'Pendiente de Análisis'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Información básica */}
        <div>
          <h4 className="text-sm font-medium mb-3">Información General</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sector</p>
              <p className="font-medium">
                {companyData.industria_principal || companyData.industry_sector || 'No especificado'}
              </p>
            </div>
            {isDataEnriched() && companyData.webhook_processed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Último Análisis</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(companyData.webhook_processed_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Descripción enriquecida */}
        {companyData.descripcion_empresa && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">Descripción Empresarial</h4>
              <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                {companyData.descripcion_empresa}
              </p>
            </div>
          </>
        )}

        {/* Redes sociales */}
        {socialLinks.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">Redes Sociales</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {socialLinks.map((link) => (
                  <Button
                    key={link.platform}
                    variant="outline"
                    size="sm"
                    asChild
                    className="justify-start"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {link.platform}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Información de estado */}
        {!isDataEnriched() && companyData.website_url && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
              <p className="text-sm text-yellow-800">
                Analizando información de la empresa en segundo plano...
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};