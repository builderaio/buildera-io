import { useState, useEffect } from "react";
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
import { Linkedin, Mail, Chrome } from "lucide-react";

interface CompanyAuthProps {
  mode: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

const CompanyAuth = ({ mode, onModeChange }: CompanyAuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industrySector, setIndustrySector] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [country, setCountry] = useState("Colombia");
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const { authMethods, loading: authMethodsLoading } = useAuthMethods();
  const { sendWelcomeEmail } = useWelcomeEmail();

  const companySizes = [
    "1-10 empleados",
    "11-50 empleados",
    "51-200 empleados",
    "201-500 empleados",
    "501-1000 empleados",
    "1000+ empleados"
  ];

  const sectors = [
    "Tecnología",
    "Finanzas",
    "Salud",
    "Educación",
    "Retail",
    "Manufactura",
    "Servicios",
    "Construcción",
    "Agricultura",
    "Energía",
    "Otro"
  ];

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

        if (!companySize) {
          toast({
            title: "Error",
            description: "Selecciona el tamaño del negocio",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!industrySector) {
          toast({
            title: "Error",
            description: "Selecciona el sector de la industria",
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

        if (password.length < 6) {
          toast({
            title: "Error",
            description: "La contraseña debe tener al menos 6 caracteres",
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
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/company-dashboard`,
            data: {
              full_name: fullName,
              user_type: 'company',
              company_name: companyName,
              company_size: companySize,
              industry_sector: industrySector,
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
          // Enviar email de bienvenida usando el sistema de Buildera
          try {
            await sendWelcomeEmail(email, fullName, 'company');
            console.log("Email de bienvenida enviado exitosamente");
          } catch (emailError) {
            console.error("Error enviando email de bienvenida:", emailError);
            // No bloquear el registro si falla el email
          }

          // Llamar manualmente al webhook después del registro exitoso
          try {
            await supabase.functions.invoke('process-company-webhooks', {
              body: {
                user_id: data.user.id,
                company_name: companyName,
                website_url: websiteUrl,
                country: country,
                trigger_type: 'registration'
              }
            });
            console.log("Webhook de registro enviado exitosamente");
          } catch (webhookError) {
            console.error("Error enviando webhook de registro:", webhookError);
            // No bloquear el registro si falla el webhook
          }
          
          // Mostrar información de verificación si el email no está confirmado
          if (!data.user.email_confirmed_at) {
            setRegisteredEmail(email);
            setShowEmailVerification(true);
            toast({
              title: "¡Registro exitoso!",
              description: "Revisa tu email para verificar tu cuenta antes de iniciar sesión.",
            });
          } else {
            toast({
              title: "¡Registro exitoso!",
              description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
            });
          }
          
          console.log("Usuario de empresa registrado exitosamente");
          
          // Cambiar a modo login después del registro exitoso
          if (onModeChange) {
            onModeChange("signin");
          }
          // Limpiar campos de registro pero mantener email y password
          setFullName("");
          setCompanyName("");
          setCompanySize("");
          setIndustrySector("");
          setWebsiteUrl("");
          setCountry("Colombia");
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
        window.location.href = '/company-dashboard';
      }
    } catch (error: any) {
      console.error("Error en autenticación:", error);
      
      // Mostrar mensajes de error más específicos
      let errorMessage = error.message;
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Tu cuenta necesita ser verificada. Por favor revisa tu email y haz clic en el enlace de verificación. Si no encuentras el email, revisa tu carpeta de spam.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "Ya existe una cuenta con este email";
      } else if (error.message?.includes('Signup not allowed')) {
        errorMessage = "El registro no está permitido en este momento";
      }
      
      toast({
        title: "Error",
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/company-dashboard`
        }
      });

      if (error) throw error;

      toast({
        title: "Email reenviado",
        description: "Hemos reenviado el enlace de verificación a tu email.",
      });
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
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/complete-profile?user_type=company`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error(`❌ Error OAuth ${provider}:`, error);
        throw error;
      }
    } catch (error: any) {
      console.error(`❌ Error en autenticación ${provider}:`, error);
      toast({
        title: "Error de Autenticación",
        description: error.message || `Error al conectar con ${provider}. Por favor, intenta de nuevo.`,
        variant: "destructive",
      });
    }
  };

  // Determine which auth methods to show
  const showEmailAuth = mode === "signup" || authMethods.canUseEmail;
  const showGoogleAuth = mode === "signup" || authMethods.canUseGoogle;
  const showLinkedInAuth = mode === "signup" || authMethods.canUseLinkedIn;
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
                <Chrome className="mr-2 h-4 w-4" />
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
                <Label htmlFor="companySize">
                  Tamaño del negocio <span className="text-destructive">*</span>
                </Label>
                <Select value={companySize} onValueChange={setCompanySize} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industrySector">
                  Sector de la industria <span className="text-destructive">*</span>
                </Label>
                <Select value={industrySector} onValueChange={setIndustrySector} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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