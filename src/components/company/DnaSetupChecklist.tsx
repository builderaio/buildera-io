import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Building2,
  Target,
  Bot,
  Heart,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import { usePlatformAgents, type PlatformAgent } from "@/hooks/usePlatformAgents";
import { cn } from "@/lib/utils";

type ChallengeKey =
  | "content"
  | "leads"
  | "budget"
  | "compliance"
  | "talent"
  | "process";

interface DnaSetupChecklistProps {
  onCompleted?: (challenge: ChallengeKey | null) => void;
  /** Optional: when provided, the component will navigate via this handler after completing */
  onNavigate?: (view: string) => void;
}

const CHALLENGE_KEYS: ChallengeKey[] = [
  "content",
  "leads",
  "budget",
  "compliance",
  "talent",
  "process",
];

// Map challenge -> primary platform_agents.category for fallback selection
const CHALLENGE_TO_CATEGORY: Record<ChallengeKey, string> = {
  content: "content",
  leads: "sales",
  budget: "finance",
  compliance: "legal",
  talent: "hr",
  process: "operations",
};

// Map challenge -> dashboard view to redirect to
const CHALLENGE_TO_VIEW: Record<ChallengeKey, string> = {
  content: "marketing",
  leads: "sales",
  budget: "finance",
  compliance: "legal",
  talent: "hr",
  process: "operations",
};

type Step = 1 | 2 | 3 | 4;

export const DnaSetupChecklist = ({ onCompleted, onNavigate }: DnaSetupChecklistProps) => {
  const { t } = useTranslation(["common", "company"]);
  const { company, refetch: refetchCompany } = useCompany();
  const { agents } = usePlatformAgents(company?.id);

  const [openStep, setOpenStep] = useState<Step | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activating, setActivating] = useState(false);

  // Step 1 form
  const [form1, setForm1] = useState({
    name: "",
    industry_sector: "",
    country: "",
    company_size: "",
    website_url: "",
  });

  // Step 2
  const [challenge, setChallenge] = useState<ChallengeKey | "">("");

  // Step 3
  const [mission, setMission] = useState("");
  const [missionSuggestions, setMissionSuggestions] = useState<string[]>([]);

  // Step 4
  const [recommendedAgentCode, setRecommendedAgentCode] = useState<string | null>(null);
  const [recommending, setRecommending] = useState(false);

  // Load company values
  useEffect(() => {
    if (!company) return;
    setForm1({
      name: company.name || "",
      industry_sector: (company as any).industry_sector || "",
      country: (company as any).country || "",
      company_size: (company as any).company_size || "",
      website_url: (company as any).website_url || "",
    });
    setChallenge(((company as any).primary_challenge as ChallengeKey) || "");
    setMission((company as any).mission || "");
    setRecommendedAgentCode((company as any).recommended_agent_code || null);
  }, [company?.id]);

  const stepsDone = useMemo(() => {
    const c: any = company || {};
    return {
      1: Boolean(c.name && c.industry_sector && c.country && c.company_size),
      2: Boolean(c.primary_challenge),
      3: Boolean(c.mission && String(c.mission).trim().length > 5),
      4: Boolean(c.recommended_agent_code),
    } as Record<Step, boolean>;
  }, [company]);

  const completedCount = (Object.values(stepsDone) as boolean[]).filter(Boolean).length;
  const allDone = completedCount === 4;
  const progressPct = Math.round((completedCount / 4) * 100);

  // ------- Save Step 1 -------
  const saveStep1 = async () => {
    if (!company?.id) return;
    if (!form1.name || !form1.industry_sector || !form1.country || !form1.company_size) {
      toast.error(t("common:dnaSetup.errors.requiredFields", "Completa los campos requeridos"));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: form1.name.trim(),
          industry_sector: form1.industry_sector.trim(),
          country: form1.country.trim(),
          company_size: form1.company_size,
          website_url: form1.website_url?.trim() || null,
        })
        .eq("id", company.id);
      if (error) throw error;
      await refetchCompany?.();
      toast.success(t("common:dnaSetup.toasts.saved", "Datos guardados"));
      setOpenStep(null);
    } catch (e: any) {
      console.error(e);
      toast.error(t("common:dnaSetup.errors.saveFailed", "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  };

  // ------- Save Step 2 -------
  const saveStep2 = async () => {
    if (!company?.id || !challenge) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ primary_challenge: challenge })
        .eq("id", company.id);
      if (error) throw error;
      await refetchCompany?.();
      toast.success(t("common:dnaSetup.toasts.challengeSaved", "Reto guardado"));
      setOpenStep(null);
    } catch (e: any) {
      console.error(e);
      toast.error(t("common:dnaSetup.errors.saveFailed", "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  };

  // ------- Mission AI suggestions -------
  const requestMissionSuggestions = async () => {
    if (!company?.id) return;
    setAiLoading(true);
    setMissionSuggestions([]);
    try {
      const prompt = `Sugiere 3 declaraciones de misión cortas (máximo 25 palabras cada una) para una empresa.
Datos: nombre="${form1.name || company.name}", sector="${form1.industry_sector || (company as any).industry_sector || ""}", país="${form1.country || (company as any).country || ""}", reto principal="${challenge || "no definido"}".
Devuelve SOLO una lista numerada (1., 2., 3.) sin texto adicional, sin asteriscos ni negritas.`;

      const { data, error } = await supabase.functions.invoke("generate-company-content", {
        body: { prompt, context: { platform: "general" } },
      });
      if (error) throw error;
      const content: string = data?.content || "";
      const lines = content
        .split("\n")
        .map((l) => l.replace(/^\s*\d+[\.\)]\s*/, "").trim())
        .filter((l) => l.length > 5)
        .slice(0, 3);
      setMissionSuggestions(lines);
      if (lines.length === 0) {
        toast.error(t("common:dnaSetup.errors.aiNoSuggestions", "No se obtuvieron sugerencias"));
      }
    } catch (e: any) {
      console.error(e);
      toast.error(t("common:dnaSetup.errors.aiFailed", "Generación con IA no disponible"));
    } finally {
      setAiLoading(false);
    }
  };

  const saveStep3 = async () => {
    if (!company?.id) return;
    if (!mission.trim() || mission.trim().length < 6) {
      toast.error(t("common:dnaSetup.errors.missionShort", "Escribe una misión válida"));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ mission: mission.trim() })
        .eq("id", company.id);
      if (error) throw error;
      await refetchCompany?.();
      toast.success(t("common:dnaSetup.toasts.missionSaved", "Misión guardada"));
      setOpenStep(null);
    } catch (e: any) {
      console.error(e);
      toast.error(t("common:dnaSetup.errors.saveFailed", "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  };

  // ------- Step 4: AI agent recommendation -------
  const recommendAgent = async () => {
    if (!company?.id || !challenge) return;
    setRecommending(true);
    try {
      // Build catalog snapshot for the AI
      const catalog = agents
        .filter((a: PlatformAgent) => (a as any).is_active !== false)
        .slice(0, 60)
        .map((a: PlatformAgent) => ({
          code: (a as any).internal_code,
          name: (a as any).name,
          category: (a as any).category,
          description: ((a as any).description || "").slice(0, 140),
        }));

      const prompt = `Selecciona el MEJOR agente para una empresa cuyo reto principal es "${challenge}".
Misión: "${mission || (company as any).mission || ""}".
Sector: "${form1.industry_sector || (company as any).industry_sector || ""}".
Catálogo (JSON): ${JSON.stringify(catalog)}
Devuelve SOLO el internal_code del agente recomendado (una sola palabra/identificador, sin explicaciones, sin formato).`;

      const { data, error } = await supabase.functions.invoke("generate-company-content", {
        body: { prompt, context: { platform: "general" } },
      });
      if (error) throw error;
      const raw: string = (data?.content || "").trim();
      const code = raw.split(/\s|\n|`|"|'/).filter(Boolean)[0]?.toUpperCase();
      const found = catalog.find((c) => c.code?.toUpperCase() === code);

      let chosenCode = found?.code as string | undefined;
      if (!chosenCode) {
        // Fallback: first agent of mapped category
        const cat = CHALLENGE_TO_CATEGORY[challenge as ChallengeKey];
        const fallback = catalog.find((c) => c.category === cat);
        chosenCode = fallback?.code;
      }

      if (!chosenCode) {
        toast.error(t("common:dnaSetup.errors.noAgent", "No se encontró un agente compatible"));
        return;
      }

      setRecommendedAgentCode(chosenCode);

      const { error: upErr } = await supabase
        .from("companies")
        .update({ recommended_agent_code: chosenCode })
        .eq("id", company.id);
      if (upErr) throw upErr;
      await refetchCompany?.();
    } catch (e: any) {
      console.error(e);
      toast.error(t("common:dnaSetup.errors.aiFailed", "Generación con IA no disponible"));
    } finally {
      setRecommending(false);
    }
  };

  const recommendedAgent = useMemo(() => {
    if (!recommendedAgentCode) return null;
    return agents.find((a: PlatformAgent) => (a as any).internal_code === recommendedAgentCode) || null;
  }, [recommendedAgentCode, agents]);

  const activateFirstAgent = async () => {
    if (!company?.id) return;
    setActivating(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          dna_setup_completed: true,
          dna_setup_completed_at: new Date().toISOString(),
        })
        .eq("id", company.id);
      if (error) throw error;
      await refetchCompany?.();
      toast.success(
        t(
          "common:dnaSetup.toasts.completed",
          "Tu ADN Empresarial está configurado. El Autopilot observa tu empresa.",
        ),
      );
      setOpenStep(null);
      const view = challenge ? CHALLENGE_TO_VIEW[challenge as ChallengeKey] : undefined;
      onCompleted?.(challenge as ChallengeKey | null);
      if (view) onNavigate?.(view);
    } catch (e: any) {
      console.error(e);
      toast.error(t("common:dnaSetup.errors.saveFailed", "No se pudo guardar"));
    } finally {
      setActivating(false);
    }
  };

  // Step 4 trigger: when opened, request recommendation if missing
  useEffect(() => {
    if (openStep === 4 && !recommendedAgentCode && challenge && agents.length > 0) {
      recommendAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openStep, agents.length]);

  if (!company) return null;

  const items: { step: Step; icon: React.ElementType; titleKey: string; titleDefault: string; descKey: string; descDefault: string; }[] = [
    { step: 1, icon: Building2, titleKey: "common:dnaSetup.step1.title", titleDefault: "Cuéntanos sobre tu empresa", descKey: "common:dnaSetup.step1.desc", descDefault: "Confirma los datos básicos del negocio" },
    { step: 2, icon: Target, titleKey: "common:dnaSetup.step2.title", titleDefault: "¿Cuál es tu mayor reto operativo?", descKey: "common:dnaSetup.step2.desc", descDefault: "Elige el reto que más te urge resolver" },
    { step: 3, icon: Heart, titleKey: "common:dnaSetup.step3.title", titleDefault: "Define tu misión en una frase", descKey: "common:dnaSetup.step3.desc", descDefault: "Texto libre con sugerencias de IA" },
    { step: 4, icon: Bot, titleKey: "common:dnaSetup.step4.title", titleDefault: "Tu primer agente está listo", descKey: "common:dnaSetup.step4.desc", descDefault: "Activa el agente sugerido por IA según tu reto" },
  ];

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <CardTitle className="text-base sm:text-lg font-bold truncate">
                {t("common:dnaSetup.title", "Configura tu ADN Empresarial")}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {completedCount}/4
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t(
              "common:dnaSetup.subtitle",
              "Cuatro pasos rápidos para que el Autopilot trabaje por ti",
            )}
          </p>
          <div className="pt-2">
            <Progress value={progressPct} className="h-1.5" />
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5">
          {items.map((it) => {
            const done = stepsDone[it.step];
            const Icon = it.icon;
            return (
              <button
                key={it.step}
                type="button"
                onClick={() => setOpenStep(it.step)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors text-left",
                  done && "opacity-90",
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                    done ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary",
                  )}
                >
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {t(it.titleKey, it.titleDefault)}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {t(it.descKey, it.descDefault)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}

          {allDone && !(company as any).dna_setup_completed && (
            <Button
              className="w-full mt-2"
              onClick={activateFirstAgent}
              disabled={activating}
            >
              {activating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {t("common:dnaSetup.finishCta", "Finalizar y activar Autopilot")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ===== Step 1 Sheet ===== */}
      <Sheet open={openStep === 1} onOpenChange={(o) => !o && setOpenStep(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("common:dnaSetup.step1.title", "Cuéntanos sobre tu empresa")}</SheetTitle>
            <SheetDescription>
              {t("common:dnaSetup.step1.long", "Estos datos personalizan toda la plataforma.")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("common:dnaSetup.fields.name", "Nombre de la empresa")} *</Label>
              <Input
                value={form1.name}
                onChange={(e) => setForm1({ ...form1, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common:dnaSetup.fields.industry", "Sector")} *</Label>
              <Input
                value={form1.industry_sector}
                onChange={(e) => setForm1({ ...form1, industry_sector: e.target.value })}
                placeholder={t("common:dnaSetup.fields.industryPh", "Ej. Tecnología, Retail, Salud")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common:dnaSetup.fields.country", "País")} *</Label>
              <Input
                value={form1.country}
                onChange={(e) => setForm1({ ...form1, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common:dnaSetup.fields.size", "Tamaño")} *</Label>
              <Select
                value={form1.company_size}
                onValueChange={(v) => setForm1({ ...form1, company_size: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("common:dnaSetup.fields.sizePh", "Selecciona un tamaño")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-500">201-500</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common:dnaSetup.fields.website", "Sitio web")}</Label>
              <Input
                value={form1.website_url}
                onChange={(e) => setForm1({ ...form1, website_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={saveStep1} disabled={saving} className="w-full sm:w-auto">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("common:dnaSetup.actions.save", "Guardar")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ===== Step 2 Sheet ===== */}
      <Sheet open={openStep === 2} onOpenChange={(o) => !o && setOpenStep(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("common:dnaSetup.step2.title", "¿Cuál es tu mayor reto operativo?")}</SheetTitle>
            <SheetDescription>
              {t("common:dnaSetup.step2.long", "Elegiremos un primer agente que ataque ese reto.")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 py-4">
            {CHALLENGE_KEYS.map((key) => {
              const selected = challenge === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChallenge(key)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selected
                      ? "border-primary bg-primary/10"
                      : "bg-card hover:bg-accent/40",
                  )}
                >
                  <p className="text-sm font-semibold">
                    {t(`common:dnaSetup.challenges.${key}.label`, key)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(`common:dnaSetup.challenges.${key}.desc`, "")}
                  </p>
                </button>
              );
            })}
          </div>
          <SheetFooter>
            <Button onClick={saveStep2} disabled={saving || !challenge} className="w-full sm:w-auto">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("common:dnaSetup.actions.save", "Guardar")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ===== Step 3 Sheet ===== */}
      <Sheet open={openStep === 3} onOpenChange={(o) => !o && setOpenStep(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("common:dnaSetup.step3.title", "Define tu misión en una frase")}</SheetTitle>
            <SheetDescription>
              {t("common:dnaSetup.step3.long", "Escríbela tú o pide sugerencias a la IA.")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 py-4">
            <Textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={4}
              placeholder={t(
                "common:dnaSetup.fields.missionPh",
                "Existimos para...",
              )}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={requestMissionSuggestions}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {t("common:dnaSetup.actions.aiSuggest", "Sugerir con IA")}
            </Button>
            {missionSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("common:dnaSetup.aiSuggestions", "Sugerencias")}
                </p>
                {missionSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMission(s)}
                    className="w-full text-left p-2.5 rounded-md border bg-card hover:bg-accent/40 text-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <SheetFooter>
            <Button onClick={saveStep3} disabled={saving} className="w-full sm:w-auto">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("common:dnaSetup.actions.save", "Guardar")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ===== Step 4 Sheet ===== */}
      <Sheet open={openStep === 4} onOpenChange={(o) => !o && setOpenStep(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("common:dnaSetup.step4.title", "Tu primer agente está listo")}</SheetTitle>
            <SheetDescription>
              {t(
                "common:dnaSetup.step4.long",
                "Seleccionamos un agente alineado con tu reto principal.",
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {!challenge && (
              <p className="text-sm text-muted-foreground">
                {t(
                  "common:dnaSetup.step4.needChallenge",
                  "Primero completa el paso 2 (Reto principal).",
                )}
              </p>
            )}
            {challenge && recommending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("common:dnaSetup.step4.thinking", "La IA está eligiendo tu primer agente...")}
              </div>
            )}
            {challenge && !recommending && recommendedAgent && (
              <Card className="border-primary/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                    {(recommendedAgent as any).icon || "🤖"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{(recommendedAgent as any).name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-1">
                      {(recommendedAgent as any).description}
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {(recommendedAgent as any).category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            {challenge && !recommending && !recommendedAgent && (
              <Button variant="outline" onClick={recommendAgent}>
                <Sparkles className="w-4 h-4 mr-2" />
                {t("common:dnaSetup.actions.recommend", "Sugerir agente con IA")}
              </Button>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={activateFirstAgent}
              disabled={activating || !recommendedAgent}
              className="w-full sm:w-auto"
            >
              {activating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("common:dnaSetup.actions.activate", "Activar mi primer agente")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default DnaSetupChecklist;
