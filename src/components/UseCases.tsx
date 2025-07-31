import { Badge } from "@/components/ui/badge";

const UseCases = () => {
  return (
    <section id="casos-de-uso" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Emprendimientos digitales que ya operan con Buildera
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Mira cómo emprendedores digitales están automatizando operaciones completas y escalando sus negocios con nuestro equipo de especialistas en IA.
          </p>
        </div>
        <div className="space-y-20">
          {/* Caso 1: E-commerce */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="font-heading text-2xl text-primary mb-4">
                E-commerce: De 1 persona a equipo completo
              </h3>
              <p className="text-muted-foreground mb-6">
                <strong>Laura (Tienda de ropa online):</strong> Era ella sola manejando todo. Ahora Buildera opera su marketing en redes sociales, optimiza su inventario, maneja atención al cliente 24/7 y analiza qué productos promocionar cada semana. <strong>Resultado:</strong> Ventas +340% en 6 meses, trabajando 50% menos horas.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-sm font-semibold">
                  📈 +340% Ventas
                </Badge>
                <Badge variant="outline" className="text-sm font-semibold">
                  ⏰ -50% Tiempo
                </Badge>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="bg-primary/5 rounded-lg p-8 shadow-card">
                <div className="bg-primary text-primary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">🛍️ E-commerce Automatizado</h4>
                  <p className="text-sm opacity-90">Marketing · Inventario · Atención · Analytics</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Caso 2: SaaS Startup */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-secondary/5 rounded-lg p-8 shadow-card">
                <div className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">🚀 SaaS Growth Machine</h4>
                  <p className="text-sm opacity-90">Sales · Marketing · Customer Success</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-secondary mb-4">
                SaaS: Escalado sin contratar equipo
              </h3>
              <p className="text-muted-foreground mb-6">
                <strong>Miguel (App de productividad):</strong> Tenía el producto pero le faltaba todo lo demás. Buildera maneja sus campañas de adquisición, nurturing de leads, onboarding automatizado y análisis de churn. <strong>Resultado:</strong> De 100 a 2,500 usuarios pagos sin contratar a nadie.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm font-semibold border-secondary text-secondary">
                  📊 2,400 usuarios nuevos
                </Badge>
                <Badge variant="secondary" className="text-sm font-semibold">
                  💰 $0 contrataciones
                </Badge>
              </div>
            </div>
          </div>

          {/* Caso 3: Agencia Digital */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="font-heading text-2xl text-accent mb-4">
                Agencia Digital: Más clientes, mismo equipo
              </h3>
              <p className="text-muted-foreground mb-6">
                <strong>Ana (Agencia de marketing):</strong> Tenía 3 empleados y 8 clientes al límite. Buildera automatizó reportes, creación de contenido, análisis competitivo y prospección. <strong>Resultado:</strong> Ahora maneja 25 clientes con el mismo equipo, márgenes +180%.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-sm font-semibold">
                  🎯 25 clientes
                </Badge>
                <Badge variant="outline" className="text-sm font-semibold">
                  💸 +180% Márgenes
                </Badge>
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