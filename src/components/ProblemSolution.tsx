import { X, CheckCircle } from "lucide-react";

const ProblemSolution = () => {
  return (
    <section id="solucion" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Su Operación Actual vs. Su Futuro con Buildera
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Transforme los procesos manuales en una ventaja competitiva.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* El Problema */}
          <div className="bg-muted/50 p-8 rounded-lg border-l-4 border-muted-foreground/30">
            <h3 className="font-heading text-2xl text-muted-foreground mb-4">
              El Desafío: Crecimiento Frenado
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Procesos Manuales y Repetitivos</strong> que consumen tiempo valioso de su equipo.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Sistemas Desconectados</strong> que crean silos de información e impiden una visión 360°.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Costos Elevados</strong> para implementar tecnología compleja y falta de talento especializado en IA.
                </span>
              </li>
            </ul>
          </div>
          {/* La Solución */}
          <div className="bg-primary/5 p-8 rounded-lg border-l-4 border-primary shadow-card">
            <h3 className="font-heading text-2xl text-primary mb-4">
              La Solución: Buildera
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Equipos de Agentes de IA</strong> que trabajan 24/7, ejecutando tareas complejas y liberando a su personal.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Plataforma Unificada</strong> que orquesta sus datos y herramientas, creando flujos de trabajo inteligentes y sin fricciones.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Desarrollo Ágil y Rentable</strong> con nuestra plataforma no-code/low-code, para un ROI rápido y soluciones a su medida.
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