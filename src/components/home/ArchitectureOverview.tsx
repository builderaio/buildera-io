import React from "react";
import { Database, Bot, Workflow, Shield, Plug2 } from "lucide-react";

const layers = [
  {
    Icon: Database,
    title: "Capa de Datos",
    desc: "Datos de tu negocio, conectados de forma segura y gobernados.",
    bullets: ["Conexión a CRM, redes sociales y fuentes internas", "Modelado de datos consistente", "Privacidad por diseño"]
  },
  {
    Icon: Bot,
    title: "Especialistas de IA",
    desc: "Agentes especializados que ejecutan tareas y procesos.",
    bullets: ["Plantillas para marketing, ventas y servicio", "Ejecución 24/7", "Resultados medibles"]
  },
  {
    Icon: Workflow,
    title: "Orquestación",
    desc: "Flujos, reglas y aprobaciones para operar como tú trabajas.",
    bullets: ["Automatizaciones configurables", "Condiciones y disparadores", "Colaboración con tu equipo"]
  },
  {
    Icon: Plug2,
    title: "Integraciones",
    desc: "Conecta tus herramientas en minutos para empezar rápido.",
    bullets: ["Redes sociales, email y mensajería", "CRM y analítica", "API abierta"]
  },
  {
    Icon: Shield,
    title: "Seguridad y Gobierno",
    desc: "Controles y visibilidad para operar con tranquilidad.",
    bullets: ["Controles de acceso", "Trazabilidad y registros", "Buenas prácticas de seguridad"]
  }
];

const ArchitectureOverview = () => {
  return (
    <section id="arquitectura" className="py-20">
      <div className="container mx-auto px-6">
        <header className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            Arquitectura clara para operar con confianza
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Una estructura modular que te permite empezar simple y crecer sin límites.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {layers.map(({ Icon, title, desc, bullets }) => (
            <article key={title} className="growth-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20">
                  <Icon className="w-5 h-5 text-secondary" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{desc}</p>
              <ul className="space-y-2 text-sm">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                    <span className="text-foreground/90">{b}</span>
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

export default ArchitectureOverview;
