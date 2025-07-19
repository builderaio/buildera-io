import { X, CheckCircle } from "lucide-react";

const ProblemSolution = () => {
  return (
    <section id="solucion" className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading text-primary">
            Te entendemos: así es como te ayudamos a crecer
          </h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground px-4">
            Conocemos los desafíos que enfrentas cada día. Por eso diseñamos soluciones que realmente marcan la diferencia.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* El Problema */}
          <div className="bg-muted/50 p-6 md:p-8 rounded-lg border-l-4 border-muted-foreground/30">
            <h3 className="font-heading text-xl md:text-2xl text-muted-foreground mb-4">
              Los retos que enfrentas día a día
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Te quedas sin tiempo</strong> porque las tareas repetitivas consumen las horas que podrías dedicar a hacer crecer tu negocio.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Tus herramientas no se conectan</strong> y pierdes información valiosa que podría ayudarte a tomar mejores decisiones.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">La tecnología parece complicada y costosa</strong> y no sabes por dónde empezar sin grandes inversiones.
                </span>
              </li>
            </ul>
          </div>
          {/* La Solución */}
          <div className="bg-primary/5 p-6 md:p-8 rounded-lg border-l-4 border-primary shadow-card">
            <h3 className="font-heading text-xl md:text-2xl text-primary mb-4">
              Cómo te ayudamos a crecer
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Te devolvemos tu tiempo</strong> con herramientas de IA que manejan las tareas repetitivas, para que te enfoques en lo que más te gusta de tu negocio.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Conectamos todo</strong> para que tengas una visión completa de tu negocio y puedas tomar decisiones con confianza.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Hacemos que sea fácil y accesible</strong> empezar con IA sin necesidad de grandes inversiones ni conocimiento técnico.
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