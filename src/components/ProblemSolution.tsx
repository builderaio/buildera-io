import { X, CheckCircle } from "lucide-react";

const ProblemSolution = () => {
  return (
    <section id="solucion" className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading text-primary">
            Marketing inteligente: datos que se convierten en crecimiento real
          </h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground px-4">
            Procesamos un año completo de tu contenido en redes sociales, generamos insights con IA y te damos recomendaciones que realmente funcionan.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* El Problema */}
          <div className="bg-muted/50 p-6 md:p-8 rounded-lg border-l-4 border-muted-foreground/30">
            <h3 className="font-heading text-xl md:text-2xl text-muted-foreground mb-4">
              Los desafíos del marketing actual
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Datos dispersos y sin sentido</strong> - tienes métricas en LinkedIn, Instagram, Facebook y TikTok pero no sabes qué significa todo junto.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Contenido sin estrategia</strong> - publicas intuitivamente sin saber qué temas generan más engagement o por qué algunos posts funcionan mejor.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Análisis superficial</strong> - solo ves likes y comentarios pero no entiendes las tendencias semánticas ni patrones de tu audiencia.
                </span>
              </li>
            </ul>
          </div>
          {/* La Solución */}
          <div className="bg-primary/5 p-6 md:p-8 rounded-lg border-l-4 border-primary shadow-card">
            <h3 className="font-heading text-xl md:text-2xl text-primary mb-4">
              La solución Buildera: Marketing Hub Híbrido
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Sincronización masiva automática</strong> - obtenemos un año completo de datos de todas tus redes sociales y los procesamos con IA avanzada.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Análisis semántico profundo</strong> - creamos clusters de contenido por similitud y tendencias para entender qué realmente funciona.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Recomendaciones ejecutables</strong> - IA que analiza patrones y te dice exactamente qué contenido crear para maximizar el engagement.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;