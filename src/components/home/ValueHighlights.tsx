import React from "react";
import { Shield, TrendingUp, Shuffle } from "lucide-react";

const items = [
  { Icon: Shield, title: "Seguro por diseño", desc: "Tus datos y operaciones, protegidos" },
  { Icon: TrendingUp, title: "Escala sin fricción", desc: "Crece sin aumentar tu carga" },
  { Icon: Shuffle, title: "Flexible a tu negocio", desc: "Se adapta a tu forma de trabajar" },
];

const ValueHighlights = () => {
  return (
    <section id="valores" className="py-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {items.map(({ Icon, title, desc }) => (
            <article key={title} className="growth-card p-5 flex items-center gap-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-lg text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueHighlights;
