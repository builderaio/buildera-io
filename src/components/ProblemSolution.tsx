import { X, CheckCircle } from "lucide-react";

const ProblemSolution = () => {
  return (
    <section id="solucion" className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading text-primary">
            ERA entiende tu negocio mejor que nadie
          </h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground px-4">
            Tu asistente ERA analiza todo lo que has publicado en redes sociales, identifica qué conecta mejor con tu audiencia y te sugiere el camino más directo para hacer crecer tu negocio. En Buildera, convertimos el caos de información en claridad total.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* El Problema */}
          <div className="bg-muted/50 p-6 md:p-8 rounded-lg border-l-4 border-muted-foreground/30">
            <h3 className="font-heading text-xl md:text-2xl text-muted-foreground mb-4">
              Lo que te pasa todos los días
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Publicas sin saber si funciona</strong> - tienes Instagram, LinkedIn, Facebook, pero no sabes cuál contenido realmente conecta con tu audiencia.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Pierdes oportunidades de crecimiento</strong> - sabes que hay patrones en tu éxito, pero no logras identificarlos para repetirlos.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Te quedas con dudas</strong> - ves los números pero no entiendes qué hacer diferente para que tu negocio crezca más rápido.
                </span>
              </li>
            </ul>
          </div>
          {/* La Solución */}
          <div className="bg-primary/5 p-6 md:p-8 rounded-lg border-l-4 border-primary shadow-card">
            <h3 className="font-heading text-xl md:text-2xl text-primary mb-4">
              Así te ayuda Buildera con ERA
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">ERA revisa todo tu historial</strong> - conectamos tus redes sociales y estudiamos un año completo de todo lo que has publicado para entender qué funciona mejor.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Agrupa tu contenido por temas</strong> - ERA organiza automáticamente tus publicaciones por temas similares y te muestra cuáles generan más interacción.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Te dice exactamente qué hacer</strong> - basándose en tus mejores resultados, ERA te sugiere qué contenido crear, cuándo publicarlo y cómo mejorarlo.
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