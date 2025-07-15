import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { supabase } from "@/integrations/supabase/client";
import { useWelcomeEmail } from "@/hooks/useWelcomeEmail";
import { Linkedin, Mail, Chrome } from "lucide-react";

interface CompanyAuthProps {
  mode: "signin" | "signup";
}

const CompanyAuth = ({ mode }: CompanyAuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industrySector, setIndustrySector] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { sendWelcomeEmail } = useWelcomeEmail();
  const { authMethods, loading: authMethodsLoading } = useAuthMethods();

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
            description: "El nombre de la empresa es requerido",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!companySize) {
          toast({
            title: "Error",
            description: "Selecciona el tamaño de la empresa",
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
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              user_type: 'company',
              company_name: companyName,
              company_size: companySize,
              industry_sector: industrySector,
              website_url: websiteUrl
            }
          }
        });

        if (error) {
          console.error("Error en registro:", error);
          throw error;
        }
        
        console.log("Registro exitoso:", data);
        
        if (data.user) {
          console.log("Enviando email de bienvenida a:", data.user.email);
          // Enviar email de bienvenida
          const emailResult = await sendWelcomeEmail(
            data.user.email || '',
            fullName,
            'company'
          );

          if (emailResult.success) {
            toast({
              title: "¡Registro exitoso!",
              description: "Revisa tu email para confirmar tu cuenta y recibir la bienvenida.",
            });
          } else {
            toast({
              title: "¡Registro exitoso!",
              description: "Tu cuenta ha sido creada. Revisa tu email para confirmarla.",
            });
          }
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
        errorMessage = "Debes confirmar tu email antes de iniciar sesión";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "Ya existe una cuenta con este email";
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

  const handleSocialAuth = async (provider: 'google' | 'linkedin_oidc') => {
    try {
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

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
                <Label htmlFor="fullName">Nombre del contacto</Label>
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
                <Label htmlFor="companyName">Nombre de la empresa</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Tu Empresa S.A.S."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Tamaño de la empresa</Label>
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
                <Label htmlFor="industrySector">Sector de la industria</Label>
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
                <Label htmlFor="websiteUrl">Sitio web</Label>
                <Input
                  id="websiteUrl"
                  type="text"
                  placeholder="tuempresa.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email corporativo</Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@tuempresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
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
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
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