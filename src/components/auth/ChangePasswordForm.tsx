import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit, logSecurityEvent } from "@/hooks/useSecurity";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Check } from "lucide-react";

export const ChangePasswordForm = () => {
  const { t } = useTranslation('auth');
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordStrength = usePasswordValidation(newPassword);
  const { toast } = useToast();
  
  // Rate limiting para cambios de contraseña
  const { checkRateLimit, isBlocked } = useRateLimit({
    maxAttempts: 3,
    windowMs: 300000, // 5 minutos
    identifier: `password_change_${Date.now()}`
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (newPassword.length < 8) {
        toast({
          title: t('errors.general.title'),
          description: t('messages.passwordTooShort'),
          variant: "destructive",
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: t('errors.general.title'),
          description: t('messages.passwordsNotMatch'),
          variant: "destructive",
        });
      return;
    }
    
    // Validar fortaleza de contraseña
    if (!passwordStrength.isValid) {
      toast({
        title: t('messages.weakPassword'),
        description: t('messages.passwordNotStrong'),
        variant: "destructive",
      });
      return;
    }

      if (currentPassword === newPassword) {
        toast({
          title: t('errors.general.title'),
          description: t('messages.passwordMustDiffer'),
          variant: "destructive",
        });
        return;
      }

      // Verificar contraseña actual reautenticando
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      // Verificar la contraseña actual intentando hacer login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: t('errors.general.title'),
          description: t('messages.incorrectCurrentPassword'),
          variant: "destructive",
        });
        return;
      }

      // Cambiar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: t('messages.passwordChanged'),
        description: t('messages.passwordChangedDesc'),
      });

      // Limpiar formulario
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      console.error("Error cambiando contraseña:", error);
      toast({
        title: t('errors.general.title'),
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {t('titles.changePassword')}
        </CardTitle>
        <CardDescription>
          {t('titles.changePasswordDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              {t('form.currentPassword')} <span className="text-destructive">{t('form.required')}</span>
            </Label>
            <PasswordInput
              id="currentPassword"
              placeholder={t('form.currentPasswordPlaceholder')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t('form.newPassword')} <span className="text-destructive">{t('form.required')}</span>
            </Label>
            <PasswordInput
              id="newPassword"
              placeholder={t('form.newPasswordPlaceholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t('form.confirmNewPassword')} <span className="text-destructive">{t('form.required')}</span>
            </Label>
            <PasswordInput
              id="confirmPassword"
              placeholder={t('form.confirmNewPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? (
              t('buttons.changingPassword')
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t('buttons.changePassword')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};