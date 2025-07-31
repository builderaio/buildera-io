import { X, CheckCircle } from "lucide-react";

const ProblemSolution = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading text-primary">
            El problema de las MiPYMEs (y nuestra solución)
          </h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground px-4">
            Sabemos lo que vives día a día: necesitas un equipo completo pero no puedes costear especialistas en cada área. Nosotros te damos ese equipo, pero con IA.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* El Problema */}
          <div className="bg-muted/50 p-6 md:p-8 rounded-lg border-l-4 border-muted-foreground/30">
            <h3 className="font-heading text-xl md:text-2xl text-muted-foreground mb-4">
              Tu realidad diaria como MiPYME
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Necesitas especialistas pero no puedes pagarlos</strong> - Marketing, finanzas, RRHH, legal... cada área necesita un experto, pero contratar cuesta mucho.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Haces todo tú pero sin expertise</strong> - terminas siendo el marketero, contador, vendedor y abogado de tu empresa, pero sin ser experto en nada.
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Pierdes tiempo en operaciones, no en producir</strong> - pasas más tiempo "operando" tu negocio que haciendo lo que realmente sabes hacer.
                </span>
              </li>
            </ul>
          </div>
          {/* La Solución */}
          <div className="bg-primary/5 p-6 md:p-8 rounded-lg border-l-4 border-primary shadow-card">
            <h3 className="font-heading text-xl md:text-2xl text-primary mb-4">
              Con Buildera, ya no es tu problema
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Tienes un equipo completo de especialistas</strong> - expertos en marketing, finanzas, RRHH, legal, ventas y más. Todos trabajando para tu empresa 24/7.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Costos de especialistas sin contratarlos</strong> - obtienes expertise de nivel profesional en todas las áreas por una fracción del costo de contratar personal.
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Vuelves a enfocarte en producir</strong> - nosotros operamos todo lo demás mientras tú haces lo que mejor sabes: desarrollar tu producto o servicio principal.
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