import { Badge } from "@/components/ui/badge";

const UseCases = () => {
  return (
    <section id="casos-de-uso" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Casos reales donde Buildera marca la diferencia
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Descubre cómo negocios como el tuyo están usando ERA para acelerar su crecimiento de manera inteligente y sin complicaciones.
          </p>
        </div>
        <div className="space-y-20">
          {/* Caso 1: Soporte al Cliente */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="font-heading text-2xl text-primary mb-4">
                ERA descubre qué contenido conecta mejor con tu audiencia
              </h3>
              <p className="text-muted-foreground mb-6">
                María tenía una tienda online pero no sabía por qué algunos posts en Instagram funcionaban y otros no. Con Buildera, ERA analizó un año completo de sus publicaciones y le mostró que sus tutoriales de 30 segundos generaban 3x más ventas que las fotos de productos. Ahora sabe exactamente qué publicar.
              </p>
              <Badge variant="secondary" className="text-sm font-semibold">
                Análisis de Contenido
              </Badge>
            </div>
            <div className="order-1 md:order-2">
              <div className="bg-primary/5 rounded-lg p-8 shadow-card">
                <div className="bg-primary text-primary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">ERA Marketing Strategist</h4>
                  <p className="text-sm opacity-90">Identifica tu contenido de mayor impacto</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Caso 2: Inteligencia Comercial */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-secondary/5 rounded-lg p-8 shadow-card">
                <div className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">ERA Business Strategist</h4>
                  <p className="text-sm opacity-90">Convierte datos en decisiones claras</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-secondary mb-4">
                ERA te ayuda a tomar decisiones inteligentes
              </h3>
              <p className="text-muted-foreground mb-6">
                Carlos tenía un restaurante con redes sociales, pero no sabía si invertir más en LinkedIn o Instagram. ERA analizó los datos y descubrió que LinkedIn le traía 60% más reservas los fines de semana. Con Buildera, ahora invierte su tiempo y dinero donde realmente funciona.
              </p>
              <Badge variant="outline" className="text-sm font-semibold border-secondary text-secondary">
                Estrategia Inteligente
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;