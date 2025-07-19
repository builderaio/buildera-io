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
            Tu asistente ERA estudia tu negocio desde todos los ángulos: analiza tus redes sociales, investiga tu competencia, trae información externa relevante y crea asistentes especializados para cada área de tu empresa. En Buildera, convertimos información dispersa en estrategias claras para acelerar tu crecimiento.
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
                  <strong className="text-foreground">Trabajas a ciegas en múltiples áreas</strong> - no sabes si tu marketing funciona, qué hace tu competencia, o cómo optimizar recursos humanos y legales.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Pierdes oportunidades por falta de información</strong> - sabes que necesitas datos del mercado y competencia, pero no tienes tiempo ni recursos para investigar.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Cada área va por su lado</strong> - marketing, ventas, finanzas y recursos humanos trabajan sin una estrategia unificada que acelere el crecimiento.
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
                  <strong className="text-primary">ERA crea equipos especializados</strong> - genera asistentes expertos en marketing, finanzas, recursos humanos, legal y más, cada uno optimizado para su área.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Trae información externa clave</strong> - ERA investiga tu competencia, analiza tendencias del mercado y recopila datos relevantes de múltiples fuentes.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Unifica todo en estrategias claras</strong> - conecta información de todas las áreas y fuentes para darte recomendaciones precisas que aceleren tu crecimiento.
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