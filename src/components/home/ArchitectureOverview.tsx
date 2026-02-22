import React from "react";
import { Brain, Bot, Shield, BookOpen, Sparkles } from "lucide-react";

const layers = [
  {
    Icon: Brain,
    label: "L1",
    title: "Decision Engine",
    desc: "Motor central que evalúa señales del negocio y genera decisiones priorizadas por departamento con scoring auditable.",
    components: ["Context Builder", "Multi-criteria Scorer", "Priority Queue"],
  },
  {
    Icon: Bot,
    label: "L2",
    title: "Agent Orchestration",
    desc: "Mapea cada decisión al agente especializado, inyecta contexto de marca y audiencia, y gestiona ejecución paralela.",
    components: ["Agent Router", "Context Injector", "Execution Manager"],
  },
  {
    Icon: Shield,
    label: "L3",
    title: "Guardrail & Compliance",
    desc: "Intercepta decisiones antes de ejecutarlas. Aplica reglas de presupuesto, compliance regulatorio y límites operativos.",
    components: ["Budget Validator", "Compliance Checker", "Rate Limiter"],
  },
  {
    Icon: BookOpen,
    label: "L4",
    title: "Learning & Memory",
    desc: "Evalúa resultados con métricas reales. Almacena lecciones aprendidas y extrae patrones para decisiones futuras.",
    components: ["Impact Evaluator", "Memory Store", "Pattern Extractor"],
  },
  {
    Icon: Sparkles,
    label: "L5",
    title: "Capability Genesis",
    desc: "Detecta vacíos operativos y propone nuevas capacidades autónomas con ciclo de vida gobernado de 7 días.",
    components: ["Gap Detector", "Capability Proposer", "Trial Manager"],
  },
];

const ArchitectureOverview = () => {
  return (
    <section id="arquitectura" className="py-20">
      <div className="container mx-auto px-6">
        <header className="max-w-3xl mx-auto text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            Enterprise Autopilot Brain
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Infraestructura modular de IA diseñada para operar departamentos empresariales con gobernanza, trazabilidad y aprendizaje continuo.
          </p>
        </header>

        <p className="text-center text-sm text-muted-foreground mb-12 max-w-2xl mx-auto">
          5 capas independientes que se comunican mediante eventos y comparten un bus de contexto empresarial unificado.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {layers.map(({ Icon, label, title, desc, components }) => (
            <article key={label} className="growth-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <span className="text-xs font-mono text-secondary font-semibold">{label}</span>
                  <h3 className="text-lg font-semibold text-foreground leading-tight">{title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {components.map((c) => (
                  <span
                    key={c}
                    className="inline-block text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureOverview;
