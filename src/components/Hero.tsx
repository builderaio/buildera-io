import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="hero-bg py-16 md:py-20 lg:py-32">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading gradient-text leading-tight">
          Transforma tu negocio con IA que analiza, optimiza y recomienda automáticamente
        </h1>
        <p className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
          Marketing Hub híbrido con análisis semántico de redes sociales, clusters de contenido inteligentes y recomendaciones IA que realmente impulsan el crecimiento. Todo integrado en un ecosistema que conecta datos, insights y acciones.
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