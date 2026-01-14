import { useRef } from 'react';
import { Button } from '@/components/ui/button';
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
  Download,
  Youtube
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  youtube: Youtube,
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

  // Generate professional PDF using jsPDF directly
  const handleDownloadPDF = async () => {
    toast.info('Generando PDF...', { duration: 2000 });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;
      
      const primaryColor: [number, number, number] = [60, 70, 178];
      const accentColor: [number, number, number] = [241, 84, 56];
      const textColor: [number, number, number] = [55, 65, 81];
      const lightGray: [number, number, number] = [156, 163, 175];

      // Helper functions
      const addPage = () => {
        pdf.addPage();
        yPos = margin;
      };

      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - margin) {
          addPage();
          return true;
        }
        return false;
      };

      const drawText = (text: string, x: number, y: number, options: { 
        fontSize?: number; 
        color?: [number, number, number]; 
        fontStyle?: 'normal' | 'bold';
        maxWidth?: number;
      } = {}) => {
        const { fontSize = 10, color = textColor, fontStyle = 'normal', maxWidth } = options;
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', fontStyle);
        if (maxWidth) {
          const lines = pdf.splitTextToSize(text, maxWidth);
          pdf.text(lines, x, y);
          return lines.length * (fontSize * 0.4);
        }
        pdf.text(text, x, y);
        return fontSize * 0.4;
      };

      // === HEADER ===
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      drawText('DIAGNÓSTICO DIGITAL', margin, 15, { fontSize: 10, color: [255, 255, 255], fontStyle: 'normal' });
      drawText(identity.company_name || 'Empresa', margin, 28, { fontSize: 22, color: [255, 255, 255], fontStyle: 'bold' });
      
      if (identity.slogan) {
        drawText(`"${identity.slogan}"`, margin, 38, { fontSize: 9, color: [200, 200, 255], fontStyle: 'normal' });
      }
      
      // Website and date on the right
      if (identity.url) {
        const urlText = identity.url.replace(/^https?:\/\//, '');
        pdf.setFontSize(9);
        pdf.setTextColor(200, 200, 255);
        pdf.text(urlText, pageWidth - margin, 20, { align: 'right' });
      }
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 220);
      pdf.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, 38, { align: 'right' });

      yPos = 55;

      // === EXECUTIVE DIAGNOSIS ===
      if (execDiag.current_state || execDiag.primary_constraint || execDiag.highest_leverage_focus) {
        checkPageBreak(50);
        
        drawText('DIAGNÓSTICO EJECUTIVO', margin, yPos, { fontSize: 12, color: primaryColor, fontStyle: 'bold' });
        yPos += 8;
        
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, margin + 40, yPos);
        yPos += 8;

        if (execDiag.current_state) {
          drawText('Estado Actual:', margin, yPos, { fontSize: 9, color: primaryColor, fontStyle: 'bold' });
          yPos += 5;
          const h = drawText(execDiag.current_state, margin, yPos, { fontSize: 9, maxWidth: contentWidth });
          yPos += h + 6;
        }

        if (execDiag.primary_constraint) {
          checkPageBreak(20);
          drawText('Restricción Principal:', margin, yPos, { fontSize: 9, color: accentColor, fontStyle: 'bold' });
          yPos += 5;
          const h = drawText(execDiag.primary_constraint, margin, yPos, { fontSize: 9, maxWidth: contentWidth });
          yPos += h + 6;
        }

        if (execDiag.highest_leverage_focus) {
          checkPageBreak(20);
          drawText('Foco de Mayor Impacto:', margin, yPos, { fontSize: 9, color: [22, 163, 74], fontStyle: 'bold' });
          yPos += 5;
          const h = drawText(execDiag.highest_leverage_focus, margin, yPos, { fontSize: 9, maxWidth: contentWidth });
          yPos += h + 10;
        }
      }

      // === TWO COLUMN LAYOUT ===
      const colWidth = (contentWidth - 10) / 2;
      const leftCol = margin;
      const rightCol = margin + colWidth + 10;
      let leftY = yPos;
      let rightY = yPos;

      // --- LEFT COLUMN: COMPANY PROFILE ---
      drawText('PERFIL DE EMPRESA', leftCol, leftY, { fontSize: 11, color: primaryColor, fontStyle: 'bold' });
      leftY += 10;

      // Contact info
      if (contact.email?.length || contact.phone?.length || contact.address?.length) {
        drawText('Contacto', leftCol, leftY, { fontSize: 9, fontStyle: 'bold' });
        leftY += 5;
        
        (contact.email || []).forEach((email: string) => {
          drawText(`📧 ${email}`, leftCol, leftY, { fontSize: 8, color: lightGray });
          leftY += 4;
        });
        (contact.phone || []).forEach((phone: string) => {
          drawText(`📞 ${phone}`, leftCol, leftY, { fontSize: 8, color: lightGray });
          leftY += 4;
        });
        (contact.address || []).forEach((addr: string) => {
          drawText(`📍 ${addr}`, leftCol, leftY, { fontSize: 8, color: lightGray });
          leftY += 4;
        });
        leftY += 4;
      }

      // Social links
      if (contact.social_links?.length > 0) {
        drawText('Redes Sociales', leftCol, leftY, { fontSize: 9, fontStyle: 'bold' });
        leftY += 5;
        contact.social_links.forEach((link: string) => {
          const platform = getPlatformFromUrl(link);
          const shortUrl = link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 35);
          drawText(`• ${platform}: ${shortUrl}${link.length > 40 ? '...' : ''}`, leftCol, leftY, { fontSize: 7, color: lightGray });
          leftY += 4;
        });
        leftY += 4;
      }

      // Services - show ALL
      if (products.service?.length > 0) {
        drawText('Servicios', leftCol, leftY, { fontSize: 9, fontStyle: 'bold' });
        leftY += 5;
        products.service.forEach((s: string) => {
          checkPageBreak(6);
          drawText(`• ${s}`, leftCol, leftY, { fontSize: 8, maxWidth: colWidth - 5 });
          leftY += 4;
        });
        leftY += 4;
      }

      // Offers - show ALL
      if (products.offer?.length > 0) {
        drawText('Ofertas', leftCol, leftY, { fontSize: 9, fontStyle: 'bold' });
        leftY += 5;
        products.offer.forEach((o: string) => {
          checkPageBreak(6);
          drawText(`• ${o}`, leftCol, leftY, { fontSize: 8, maxWidth: colWidth - 5 });
          leftY += 4;
        });
        leftY += 4;
      }

      // Audience & Market - show ALL
      if (audience.segment?.length || audience.profession?.length || audience.target_user?.length) {
        drawText('Audiencia', leftCol, leftY, { fontSize: 9, fontStyle: 'bold' });
        leftY += 5;
        (audience.segment || []).forEach((s: string) => {
          drawText(`• Segmento: ${s}`, leftCol, leftY, { fontSize: 8, color: lightGray });
          leftY += 4;
        });
        (audience.profession || []).forEach((p: string) => {
          drawText(`• Profesión: ${p}`, leftCol, leftY, { fontSize: 8, color: lightGray });
          leftY += 4;
        });
        (audience.target_user || []).forEach((t: string) => {
          drawText(`• Usuario: ${t}`, leftCol, leftY, { fontSize: 8, color: lightGray });
          leftY += 4;
        });
        leftY += 4;
      }

      if (market.country?.length || market.city?.length) {
        drawText('Mercado', leftCol, leftY, { fontSize: 9, fontStyle: 'bold' });
        leftY += 5;
        (market.country || []).forEach((c: string) => {
          drawText(`• País: ${c}`, leftCol, leftY, { fontSize: 8, color: lightGray });
          leftY += 4;
        });
        (market.city || []).forEach((c: string) => {
          drawText(`• Ciudad: ${c}`, leftCol, leftY, { fontSize: 8, color: lightGray });
          leftY += 4;
        });
        leftY += 4;
      }

      // SEO Keywords - show ALL
      if (seo.keyword?.length > 0) {
        drawText('Keywords SEO', leftCol, leftY, { fontSize: 9, fontStyle: 'bold' });
        leftY += 5;
        seo.keyword.forEach((kw: string) => {
          checkPageBreak(6);
          drawText(`• ${kw}`, leftCol, leftY, { fontSize: 7, color: lightGray, maxWidth: colWidth - 5 });
          leftY += 4;
        });
      }

      // --- RIGHT COLUMN: DIGITAL PRESENCE ---
      drawText('PRESENCIA DIGITAL', rightCol, rightY, { fontSize: 11, color: primaryColor, fontStyle: 'bold' });
      rightY += 10;

      // Digital footprint summary
      if (digitalPresence.digital_footprint_summary) {
        const h = drawText(digitalPresence.digital_footprint_summary, rightCol, rightY, { fontSize: 8, maxWidth: colWidth });
        rightY += h + 8;
      }

      // What is working - show ALL
      if (digitalPresence.what_is_working?.length > 0) {
        drawText('✓ Lo que Funciona Bien', rightCol, rightY, { fontSize: 9, color: [22, 163, 74], fontStyle: 'bold' });
        rightY += 5;
        digitalPresence.what_is_working.forEach((item: string) => {
          checkPageBreak(10);
          const h = drawText(`• ${item}`, rightCol, rightY, { fontSize: 8, maxWidth: colWidth - 5 });
          rightY += h + 2;
        });
        rightY += 4;
      }

      // What is missing - show ALL
      if (digitalPresence.what_is_missing?.length > 0) {
        drawText('⚠ Lo que Falta', rightCol, rightY, { fontSize: 9, color: [202, 138, 4], fontStyle: 'bold' });
        rightY += 5;
        digitalPresence.what_is_missing.forEach((item: string) => {
          checkPageBreak(10);
          const h = drawText(`• ${item}`, rightCol, rightY, { fontSize: 8, maxWidth: colWidth - 5 });
          rightY += h + 2;
        });
        rightY += 4;
      }

      // Key risks - show ALL
      if (digitalPresence.key_risks?.length > 0) {
        drawText('✗ Riesgos Principales', rightCol, rightY, { fontSize: 9, color: accentColor, fontStyle: 'bold' });
        rightY += 5;
        digitalPresence.key_risks.forEach((risk: string) => {
          checkPageBreak(10);
          const h = drawText(`• ${risk}`, rightCol, rightY, { fontSize: 8, maxWidth: colWidth - 5 });
          rightY += h + 2;
        });
        rightY += 4;
      }

      // Competitive positioning
      if (digitalPresence.competitive_positioning) {
        drawText('Posicionamiento Competitivo', rightCol, rightY, { fontSize: 9, fontStyle: 'bold' });
        rightY += 5;
        const h = drawText(digitalPresence.competitive_positioning, rightCol, rightY, { fontSize: 8, maxWidth: colWidth });
        rightY += h + 8;
      }

      // === ACTION PLAN (new page if needed) ===
      yPos = Math.max(leftY, rightY) + 15;
      
      if (actionPlan.short_term?.length || actionPlan.mid_term?.length || actionPlan.long_term?.length) {
        checkPageBreak(60);
        
        drawText('PLAN DE ACCIÓN', margin, yPos, { fontSize: 12, color: accentColor, fontStyle: 'bold' });
        yPos += 8;
        
        pdf.setDrawColor(...accentColor);
        pdf.line(margin, yPos, margin + 30, yPos);
        yPos += 10;

        const planColWidth = (contentWidth - 20) / 3;

        // Short term - show ALL
        if (actionPlan.short_term?.length > 0) {
          let planY = yPos;
          drawText('CORTO PLAZO', margin, planY, { fontSize: 9, color: [22, 163, 74], fontStyle: 'bold' });
          planY += 6;
          actionPlan.short_term.forEach((action: any, idx: number) => {
            checkPageBreak(15);
            drawText(`${idx + 1}. ${action.action || action}`, margin, planY, { fontSize: 8, fontStyle: 'bold', maxWidth: planColWidth });
            planY += 5;
            if (action.reason) {
              const h = drawText(action.reason, margin + 3, planY, { fontSize: 7, color: lightGray, maxWidth: planColWidth - 5 });
              planY += h + 3;
            }
          });
        }

        // Mid term - show ALL
        if (actionPlan.mid_term?.length > 0) {
          let planY = yPos;
          const midCol = margin + planColWidth + 10;
          drawText('MEDIANO PLAZO', midCol, planY, { fontSize: 9, color: [37, 99, 235], fontStyle: 'bold' });
          planY += 6;
          actionPlan.mid_term.forEach((action: any, idx: number) => {
            checkPageBreak(15);
            drawText(`${idx + 1}. ${action.action || action}`, midCol, planY, { fontSize: 8, fontStyle: 'bold', maxWidth: planColWidth });
            planY += 5;
            if (action.reason) {
              const h = drawText(action.reason, midCol + 3, planY, { fontSize: 7, color: lightGray, maxWidth: planColWidth - 5 });
              planY += h + 3;
            }
          });
        }

        // Long term - show ALL
        if (actionPlan.long_term?.length > 0) {
          let planY = yPos;
          const longCol = margin + (planColWidth + 10) * 2;
          drawText('LARGO PLAZO', longCol, planY, { fontSize: 9, color: [147, 51, 234], fontStyle: 'bold' });
          planY += 6;
          actionPlan.long_term.forEach((action: any, idx: number) => {
            checkPageBreak(15);
            drawText(`${idx + 1}. ${action.action || action}`, longCol, planY, { fontSize: 8, fontStyle: 'bold', maxWidth: planColWidth });
            planY += 5;
            if (action.reason) {
              const h = drawText(action.reason, longCol + 3, planY, { fontSize: 7, color: lightGray, maxWidth: planColWidth - 5 });
              planY += h + 3;
            }
          });
        }
      }

      // === FOOTER ===
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Generado por Buildera | Página ${i} de ${totalPages}`, margin, pageHeight - 8);
        pdf.text(`© ${new Date().getFullYear()} Buildera.io`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

      const companyName = identity.company_name || 'empresa';
      pdf.save(`diagnostico-digital-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      
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

      {/* One-Page Report - Visual Display */}
      <div 
        ref={reportRef} 
        className="bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden"
      >
        {/* Report Header */}
        <div className="bg-gradient-to-r from-[#3c46b2] to-[#5a64c8] text-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
            {identity.logo && (
              <img 
                src={identity.logo} 
                alt="Logo" 
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-contain bg-white/10 p-2"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <FileSearch className="w-4 h-4 flex-shrink-0" />
                <span>DIAGNÓSTICO DIGITAL</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words">{identity.company_name || 'Empresa'}</h1>
              {identity.slogan && (
                <p className="text-white/80 italic text-base md:text-lg break-words">"{identity.slogan}"</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/70">
                {identity.url && (
                  <span className="flex items-center gap-1 break-all">
                    <Globe2 className="w-4 h-4 flex-shrink-0" />
                    {identity.url}
                  </span>
                )}
                {identity.founding_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    Fundada en {identity.founding_date}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          
          {/* Executive Summary */}
          {(execDiag.current_state || execDiag.primary_constraint || execDiag.highest_leverage_focus) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#3c46b2] flex items-center justify-center flex-shrink-0">
                  <FileSearch className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Diagnóstico Ejecutivo</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 md:p-6 space-y-4">
                {execDiag.current_state && (
                  <div>
                    <p className="text-sm font-semibold text-[#3c46b2] mb-1">Estado Actual</p>
                    <p className="text-gray-700 text-sm md:text-base">{execDiag.current_state}</p>
                  </div>
                )}
                {execDiag.primary_constraint && (
                  <div>
                    <p className="text-sm font-semibold text-[#f15438] mb-1">Restricción Principal</p>
                    <p className="text-gray-700 text-sm md:text-base">{execDiag.primary_constraint}</p>
                  </div>
                )}
                {execDiag.highest_leverage_focus && (
                  <div>
                    <p className="text-sm font-semibold text-green-600 mb-1">Foco de Mayor Impacto</p>
                    <p className="text-gray-700 text-sm md:text-base">{execDiag.highest_leverage_focus}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <Separator className="bg-gray-200" />

          {/* Two Column Layout: Company Profile + Digital Presence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            
            {/* Column 1: Company Profile */}
            <section className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#3c46b2] flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Perfil de Empresa</h2>
              </div>

              {/* Contact - Show ALL */}
              {(contact.email?.length > 0 || contact.phone?.length > 0 || contact.address?.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#3c46b2] flex-shrink-0" />
                    Contacto
                  </p>
                  <div className="space-y-2 text-sm">
                    {(contact.email || []).map((email: string, idx: number) => (
                      <p key={`email-${idx}`} className="flex items-start gap-2 text-gray-600 break-all">
                        <Mail className="w-3 h-3 mt-1 flex-shrink-0" /> {email}
                      </p>
                    ))}
                    {(contact.phone || []).map((phone: string, idx: number) => (
                      <p key={`phone-${idx}`} className="flex items-start gap-2 text-gray-600">
                        <Phone className="w-3 h-3 mt-1 flex-shrink-0" /> {phone}
                      </p>
                    ))}
                    {(contact.address || []).map((addr: string, idx: number) => (
                      <p key={`addr-${idx}`} className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-3 h-3 mt-1 flex-shrink-0" /> {addr}
                      </p>
                    ))}
                  </div>
                  {/* Social Links - Show ALL */}
                  {contact.social_links?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {contact.social_links.map((link: string, idx: number) => {
                        const platform = getPlatformFromUrl(link);
                        const Icon = platformIcons[platform] || Globe2;
                        return (
                          <a 
                            key={idx} 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-gray-200 hover:bg-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 transition-colors"
                          >
                            <Icon className="w-3 h-3" />
                            {platform}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Services - Show ALL */}
              {products.service?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#3c46b2] flex-shrink-0" />
                    Servicios ({products.service.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {products.service.map((s: string, idx: number) => (
                      <span key={idx} className="bg-[#3c46b2]/10 text-[#3c46b2] rounded-full px-3 py-1 text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Offers - Show ALL */}
              {products.offer?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f15438] flex-shrink-0" />
                    Ofertas ({products.offer.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {products.offer.map((o: string, idx: number) => (
                      <span key={idx} className="bg-[#f15438]/10 text-[#f15438] rounded-full px-3 py-1 text-xs font-medium">
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience & Market - Show ALL */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3c46b2] flex-shrink-0" />
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
                  {(audience.target_user || []).map((t: string, idx: number) => (
                    <span key={`t-${idx}`} className="bg-purple-100 text-purple-700 rounded-full px-3 py-1 text-xs font-medium">
                      {t}
                    </span>
                  ))}
                  {(market.country || []).map((c: string, idx: number) => (
                    <span key={`c-${idx}`} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                      🌍 {c}
                    </span>
                  ))}
                  {(market.city || []).map((ci: string, idx: number) => (
                    <span key={`ci-${idx}`} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                      📍 {ci}
                    </span>
                  ))}
                </div>
              </div>

              {/* SEO Keywords - Show ALL */}
              {seo.keyword?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#3c46b2] flex-shrink-0" />
                    Keywords SEO ({seo.keyword.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {seo.keyword.map((kw: string, idx: number) => (
                      <span key={idx} className="bg-gray-200 text-gray-600 rounded px-2 py-0.5 text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Column 2: Digital Presence Analysis */}
            <section className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#3c46b2] flex items-center justify-center flex-shrink-0">
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

              {/* What is Working - Show ALL */}
              {digitalPresence.what_is_working?.length > 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Lo que Funciona Bien ({digitalPresence.what_is_working.length})
                  </p>
                  <ul className="space-y-2">
                    {digitalPresence.what_is_working.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What is Missing - Show ALL */}
              {digitalPresence.what_is_missing?.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Lo que Falta ({digitalPresence.what_is_missing.length})
                  </p>
                  <ul className="space-y-2">
                    {digitalPresence.what_is_missing.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Risks - Show ALL */}
              {digitalPresence.key_risks?.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    Riesgos Principales ({digitalPresence.key_risks.length})
                  </p>
                  <ul className="space-y-2">
                    {digitalPresence.key_risks.map((risk: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Competitive Positioning */}
              {digitalPresence.competitive_positioning && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#3c46b2] flex-shrink-0" />
                    Posicionamiento Competitivo
                  </p>
                  <p className="text-sm text-gray-700">{digitalPresence.competitive_positioning}</p>
                </div>
              )}
            </section>
          </div>

          <Separator className="bg-gray-200" />

          {/* Action Plan - Full Width - Show ALL */}
          {(actionPlan.short_term?.length > 0 || actionPlan.mid_term?.length > 0 || actionPlan.long_term?.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#f15438] flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Plan de Acción</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Short Term */}
                {actionPlan.short_term?.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 md:p-5 border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <h3 className="font-bold text-green-800">Corto Plazo ({actionPlan.short_term.length})</h3>
                    </div>
                    <ul className="space-y-3">
                      {actionPlan.short_term.map((action: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{action.action}</p>
                              {action.reason && (
                                <p className="text-gray-600 text-xs mt-1">{action.reason}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mid Term */}
                {actionPlan.mid_term?.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 md:p-5 border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <h3 className="font-bold text-blue-800">Mediano Plazo ({actionPlan.mid_term.length})</h3>
                    </div>
                    <ul className="space-y-3">
                      {actionPlan.mid_term.map((action: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{action.action}</p>
                              {action.reason && (
                                <p className="text-gray-600 text-xs mt-1">{action.reason}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Long Term */}
                {actionPlan.long_term?.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4 md:p-5 border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <h3 className="font-bold text-purple-800">Largo Plazo ({actionPlan.long_term.length})</h3>
                    </div>
                    <ul className="space-y-3">
                      {actionPlan.long_term.map((action: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{action.action}</p>
                              {action.reason && (
                                <p className="text-gray-600 text-xs mt-1">{action.reason}</p>
                              )}
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
