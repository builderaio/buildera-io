import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useWelcomeEmail } from "@/hooks/useWelcomeEmail";
import { EmailVerificationInfo } from "./EmailVerificationInfo";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Mail, Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface CompanyAuthProps {
  mode: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

/** Inline password requirements checklist for signup */
const PasswordRequirementsChecklist = ({ password }: { password: string }) => {
  const { t } = useTranslation('auth');
  const checks = [
    { met: password.length >= 8, label: t('passwordStrength.minLength', '8+ caracteres') },
    { met: /[A-Z]/.test(password), label: t('passwordStrength.uppercase', 'Una mayúscula') },
    { met: /[0-9]/.test(password), label: t('passwordStrength.number', 'Un número') },
  ];
  const metCount = checks.filter(c => c.met).length;
  const strengthPercent = (metCount / checks.length) * 100;
  const strengthColor = metCount === checks.length
    ? 'bg-green-500'
    : metCount >= 2
    ? 'bg-yellow-500'
    : 'bg-red-500';
  const strengthLabel = metCount === checks.length
    ? t('passwordStrength.strong', 'Fuerte')
    : metCount >= 2
    ? t('passwordStrength.medium', 'Media')
    : t('passwordStrength.weak', 'Débil');

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('passwordStrength.label', 'Fortaleza')}</span>
        <span className={`font-medium ${metCount === checks.length ? 'text-green-600' : metCount >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
          {strengthLabel}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>
      <ul className="space-y-1">
        {checks.map((check, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs">
            {check.met
              ? <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              : <X className="h-3.5 w-3.5 text-red-400 shrink-0" />}
            <span className={check.met ? 'text-green-600' : 'text-muted-foreground'}>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CompanyAuth = ({ mode, onModeChange }: CompanyAuthProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [country, setCountry] = useState("Colombia");
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [passwordStrengthLevel, setPasswordStrengthLevel] = useState<string>('weak');
  const verificationRef = useRef<HTMLDivElement>(null);
  
  const { authMethods, loading: authMethodsLoading } = useAuthMethods();
  const { sendWelcomeEmail } = useWelcomeEmail();

  // Compute password strength for signup button disabling
  const isPasswordStrongEnough = useMemo(() => {
    if (mode !== 'signup') return true;
    const hasMin = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasMin && hasUpper && hasNumber;
  }, [password, mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        // Validaciones para registro
        if (!fullName.trim()) {
          toast.error(t('messages.nameRequired'));
          setLoading(false);
          return;
        }

        if (!companyName.trim()) {
          toast.error(t('messages.companyRequired'));
          setLoading(false);
          return;
        }


        if (!country.trim()) {
          toast.error(t('messages.countryRequired'));
          setLoading(false);
          return;
        }

        // Validar requisitos de contraseña de Supabase
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        let hasErrors = false;
        setPasswordError("");
        setConfirmPasswordError("");

        if (password.length < 8 || !hasLowerCase || !hasUpperCase || !hasNumber) {
          setPasswordError(t('messages.weakPasswordInline'));
          hasErrors = true;
        }

        if (password !== confirmPassword) {
          setConfirmPasswordError(t('messages.passwordMismatchInline'));
          hasErrors = true;
        }

        if (hasErrors) {
          setLoading(false);
          return;
        }

        console.log("Iniciando registro con email para:", email);
        
        // Crear URL de verificación que maneje correctamente el primer login
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`,
            data: {
              full_name: fullName,
              user_type: 'company',
              company_name: companyName,
              website_url: websiteUrl,
              country: country
            }
          }
        });

        if (error) {
          console.error("Error en registro:", error);
          throw error;
        }
        
        console.log("Registro exitoso:", data);
        
        if (data.user) {
          // Supabase enviará automáticamente el email de verificación
          if (!data.user.email_confirmed_at) {
            console.log("Email de verificación será enviado automáticamente por Supabase");
            
            // Mostrar información de verificación
            setRegisteredEmail(email);
            setShowEmailVerification(true);
            setRegistrationSuccess(true);
            toast.success(t('messages.signupSuccessDesc'));
            // Scroll to verification message after render
            setTimeout(() => {
              verificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          } else {
            // Si el email ya está verificado (caso raro), enviar bienvenida y ir a login
            try {
              await sendWelcomeEmail(email, fullName, 'company');
              console.log("Email de bienvenida enviado exitosamente");
            } catch (emailError) {
              console.error("Error enviando email de bienvenida:", emailError);
            }
            
            toast.success(t('messages.signupVerifiedDesc'));

            // Cambiar a modo login
            if (onModeChange) {
              onModeChange("signin");
            }
          }

          // No ejecutar webhooks en el registro - se ejecutarán cuando haga clic en "Comenzar configuración"

          console.log("Usuario de empresa registrado exitosamente");
          
          // Limpiar campos de registro
          setFullName("");
          setCompanyName("");
          setWebsiteUrl("");
          setCountry("");
          setConfirmPassword("");
        }
      } else {
        // Validaciones para login
        if (!email.trim()) {
          toast.error(t('messages.emailRequiredField'));
          setLoading(false);
          return;
        }

        if (!password.trim()) {
          toast.error(t('messages.passwordRequired'));
          setLoading(false);
          return;
        }

        console.log("Iniciando login con email para:", email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error("Error en login:", error);
          throw error;
        }
        
        console.log("Login exitoso:", data);
        
        // Verificar si es primer login para redirigir al onboarding
        if (data.user) {
          try {
            // Verificar estado de onboarding
            const { data: onboardingStatus } = await supabase
              .from('user_onboarding_status')
              .select('*')
              .eq('user_id', data.user.id)
              .single();

            console.log("🔍 Estado de onboarding:", onboardingStatus);

            // Si no existe registro de onboarding o no está completado, ir al flujo de 5 pasos
            if (!onboardingStatus || !onboardingStatus.onboarding_completed_at) {
              console.log("🎯 Primer login detectado, redirigiendo al onboarding de 5 pasos");
              navigate('/company-dashboard?view=onboarding&first_login=true');
            } else {
              console.log("✅ Usuario ya completó onboarding, ir al dashboard");
              navigate('/company-dashboard');
            }
          } catch (error) {
            console.error("Error verificando onboarding:", error);
            // Si hay error verificando onboarding, ir al flujo de 5 pasos por seguridad
            navigate('/company-dashboard?view=onboarding&first_login=true');
          }
        }
      }
    } catch (error: any) {
      console.error("Error en autenticación:", error);
      
      // Mostrar mensajes de error más específicos
      let errorMessage = t('messages.genericLoginError');
      
      if (error.code === 'weak_password' || error.message?.includes('Password should contain')) {
        errorMessage = t('messages.weakPasswordComplex');
      } else if (error.code === 'invalid_credentials' || error.message?.includes('Invalid login credentials')) {
        errorMessage = t('messages.invalidCredentials');
      } else if (error.code === 'email_not_confirmed' || error.message?.includes('Email not confirmed')) {
        errorMessage = t('messages.emailNotConfirmed');
      } else if (error.message?.includes('User already registered')) {
        errorMessage = t('messages.userAlreadyRegistered');
      } else if (error.message?.includes('Signup not allowed')) {
        errorMessage = t('messages.signupNotAllowed');
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    try {
      setLoading(true);
      
      // Usar solo el sistema nativo de Supabase
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) throw error;

      toast.success(t('messages.emailResentDesc'));
    } catch (error: any) {
      toast.error(error.message || t('messages.emailResendError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      console.log(`🔗 Iniciando autenticación con ${provider}...`);
      console.log("📍 URL actual antes de OAuth:", window.location.href);
      console.log("📍 Origin:", window.location.origin);
      
      // Construir URL de redirect con más información
      const redirectUrl = `${window.location.origin}/auth/social-callback?user_type=company&provider=${provider}&timestamp=${Date.now()}`;
      console.log("🔄 URL de redirect:", redirectUrl);
      
      // No limpiar sesión antes de OAuth - puede interferir
      console.log("⚡ Iniciando OAuth sin limpiar sesión previa...");
      
      // Verificar configuración del cliente Supabase
      console.log("🔍 Verificando configuración del cliente...");
      console.log("📊 Cliente Supabase inicializado correctamente");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          skipBrowserRedirect: false
        }
      });

      console.log("📦 Resultado OAuth:", data);

      if (error) {
        console.error(`❌ Error OAuth ${provider}:`, error);
        throw error;
      }
      
      console.log("✅ OAuth iniciado correctamente");
    } catch (error: any) {
      console.error(`❌ Error en autenticación ${provider}:`, error);
      toast.error(error.message || t('messages.authError'));
    }
  };

  // Determine which auth methods to show - SIEMPRE mostrar todos en signup
  const showEmailAuth = true; // Siempre mostrar email
  const showGoogleAuth = true; // Siempre mostrar Google
  const showLinkedInAuth = true; // Siempre mostrar LinkedIn
  const showSocialAuth = showGoogleAuth || showLinkedInAuth;

  if (authMethodsLoading && mode === "signin") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mostrar formulario de recuperación de contraseña
  if (showForgotPassword) {
    return (
      <ForgotPasswordForm 
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {showEmailVerification && registeredEmail && (
        <div ref={verificationRef}>
          <EmailVerificationInfo 
            email={registeredEmail}
            onResendVerification={handleResendVerification}
            loading={loading}
          />
        </div>
      )}
      {showSocialAuth && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {showGoogleAuth && (
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('google')}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Google
              </Button>
            )}
            {showLinkedInAuth && (
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('linkedin_oidc')}
                className="w-full"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>
            )}
          </div>

          {showEmailAuth && (
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
          )}
        </>
      )}

      {showEmailAuth && (
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-2">
              <Label htmlFor="fullName">
                  {t('form.contactName')} <span className="text-destructive">{t('form.required')}</span>
                </Label>
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
              <Label htmlFor="companyName">
                  {t('form.companyName')} <span className="text-destructive">{t('form.required')}</span>
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder={t('form.companyNamePlaceholder')}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
              <Label htmlFor="websiteUrl">
                  {t('form.websiteUrl')} <span className="text-muted-foreground text-xs">{t('form.websiteOptional')}</span>
                </Label>
                <Input
                  id="websiteUrl"
                  type="text"
                  placeholder={t('form.websiteUrlPlaceholder')}
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
              <Label htmlFor="country">
                  {t('form.country')} <span className="text-destructive">{t('form.required')}</span>
                </Label>
                <Select value={country} onValueChange={setCountry} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.countryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="México">México</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Perú">Perú</SelectItem>
                    <SelectItem value="Ecuador">Ecuador</SelectItem>
                    <SelectItem value="Venezuela">Venezuela</SelectItem>
                    <SelectItem value="Uruguay">Uruguay</SelectItem>
                    <SelectItem value="Paraguay">Paraguay</SelectItem>
                    <SelectItem value="Bolivia">Bolivia</SelectItem>
                    <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                    <SelectItem value="Panamá">Panamá</SelectItem>
                    <SelectItem value="Guatemala">Guatemala</SelectItem>
                    <SelectItem value="Honduras">Honduras</SelectItem>
                    <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                    <SelectItem value="El Salvador">El Salvador</SelectItem>
                    <SelectItem value="República Dominicana">República Dominicana</SelectItem>
                    <SelectItem value="Cuba">Cuba</SelectItem>
                    <SelectItem value="España">España</SelectItem>
                    <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">
              {t('form.email')} <span className="text-destructive">{t('form.required')}</span>
            </Label>
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
            <Label htmlFor="password">
              {t('form.password')} <span className="text-destructive">{t('form.required')}</span>
            </Label>
            <PasswordInput
              id="password"
              placeholder={t('form.passwordPlaceholder')}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              showStrengthIndicator={false}
              onStrengthChange={(s) => setPasswordStrengthLevel(s.strength)}
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {mode === "signup" && password.length > 0 && (
              <PasswordRequirementsChecklist password={password} />
            )}
          </div>
          
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('form.confirmPassword')} <span className="text-destructive">{t('form.required')}</span>
              </Label>
              <PasswordInput
                id="confirmPassword"
                placeholder={t('form.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(""); }}
                required
              />
              {confirmPasswordError && (
                <p className="text-sm text-destructive">{confirmPasswordError}</p>
              )}
            </div>
          )}

        <Button type="submit" className="w-full" disabled={loading || registrationSuccess || (mode === 'signup' && !isPasswordStrongEnough)}>
          {loading 
            ? t('buttons.processing') 
            : registrationSuccess 
            ? `${t('buttons.sent')} ✓`
            : mode === "signin" 
            ? t('buttons.signin') 
            : t('buttons.signup')}
        </Button>

          {mode === "signin" && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary/80 underline"
              >
                {t('buttons.forgotPassword')}
              </button>
            </div>
          )}
        </form>
      )}

      {!showEmailAuth && !showSocialAuth && mode === "signin" && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No tienes métodos de autenticación configurados. 
            Contacta al administrador para obtener ayuda.
          </p>
        </div>
      )}

    </div>
  );
};

export default CompanyAuth;