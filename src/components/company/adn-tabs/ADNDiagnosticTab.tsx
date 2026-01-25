import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { 
  Building2, 
  Search, 
  Package, 
  Mail, 
  MapPin, 
  Users, 
  Hash,
  Link,
  Calendar,
  FileText,
  Target,
  Globe,
  Phone,
  ExternalLink
} from "lucide-react";

interface ADNDiagnosticTabProps {
  webhookData: any;
}

// Helper to ensure we always have an array
const toArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  if (typeof value === 'object') return Object.values(value).flat().filter(Boolean) as string[];
  return [];
};

// Helper to check if has valid data
const hasData = (value: any): boolean => {
  const arr = toArray(value);
  return arr.length > 0;
};

export const ADNDiagnosticTab = ({ webhookData }: ADNDiagnosticTabProps) => {
  const { t } = useTranslation(['common', 'company']);

  if (!webhookData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p>{t('common:adn.noDiagnosticData', 'No hay datos de diagnóstico disponibles')}</p>
        <p className="text-sm mt-2">{t('common:adn.runDiagnosticFirst', 'Ejecuta un diagnóstico desde el onboarding o enriquece los datos')}</p>
      </div>
    );
  }

  const { identity, seo, products, contact, market, audience } = webhookData;

  return (
    <div className="space-y-4">
      {/* Identity Section */}
      {identity && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              {t('common:adn.diagnostic.identity', 'Identidad Corporativa')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {identity.company_name && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.companyName', 'Nombre')}</p>
                  <p className="text-sm font-semibold">{identity.company_name}</p>
                </div>
              )}
              {identity.legal_name && identity.legal_name !== identity.company_name && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.legalName', 'Razón Social')}</p>
                  <p className="text-sm">{identity.legal_name}</p>
                </div>
              )}
              {identity.founding_date && (
                <div className="space-y-1 flex items-start gap-2">
                  <Calendar className="w-3 h-3 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.foundingDate', 'Fundación')}</p>
                    <p className="text-sm">{identity.founding_date}</p>
                  </div>
                </div>
              )}
              {identity.url && (
                <div className="space-y-1 flex items-start gap-2">
                  <Globe className="w-3 h-3 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.website', 'Sitio Web')}</p>
                    <a 
                      href={identity.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {identity.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
            {identity.slogan && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('common:adn.diagnostic.slogan', 'Slogan')}</p>
                <p className="text-sm italic bg-muted/50 px-3 py-2 rounded-md">"{identity.slogan}"</p>
              </div>
            )}
            {identity.logo && (
              <div className="flex items-center gap-3 pt-2">
                <img 
                  src={identity.logo} 
                  alt="Logo" 
                  className="w-12 h-12 object-contain rounded border bg-white"
                />
                <span className="text-xs text-muted-foreground">{t('common:adn.diagnostic.logoDetected', 'Logo detectado')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SEO Section */}
      {seo && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-500" />
              {t('common:adn.diagnostic.seo', 'SEO y Posicionamiento')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-3">
            {seo.title && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.seoTitle', 'Título SEO')}</p>
                <p className="text-sm font-medium">{seo.title}</p>
              </div>
            )}
            {seo.description && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.seoDescription', 'Meta Descripción')}</p>
                <p className="text-sm text-muted-foreground">{seo.description}</p>
              </div>
            )}
            {hasData(seo.keyword) && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {t('common:adn.diagnostic.keywords', 'Palabras Clave')} ({toArray(seo.keyword).length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {toArray(seo.keyword).map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products & Services Section */}
      {products && (hasData(products.service) || hasData(products.offer)) && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-green-500" />
              {t('common:adn.diagnostic.products', 'Productos y Servicios')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-3">
            {hasData(products.service) && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {t('common:adn.diagnostic.services', 'Servicios')} ({toArray(products.service).length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {toArray(products.service).map((service: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {hasData(products.offer) && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {t('common:adn.diagnostic.offers', 'Ofertas Destacadas')} ({toArray(products.offer).length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {toArray(products.offer).map((offer: string, idx: number) => (
                    <Badge key={idx} className="text-xs bg-primary/10 text-primary border-primary/30">
                      {offer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Section */}
      {contact && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              {t('common:adn.diagnostic.contact', 'Información de Contacto')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {hasData(contact.email) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {t('common:adn.diagnostic.emails', 'Emails')}
                  </p>
                  <div className="space-y-0.5">
                    {toArray(contact.email).map((email: string, idx: number) => (
                      <a 
                        key={idx} 
                        href={`mailto:${email}`}
                        className="text-sm text-primary hover:underline block"
                      >
                        {email}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {hasData(contact.phone) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {t('common:adn.diagnostic.phones', 'Teléfonos')}
                  </p>
                  <div className="space-y-0.5">
                    {toArray(contact.phone).map((phone: string, idx: number) => (
                      <p key={idx} className="text-sm">{phone}</p>
                    ))}
                  </div>
                </div>
              )}
              {hasData(contact.address) && (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {t('common:adn.diagnostic.addresses', 'Direcciones')}
                  </p>
                  <div className="space-y-0.5">
                    {toArray(contact.address).map((addr: string, idx: number) => (
                      <p key={idx} className="text-sm">{addr}</p>
                    ))}
                  </div>
                </div>
              )}
              {hasData(contact.social_links) && (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Link className="w-3 h-3" />
                    {t('common:adn.diagnostic.socialLinks', 'Redes Sociales')} ({toArray(contact.social_links).length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {toArray(contact.social_links).map((link: string, idx: number) => {
                      const platform = link.includes('linkedin') ? 'LinkedIn' :
                                       link.includes('instagram') ? 'Instagram' :
                                       link.includes('tiktok') ? 'TikTok' :
                                       link.includes('facebook') ? 'Facebook' :
                                       link.includes('twitter') ? 'Twitter' :
                                       link.includes('youtube') ? 'YouTube' : 'Web';
                      return (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80 flex items-center gap-1"
                        >
                          {platform}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Section */}
      {market && (hasData(market.country) || hasData(market.city)) && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              {t('common:adn.diagnostic.market', 'Mercado')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {hasData(market.country) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.countries', 'Países')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {toArray(market.country).map((country: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {hasData(market.city) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.cities', 'Ciudades')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {toArray(market.city).map((city: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {city}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audience Section */}
      {audience && (hasData(audience.segment) || hasData(audience.profession) || hasData(audience.target_user)) && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              {t('common:adn.diagnostic.audience', 'Audiencia Objetivo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-3">
            {hasData(audience.segment) && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {t('common:adn.diagnostic.segments', 'Segmentos')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {toArray(audience.segment).map((seg: string, idx: number) => (
                    <Badge key={idx} className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                      {seg}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {hasData(audience.profession) && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.professions', 'Profesiones')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {toArray(audience.profession).map((prof: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {prof}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {hasData(audience.target_user) && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{t('common:adn.diagnostic.targetUsers', 'Usuarios Objetivo')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {toArray(audience.target_user).map((user: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {user}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timestamp */}
      {webhookData.processed_at && (
        <p className="text-xs text-muted-foreground text-center">
          {t('common:adn.diagnostic.lastUpdate', 'Última actualización')}: {new Date(webhookData.processed_at).toLocaleString()}
        </p>
      )}
    </div>
  );
};
