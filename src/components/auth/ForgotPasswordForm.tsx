import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa tu email",
          variant: "destructive",
        });
        return;
      }

      // Usar nuestro sistema personalizado de email
      const resetUrl = `${window.location.origin}/reset-password`;
      
      // Primero, solicitar el reset usando Supabase Auth
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });

      if (authError) {
        throw authError;
      }

      // Luego, enviar nuestro email personalizado
      try {
        const { error: emailError } = await supabase.functions.invoke('send-password-reset-email', {
          body: {
            email: email,
            resetUrl: resetUrl,
            userType: 'usuario'
          }
        });

        if (emailError) {
          console.warn('Error enviando email personalizado, pero el reset de Supabase funcionó:', emailError);
        } else {
          console.log('Email personalizado de reset enviado exitosamente');
        }
      } catch (emailError) {
        console.warn('Error enviando email personalizado:', emailError);
        // No lanzamos error aquí porque el reset de Supabase ya funcionó
      }


      setEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Te hemos enviado un enlace para restablecer tu contraseña",
      });

    } catch (error: any) {
      console.error("Error enviando email de reset:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el email de recuperación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email enviado
          </CardTitle>
          <CardDescription>
            Revisa tu bandeja de entrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-medium">¡Email enviado correctamente!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hemos enviado un enlace para restablecer tu contraseña a:
              </p>
              <p className="font-medium text-sm">{email}</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Revisa tu bandeja de entrada y carpeta de spam</p>
              <p>• Haz clic en el enlace para restablecer tu contraseña</p>
              <p>• El enlace expirará en 1 hora</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
            >
              Enviar a otro email
            </Button>
            <Button
              variant="ghost"
              onClick={onBackToLogin}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Recuperar contraseña
        </CardTitle>
        <CardDescription>
          Te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Correo electrónico <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={onBackToLogin}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};