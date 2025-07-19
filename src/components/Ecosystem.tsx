import { Building2, Code, PieChart } from "lucide-react";

const Ecosystem = () => {
  return (
    <section id="ecosistema" className="bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Un ecosistema pensado para ti
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Creemos que el crecimiento se da cuando las personas correctas trabajan juntas. Por eso reunimos empresas, desarrolladores y expertos en un solo lugar.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Para Empresas */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <Building2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-primary mb-4">Para Empresas</h3>
            <p className="text-muted-foreground">
              Te ayudamos a hacer crecer tu empresa más rápido. Accede a soluciones de IA diseñadas específicamente para tus necesidades, sin complicaciones y con resultados que puedes ver.
            </p>
          </div>
          {/* Para Desarrolladores */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-secondary/10 p-4 rounded-full">
                <Code className="w-12 h-12 text-secondary" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-secondary mb-4">Para Desarrolladores</h3>
            <p className="text-muted-foreground">
              Únete a una comunidad donde tu talento es valorado. Trabaja en proyectos emocionantes, colabora con otros desarrolladores apasionados y construye el futuro mientras generas ingresos.
            </p>
          </div>
          {/* Para Expertos */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-accent/50 p-4 rounded-full">
                <PieChart className="w-12 h-12 text-accent-foreground" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-accent-foreground mb-4">Para Expertos</h3>
            <p className="text-muted-foreground">
              Tu experiencia tiene un impacto real. Comparte tu conocimiento para guiar proyectos que transforman empresas y ayuda a que las soluciones sean realmente efectivas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;