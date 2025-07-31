import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEnrichedCompanyData } from '@/hooks/useEnrichedCompanyData';
import { Building, Globe, Users, Calendar, ExternalLink, RefreshCw, Sparkles, Bot, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
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

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Información Enriquecida por IA */}
      {isDataEnriched() && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-6 w-6 text-primary" />
                  <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-lg">Análisis Empresarial ERA</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Analizado el {new Date(companyData.webhook_processed_at!).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                IA
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Descripción Empresarial Enriquecida */}
            {companyData.descripcion_empresa && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">Descripción Empresarial</h4>
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    Generado por ERA
                  </Badge>
                </div>
                <div className="bg-background/60 backdrop-blur-sm border border-primary/20 rounded-lg p-4">
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {companyData.descripcion_empresa}
                  </p>
                </div>
              </div>
            )}

            {/* Sector Identificado */}
            {companyData.industria_principal && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">Sector Principal</h4>
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    Identificado por ERA
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">{companyData.industria_principal}</span>
                </div>
              </div>
            )}

            {/* Redes Sociales Detectadas */}
            {socialLinks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">Redes Sociales Detectadas</h4>
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    Encontradas por ERA
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {socialLinks.map((link) => (
                    <Button
                      key={link.platform}
                      variant="outline"
                      size="sm"
                      asChild
                      className="justify-start bg-background/60 hover:bg-background/80 border-primary/20"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getSocialIcon(link.platform)}
                        <span className="ml-2">{link.platform}</span>
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-primary/20" />
            
            {/* Footer con marca ERA */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span>Información analizada y enriquecida por ERA</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-auto p-1">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de Procesamiento */}
      {!isDataEnriched() && companyData.website_url && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-5 w-5 text-yellow-600" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full animate-ping"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">ERA está analizando tu empresa</p>
                <p className="text-xs text-yellow-700">
                  Estamos procesando la información de tu sitio web para generar insights personalizados
                </p>
              </div>
              <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                Procesando...
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};