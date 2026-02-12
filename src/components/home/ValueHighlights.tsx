import React from "react";
import { useTranslation } from "react-i18next";
import { Shield, Sparkles, Brain } from "lucide-react";

const ValueHighlights = () => {
  const { t } = useTranslation('landing');
  
  const items = [
    { Icon: Shield, titleKey: "values.secure.title", descKey: "values.secure.description" },
    { Icon: Sparkles, titleKey: "values.scalable.title", descKey: "values.scalable.description" },
    { Icon: Brain, titleKey: "values.flexible.title", descKey: "values.flexible.description" },
  ];
  return (
    <section id="valores" className="py-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ Icon, titleKey, descKey }) => (
            <article key={titleKey} className="growth-card p-5 flex items-center gap-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-lg text-foreground">{t(titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(descKey)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueHighlights;
