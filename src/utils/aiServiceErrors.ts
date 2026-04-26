import { supabase } from "@/integrations/supabase/client";

/**
 * Standardized error codes returned by AI generation edge functions.
 */
export type AIErrorCode =
  | "service_unavailable"
  | "rate_limited"
  | "quota_exceeded"
  | "upstream_error"
  | "network_error"
  | "internal_error"
  | "unknown";

export interface AIServiceError {
  code: AIErrorCode;
  status?: number;
  message: string;
  raw?: unknown;
}

/**
 * Parses the opaque error returned by `supabase.functions.invoke`.
 * The SDK throws a `FunctionsHttpError` with `context: Response` on non-2xx
 * status codes — we read the JSON body to extract the structured `error_code`.
 *
 * Always returns a typed AIServiceError so callers can switch on `code`.
 */
export async function parseAIServiceError(error: unknown): Promise<AIServiceError> {
  // Network failure (fetch rejected before reaching the function)
  const anyErr = error as any;
  if (anyErr?.name === "FunctionsFetchError" || anyErr?.message === "Failed to fetch") {
    return {
      code: "network_error",
      message: "Could not reach the AI generation service. Please check your connection.",
      raw: error,
    };
  }

  // FunctionsHttpError carries the original Response in `context`
  const ctx = anyErr?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      const code = (body?.error_code as AIErrorCode) || mapStatusToCode(ctx.status);
      return {
        code,
        status: ctx.status,
        message: body?.error || body?.message || anyErr?.message || "AI service error",
        raw: body,
      };
    } catch {
      // Fall through to default mapping
    }
    return {
      code: mapStatusToCode(ctx.status),
      status: ctx.status,
      message: anyErr?.message || "AI service error",
      raw: error,
    };
  }

  return {
    code: "unknown",
    message: anyErr?.message || "Unknown error",
    raw: error,
  };
}

function mapStatusToCode(status?: number): AIErrorCode {
  if (status === 503) return "service_unavailable";
  if (status === 429) return "rate_limited";
  if (status === 402) return "quota_exceeded";
  if (status && status >= 500) return "upstream_error";
  return "internal_error";
}

/**
 * Translation key used to display a user-friendly message for each error code.
 * Pair with i18n namespace `errors:ai.<code>`.
 */
export function getAIErrorTranslationKey(code: AIErrorCode): string {
  return `errors:ai.${code}`;
}

/**
 * Lightweight cached health-check for the content generation service.
 * Useful to disable "Generate with AI" buttons proactively.
 */
let cachedHealth: { available: boolean; checkedAt: number } | null = null;
const HEALTH_TTL_MS = 60_000; // 1 min

export async function checkContentGenerationHealth(force = false): Promise<{
  available: boolean;
  errorCode?: AIErrorCode;
}> {
  if (!force && cachedHealth && Date.now() - cachedHealth.checkedAt < HEALTH_TTL_MS) {
    return { available: cachedHealth.available };
  }

  try {
    const { data, error } = await supabase.functions.invoke("generate-company-content", {
      body: { health_check: true },
    });

    if (error) {
      const parsed = await parseAIServiceError(error);
      cachedHealth = { available: false, checkedAt: Date.now() };
      return { available: false, errorCode: parsed.code };
    }

    const available = !!data?.available;
    cachedHealth = { available, checkedAt: Date.now() };
    return { available, errorCode: available ? undefined : (data?.error_code as AIErrorCode) };
  } catch (e) {
    cachedHealth = { available: false, checkedAt: Date.now() };
    return { available: false, errorCode: "network_error" };
  }
}
