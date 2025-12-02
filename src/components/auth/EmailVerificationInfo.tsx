import { AlertCircle, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EmailVerificationInfoProps {
  email: string;
  onResendVerification?: () => void;
  loading?: boolean;
}

export const EmailVerificationInfo = ({ 
  email, 
  onResendVerification, 
  loading = false 
}: EmailVerificationInfoProps) => {
  const { t } = useTranslation('auth');

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Mail className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">{t('messages.verifyEmailTitle')}</AlertTitle>
      <AlertDescription className="text-blue-700">
        <div className="space-y-3">
          <p>
            {t('messages.verifyEmailSent')} <strong>{email}</strong>
          </p>
          <p className="text-sm">
            • {t('messages.verifyEmailInstructions.0')}<br/>
            • {t('messages.verifyEmailInstructions.1')}<br/>
            • {t('messages.verifyEmailInstructions.2')}
          </p>
          {onResendVerification && (
            <button
              onClick={onResendVerification}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium disabled:opacity-50"
            >
              {loading ? t('buttons.sending') : t('buttons.resendVerification')}
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};