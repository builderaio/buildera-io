import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Target, 
  Users, 
  Package,
  Hash,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DigitalPresenceData {
  executive_diagnosis: any;
  what_is_working: any;
  what_is_missing: any;
  key_risks: any;
  action_plan: any;
  competitive_positioning: string | null;
  digital_footprint_summary: string | null;
}

interface CompetitorAnalysisData {
  name: string;
  description: string;
  website: string;
  logo: string | null;
  social_networks: {
    linkedin: string | null;
    facebook: string | null;
    twitter: string | null;
    instagram: string | null;
    youtube: string | null;
    tiktok: string | null;
  };
  products: {
    services: string[];
    offers: string[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  market: {
    country: string[];
    competitors: string[];
    differentiators: string[];
  };
  audience: {
    segments: string[];
    pain_points: string[];
  };
  contact: {
    email: string[];
    phone: string[];
    address: string[];
  };
  digital_presence?: DigitalPresenceData | null;
}

interface CompetitorAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitorData: CompetitorAnalysisData | null;
  competitorName: string;
}

const SocialIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, React.ReactNode> = {
    linkedin: <Linkedin className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    tiktok: <span className="text-xs font-bold">TT</span>,
  };
  return icons[platform] || <Globe className="h-4 w-4" />;
};

const InfoSection = ({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h4 className="font-medium flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-primary" />
      {title}
    </h4>
    <div className="pl-6">{children}</div>
  </div>
);

const TagList = ({ items, variant = 'secondary' }: { items: string[]; variant?: 'default' | 'secondary' | 'outline' }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">No disponible</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, idx) => (
        <Badge key={idx} variant={variant} className="text-xs">
          {item}
        </Badge>
      ))}
    </div>
  );
};

// Helper to extract array items from various formats
const extractItems = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') return item;
      if (item?.item) return item.item;
      if (item?.name) return item.name;
      if (item?.title) return item.title;
      if (item?.description) return item.description;
      return JSON.stringify(item);
    });
  }
  if (typeof data === 'string') return [data];
  if (data?.items) return extractItems(data.items);
  return [];
};

const DiagnosisCard = ({ 
  title, 
  icon: Icon, 
  items, 
  variant = 'default',
  iconColor = 'text-primary'
}: { 
  title: string; 
  icon: React.ElementType; 
  items: string[];
  variant?: 'success' | 'warning' | 'danger' | 'default';
  iconColor?: string;
}) => {
  if (!items || items.length === 0) return null;
  
  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    danger: 'bg-red-500/10 border-red-500/20',
    default: 'bg-muted/50 border-border',
  };
  
  return (
    <Card className={`${bgColors[variant]} border`}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <ul className="space-y-1.5">
          {items.slice(0, 5).map((item, idx) => (
            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export const CompetitorAnalysisModal = ({ 
  open, 
  onOpenChange, 
  competitorData,
  competitorName 
}: CompetitorAnalysisModalProps) => {
  const { t } = useTranslation();
  
  if (!competitorData) return null;

  const socialNetworks = Object.entries(competitorData.social_networks || {})
    .filter(([_, url]) => url);
    
  const dp = competitorData.digital_presence;
  const hasDigitalPresence = dp && (
    dp.executive_diagnosis || 
    dp.what_is_working || 
    dp.what_is_missing || 
    dp.key_risks ||
    dp.action_plan
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {competitorData.logo ? (
              <img 
                src={competitorData.logo} 
                alt={competitorData.name} 
                className="h-10 w-10 rounded object-contain bg-muted"
              />
            ) : (
              <Building2 className="h-10 w-10 text-muted-foreground" />
            )}
            <div>
              <span className="text-lg">{competitorData.name || competitorName}</span>
              {competitorData.website && (
                <a 
                  href={competitorData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-xs text-muted-foreground hover:text-primary"
                >
                  {competitorData.website}
                </a>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-5">
            {/* Description */}
            {competitorData.description && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {competitorData.description}
                </p>
              </div>
            )}

            {/* Digital Presence Section */}
            {hasDigitalPresence && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Análisis de Presencia Digital
                  </h3>
                  
                  {/* Executive Summary */}
                  {dp?.digital_footprint_summary && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm">{dp.digital_footprint_summary}</p>
                    </div>
                  )}
                  
                  {/* Competitive Positioning */}
                  {dp?.competitive_positioning && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Posicionamiento Competitivo:</p>
                      <p className="text-sm">{dp.competitive_positioning}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DiagnosisCard
                      title="Lo que funciona"
                      icon={CheckCircle2}
                      items={extractItems(dp?.what_is_working)}
                      variant="success"
                      iconColor="text-green-600"
                    />
                    
                    <DiagnosisCard
                      title="Lo que falta"
                      icon={XCircle}
                      items={extractItems(dp?.what_is_missing)}
                      variant="warning"
                      iconColor="text-amber-600"
                    />
                    
                    <DiagnosisCard
                      title="Riesgos Clave"
                      icon={AlertTriangle}
                      items={extractItems(dp?.key_risks)}
                      variant="danger"
                      iconColor="text-red-600"
                    />
                    
                    <DiagnosisCard
                      title="Plan de Acción"
                      icon={Lightbulb}
                      items={extractItems(dp?.action_plan)}
                      variant="default"
                      iconColor="text-blue-600"
                    />
                  </div>
                </div>
                
                <Separator />
              </>
            )}

            {/* Social Networks */}
            {socialNetworks.length > 0 && (
              <>
                <InfoSection title="Redes Sociales" icon={Globe}>
                  <div className="flex flex-wrap gap-2">
                    {socialNetworks.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs"
                      >
                        <SocialIcon platform={platform} />
                        <span className="capitalize">{platform}</span>
                      </a>
                    ))}
                  </div>
                </InfoSection>
                <Separator />
              </>
            )}

            {/* Products & Services */}
            <InfoSection title="Productos y Servicios" icon={Package}>
              <div className="space-y-2">
                {competitorData.products?.services?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Servicios:</p>
                    <TagList items={competitorData.products.services} />
                  </div>
                )}
                {competitorData.products?.offers?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ofertas:</p>
                    <TagList items={competitorData.products.offers} variant="outline" />
                  </div>
                )}
                {(!competitorData.products?.services?.length && !competitorData.products?.offers?.length) && (
                  <p className="text-sm text-muted-foreground">No disponible</p>
                )}
              </div>
            </InfoSection>

            <Separator />

            {/* SEO Info */}
            <InfoSection title="SEO" icon={Hash}>
              <div className="space-y-2">
                {competitorData.seo?.title && (
                  <div>
                    <p className="text-xs text-muted-foreground">Título:</p>
                    <p className="text-sm">{competitorData.seo.title}</p>
                  </div>
                )}
                {competitorData.seo?.keywords?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Keywords:</p>
                    <TagList items={competitorData.seo.keywords} variant="outline" />
                  </div>
                )}
              </div>
            </InfoSection>

            <Separator />

            {/* Market Info */}
            <InfoSection title="Mercado" icon={Target}>
              <div className="space-y-2">
                {competitorData.market?.country?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Países:</p>
                    <TagList items={competitorData.market.country} />
                  </div>
                )}
                {competitorData.market?.differentiators?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Diferenciadores:</p>
                    <TagList items={competitorData.market.differentiators} variant="outline" />
                  </div>
                )}
                {competitorData.market?.competitors?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sus competidores:</p>
                    <TagList items={competitorData.market.competitors} variant="secondary" />
                  </div>
                )}
              </div>
            </InfoSection>

            <Separator />

            {/* Audience */}
            <InfoSection title="Audiencia" icon={Users}>
              <div className="space-y-2">
                {competitorData.audience?.segments?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Segmentos:</p>
                    <TagList items={competitorData.audience.segments} />
                  </div>
                )}
                {competitorData.audience?.pain_points?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pain Points:</p>
                    <TagList items={competitorData.audience.pain_points} variant="outline" />
                  </div>
                )}
              </div>
            </InfoSection>

            <Separator />

            {/* Contact */}
            <InfoSection title="Contacto" icon={Mail}>
              <div className="space-y-2 text-sm">
                {competitorData.contact?.email?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{competitorData.contact.email.join(', ')}</span>
                  </div>
                )}
                {competitorData.contact?.phone?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{competitorData.contact.phone.join(', ')}</span>
                  </div>
                )}
                {competitorData.contact?.address?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{competitorData.contact.address.join(', ')}</span>
                  </div>
                )}
                {(!competitorData.contact?.email?.length && !competitorData.contact?.phone?.length && !competitorData.contact?.address?.length) && (
                  <p className="text-muted-foreground">No disponible</p>
                )}
              </div>
            </InfoSection>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
