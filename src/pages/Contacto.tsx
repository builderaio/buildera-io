import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useGTM } from "@/hooks/useGTM";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contacto = () => {
  useGTM();
  const { t } = useTranslation(['landing', 'common', 'errors']);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject || 'general',
          message: formData.message.trim(),
        });

      if (error) throw error;

      toast({
        title: t('common:status.success', 'Éxito'),
        description: t('landing:contact.successMessage', 'Tu mensaje ha sido enviado. Te responderemos pronto.'),
      });

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Contact form error:', error);
      toast({
        title: t('errors:general.title'),
        description: t('landing:contact.errorMessage', 'No se pudo enviar el mensaje. Intenta de nuevo.'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold gradient-text mb-4">
            {t('landing:contact.title', 'Contáctanos')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('landing:contact.subtitle', '¿Tienes preguntas sobre cómo Buildera puede transformar tu negocio? Estamos aquí para ayudarte.')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">{t('landing:contact.emailLabel', 'Email')}</h4>
                    <p className="text-sm text-muted-foreground">info@buildera.io</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">{t('landing:contact.locationLabel', 'Ubicación')}</h4>
                    <p className="text-sm text-muted-foreground">Colombia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">{t('landing:contact.responseLabel', 'Tiempo de respuesta')}</h4>
                    <p className="text-sm text-muted-foreground">{t('landing:contact.responseTime', 'Dentro de 24 horas')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('landing:contact.formTitle', 'Envíanos un mensaje')}</CardTitle>
              <CardDescription>{t('landing:contact.formDescription', 'Completa el formulario y nos pondremos en contacto contigo.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('landing:contact.nameLabel', 'Nombre')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('landing:contact.namePlaceholder', 'Tu nombre')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('landing:contact.emailFieldLabel', 'Email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t('landing:contact.emailPlaceholder', 'tu@email.com')}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('landing:contact.subjectLabel', 'Asunto')}</Label>
                  <Select value={formData.subject} onValueChange={(v) => setFormData(prev => ({ ...prev, subject: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('landing:contact.subjectPlaceholder', 'Selecciona un asunto')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{t('landing:contact.subjectGeneral', 'Consulta general')}</SelectItem>
                      <SelectItem value="demo">{t('landing:contact.subjectDemo', 'Solicitar demo')}</SelectItem>
                      <SelectItem value="pricing">{t('landing:contact.subjectPricing', 'Precios y planes')}</SelectItem>
                      <SelectItem value="support">{t('landing:contact.subjectSupport', 'Soporte técnico')}</SelectItem>
                      <SelectItem value="partnership">{t('landing:contact.subjectPartnership', 'Alianzas')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('landing:contact.messageLabel', 'Mensaje')}</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={t('landing:contact.messagePlaceholder', 'Cuéntanos cómo podemos ayudarte...')}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('landing:contact.sending', 'Enviando...') : t('landing:contact.send', 'Enviar mensaje')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Contacto;
