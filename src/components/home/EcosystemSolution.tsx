import React from "react";
import { Building2, Code2, ShieldCheck, ArrowRight, ArrowDown, TrendingUp } from "lucide-react";

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-accent/10 text-foreground/90 px-3 py-1 text-xs border border-accent/20">
    {children}
  </span>
);

const EcosystemSolution = () => {
  return (
    <section id="ecosistema" className="py-16">
      <div className="container mx-auto px-6">
        <header className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-heading">Ecosistema que impulsa tu crecimiento</h2>
          <p className="mt-3 text-muted-foreground">
            Empresas, desarrolladores y expertos trabajando juntos para operar con IA de forma simple y efectiva.
          </p>
        </header>

        {/* Flow visual */}
        <div className="hidden md:flex items-center justify-center gap-4 mb-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <span className="text-xs text-foreground/80">Empresas</span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-secondary" aria-hidden="true" />
            </div>
            <span className="text-xs text-foreground/80">Desarrolladores</span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
            <span className="text-xs text-foreground/80">Expertos</span>
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
            <h3 className="text-xl font-semibold mb-2">Empresas</h3>
            <p className="text-sm text-muted-foreground mb-4">Operan con agentes de IA hechos a su medida.</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Pill>Menos operación</Pill>
              <Pill>Más crecimiento</Pill>
              <Pill>Procesos medibles</Pill>
            </div>
          </article>

          <article className="growth-card p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-3">
              <Code2 className="w-6 h-6 text-secondary" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Desarrolladores</h3>
            <p className="text-sm text-muted-foreground mb-4">Crean y escalan agentes listos para el mercado.</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Pill>Time‑to‑market</Pill>
              <Pill>Plantillas reutilizables</Pill>
              <Pill>Escalabilidad</Pill>
            </div>
          </article>

          <article className="growth-card p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Expertos</h3>
            <p className="text-sm text-muted-foreground mb-4">Aseguran alineación estratégica y ética.</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Pill>Buenas prácticas</Pill>
              <Pill>Gobierno y control</Pill>
              <Pill>Resultados confiables</Pill>
            </div>
          </article>
        </div>

        {/* Impact banner */}
        <div className="mt-8 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-4 flex items-center justify-center gap-3">
          <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground/90">
            Resultado: menos operación, más crecimiento — con una experiencia simple y segura.
          </p>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSolution;
