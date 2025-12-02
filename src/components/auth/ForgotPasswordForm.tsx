import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation('auth');
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
          title: t('errors.general.title'),
          description: t('messages.emailRequired'),
          variant: "destructive",
        });
        return;
      }

      // Usar el sistema nativo de Supabase para password reset
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (authError) {
        throw authError;
      }


      setEmailSent(true);
      toast({
        title: t('messages.emailSent'),
        description: t('messages.emailSentDesc'),
      });

    } catch (error: any) {
      console.error("Error enviando email de reset:", error);
      toast({
        title: t('errors.general.title'),
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
            {t('titles.emailSent')}
          </CardTitle>
          <CardDescription>
            {t('titles.emailSentDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-medium">{t('messages.emailSentSuccessTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('messages.emailSentSuccessDesc')}
              </p>
              <p className="font-medium text-sm">{email}</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• {t('messages.emailInstructions.0')}</p>
              <p>• {t('messages.emailInstructions.1')}</p>
              <p>• {t('messages.emailInstructions.2')}</p>
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
              {t('buttons.sendToAnotherEmail')}
            </Button>
            <Button
              variant="ghost"
              onClick={onBackToLogin}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('buttons.backToLogin')}
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
          {t('titles.recoverPassword')}
        </CardTitle>
        <CardDescription>
          {t('titles.recoverPasswordDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleForgotPassword} className="space-y-4">
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

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? t('buttons.sending') : t('buttons.sendResetLink')}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={onBackToLogin}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('buttons.backToLogin')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};