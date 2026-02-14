import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Brain, TrendingUp, ShoppingCart, DollarSign, Scale, Users, Settings2,
  ArrowRight, Zap, Eye, Shield, BookOpen, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const departments = [
  { id: "marketing", icon: TrendingUp, color: "from-pink-500 to-rose-500" },
  { id: "sales", icon: ShoppingCart, color: "from-blue-500 to-cyan-500" },
  { id: "finance", icon: DollarSign, color: "from-emerald-500 to-green-500" },
  { id: "legal", icon: Scale, color: "from-amber-500 to-yellow-500" },
  { id: "hr", icon: Users, color: "from-violet-500 to-purple-500" },
  { id: "operations", icon: Settings2, color: "from-orange-500 to-red-500" },
];

const cycleSteps = [
  { id: "sense", icon: Eye },
  { id: "think", icon: Brain },
  { id: "guard", icon: Shield },
  { id: "act", icon: Zap },
  { id: "learn", icon: BookOpen },
  { id: "evolve", icon: TrendingUp },
];

const governanceItems = ["approval", "audit", "limits", "override"];

const AutonomousEnterprise = () => {
  const { t } = useTranslation('landing');

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            {t('autonomousEnterprise.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
            {t('autonomousEnterprise.title')}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('autonomousEnterprise.subtitle')}
          </p>
        </motion.div>

        {/* 6 Department Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16"
        >
          {departments.map((dept, i) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="group bg-card rounded-2xl p-5 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 text-center"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <dept.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-semibold text-sm">
                {t(`autonomousEnterprise.departments.${dept.id}`)}
              </h3>
            </motion.div>
          ))}
        </motion.div>

        {/* Governed Intelligence Cycle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-center mb-8">
            {t('autonomousEnterprise.cycleTitle')}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {cycleSteps.map((step, i) => (
              <React.Fragment key={step.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
                >
                  <step.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">
                    {t(`autonomousEnterprise.cycle.${step.id}`)}
                  </span>
                </motion.div>
                {i < cycleSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground self-center hidden sm:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-16"
        >
          <div className="grid md:grid-cols-3 gap-6">
            {['adaptive', 'genesis', 'crossDept'].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl p-6 border border-primary/10"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  {feature === 'adaptive' && <BookOpen className="w-5 h-5 text-primary" />}
                  {feature === 'genesis' && <Zap className="w-5 h-5 text-primary" />}
                  {feature === 'crossDept' && <Shield className="w-5 h-5 text-primary" />}
                </div>
                <h4 className="font-heading font-bold text-lg mb-2">
                  {t(`autonomousEnterprise.features.${feature}.title`)}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`autonomousEnterprise.features.${feature}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Governance section - NEW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-heading font-bold">
                {t('autonomousEnterprise.governance.title')}
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {governanceItems.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {t(`autonomousEnterprise.governance.items.${item}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <a href="/auth?mode=signup&userType=company">
            <Button variant="hero" size="lg" className="group">
              {t('autonomousEnterprise.cta')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default AutonomousEnterprise;
