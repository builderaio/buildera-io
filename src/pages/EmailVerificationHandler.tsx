import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWelcomeEmail } from "@/hooks/useWelcomeEmail";

const EmailVerificationHandler = () => {
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useWelcomeEmail();
  const { t } = useTranslation("auth");

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        console.log('🔍 Email verification started:', { tokenHash, type });

        if (!tokenHash || !type) {
          throw new Error('Invalid verification parameters');
        }

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        });

        if (error) {
          console.error('❌ Error verifying email:', error);
          throw error;
        }

        console.log('✅ Email verified successfully:', data);

        if (data.user) {
          const fullName = data.user.user_metadata?.full_name || 'Usuario';
          const userType = data.user.user_metadata?.user_type || 'company';
          
          try {
            await sendWelcomeEmail(data.user.email || '', fullName, userType);
            console.log('✅ Welcome email sent');
          } catch (emailError) {
            console.error('❌ Error sending welcome email:', emailError);
          }

          toast({
            title: t("verification.successTitle"),
            description: t("verification.successDesc"),
          });

          // Redirect to onboarding flow instead of adn-empresa
          setTimeout(() => {
            navigate('/company-dashboard?view=onboarding&first_login=true');
          }, 2000);
        }
      } catch (error: any) {
        console.error('❌ Verification error:', error);
        
        let errorKey = 'verification.genericError';
        if (error.message?.includes('Token has expired')) {
          errorKey = 'verification.expiredError';
        } else if (error.message?.includes('Invalid token')) {
          errorKey = 'verification.invalidError';
        }

        toast({
          title: t("verification.errorTitle"),
          description: t(errorKey),
          variant: "destructive",
        });

        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleEmailVerification();
  }, [searchParams, navigate, toast, sendWelcomeEmail, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {loading ? t("verification.verifying") : t("verification.completed")}
        </h2>
        <p className="text-muted-foreground">
          {loading 
            ? t("verification.pleaseWait")
            : t("verification.redirecting")
          }
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationHandler;