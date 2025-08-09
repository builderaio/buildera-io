import { Badge } from "@/components/ui/badge";

const UseCases = () => {
  return (
    <section id="casos-de-uso" className="py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">Resultados en acción</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Tres ejemplos en Latinoamérica. Menos operación, más crecimiento.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Caso 1: Restaurante en Bogotá */}
          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-primary">Restaurante · Bogotá</h3>
            <p className="text-sm text-muted-foreground mb-4">Reservas por WhatsApp, confirmaciones y recordatorios automáticos.</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-sm font-semibold">📈 +45% reservas</Badge>
              <Badge variant="outline" className="text-sm font-semibold">🕒 -30% no‑shows</Badge>
            </div>
          </article>

          {/* Caso 2: Tienda de moda en Medellín */}
          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-secondary">Tienda de moda · Medellín</h3>
            <p className="text-sm text-muted-foreground mb-4">Catálogo y publicaciones en Instagram; respuestas 24/7 por mensajes.</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm font-semibold border-secondary text-secondary">🛍️ +220% ventas online</Badge>
              <Badge variant="secondary" className="text-sm font-semibold">👥 +180% alcance</Badge>
            </div>
          </article>

          {/* Caso 3: Clínica dental en Cali */}
          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-accent">Clínica dental · Cali</h3>
            <p className="text-sm text-muted-foreground mb-4">Agenda automática, seguimiento de pacientes y campañas locales.</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-sm font-semibold">📅 +60% citas</Badge>
              <Badge variant="outline" className="text-sm font-semibold">💬 3x leads calificados</Badge>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
