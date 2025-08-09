import React from "react";
import { Building2, CircuitBoard, ShieldCheck } from "lucide-react";

const items = [
  {
    Icon: Building2,
    title: "Empresas",
    desc: "Acceden a soluciones personalizadas para mejorar la eficiencia operativa y acelerar el crecimiento.",
    impact: ["Menos operación manual", "Procesos medibles", "Crecimiento sostenible"],
    color: "primary",
  },
  {
    Icon: CircuitBoard,
    title: "Desarrolladores",
    desc: "Crean agentes inteligentes escalables adaptados al mercado y a las necesidades de cada empresa.",
    impact: ["Time‑to‑market rápido", "Plantillas reutilizables", "Escalabilidad"],
    color: "secondary",
  },
  {
    Icon: ShieldCheck,
    title: "Expertos",
    desc: "Validan y optimizan soluciones para asegurar alineación estratégica y ética.",
    impact: ["Mejores prácticas", "Gobierno y control", "Resultados confiables"],
    color: "accent",
  },
];

const EcosystemSolution = () => {
  return (
    <section id="ecosistema" className="py-16">
      <div className="container mx-auto px-6">
        <header className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading">Solución Ecosistema</h2>
          <p className="mt-3 text-muted-foreground">
            Empresas, desarrolladores y expertos trabajando en conjunto para operar con IA de forma simple y efectiva.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map(({ Icon, title, desc, impact, color }) => (
            <article key={title} className="growth-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-${color}/10 border border-${color}/20`}>
                  <Icon className={`w-5 h-5 text-${color}`} aria-hidden="true" />
                </span>
                <h3 className="text-xl font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{desc}</p>
              <ul className="space-y-2 text-sm">
                {impact.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                    <span className="text-foreground/90">{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSolution;
