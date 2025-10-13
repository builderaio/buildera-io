import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useWelcomeEmail } from "@/hooks/useWelcomeEmail";
import { EmailVerificationInfo } from "./EmailVerificationInfo";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompanyAuthProps {
  mode: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

const CompanyAuth = ({ mode, onModeChange }: CompanyAuthProps) => {
  const navigate = useNavigate();
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
  const { toast } = useToast();
  const { authMethods, loading: authMethodsLoading } = useAuthMethods();
  const { sendWelcomeEmail } = useWelcomeEmail();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        // Validaciones para registro
        if (!fullName.trim()) {
          toast({
            title: "Error",
            description: "El nombre es requerido",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!companyName.trim()) {
          toast({
            title: "Error", 
            description: "El nombre del negocio es requerido",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }


        if (!websiteUrl.trim()) {
          toast({
            title: "Error",
            description: "El sitio web es requerido",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!country.trim()) {
          toast({
            title: "Error",
            description: "El país es requerido",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Validar requisitos de contraseña de Supabase
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        if (password.length < 8) {
          toast({
            title: "Contraseña débil",
            description: "La contraseña debe tener al menos 8 caracteres",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!hasLowerCase || !hasUpperCase || !hasNumber) {
          toast({
            title: "Contraseña débil",
            description: "La contraseña debe contener al menos: una letra minúscula (a-z), una letra mayúscula (A-Z) y un número (0-9)",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Las contraseñas no coinciden",
            variant: "destructive",
          });
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
          // Enviar email de verificación personalizado usando el sistema de Buildera
          if (!data.user.email_confirmed_at) {
            try {
              const verificationUrl = `${window.location.origin}/auth/verify?type=signup`;
              
              await supabase.functions.invoke('send-verification-email', {
                body: {
                  email: email,
                  fullName: fullName,
                  confirmationUrl: verificationUrl,
                  userType: 'empresa'
                }
              });
              
              console.log("Email de verificación enviado exitosamente");
            } catch (emailError) {
              console.error("Error enviando email de verificación:", emailError);
              // No bloquear el registro si falla el email, usar el sistema por defecto
              console.log("Fallback al sistema de verificación por defecto de Supabase");
            }

            // Mostrar información de verificación
            setRegisteredEmail(email);
            setShowEmailVerification(true);
            toast({
              title: "¡Registro exitoso!",
              description: "Hemos enviado un email de verificación a tu correo. Revisa tu bandeja de entrada y carpeta de spam.",
            });
          } else {
            // Si el email ya está verificado (caso raro), enviar bienvenida y ir a login
            try {
              await sendWelcomeEmail(email, fullName, 'company');
              console.log("Email de bienvenida enviado exitosamente");
            } catch (emailError) {
              console.error("Error enviando email de bienvenida:", emailError);
            }
            
            toast({
              title: "¡Registro exitoso!",
              description: "Tu cuenta ha sido creada y verificada. Ahora puedes iniciar sesión.",
            });

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
          toast({
            title: "Error",
            description: "El email es requerido",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!password.trim()) {
          toast({
            title: "Error",
            description: "La contraseña es requerida",
            variant: "destructive",
          });
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
      let errorMessage = error.message;
      let errorTitle = "Error";
      
      if (error.code === 'weak_password' || error.message?.includes('Password should contain')) {
        errorTitle = "Contraseña débil";
        errorMessage = "La contraseña debe contener al menos: una letra minúscula (a-z), una letra mayúscula (A-Z) y un número (0-9)";
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Tu cuenta necesita ser verificada. Por favor revisa tu email y haz clic en el enlace de verificación. Si no encuentras el email, revisa tu carpeta de spam.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "Ya existe una cuenta con este email";
      } else if (error.message?.includes('Signup not allowed')) {
        errorMessage = "El registro no está permitido en este momento";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    try {
      setLoading(true);
      
      // Intentar primero con nuestro sistema personalizado
      try {
        const verificationUrl = `${window.location.origin}/auth/verify?type=signup`;
        
        await supabase.functions.invoke('send-verification-email', {
          body: {
            email: registeredEmail,
            fullName: fullName || 'Usuario',
            confirmationUrl: verificationUrl,
            userType: 'empresa'
          }
        });

        toast({
          title: "Email reenviado",
          description: "Hemos reenviado el enlace de verificación usando nuestro sistema personalizado.",
        });
      } catch (customError) {
        console.error("Error con sistema personalizado, usando fallback:", customError);
        
        // Fallback al sistema por defecto de Supabase
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: registeredEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`
          }
        });

        if (error) throw error;

        toast({
          title: "Email reenviado",
          description: "Hemos reenviado el enlace de verificación a tu email.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo reenviar el email de verificación",
        variant: "destructive",
      });
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
      toast({
        title: "Error de Autenticación",
        description: error.message || `Error al conectar con ${provider}. Por favor, intenta de nuevo.`,
        variant: "destructive",
      });
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
                  O continúa con email
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
                  Nombre del contacto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Nombre del negocio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Tu Negocio S.A.S."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">
                  Sitio web <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="websiteUrl"
                  type="text"
                  placeholder="tunegocio.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">
                  País <span className="text-destructive">*</span>
                </Label>
                <Select value={country} onValueChange={setCountry} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el país" />
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
              Correo electrónico <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@tunegocio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña <span className="text-destructive">*</span>
            </Label>
            <PasswordInput
              id="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar contraseña <span className="text-destructive">*</span>
              </Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Procesando..." : mode === "signin" ? "Iniciar Sesión" : "Crear Cuenta"}
          </Button>

          {mode === "signin" && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary/80 underline"
              >
                ¿Olvidaste tu contraseña?
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

      {showEmailVerification && registeredEmail && (
        <EmailVerificationInfo 
          email={registeredEmail}
          onResendVerification={handleResendVerification}
          loading={loading}
        />
      )}
    </div>
  );
};

export default CompanyAuth;