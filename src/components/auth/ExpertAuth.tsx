import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Mail } from "lucide-react";

interface ExpertAuthProps {
  mode: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

const ExpertAuth = ({ mode, onModeChange }: ExpertAuthProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [industry, setIndustry] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const industries = [
    t('industries.technology'),
    t('industries.finance'),
    t('industries.health'),
    t('industries.education'),
    t('industries.retail'),
    t('industries.manufacturing'),
    t('industries.consulting'),
    t('industries.marketing'),
    t('industries.humanResources'),
    t('industries.other')
  ];

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          toast({
            title: t('errors.general.title'),
            description: t('messages.passwordMismatch'),
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        // Para registro, los expertos ahora van directamente a su dashboard después del social auth
        // El trigger de la base de datos creará su perfil automáticamente
        navigate(`/waitlist?type=expert&email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}`);
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: t('errors.general.title'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      console.log(`🔗 Iniciando autenticación con ${provider} para expert...`);
      
      // Usar el mismo flujo que CompanyAuth - pasar por SocialCallback
      const redirectUrl = `${window.location.origin}/auth/social-callback?user_type=expert&provider=${provider}&timestamp=${Date.now()}`;
      console.log("🔄 URL de redirect:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: t('errors.general.title'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleSocialAuth('google')}
          className="w-full"
        >
          <Mail className="mr-2 h-4 w-4" />
          {t('social.google')}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialAuth('linkedin_oidc')}
          className="w-full"
        >
          <Linkedin className="mr-2 h-4 w-4" />
          {t('social.linkedin')}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('social.divider')}
          </span>
        </div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === "signup" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('form.fullName')}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={t('form.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">{t('form.industry')}</Label>
              <Select value={industry} onValueChange={setIndustry} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.industryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expertiseAreas">{t('form.expertiseAreas')}</Label>
              <Input
                id="expertiseAreas"
                type="text"
                placeholder={t('form.expertiseAreasPlaceholder')}
                value={expertiseAreas}
                onChange={(e) => setExpertiseAreas(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">{t('form.yearsExperience')}</Label>
              <Input
                id="yearsExperience"
                type="number"
                placeholder={t('form.yearsExperiencePlaceholder')}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                required
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">{t('form.email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('form.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">{t('form.password')}</Label>
          <PasswordInput
            id="password"
            placeholder={t('form.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('form.confirmPassword')}</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder={t('form.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('buttons.processing') : mode === "signin" ? t('buttons.signin') : t('buttons.signup')}
        </Button>
      </form>
    </div>
  );
};

export default ExpertAuth;