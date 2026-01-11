import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Building2, 
  Globe2, 
  FileSearch,
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  Star,
  Mail,
  Phone,
  MapPin,
  Tag,
  XCircle,
  CheckCircle,
  Users,
  Calendar,
  Zap,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface OnboardingWowResultsProps {
  results: {
    basic_info?: {
      identity?: any;
      seo?: any;
      products?: any;
      contact?: any;
      market?: any;
      audience?: any;
    };
    digital_presence?: {
      digital_footprint_summary?: string;
      what_is_working?: string[];
      what_is_missing?: string[];
      key_risks?: string[];
      competitive_positioning?: string;
      action_plan?: {
        short_term?: any[];
        mid_term?: any[];
        long_term?: any[];
      };
      executive_diagnosis?: {
        current_state?: string;
        primary_constraint?: string;
        highest_leverage_focus?: string;
      };
    };
  };
  summary: {
    title: string;
    description: string;
    highlights: string[];
  };
  totalTime: number;
  onContinue: () => void;
}

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Globe2,
  tiktok: Globe2
};

// Helper to extract platform name from URL
const getPlatformFromUrl = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('facebook')) return 'facebook';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('youtube')) return 'youtube';
  if (lower.includes('tiktok')) return 'tiktok';
  return 'other';
};

export const OnboardingWowResults = ({ 
  results, 
  summary, 
  totalTime, 
  onContinue 
}: OnboardingWowResultsProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { t } = useTranslation(['common']);

  const basicInfo = results.basic_info || {};
  const digitalPresence = results.digital_presence || {};
  
  const identity = basicInfo.identity || {};
  const seo = basicInfo.seo || {};
  const products = basicInfo.products || {};
  const contact = basicInfo.contact || {};
  const market = basicInfo.market || {};
  const audience = basicInfo.audience || {};
  
  const execDiag = digitalPresence.executive_diagnosis || {};
  const actionPlan = digitalPresence.action_plan || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header with celebration */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
            >
              <Sparkles className="w-16 h-16 mx-auto text-primary" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-foreground"
            >
              {summary.title}
            </motion.h2>
            
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              {summary.description?.substring(0, 200)}...
            </p>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {summary.highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    {highlight}
                  </Badge>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
              <Clock className="w-4 h-4" />
              <span>{t('common:onboarding.generatedIn', { time: (totalTime / 1000).toFixed(1) })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for results - NEW structure: Perfil, Presencia, Diagnóstico */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common:onboarding.tabs.profile', 'Perfil')}</span>
          </TabsTrigger>
          <TabsTrigger value="presence" className="flex items-center gap-2">
            <Globe2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common:onboarding.tabs.presence', 'Presencia')}</span>
          </TabsTrigger>
          <TabsTrigger value="diagnosis" className="flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common:onboarding.tabs.diagnosis', 'Diagnóstico')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Perfil - Identity, SEO, Products, Contact, Market, Audience */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          {/* Identity Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {t('common:onboarding.identity', 'Identidad de Marca')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                {identity.logo && (
                  <img 
                    src={identity.logo} 
                    alt="Logo" 
                    className="w-16 h-16 rounded-lg object-contain bg-muted p-2"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{identity.company_name}</h3>
                  {identity.slogan && (
                    <p className="text-muted-foreground italic">"{identity.slogan}"</p>
                  )}
                  {identity.founding_date && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Fundada en {identity.founding_date}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Info */}
          {seo.title && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t('common:onboarding.seoInfo', 'SEO & Posicionamiento')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Título SEO</p>
                  <p className="text-sm">{seo.title}</p>
                </div>
                {seo.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Meta Descripción</p>
                    <p className="text-sm">{seo.description}</p>
                  </div>
                )}
                {seo.keywords?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {seo.keywords.slice(0, 10).map((kw: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          {(contact.emails?.length > 0 || contact.phones?.length > 0 || contact.addresses?.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  {t('common:onboarding.contact', 'Contacto')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contact.emails?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.emails[0]}</span>
                  </div>
                )}
                {contact.phones?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.phones[0]}</span>
                  </div>
                )}
                {contact.addresses?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.addresses[0]}</span>
                  </div>
                )}
                {/* Social Links */}
                {contact.social_links?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {contact.social_links.map((link: string, idx: number) => {
                      const platform = getPlatformFromUrl(link);
                      const Icon = platformIcons[platform] || Globe2;
                      return (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 text-xs hover:bg-muted/80 transition-colors"
                        >
                          <Icon className="w-3 h-3" />
                          <span className="capitalize">{platform}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {products.services?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  {t('common:onboarding.services', 'Servicios')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {products.services.slice(0, 10).map((service: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="py-1 px-3">
                      {service}
                    </Badge>
                  ))}
                  {products.services.length > 10 && (
                    <Badge variant="secondary">+{products.services.length - 10} más</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audience */}
          {(audience.segments?.length > 0 || audience.professions?.length > 0 || audience.target_users?.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t('common:onboarding.audience', 'Audiencia Objetivo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {audience.segments?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Segmentos</p>
                    <div className="flex flex-wrap gap-1">
                      {audience.segments.map((seg: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{seg}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {audience.professions?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Profesiones</p>
                    <div className="flex flex-wrap gap-1">
                      {audience.professions.map((prof: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">{prof}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {audience.target_users?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Tipo de Usuario</p>
                    <div className="flex flex-wrap gap-1">
                      {audience.target_users.map((user: string, idx: number) => (
                        <Badge key={idx} variant="default" className="text-xs">{user}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Market */}
          {(market.countries?.length > 0 || market.cities?.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-primary" />
                  {t('common:onboarding.market', 'Mercado')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {market.countries?.map((country: string, idx: number) => (
                    <Badge key={`c-${idx}`} variant="secondary">{country}</Badge>
                  ))}
                  {market.cities?.map((city: string, idx: number) => (
                    <Badge key={`ci-${idx}`} variant="outline">{city}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Presencia Digital - what_is_working, what_is_missing, key_risks */}
        <TabsContent value="presence" className="space-y-4 mt-4">
          {/* Digital Footprint Summary */}
          {digitalPresence.digital_footprint_summary && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-primary" />
                  {t('common:onboarding.digitalFootprint', 'Huella Digital')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{digitalPresence.digital_footprint_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* What is Working */}
          {digitalPresence.what_is_working?.length > 0 && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  {t('common:onboarding.whatIsWorking', 'Lo que Funciona Bien')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {digitalPresence.what_is_working.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* What is Missing */}
          {digitalPresence.what_is_missing?.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  {t('common:onboarding.whatIsMissing', 'Lo que Falta')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {digitalPresence.what_is_missing.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-1 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Key Risks */}
          {digitalPresence.key_risks?.length > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  {t('common:onboarding.keyRisks', 'Riesgos Principales')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {digitalPresence.key_risks.map((risk: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                      <span className="text-sm text-muted-foreground">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Competitive Positioning */}
          {digitalPresence.competitive_positioning && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {t('common:onboarding.competitivePositioning', 'Posicionamiento Competitivo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{digitalPresence.competitive_positioning}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Diagnóstico - executive_diagnosis, action_plan */}
        <TabsContent value="diagnosis" className="space-y-4 mt-4">
          {/* Executive Diagnosis */}
          {(execDiag.current_state || execDiag.primary_constraint || execDiag.highest_leverage_focus) && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-primary" />
                  {t('common:onboarding.executiveDiagnosis', 'Diagnóstico Ejecutivo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {execDiag.current_state && (
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Estado Actual</p>
                    <p className="text-sm text-muted-foreground">{execDiag.current_state}</p>
                  </div>
                )}
                {execDiag.primary_constraint && (
                  <div>
                    <p className="text-sm font-medium text-yellow-600 mb-1">Restricción Principal</p>
                    <p className="text-sm text-muted-foreground">{execDiag.primary_constraint}</p>
                  </div>
                )}
                {execDiag.highest_leverage_focus && (
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Foco de Mayor Impacto</p>
                    <p className="text-sm text-muted-foreground">{execDiag.highest_leverage_focus}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Plan - Short Term */}
          {actionPlan.short_term?.length > 0 && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-500" />
                  {t('common:onboarding.shortTermActions', 'Acciones Inmediatas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {actionPlan.short_term.map((action: any, idx: number) => (
                    <AccordionItem key={idx} value={`short-${idx}`}>
                      <AccordionTrigger className="text-left text-sm">
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          {action.action}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm pl-7">
                        {action.reason}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Action Plan - Mid Term */}
          {actionPlan.mid_term?.length > 0 && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  {t('common:onboarding.midTermActions', 'Acciones a Mediano Plazo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {actionPlan.mid_term.map((action: any, idx: number) => (
                    <AccordionItem key={idx} value={`mid-${idx}`}>
                      <AccordionTrigger className="text-left text-sm">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          {action.action}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm pl-7">
                        {action.reason}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Action Plan - Long Term */}
          {actionPlan.long_term?.length > 0 && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  {t('common:onboarding.longTermActions', 'Acciones a Largo Plazo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {actionPlan.long_term.map((action: any, idx: number) => (
                    <AccordionItem key={idx} value={`long-${idx}`}>
                      <AccordionTrigger className="text-left text-sm">
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          {action.action}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm pl-7">
                        {action.reason}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Continue button */}
      <div className="flex justify-center pt-4">
        <Button 
          size="lg" 
          onClick={onContinue}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          {t('common:onboarding.continueToDashboard', 'Continuar al Dashboard')}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};
