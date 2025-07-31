import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="hero-bg py-16 md:py-20 lg:py-32">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="mb-6">
          <h3 className="text-lg md:text-xl text-primary/80 font-medium mb-2">
            Bienvenido a la nueva era empresarial
          </h3>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading gradient-text leading-tight">
            <span className="block">BUILDERA</span>
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Building The New Era</span>
          </h1>
        </div>
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-heading text-foreground mb-4">
            Olvida el modelo tradicional.
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Con Buildera, tendrás un <strong className="text-primary">equipo completo de especialistas</strong> que se encarga de operar y hacer crecer tu empresa usando la última tecnología en inteligencia artificial.
          </p>
        </div>
        <div className="mb-8">
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4">
            Nos ocupamos de las áreas clave:
          </h3>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 text-sm md:text-base">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">Marketing</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">Ventas</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">Servicio al cliente</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">Jurídico</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">RRHH</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">Finanzas</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">Contabilidad</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">Abastecimiento</span>
          </div>
        </div>
        <div className="mb-8">
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4">
            Para ti significa:
          </h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-base md:text-lg">
            <span className="flex items-center"><span className="text-green-500 mr-2">✅</span> Más crecimiento</span>
            <span className="flex items-center"><span className="text-green-500 mr-2">✅</span> Menos costos</span>
            <span className="flex items-center"><span className="text-green-500 mr-2">✅</span> Decisiones más inteligentes</span>
          </div>
        </div>
        <div className="mb-8">
          <p className="text-xl md:text-2xl font-heading text-primary">
            💡 Tú produces. Nosotros operamos el resto.
          </p>
        </div>
        <div className="mt-6 md:mt-10 flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 px-4">
          <a href="/auth?mode=register&userType=company" className="w-full sm:w-auto">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              Comenzar mi crecimiento gratis
            </Button>
          </a>
          <a href="#como-funciona" className="w-full sm:w-auto">
            <Button variant="outline-hero" size="xl" className="w-full sm:w-auto">
              Ver cómo operamos tu negocio
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;