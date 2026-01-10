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
  Youtube,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  Star,
  Mail,
  Phone,
  MapPin,
  Tag,
  MessageSquare,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface OnboardingWowResultsProps {
  results: {
    business_profile?: any;
    social_presence?: any;
    diagnosis?: any;
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
  youtube: Youtube,
  tiktok: Globe2
};

export const OnboardingWowResults = ({ 
  results, 
  summary, 
  totalTime, 
  onContinue 
}: OnboardingWowResultsProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { t } = useTranslation(['common']);

  const bp = results.business_profile || {};
  const sp = results.social_presence || {};
  const diag = results.diagnosis || {};

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

      {/* Tabs for results */}
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

        {/* Tab: Business Profile */}
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
                {bp.identity?.logo && (
                  <img 
                    src={bp.identity.logo} 
                    alt="Logo" 
                    className="w-16 h-16 rounded-lg object-contain bg-muted p-2"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{bp.identity?.company_name}</h3>
                  {bp.identity?.slogan && (
                    <p className="text-muted-foreground italic">"{bp.identity.slogan}"</p>
                  )}
                  {bp.identity?.founding_date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Fundada en {bp.identity.founding_date}
                    </p>
                  )}
                </div>
                {bp.trust?.rating && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {bp.trust.rating}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          {bp.contact && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  {t('common:onboarding.contact', 'Contacto')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bp.contact.email?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{bp.contact.email[0]}</span>
                  </div>
                )}
                {bp.contact.phone?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{bp.contact.phone[0]}</span>
                  </div>
                )}
                {bp.contact.address?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{bp.contact.address[0]}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {bp.products?.services?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  {t('common:onboarding.services', 'Servicios')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {bp.products.services.slice(0, 8).map((service: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="py-1 px-3">
                      {service}
                    </Badge>
                  ))}
                  {bp.products.services.length > 8 && (
                    <Badge variant="secondary">+{bp.products.services.length - 8} más</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAQs */}
          {bp.faqs?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {t('common:onboarding.faqs', 'Preguntas Frecuentes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {bp.faqs.slice(0, 3).map((faq: any, idx: number) => (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                      <AccordionTrigger className="text-left text-sm">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          {bp.pricing?.price_range && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t('common:onboarding.pricing', 'Precios')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{bp.pricing.price_range}</p>
                {bp.pricing.payment_methods?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bp.pricing.payment_methods.map((method: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {method}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Social Presence */}
        <TabsContent value="presence" className="space-y-4 mt-4">
          {/* Activity Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-primary" />
                {t('common:onboarding.socialActivity', 'Actividad en Redes')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('common:onboarding.activityLevel', 'Nivel de actividad')}</span>
                <Badge variant={
                  sp.activity?.overall_activity_level === 'high' ? 'default' :
                  sp.activity?.overall_activity_level === 'medium' ? 'secondary' : 'outline'
                }>
                  {sp.activity?.overall_activity_level || 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('common:onboarding.consistency', 'Consistencia')}</span>
                <Badge variant="outline">{sp.activity?.consistency || 'N/A'}</Badge>
              </div>
              {sp.confidence_score && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('common:onboarding.confidenceScore', 'Score de confianza')}</span>
                  <span className="font-semibold">{Math.round(sp.confidence_score * 100)}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Platforms */}
          {sp.activity?.active_platforms?.length > 0 && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  {t('common:onboarding.activePlatforms', 'Plataformas Activas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {sp.activity.active_platforms.map((platform: string, idx: number) => {
                    const Icon = platformIcons[platform.toLowerCase()] || Globe2;
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-green-500/10 rounded-lg px-3 py-2">
                        <Icon className="w-5 h-5 text-green-600" />
                        <span className="capitalize font-medium">{platform}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inactive Platforms */}
          {sp.activity?.inactive_platforms?.length > 0 && (
            <Card className="border-l-4 border-l-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  {t('common:onboarding.inactivePlatforms', 'Plataformas Sin Actividad')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {sp.activity.inactive_platforms.map((platform: string, idx: number) => {
                    const Icon = platformIcons[platform.toLowerCase()] || Globe2;
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 opacity-60">
                        <Icon className="w-5 h-5" />
                        <span className="capitalize">{platform}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tone */}
          {sp.tone && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('common:onboarding.communicationTone', 'Tono de Comunicación')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className="capitalize">{sp.tone.primary}</Badge>
                {sp.tone.secondary?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sp.tone.secondary.map((tone: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="capitalize">
                        {tone.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Content Themes */}
          {sp.content?.themes?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('common:onboarding.contentThemes', 'Temas de Contenido')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {sp.content.themes.map((theme: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <span className="text-muted-foreground">{theme}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Diagnosis */}
        <TabsContent value="diagnosis" className="space-y-4 mt-4">
          {/* Executive Summary */}
          {diag.executive_summary && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-primary" />
                  {t('common:onboarding.executiveSummary', 'Resumen Ejecutivo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{diag.executive_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          {diag.brand_identity_and_offering?.strengths?.length > 0 && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  {t('common:onboarding.strengths', 'Fortalezas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diag.brand_identity_and_offering.strengths.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                      <span className="text-muted-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Gaps */}
          {diag.brand_identity_and_offering?.gaps?.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  {t('common:onboarding.areasToImprove', 'Áreas de Mejora')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diag.brand_identity_and_offering.gaps.map((gap: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-1 shrink-0" />
                      <span className="text-muted-foreground">{gap}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {diag.summary_of_risks?.principal_risks?.length > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  {t('common:onboarding.risks', 'Riesgos Principales')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diag.summary_of_risks.principal_risks.map((risk: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                      <span className="text-muted-foreground">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Prioritized Actions */}
          {diag.prioritized_actions?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {t('common:onboarding.prioritizedActions', 'Acciones Priorizadas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diag.prioritized_actions.slice(0, 5).map((action: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium">{action.action}</h4>
                        <div className="flex gap-1 shrink-0">
                          <Badge variant={action.impact === 'Alto' ? 'default' : 'secondary'} className="text-xs">
                            {action.impact}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {action.timeline}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.rationale}</p>
                      {action.outcome_metrics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {action.outcome_metrics.slice(0, 3).map((metric: string, mIdx: number) => (
                            <Badge key={mIdx} variant="outline" className="text-xs">
                              📊 {metric}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPIs */}
          {diag.metrics_and_kpis?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t('common:onboarding.recommendedKpis', 'KPIs Recomendados')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {diag.metrics_and_kpis.map((kpi: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="py-1 px-3">
                      {kpi}
                    </Badge>
                  ))}
                </div>
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
