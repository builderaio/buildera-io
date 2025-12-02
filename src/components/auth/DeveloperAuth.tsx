import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Mail } from "lucide-react";

interface DeveloperAuthProps {
  mode: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

const DeveloperAuth = ({ mode, onModeChange }: DeveloperAuthProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        // Registro directo de desarrolladores
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: 'developer',
              github_url: githubUrl,
              skills: skills.split(',').map(s => s.trim()),
              experience_years: parseInt(experienceYears) || 0
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          if (error.message.includes('weak_password') || error.message.includes('Password should contain')) {
            toast({
              title: t('messages.weakPassword'),
              description: t('messages.weakPasswordDesc'),
              variant: "destructive",
            });
          } else {
            throw error;
          }
          setLoading(false);
          return;
        }

        toast({
          title: t('messages.signupSuccess'),
          description: t('messages.signupSuccessDesc'),
        });

        // Redirigir al dashboard después del registro
        setTimeout(() => {
          navigate('/whitelabel/dashboard');
        }, 2000);
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
      console.log(`🔗 Iniciando autenticación con ${provider} para developer...`);
      
      // Usar el mismo flujo que CompanyAuth - pasar por SocialCallback
      const redirectUrl = `${window.location.origin}/auth/social-callback?user_type=developer&provider=${provider}&timestamp=${Date.now()}`;
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
              <Label htmlFor="githubUrl">{t('form.githubUrl')}</Label>
              <Input
                id="githubUrl"
                type="text"
                placeholder={t('form.githubUrlPlaceholder')}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">{t('form.skills')}</Label>
              <Input
                id="skills"
                type="text"
                placeholder={t('form.skillsPlaceholder')}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">{t('form.experienceYears')}</Label>
              <Input
                id="experienceYears"
                type="number"
                placeholder={t('form.experienceYearsPlaceholder')}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
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
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground">
              {t('messages.passwordRequirements')}
            </p>
          )}
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

export default DeveloperAuth;