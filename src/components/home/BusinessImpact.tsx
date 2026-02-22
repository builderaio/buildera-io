import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Zap,
  BarChart3,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Building2,
  UserMinus,
} from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

const metrics = [
  { id: "efficiency", icon: TrendingUp, value: 73, suffix: "%", color: "text-primary" },
  { id: "decisionSpeed", icon: Zap, value: 12, suffix: "x", color: "text-secondary" },
  { id: "marketingROI", icon: BarChart3, value: 340, suffix: "%", color: "text-primary" },
  { id: "complianceRisk", icon: ShieldCheck, value: 89, suffix: "%", color: "text-secondary" },
  { id: "knowledge", icon: BookOpen, value: 100, suffix: "%", color: "text-primary" },
];

const beforeAfter = [
  "founderDependency",
  "decisionBottleneck",
  "knowledgeLoss",
  "manualProcesses",
  "reactiveStrategy",
];

const BusinessImpact = () => {
  const { t } = useTranslation("landing");

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden scroll-mt-24">
      {/* Subtle pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(60,70,178,0.05),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 font-mono">
            <TrendingUp className="w-4 h-4" />
            {t("businessImpact.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
            {t("businessImpact.title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("businessImpact.subtitle")}
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-20 max-w-5xl mx-auto">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border/50 rounded-xl p-5 text-center hover:border-primary/30 transition-all group"
            >
              <metric.icon className={`w-6 h-6 ${metric.color} mx-auto mb-3 group-hover:scale-110 transition-transform`} />
              <div className={`text-3xl md:text-4xl font-heading font-bold ${metric.color} mb-1`}>
                <AnimatedCounter end={metric.value} suffix={metric.suffix} />
              </div>
              <span className="text-xs text-muted-foreground font-medium leading-tight block">
                {t(`businessImpact.metrics.${metric.id}`)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Before vs After */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">
            {t("businessImpact.comparison.title")}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <div className="flex items-center gap-3 mb-6">
                <UserMinus className="w-6 h-6 text-destructive" />
                <h4 className="font-heading font-bold text-lg">
                  {t("businessImpact.comparison.before")}
                </h4>
              </div>
              <ul className="space-y-3">
                {beforeAfter.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 mt-2 shrink-0" />
                    {t(`businessImpact.comparison.items.${item}.before`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-primary" />
                <h4 className="font-heading font-bold text-lg">
                  {t("businessImpact.comparison.after")}
                </h4>
              </div>
              <ul className="space-y-3">
                {beforeAfter.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                    {t(`businessImpact.comparison.items.${item}.after`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Valuation callout */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6"
          >
            <div className="flex items-start gap-4">
              <Building2 className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-heading font-bold mb-2">
                  {t("businessImpact.valuation.title")}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("businessImpact.valuation.description")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <p className="mt-6 text-center text-xs text-muted-foreground/60 italic">
            {t("businessImpact.disclaimer", { defaultValue: "* Resultados proyectados basados en benchmarks de la industria. Los resultados individuales pueden variar." })}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default BusinessImpact;
