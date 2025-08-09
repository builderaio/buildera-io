import React from "react";
import { ShieldCheck, Lock, Layers, Gauge, Shuffle } from "lucide-react";

const items = [
  {
    Icon: ShieldCheck,
    title: "Seguridad que inspira confianza",
    desc: "Protección de datos y operaciones críticas desde el primer día.",
    points: [
      "Cifrado en tránsito y en reposo",
      "Controles de acceso por roles",
      "Auditoría y trazabilidad"
    ]
  },
  {
    Icon: Lock,
    title: "Confianza en cada interacción",
    desc: "Procesos consistentes y predecibles para tu negocio.",
    points: [
      "Buenas prácticas de privacidad",
      "Aislamiento por cuenta",
      "Alertas y monitoreo continuo"
    ]
  },
  {
    Icon: Gauge,
    title: "Escalabilidad sin fricción",
    desc: "Crece cuando lo necesites sin reestructurar tu operación.",
    points: [
      "Arquitectura preparada para altos volúmenes",
      "Ejecución paralela de especialistas",
      "Rendimiento consistente"
    ]
  },
  {
    Icon: Shuffle,
    title: "Flexibilidad para tu realidad",
    desc: "Adáptalo a tu forma de trabajar, no al revés.",
    points: [
      "Flujos configurables",
      "Integraciones con tus herramientas",
      "Roles y permisos personalizados"
    ]
  },
  {
    Icon: Layers,
    title: "Arquitectura abierta",
    desc: "Componentes modulares y fáciles de extender.",
    points: [
      "Capas claras de datos, IA y orquestación",
      "Conectores listos para usar",
      "Estandarización y mejores prácticas"
    ]
  }
];

const ValuePillars = () => {
  return (
    <section id="pilares" className="py-20">
      <div className="container mx-auto px-6">
        <header className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            Operación inteligente con seguridad y crecimiento
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Nuestra propuesta de valor: Innovación, Simplicidad y Colaboración para que tu empresa opere con especialistas de IA y resultados medibles.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ Icon, title, desc, points }) => (
            <article key={title} className="growth-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{desc}</p>
              <ul className="space-y-2 text-sm">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-secondary" aria-hidden="true" />
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

export default ValuePillars;
