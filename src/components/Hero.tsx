import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="hero-bg py-20 md:py-32">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-heading gradient-text leading-tight">
          La Automatización Inteligente que su Empresa Necesita para Crecer
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Deje de operar, empiece a escalar. Buildera es la plataforma que le permite a su empresa diseñar y desplegar equipos de agentes de IA que automatizan sus procesos, reducen costos y liberan a su equipo para que se enfoque en la innovación.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <a href="/auth?mode=register&userType=company">
            <Button variant="hero" size="xl">
              Empiece a Automatizar
            </Button>
          </a>
          <a href="#solucion">
            <Button variant="outline-hero" size="xl">
              Conozca la Plataforma
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;