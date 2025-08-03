import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Linkedin, Search } from "lucide-react";

interface DeveloperAuthProps {
  mode: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

const DeveloperAuth = ({ mode, onModeChange }: DeveloperAuthProps) => {
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
            title: "Error",
            description: "Las contraseñas no coinciden",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        // Redirigir a lista de espera para desarrolladores
        window.location.href = `/waitlist?type=developer&email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}`;
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
          redirectTo: `${window.location.origin}/complete-profile?user_type=developer`,
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleSocialAuth('google')}
          className="w-full"
        >
          <Search className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialAuth('linkedin_oidc')}
          className="w-full"
        >
          <Linkedin className="mr-2 h-4 w-4" />
          LinkedIn
        </Button>
      </div>

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

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === "signup" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
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
              <Label htmlFor="githubUrl">GitHub URL (opcional)</Label>
              <Input
                id="githubUrl"
                type="text"
                placeholder="github.com/tuusuario"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Habilidades principales</Label>
              <Input
                id="skills"
                type="text"
                placeholder="React, Python, Node.js (separadas por comas)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">Años de experiencia</Label>
              <Input
                id="experienceYears"
                type="number"
                placeholder="5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                required
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
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
    </div>
  );
};

export default DeveloperAuth;