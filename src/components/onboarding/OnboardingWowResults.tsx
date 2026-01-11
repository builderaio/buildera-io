import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Shield,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

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
  const { t } = useTranslation(['common']);
  const reportRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    toast.info('Generando PDF...', { duration: 2000 });

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      // Calculate pages needed
      const pageHeight = pdfHeight * imgWidth / pdfWidth;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', imgX, position * ratio, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position * ratio, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pageHeight;
      }

      const companyName = identity.company_name || 'empresa';
      pdf.save(`diagnostico-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Action Buttons - Fixed at top */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 px-2 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{t('common:onboarding.generatedIn', { time: (totalTime / 1000).toFixed(1) })}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
          <Button 
            onClick={onContinue}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Continuar
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* One-Page Report - Printable */}
      <div 
        ref={reportRef} 
        className="bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        {/* Report Header */}
        <div className="bg-gradient-to-r from-[#3c46b2] to-[#5a64c8] text-white p-8">
          <div className="flex items-start gap-6">
            {identity.logo && (
              <img 
                src={identity.logo} 
                alt="Logo" 
                className="w-20 h-20 rounded-xl object-contain bg-white/10 p-2"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <FileSearch className="w-4 h-4" />
                DIAGNÓSTICO DIGITAL
              </div>
              <h1 className="text-3xl font-bold mb-2">{identity.company_name || 'Empresa'}</h1>
              {identity.slogan && (
                <p className="text-white/80 italic text-lg">"{identity.slogan}"</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/70">
                {identity.url && (
                  <span className="flex items-center gap-1">
                    <Globe2 className="w-4 h-4" />
                    {identity.url}
                  </span>
                )}
                {identity.founding_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Fundada en {identity.founding_date}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-8 space-y-8">
          
          {/* Executive Summary */}
          {(execDiag.current_state || execDiag.primary_constraint || execDiag.highest_leverage_focus) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#3c46b2] flex items-center justify-center">
                  <FileSearch className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Diagnóstico Ejecutivo</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                {execDiag.current_state && (
                  <div>
                    <p className="text-sm font-semibold text-[#3c46b2] mb-1">Estado Actual</p>
                    <p className="text-gray-700">{execDiag.current_state}</p>
                  </div>
                )}
                {execDiag.primary_constraint && (
                  <div>
                    <p className="text-sm font-semibold text-[#f15438] mb-1">Restricción Principal</p>
                    <p className="text-gray-700">{execDiag.primary_constraint}</p>
                  </div>
                )}
                {execDiag.highest_leverage_focus && (
                  <div>
                    <p className="text-sm font-semibold text-green-600 mb-1">Foco de Mayor Impacto</p>
                    <p className="text-gray-700">{execDiag.highest_leverage_focus}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <Separator className="bg-gray-200" />

          {/* Two Column Layout: Company Profile + Digital Presence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Column 1: Company Profile */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#3c46b2] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Perfil de Empresa</h2>
              </div>

              {/* Contact */}
              {(contact.email?.length > 0 || contact.phone?.length > 0 || contact.address?.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#3c46b2]" />
                    Contacto
                  </p>
                  <div className="space-y-2 text-sm">
                    {contact.email?.[0] && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3 h-3" /> {contact.email[0]}
                      </p>
                    )}
                    {contact.phone?.[0] && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3 h-3" /> {contact.phone[0]}
                      </p>
                    )}
                    {contact.address?.[0] && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-3 h-3" /> {contact.address[0]}
                      </p>
                    )}
                  </div>
                  {/* Social Links */}
                  {contact.social_links?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {contact.social_links.map((link: string, idx: number) => {
                        const platform = getPlatformFromUrl(link);
                        const Icon = platformIcons[platform] || Globe2;
                        return (
                          <span key={idx} className="inline-flex items-center gap-1 bg-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                            <Icon className="w-3 h-3" />
                            {platform}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Services */}
              {(products.service?.length > 0 || products.offer?.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#3c46b2]" />
                    Servicios y Ofertas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(products.service || []).slice(0, 6).map((s: string, idx: number) => (
                      <span key={idx} className="bg-[#3c46b2]/10 text-[#3c46b2] rounded-full px-3 py-1 text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience & Market */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3c46b2]" />
                  Audiencia y Mercado
                </p>
                <div className="flex flex-wrap gap-2">
                  {(audience.segment || []).map((s: string, idx: number) => (
                    <span key={`s-${idx}`} className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-medium">
                      {s}
                    </span>
                  ))}
                  {(audience.profession || []).map((p: string, idx: number) => (
                    <span key={`p-${idx}`} className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-medium">
                      {p}
                    </span>
                  ))}
                  {(market.country || []).map((c: string, idx: number) => (
                    <span key={`c-${idx}`} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                      {c}
                    </span>
                  ))}
                  {(market.city || []).map((ci: string, idx: number) => (
                    <span key={`ci-${idx}`} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                      {ci}
                    </span>
                  ))}
                </div>
              </div>

              {/* SEO Keywords */}
              {seo.keyword?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#3c46b2]" />
                    Keywords SEO
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {seo.keyword.slice(0, 8).map((kw: string, idx: number) => (
                      <span key={idx} className="bg-gray-200 text-gray-600 rounded px-2 py-0.5 text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Column 2: Digital Presence Analysis */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#3c46b2] flex items-center justify-center">
                  <Globe2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Presencia Digital</h2>
              </div>

              {/* Digital Footprint */}
              {digitalPresence.digital_footprint_summary && (
                <div className="bg-[#3c46b2]/5 border border-[#3c46b2]/20 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{digitalPresence.digital_footprint_summary}</p>
                </div>
              )}

              {/* What is Working */}
              {digitalPresence.what_is_working?.length > 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Lo que Funciona Bien
                  </p>
                  <ul className="space-y-2">
                    {digitalPresence.what_is_working.slice(0, 3).map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                        <span className="line-clamp-2">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What is Missing */}
              {digitalPresence.what_is_missing?.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Lo que Falta
                  </p>
                  <ul className="space-y-2">
                    {digitalPresence.what_is_missing.slice(0, 3).map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="w-3 h-3 text-yellow-500 mt-1 shrink-0" />
                        <span className="line-clamp-2">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Risks */}
              {digitalPresence.key_risks?.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Riesgos Principales
                  </p>
                  <ul className="space-y-2">
                    {digitalPresence.key_risks.slice(0, 3).map((risk: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <XCircle className="w-3 h-3 text-red-500 mt-1 shrink-0" />
                        <span className="line-clamp-2">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Competitive Positioning */}
              {digitalPresence.competitive_positioning && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#3c46b2]" />
                    Posicionamiento Competitivo
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-4">{digitalPresence.competitive_positioning}</p>
                </div>
              )}
            </section>
          </div>

          <Separator className="bg-gray-200" />

          {/* Action Plan - Full Width */}
          {(actionPlan.short_term?.length > 0 || actionPlan.mid_term?.length > 0 || actionPlan.long_term?.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#f15438] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Plan de Acción</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Short Term */}
                {actionPlan.short_term?.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-green-800">Corto Plazo</h3>
                    </div>
                    <ul className="space-y-3">
                      {actionPlan.short_term.slice(0, 3).map((action: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-2">{action.action}</p>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{action.reason}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mid Term */}
                {actionPlan.mid_term?.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-blue-800">Mediano Plazo</h3>
                    </div>
                    <ul className="space-y-3">
                      {actionPlan.mid_term.slice(0, 3).map((action: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-2">{action.action}</p>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{action.reason}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Long Term */}
                {actionPlan.long_term?.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-purple-800">Largo Plazo</h3>
                    </div>
                    <ul className="space-y-3">
                      {actionPlan.long_term.slice(0, 3).map((action: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-2">{action.action}</p>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{action.reason}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3c46b2]" />
                <span>Generado por Buildera</span>
              </div>
              <span>{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
