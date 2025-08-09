import { Badge } from "@/components/ui/badge";

const UseCases = () => {
  return (
    <section id="casos-de-uso" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Empresas que ya operan con Buildera
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Casos reales de automatización con especialistas de IA: menos operación, más crecimiento.
          </p>
        </div>

        <div className="space-y-16 md:space-y-20">
          {/* Caso 1: E-commerce */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="font-heading text-2xl text-primary mb-3">
                E‑commerce: de 1 persona a operación escalable
              </h3>
              <p className="text-muted-foreground mb-5">
                Marketing en redes, inventario, soporte 24/7 y promociones automáticas. Resultado: ventas +340% en 6 meses con 50% menos horas de operación.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-sm font-semibold">📈 +340% Ventas</Badge>
                <Badge variant="outline" className="text-sm font-semibold">⏰ -50% Tiempo</Badge>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="bg-primary/5 rounded-lg p-8 shadow-card">
                <div className="bg-primary text-primary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">🛍️ E‑commerce Automatizado</h4>
                  <p className="text-sm opacity-90">Marketing · Inventario · Atención · Analytics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Caso 2: SaaS */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-secondary/5 rounded-lg p-8 shadow-card">
                <div className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">🚀 SaaS Growth</h4>
                  <p className="text-sm opacity-90">Adquisición · Nurturing · Onboarding</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-secondary mb-3">
                SaaS: crecer sin contratar equipo
              </h3>
              <p className="text-muted-foreground mb-5">
                Campañas de adquisición, nurturing de leads y onboarding automatizado. Resultado: de 100 a 2,500 usuarios pagos sin nuevas contrataciones.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm font-semibold border-secondary text-secondary">📊 +2,400 usuarios</Badge>
                <Badge variant="secondary" className="text-sm font-semibold">💰 $0 contrataciones</Badge>
              </div>
            </div>
          </div>

          {/* Caso 3: Agencia */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="font-heading text-2xl text-accent mb-3">
                Agencia: más clientes, mismo equipo
              </h3>
              <p className="text-muted-foreground mb-5">
                Reportes automáticos, contenido asistido, análisis competitivo y prospección. Resultado: 25 clientes con el mismo equipo y márgenes +180%.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-sm font-semibold">🎯 25 clientes</Badge>
                <Badge variant="outline" className="text-sm font-semibold">💸 +180% márgenes</Badge>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="bg-accent/5 rounded-lg p-8 shadow-card">
                <div className="bg-accent text-accent-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">🎨 Agencia Escalable</h4>
                  <p className="text-sm opacity-90">Contenido · Reportes · Prospección</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
