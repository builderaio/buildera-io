import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { XCircle, ShieldAlert, FlaskConical, DatabaseZap, Eye } from "lucide-react";

const items = [
  { id: "replace", icon: ShieldAlert },
  { id: "magic", icon: FlaskConical },
  { id: "data", icon: DatabaseZap },
  { id: "unsupervised", icon: Eye },
];

const WhatWeDoNot = () => {
  const { t } = useTranslation('landing');

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
            <XCircle className="w-4 h-4" />
            {t('whatWeDoNot.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            {t('whatWeDoNot.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('whatWeDoNot.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border/50 hover:border-destructive/20 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg mb-2">
                    {t(`whatWeDoNot.items.${item.id}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`whatWeDoNot.items.${item.id}.description`)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDoNot;
