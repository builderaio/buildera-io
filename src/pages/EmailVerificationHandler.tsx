import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWelcomeEmail } from "@/hooks/useWelcomeEmail";

const EmailVerificationHandler = () => {
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useWelcomeEmail();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        console.log('🔍 Verificación de email iniciada:', { tokenHash, type });

        if (!tokenHash || !type) {
          throw new Error('Parámetros de verificación inválidos');
        }

        // Verificar el token con Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        });

        if (error) {
          console.error('❌ Error verificando email:', error);
          throw error;
        }

        console.log('✅ Email verificado exitosamente:', data);

        if (data.user) {
          // Obtener datos del usuario para enviar email de bienvenida
          const fullName = data.user.user_metadata?.full_name || 'Usuario';
          const userType = data.user.user_metadata?.user_type || 'company';
          
          // Enviar email de bienvenida
          try {
            await sendWelcomeEmail(data.user.email || '', fullName, userType);
            console.log('✅ Email de bienvenida enviado');
          } catch (emailError) {
            console.error('❌ Error enviando email de bienvenida:', emailError);
            // No bloquear el flujo si falla el email
          }

          toast({
            title: "¡Email verificado!",
            description: "Tu cuenta ha sido verificada exitosamente. Te hemos enviado un email de bienvenida. Ahora puedes iniciar sesión.",
          });

          // Redirigir al login con mensaje para que inicie sesión y vaya al onboarding
          setTimeout(() => {
            navigate('/auth?mode=signin&verified=true');
          }, 2000);
        }
      } catch (error: any) {
        console.error('❌ Error en verificación:', error);
        
        let errorMessage = 'Error al verificar tu email';
        if (error.message?.includes('Token has expired')) {
          errorMessage = 'El enlace de verificación ha expirado. Por favor, solicita uno nuevo.';
        } else if (error.message?.includes('Invalid token')) {
          errorMessage = 'El enlace de verificación no es válido.';
        }

        toast({
          title: "Error de verificación",
          description: errorMessage,
          variant: "destructive",
        });

        // Redirigir al auth después de un momento
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleEmailVerification();
  }, [searchParams, navigate, toast, sendWelcomeEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {loading ? "Verificando tu email..." : "Verificación completada"}
        </h2>
        <p className="text-muted-foreground">
          {loading 
            ? "Por favor espera mientras verificamos tu cuenta." 
            : "Te estamos redirigiendo..."
          }
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationHandler;