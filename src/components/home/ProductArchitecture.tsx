import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Brain,
  Cpu,
  Shield,
  BookOpen,
  Sparkles,
  Network,
  Eye,
  BarChart3,
  CheckCircle2,
  ArrowDown,
  ArrowRight,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Scale,
  Users,
  Settings2,
  Layers,
  Database,
  Zap,
} from "lucide-react";

const systemLayers = [
  { id: "decisionEngine", icon: Cpu, color: "from-primary to-primary/70" },
  { id: "agentOrchestration", icon: Network, color: "from-secondary to-secondary/70" },
  { id: "guardrailCompliance", icon: Shield, color: "from-destructive to-destructive/70" },
  { id: "learningMemory", icon: BookOpen, color: "from-accent to-accent/70" },
  { id: "capabilityGenesis", icon: Sparkles, color: "from-violet-500 to-purple-500" },
];

const deptConnections = [
  { id: "marketing", icon: TrendingUp },
  { id: "sales", icon: ShoppingCart },
  { id: "finance", icon: DollarSign },
  { id: "legal", icon: Scale },
  { id: "hr", icon: Users },
  { id: "operations", icon: Settings2 },
];

const cyclePhases = [
  { id: "sense", icon: Eye, color: "border-primary/40 bg-primary/5" },
  { id: "think", icon: Brain, color: "border-secondary/40 bg-secondary/5" },
  { id: "guard", icon: Shield, color: "border-destructive/40 bg-destructive/5" },
  { id: "act", icon: Zap, color: "border-accent/40 bg-accent/5" },
  { id: "learn", icon: BookOpen, color: "border-violet-400/40 bg-violet-500/5" },
  { id: "evolve", icon: Sparkles, color: "border-amber-400/40 bg-amber-500/5" },
];

const ProductArchitecture = () => {
  const { t } = useTranslation("landing");

  return (
    <section
      id="arquitectura-producto"
      className="py-24 bg-background relative overflow-hidden scroll-mt-24"
    >
      {/* Subtle grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(60,70,178,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(60,70,178,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

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
            <Layers className="w-4 h-4" />
            {t("architecture.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
            {t("architecture.title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("architecture.subtitle")}
          </p>
        </motion.div>

        {/* ── 1. System Architecture: 5 Layers ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">
            {t("architecture.layers.title")}
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            {t("architecture.layers.subtitle")}
          </p>

          {/* Stacked layers — visually shows hierarchy */}
          <div className="max-w-4xl mx-auto space-y-4">
            {systemLayers.map((layer, i) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 p-6 group"
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${layer.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <layer.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        L{i + 1}
                      </span>
                      <h4 className="font-heading font-bold text-lg">
                        {t(`architecture.layers.items.${layer.id}.title`)}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {t(`architecture.layers.items.${layer.id}.description`)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground font-mono"
                        >
                          <Database className="w-3 h-3" />
                          {t(
                            `architecture.layers.items.${layer.id}.components.${n}`
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── 2. Agent-to-Department Modular Diagram ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">
            {t("architecture.agentMap.title")}
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            {t("architecture.agentMap.subtitle")}
          </p>

          <div className="max-w-5xl mx-auto">
            {/* Central brain */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/20"
              >
                <Brain className="w-10 h-10 text-white" />
              </motion.div>
              <span className="mt-3 font-heading font-bold text-sm">
                {t("architecture.agentMap.brain")}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {t("architecture.agentMap.brainSub")}
              </span>
            </div>

            {/* Connection lines */}
            <div className="flex justify-center mb-4">
              <div className="w-px h-8 bg-gradient-to-b from-primary/40 to-primary/10" />
            </div>

            <div className="hidden md:flex justify-center mb-4">
              <div className="w-[80%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>

            {/* Department grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {deptConnections.map((dept, i) => (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-px h-6 bg-primary/20 hidden md:block" />
                  <div className="bg-card border border-border/50 rounded-xl p-4 text-center w-full hover:border-primary/30 transition-all">
                    <dept.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <span className="font-heading font-semibold text-xs block">
                      {t(
                        `architecture.agentMap.departments.${dept.id}.name`
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                      {t(
                        `architecture.agentMap.departments.${dept.id}.agents`
                      )}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── 3. Autonomous Cycle — Operational Detail ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">
            {t("architecture.cycle.title")}
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            {t("architecture.cycle.subtitle")}
          </p>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cyclePhases.map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border ${phase.color} p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center font-mono text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <phase.icon className="w-5 h-5 text-foreground/70" />
                  <h4 className="font-heading font-bold">
                    {t(`architecture.cycle.phases.${phase.id}.title`)}
                  </h4>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {t(`architecture.cycle.phases.${phase.id}.description`)}
                </p>

                <div className="space-y-2">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>
                        {t(
                          `architecture.cycle.phases.${phase.id}.details.${n}`
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Data flow summary */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 max-w-3xl mx-auto"
          >
            <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-heading font-bold mb-2">
                    {t("architecture.dataFlow.title")}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("architecture.dataFlow.description")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductArchitecture;
