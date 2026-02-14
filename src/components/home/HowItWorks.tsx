import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Dna, Rocket, ArrowRight, ArrowDown, Clock } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

const steps = [
  {
    id: 1,
    icon: Search,
    color: "from-primary to-primary/70",
    phaseColor: "bg-primary",
  },
  {
    id: 2,
    icon: Dna,
    color: "from-secondary to-secondary/70",
    phaseColor: "bg-secondary",
  },
  {
    id: 3,
    icon: Rocket,
    color: "from-accent to-accent/70",
    phaseColor: "bg-accent",
  },
];

const HowItWorks = () => {
  const { t } = useTranslation('landing');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring" as const, stiffness: 80, damping: 15 },
    },
  };

  return (
    <section id="como-funciona" className="py-24 bg-background relative overflow-hidden scroll-mt-24">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            {t('howItWorks.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        {/* Time indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium">
              {t('howItWorks.timeLabel')}{" "}
              <span className="text-primary font-bold">
                <AnimatedCounter end={60} suffix="s" />
              </span>
            </span>
          </div>
        </motion.div>

        {/* Visual flow diagram - horizontal on desktop */}
        <div className="hidden md:flex items-center justify-center gap-2 mb-8">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${step.phaseColor} flex items-center justify-center text-white font-bold text-sm`}>
                  {step.id}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {t(`howItWorks.steps.${step.id}.title`)}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="w-5 h-5 text-muted-foreground mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Visual flow diagram - vertical on mobile */}
        <div className="flex md:hidden flex-col items-center gap-2 mb-8">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${step.phaseColor} flex items-center justify-center text-white font-bold text-sm`}>
                  {step.id}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {t(`howItWorks.steps.${step.id}.title`)}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ArrowDown className="w-4 h-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Steps cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-8 relative"
        >
          {/* Connection line */}
          <div className="hidden md:block absolute top-24 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-30" />

          {steps.map((step) => (
            <motion.div
              key={step.id}
              variants={stepVariants}
              className="relative"
            >
              <div className="bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group">
                <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-primary">
                  {step.id}
                </div>

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="font-heading font-bold text-xl mb-3">
                  {t(`howItWorks.steps.${step.id}.title`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`howItWorks.steps.${step.id}.description`)}
                </p>

                <ul className="mt-4 space-y-2">
                  {[1, 2, 3].map((featureNum) => (
                    <li key={featureNum} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="w-3 h-3 text-primary" />
                      {t(`howItWorks.steps.${step.id}.features.${featureNum}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
