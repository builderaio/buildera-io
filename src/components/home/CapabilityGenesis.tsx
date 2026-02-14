import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  FileText,
  ShieldCheck,
  Plug,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Clock,
  XCircle,
  Zap,
  Scale,
  BarChart3,
} from "lucide-react";

const lifecycleSteps = [
  { id: "detect", icon: Search, color: "bg-destructive/10 border-destructive/30 text-destructive" },
  { id: "propose", icon: FileText, color: "bg-primary/10 border-primary/30 text-primary" },
  { id: "govern", icon: ShieldCheck, color: "bg-amber-500/10 border-amber-500/30 text-amber-600" },
  { id: "trial", icon: Clock, color: "bg-violet-500/10 border-violet-500/30 text-violet-600" },
  { id: "evaluate", icon: BarChart3, color: "bg-secondary/10 border-secondary/30 text-secondary" },
  { id: "integrate", icon: Plug, color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" },
];

const CapabilityGenesis = () => {
  const { t } = useTranslation("landing");

  return (
    <section
      id="capability-genesis"
      className="py-24 bg-muted/30 relative overflow-hidden scroll-mt-24"
    >
      {/* Subtle pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(60,70,178,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(60,70,178,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 font-mono">
            <Sparkles className="w-4 h-4" />
            {t("genesis.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
            {t("genesis.title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("genesis.subtitle")}
          </p>
        </motion.div>

        {/* ── 1. How it Works: 4 Pillars ── */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-20">
          {(["gapDetection", "agentProposal", "governance", "integration"] as const).map((pillar, i) => (
            <motion.div
              key={pillar}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl border border-border/50 p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-mono text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <h3 className="font-heading font-bold text-lg">
                  {t(`genesis.pillars.${pillar}.title`)}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t(`genesis.pillars.${pillar}.description`)}
              </p>
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{t(`genesis.pillars.${pillar}.details.${n}`)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── 2. Visual Lifecycle ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">
            {t("genesis.lifecycle.title")}
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            {t("genesis.lifecycle.subtitle")}
          </p>

          {/* Horizontal lifecycle on desktop, vertical on mobile */}
          <div className="max-w-5xl mx-auto">
            {/* Desktop: horizontal flow */}
            <div className="hidden lg:flex items-start justify-between gap-2">
              {lifecycleSteps.map((step, i) => (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center text-center flex-1"
                  >
                    <div className={`w-14 h-14 rounded-xl border-2 ${step.color} flex items-center justify-center mb-3`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span className="font-heading font-bold text-sm mb-1">
                      {t(`genesis.lifecycle.steps.${step.id}.title`)}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      {t(`genesis.lifecycle.steps.${step.id}.description`)}
                    </span>
                  </motion.div>
                  {i < lifecycleSteps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground/40 shrink-0 mt-4" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile: vertical flow */}
            <div className="lg:hidden space-y-3">
              {lifecycleSteps.map((step, i) => (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-xl border-2 ${step.color} flex items-center justify-center shrink-0`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-heading font-bold text-sm block">
                        {t(`genesis.lifecycle.steps.${step.id}.title`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(`genesis.lifecycle.steps.${step.id}.description`)}
                      </span>
                    </div>
                  </motion.div>
                  {i < lifecycleSteps.length - 1 && (
                    <div className="flex justify-6 ml-5">
                      <ArrowDown className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── 3. Real Use Case Example ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">
            {t("genesis.useCase.title")}
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("genesis.useCase.subtitle")}
          </p>

          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Trigger */}
            <div className="p-6 border-b border-border/50 bg-destructive/5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-xs text-destructive uppercase tracking-wide">
                    {t("genesis.useCase.triggerLabel")}
                  </span>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">
                    {t("genesis.useCase.trigger")}
                  </p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="divide-y divide-border/30">
              {(["step1", "step2", "step3", "step4", "step5"] as const).map((step, i) => {
                const icons = [Search, Sparkles, ShieldCheck, Clock, Plug];
                const StepIcon = icons[i];
                return (
                  <div key={step} className="p-5 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <StepIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-heading font-bold text-sm block">
                        {t(`genesis.useCase.steps.${step}.title`)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {t(`genesis.useCase.steps.${step}.description`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Outcome */}
            <div className="p-6 bg-emerald-500/5 border-t border-emerald-500/20">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-xs text-emerald-600 uppercase tracking-wide">
                    {t("genesis.useCase.outcomeLabel")}
                  </span>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">
                    {t("genesis.useCase.outcome")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Governance callout */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6"
          >
            <div className="flex items-start gap-4">
              <Scale className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-heading font-bold mb-2">
                  {t("genesis.governanceNote.title")}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("genesis.governanceNote.description")}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CapabilityGenesis;
