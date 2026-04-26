import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { parseAIServiceError } from "@/utils/aiServiceErrors";

export type AIFieldType = "misión" | "visión" | "propuesta de valor" | "valores corporativos";

interface AIGenerateFieldButtonProps {
  /** Server-side field key understood by the generate-company-content edge function */
  fieldType: AIFieldType;
  /** Current value — when present, the button stays hidden (use EraOptimizerButton to refine) */
  currentValue?: string | null;
  /** Company context passed to the AI */
  companyInfo: {
    company_name?: string;
    industry_sector?: string;
    company_size?: string;
    website_url?: string;
  };
  /** Disable the button externally (e.g. while parent is saving) */
  disabled?: boolean;
  /** Called with the generated text after a successful generation */
  onGenerated: (text: string) => void | Promise<void>;
  className?: string;
  size?: "sm" | "default" | "lg";
  /** Hide the button when the field already has content (default true) */
  hideWhenFilled?: boolean;
}

/**
 * Compact "Generate with AI" button intended to sit next to an empty
 * strategy field. When the user clicks it, we call generate-company-content
 * with the appropriate field key and pipe the result back to the parent.
 *
 * Errors are surfaced with a specific, actionable toast — including the
 * configuration hint when the AI service is unavailable (missing API key).
 */
export const AIGenerateFieldButton = ({
  fieldType,
  currentValue,
  companyInfo,
  disabled,
  onGenerated,
  className,
  size = "sm",
  hideWhenFilled = true,
}: AIGenerateFieldButtonProps) => {
  const { t } = useTranslation(["common"]);
  const [loading, setLoading] = useState(false);

  const hasValue = !!(currentValue && currentValue.trim().length > 0);
  if (hideWhenFilled && hasValue) return null;

  const handleGenerate = async () => {
    if (!companyInfo?.company_name) {
      toast.error(t("common:adn.aiGenerate.missingCompany", "Falta información de la empresa para generar"));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-company-content", {
        body: { field: fieldType, companyInfo },
      });

      if (error) {
        const parsed = await parseAIServiceError(error);
        const config = parsed.code === "service_unavailable" || parsed.code === "internal_error";
        toast.error(
          config
            ? t(
                "common:adn.aiGenerate.unavailable",
                "La generación con IA no está disponible. Verifica la configuración del proveedor de IA o contacta a soporte.",
              )
            : parsed.code === "quota_exceeded"
              ? t("common:adn.aiGenerate.quota", "Cuota de IA agotada. Recarga tu plan para continuar.")
              : parsed.code === "rate_limited"
                ? t("common:adn.aiGenerate.rateLimited", "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.")
                : t("common:adn.aiGenerate.failed", "No se pudo generar el contenido. Intenta de nuevo."),
        );
        return;
      }

      if (!data?.success || !data?.content) {
        toast.error(
          t(
            "common:adn.aiGenerate.unavailable",
            "La generación con IA no está disponible. Verifica la configuración del proveedor de IA o contacta a soporte.",
          ),
        );
        return;
      }

      await onGenerated(String(data.content).trim());
      toast.success(t("common:adn.aiGenerate.success", "Generado con IA"));
    } catch (e) {
      console.error("[AIGenerateFieldButton] unexpected error:", e);
      toast.error(t("common:adn.aiGenerate.failed", "No se pudo generar el contenido. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleGenerate}
      disabled={loading || disabled}
      className={cn(
        "gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5",
        className,
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {t("common:adn.aiGenerate.generating", "Generando…")}
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          {t("common:adn.aiGenerate.cta", "Generar con IA")}
        </>
      )}
    </Button>
  );
};

export default AIGenerateFieldButton;
