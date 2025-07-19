import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="hero-bg py-16 md:py-20 lg:py-32">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading gradient-text leading-tight">
          Bienvenido a Buildera: Building The New Era de tu negocio
        </h1>
        <p className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
          Conoce a ERA, tu asistente de inteligencia artificial que analiza tu negocio completo, estudia tu competencia, trae información externa relevante y crea roles especializados (jurídico, financiero, RRHH) para acelerar cada área de tu empresa. Con Buildera, transformas información dispersa en estrategias claras que impulsan tu crecimiento.
        </p>
        <div className="mt-6 md:mt-10 flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 px-4">
          <a href="/auth?mode=register&userType=company" className="w-full sm:w-auto">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              Comenzar Análisis Gratuito
            </Button>
          </a>
          <a href="#solucion" className="w-full sm:w-auto">
            <Button variant="outline-hero" size="xl" className="w-full sm:w-auto">
              Ver Cómo Te Ayudamos
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;