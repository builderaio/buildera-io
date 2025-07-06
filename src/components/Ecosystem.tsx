import { Building2, Code, PieChart } from "lucide-react";

const Ecosystem = () => {
  return (
    <section id="ecosistema" className="bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Un Ecosistema para Construir el Futuro
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Conectamos a las tres fuerzas de la transformación digital en un círculo virtuoso de innovación y crecimiento.
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
              Su acelerador de innovación. Acceda a soluciones de IA a medida, implementadas en tiempo récord para obtener una ventaja competitiva real y sostenible.
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
              Construya el futuro, hoy. Acceda a proyectos relevantes, colabore con una comunidad de élite y monetice sus habilidades creando agentes de IA.
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
              Su plataforma de influencia. Aplique su conocimiento de industria para guiar proyectos de alto impacto y asegurar que las soluciones sean estratégicamente brillantes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;