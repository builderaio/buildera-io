import React from "react";
import { useTranslation } from "react-i18next";
import { Building2, Code2, ShieldCheck, ArrowRight, ArrowDown, TrendingUp } from "lucide-react";

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-accent/10 text-foreground/90 px-3 py-1 text-xs border border-accent/20">
    {children}
  </span>
);

const EcosystemSolution = () => {
  const { t } = useTranslation('landing');
  return (
    <section id="ecosistema" className="py-16">
      <div className="container mx-auto px-6">
        <header className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-heading">{t('ecosystem.title')}</h2>
          <p className="mt-3 text-muted-foreground">
            {t('ecosystem.subtitle')}
          </p>
        </header>

        {/* Flow visual */}
        <div className="hidden md:flex items-center justify-center gap-4 mb-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <span className="text-xs text-foreground/80">{t('ecosystem.roles.companies')}</span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-secondary" aria-hidden="true" />
            </div>
            <span className="text-xs text-foreground/80">{t('ecosystem.roles.developers')}</span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
            <span className="text-xs text-foreground/80">{t('ecosystem.roles.experts')}</span>
          </div>
        </div>

        {/* Flow visual (mobile) */}
        <div className="md:hidden flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <ArrowDown className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-secondary" aria-hidden="true" />
          </div>
          <ArrowDown className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <article className="growth-card p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('ecosystem.companies.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('ecosystem.companies.description')}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Pill>{t('ecosystem.companies.benefits.lessOperation')}</Pill>
              <Pill>{t('ecosystem.companies.benefits.moreGrowth')}</Pill>
              <Pill>{t('ecosystem.companies.benefits.measurable')}</Pill>
            </div>
          </article>

          <article className="growth-card p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-3">
              <Code2 className="w-6 h-6 text-secondary" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('ecosystem.developers.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('ecosystem.developers.description')}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Pill>{t('ecosystem.developers.benefits.timeToMarket')}</Pill>
              <Pill>{t('ecosystem.developers.benefits.reusable')}</Pill>
              <Pill>{t('ecosystem.developers.benefits.scalability')}</Pill>
            </div>
          </article>

          <article className="growth-card p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('ecosystem.experts.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('ecosystem.experts.description')}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Pill>{t('ecosystem.experts.benefits.bestPractices')}</Pill>
              <Pill>{t('ecosystem.experts.benefits.governance')}</Pill>
              <Pill>{t('ecosystem.experts.benefits.reliable')}</Pill>
            </div>
          </article>
        </div>

        {/* Impact banner */}
        <div className="mt-8 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-4 flex items-center justify-center gap-3">
          <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground/90">
            {t('ecosystem.impact')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSolution;
