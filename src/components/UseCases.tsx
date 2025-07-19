import { Badge } from "@/components/ui/badge";

const UseCases = () => {
  return (
    <section id="casos-de-uso" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Casos reales donde Buildera transforma negocios
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Descubre cómo empresas están usando ERA para crear equipos especializados, analizar su competencia y obtener información externa que acelera su crecimiento.
          </p>
        </div>
        <div className="space-y-20">
          {/* Caso 1: Soporte al Cliente */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="font-heading text-2xl text-primary mb-4">
                ERA crea asistentes especializados para cada área
              </h3>
              <p className="text-muted-foreground mb-6">
                María tenía una tienda online pero le faltaba apoyo en múltiples áreas. Con Buildera, ERA le creó asistentes especializados: uno para marketing que optimiza sus campañas, otro financiero que analiza rentabilidad, y uno de recursos humanos que mejora la gestión de su equipo. Ahora tiene expertos disponibles 24/7.
              </p>
              <Badge variant="secondary" className="text-sm font-semibold">
                Equipos Especializados
              </Badge>
            </div>
            <div className="order-1 md:order-2">
              <div className="bg-primary/5 rounded-lg p-8 shadow-card">
                <div className="bg-primary text-primary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">ERA Team Builder</h4>
                  <p className="text-sm opacity-90">Crea asistentes expertos para cada área</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Caso 2: Inteligencia Comercial */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-secondary/5 rounded-lg p-8 shadow-card">
                <div className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">ERA Competitive Intelligence</h4>
                  <p className="text-sm opacity-90">Analiza competencia y trae información externa</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-secondary mb-4">
                ERA investiga tu competencia y trae información clave
              </h3>
              <p className="text-muted-foreground mb-6">
                Carlos tenía un restaurante pero no sabía qué estrategias usaba su competencia exitosa. ERA investigó a sus competidores locales, analizó tendencias del sector gastronómico y trajo información de nuevas regulaciones. Ahora toma decisiones basadas en datos completos del mercado.
              </p>
              <Badge variant="outline" className="text-sm font-semibold border-secondary text-secondary">
                Inteligencia Competitiva
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;