import { X, CheckCircle } from "lucide-react";

const ProblemSolution = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading text-primary">
            El problema en las empresas y nuestra solución
          </h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground px-4">
            Necesitas resultados sin inflar tu estructura. Te damos un equipo de IA listo para operar, con seguridad, control y enfoque en resultados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* El Problema */}
          <article className="bg-muted/50 p-6 md:p-8 rounded-lg border-l-4 border-muted-foreground/30">
            <h3 className="font-heading text-xl md:text-2xl text-muted-foreground mb-4">
              La realidad de muchas empresas
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Operación dispersa y poco tiempo</strong> — pasas más tiempo operando que generando valor.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Expertise costoso o difícil de conseguir</strong> — especialistas por área elevan costos y complejidad.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Falta de visibilidad y control</strong> — decisiones sin datos y procesos poco medibles.
                </span>
              </li>
            </ul>
          </article>

          {/* La Solución */}
          <article className="bg-primary/5 p-6 md:p-8 rounded-lg border-l-4 border-primary shadow-card">
            <h3 className="font-heading text-xl md:text-2xl text-primary mb-4">
              Cómo te ayuda Buildera
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Especialistas virtuales por área</strong> — marketing, ventas, servicio, finanzas y más, operando 24/7.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Seguridad, escalabilidad y flexibilidad</strong> — controles por roles, trazabilidad y flujos que se adaptan a tu operación.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Resultados medibles</strong> — KPIs y reportes para decidir y optimizar con claridad.
                </span>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
