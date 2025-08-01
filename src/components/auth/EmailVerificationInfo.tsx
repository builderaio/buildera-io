import { AlertCircle, Mail } from "lucide-react";
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
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Mail className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Verifica tu email</AlertTitle>
      <AlertDescription className="text-blue-700">
        <div className="space-y-3">
          <p>
            Hemos enviado un enlace de verificación a <strong>{email}</strong>
          </p>
          <p className="text-sm">
            • Revisa tu bandeja de entrada y carpeta de spam<br/>
            • Haz clic en el enlace para activar tu cuenta<br/>
            • Una vez verificado, podrás iniciar sesión normalmente
          </p>
          {onResendVerification && (
            <button
              onClick={onResendVerification}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Reenviar email de verificación"}
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};