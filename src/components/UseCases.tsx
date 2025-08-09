import { Badge } from "@/components/ui/badge";

const UseCases = () => {
  const items = [
    {
      title: "E‑commerce",
      result1: "📈 +340% Ventas",
      result2: "⏰ -50% Tiempo",
      caption: "Marketing, inventario y soporte 24/7",
      color: "primary",
    },
    {
      title: "SaaS",
      result1: "📊 +2,400 usuarios",
      result2: "💰 $0 contrataciones",
      caption: "Adquisición, nurturing y onboarding",
      color: "secondary",
    },
    {
      title: "Agencia",
      result1: "🎯 25 clientes",
      result2: "💸 +180% márgenes",
      caption: "Reportes, contenido y prospección",
      color: "accent",
    },
  ];

  return (
    <section id="casos-de-uso" className="py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">Resultados en acción</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Tres ejemplos claros. Menos operación, más crecimiento.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((i) => (
            <article key={i.title} className="growth-card p-6">
              <h3 className={`font-heading text-xl mb-2 text-${i.color}`}>{i.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{i.caption}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={i.color === 'secondary' ? 'outline' : 'secondary'} className="text-sm font-semibold">
                  {i.result1}
                </Badge>
                <Badge variant={i.color === 'secondary' ? 'secondary' : 'outline'} className="text-sm font-semibold">
                  {i.result2}
                </Badge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
