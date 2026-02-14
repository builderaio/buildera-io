import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Shield,
  UserCheck,
  DollarSign,
  Scale,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  ArrowRight,
  Eye,
  Lock,
  Gauge,
  Bell,
  ClipboardList,
  Settings2,
  TrendingDown,
  Zap,
  BarChart3,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const approvalLevels = [
  { id: "auto", icon: Zap, risk: "low" },
  { id: "review", icon: Eye, risk: "medium" },
  { id: "approval", icon: UserCheck, risk: "high" },
  { id: "escalation", icon: AlertTriangle, risk: "critical" },
];

const budgetControls = [
  { id: "daily", icon: Clock },
  { id: "campaign", icon: BarChart3 },
  { id: "department", icon: Settings2 },
  { id: "crossDept", icon: Shield },
];

const legalFeatures = [
  { id: "preValidation", icon: Scale },
  { id: "regulatory", icon: Bell },
  { id: "contractReview", icon: FileSearch },
  { id: "sectorCompliance", icon: ClipboardList },
];

const riskIndicators = [
  { id: "anomaly", icon: AlertTriangle },
  { id: "budget", icon: TrendingDown },
  { id: "performance", icon: Gauge },
  { id: "compliance", icon: Lock },
];

const auditCapabilities = [
  { id: "decision", icon: ClipboardList },
  { id: "credit", icon: DollarSign },
  { id: "guardrail", icon: Shield },
  { id: "learning", icon: Eye },
];

const Governance = () => {
  const { t } = useTranslation("governance");

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="py-24 md:py-32 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(60,70,178,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(60,70,178,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 font-mono">
                <Shield className="w-4 h-4" />
                {t("hero.badge")}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight">
                {t("hero.title")}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-4">
                {t("hero.subtitle")}
              </p>
              <p className="text-lg text-muted-foreground/80 max-w-3xl mx-auto mb-10">
                {t("hero.description")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/auth?mode=signup&userType=company">
                  <Button size="lg" className="shadow-glow">
                    {t("hero.cta")}
                  </Button>
                </a>
                <a href="/#arquitectura-producto">
                  <Button variant="outline" size="lg">
                    {t("hero.ctaSecondary")}
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── 1. Human Approval Levels ── */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <SectionHeader
              badge={t("approvalLevels.badge")}
              title={t("approvalLevels.title")}
              subtitle={t("approvalLevels.subtitle")}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {approvalLevels.map((level, i) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-xl border border-border/50 p-6 hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    level.risk === "low" ? "bg-emerald-500" :
                    level.risk === "medium" ? "bg-amber-500" :
                    level.risk === "high" ? "bg-secondary" :
                    "bg-destructive"
                  }`} />
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <level.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className={`text-[10px] uppercase tracking-wider font-mono font-bold ${
                        level.risk === "low" ? "text-emerald-600" :
                        level.risk === "medium" ? "text-amber-600" :
                        level.risk === "high" ? "text-secondary" :
                        "text-destructive"
                      }`}>
                        {t(`approvalLevels.levels.${level.id}.risk`)}
                      </span>
                      <h4 className="font-heading font-bold text-sm">
                        {t(`approvalLevels.levels.${level.id}.title`)}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {t(`approvalLevels.levels.${level.id}.description`)}
                  </p>
                  <div className="space-y-1.5">
                    {[1, 2].map((n) => (
                      <div key={n} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                        <span>{t(`approvalLevels.levels.${level.id}.examples.${n}`)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. Budget Spending Caps ── */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <SectionHeader
              badge={t("budgetCaps.badge")}
              title={t("budgetCaps.title")}
              subtitle={t("budgetCaps.subtitle")}
            />

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {budgetControls.map((ctrl, i) => (
                <motion.div
                  key={ctrl.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-xl border border-border/50 p-6 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ctrl.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold mb-2">
                        {t(`budgetCaps.controls.${ctrl.id}.title`)}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {t(`budgetCaps.controls.${ctrl.id}.description`)}
                      </p>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-[11px] text-muted-foreground font-mono">
                        <Lock className="w-3 h-3" />
                        {t(`budgetCaps.controls.${ctrl.id}.mechanism`)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Legal Review Automation ── */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <SectionHeader
              badge={t("legalReview.badge")}
              title={t("legalReview.title")}
              subtitle={t("legalReview.subtitle")}
            />

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {legalFeatures.map((feat, i) => (
                <motion.div
                  key={feat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-xl border border-border/50 p-6 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold mb-2">
                        {t(`legalReview.features.${feat.id}.title`)}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(`legalReview.features.${feat.id}.description`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Risk Monitoring Dashboard ── */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <SectionHeader
              badge={t("riskMonitoring.badge")}
              title={t("riskMonitoring.title")}
              subtitle={t("riskMonitoring.subtitle")}
            />

            <div className="max-w-5xl mx-auto">
              {/* Dashboard mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
              >
                {/* Top bar */}
                <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-primary" />
                    <span className="font-heading font-bold text-sm">
                      {t("riskMonitoring.dashboardTitle")}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {t("riskMonitoring.liveLabel")}
                  </span>
                </div>

                {/* Indicators grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-border/30">
                  {riskIndicators.map((ind, i) => (
                    <div key={ind.id} className="p-6 text-center">
                      <ind.icon className={`w-8 h-8 mx-auto mb-3 ${
                        i === 0 ? "text-amber-500" :
                        i === 1 ? "text-destructive" :
                        i === 2 ? "text-emerald-500" :
                        "text-primary"
                      }`} />
                      <span className="font-heading font-bold text-lg block">
                        {t(`riskMonitoring.indicators.${ind.id}.value`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(`riskMonitoring.indicators.${ind.id}.label`)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div className="px-6 py-4 border-t border-border/30 bg-muted/20">
                  <p className="text-xs text-muted-foreground text-center">
                    {t("riskMonitoring.description")}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 5. Audit Logs ── */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <SectionHeader
              badge={t("auditLogs.badge")}
              title={t("auditLogs.title")}
              subtitle={t("auditLogs.subtitle")}
            />

            <div className="max-w-5xl mx-auto">
              {/* Audit log structure */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {auditCapabilities.map((cap, i) => (
                  <motion.div
                    key={cap.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card rounded-xl border border-border/50 p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <cap.icon className="w-5 h-5 text-primary" />
                      <h4 className="font-heading font-bold text-sm">
                        {t(`auditLogs.capabilities.${cap.id}.title`)}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(`auditLogs.capabilities.${cap.id}.description`)}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Sample log entry */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl border border-border/50 overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {t("auditLogs.sampleTitle")}
                  </span>
                </div>
                <div className="p-5 font-mono text-xs space-y-1 text-muted-foreground">
                  <p><span className="text-primary">cycle_id:</span> {t("auditLogs.sample.cycleId")}</p>
                  <p><span className="text-primary">phase:</span> {t("auditLogs.sample.phase")}</p>
                  <p><span className="text-primary">decision:</span> {t("auditLogs.sample.decision")}</p>
                  <p><span className="text-primary">guardrail_result:</span> <span className="text-emerald-600">{t("auditLogs.sample.guardrail")}</span></p>
                  <p><span className="text-primary">agent_executed:</span> {t("auditLogs.sample.agent")}</p>
                  <p><span className="text-primary">credits_consumed:</span> {t("auditLogs.sample.credits")}</p>
                  <p><span className="text-primary">outcome_score:</span> {t("auditLogs.sample.outcome")}</p>
                  <p><span className="text-primary">human_approval:</span> {t("auditLogs.sample.approval")}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Accountability Statement ── */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                {t("accountability.title")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                {t("accountability.description")}
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-sm text-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {t(`accountability.principles.${n}`)}
                  </span>
                ))}
              </div>
              <a href="/auth?mode=signup&userType=company">
                <Button size="lg" className="shadow-glow">
                  {t("accountability.cta")}
                </Button>
              </a>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const SectionHeader = ({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="text-center max-w-3xl mx-auto mb-14"
  >
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 font-mono">
      {badge}
    </span>
    <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
      {title}
    </h2>
    <p className="text-lg text-muted-foreground leading-relaxed">
      {subtitle}
    </p>
  </motion.div>
);

export default Governance;
