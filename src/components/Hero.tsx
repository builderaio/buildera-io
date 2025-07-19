import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="hero-bg py-20 md:py-32">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-heading gradient-text leading-tight">
          Hacemos que tu negocio crezca con la automatización que realmente funciona
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Sabemos lo desafiante que puede ser hacer crecer un negocio hoy en día. Por eso creamos Buildera: para que puedas automatizar lo que te quita tiempo y enfocarte en lo que realmente importa. Estamos aquí para acompañarte en cada paso hacia el crecimiento que buscas.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <a href="/auth?mode=register&userType=company">
            <Button variant="hero" size="xl">
              Comenzar mi Transformación
            </Button>
          </a>
          <a href="#solucion">
            <Button variant="outline-hero" size="xl">
              Ver Cómo Te Ayudamos
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;