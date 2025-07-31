import { Brain, Database, TrendingUp } from "lucide-react";

const Ecosystem = () => {
  return (
    <section id="ecosistema" className="bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Cómo funciona tu equipo de especialistas
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Simple: nosotros montamos y operamos todas las áreas de tu empresa mientras tú te enfocas en lo que mejor sabes hacer. Tu único trabajo es producir.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Recolección */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <Database className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-primary mb-4">1. Analizamos tu Negocio</h3>
            <p className="text-muted-foreground">
              Estudiamos todo: tu empresa, competencia, mercado y oportunidades. Identificamos exactamente qué necesitas en cada área para crecer de forma inteligente.
            </p>
          </div>
          {/* Análisis */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-secondary/10 p-4 rounded-full">
                <Brain className="w-12 h-12 text-secondary" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-secondary mb-4">2. Montamos tu Equipo</h3>
            <p className="text-muted-foreground">
              Creamos especialistas en cada área que necesitas: marketing, ventas, finanzas, RRHH, legal, etc. Cada uno experto en su campo, trabajando 24/7 para tu empresa.
            </p>
          </div>
          {/* Recomendaciones */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-accent/50 p-4 rounded-full">
                <TrendingUp className="w-12 h-12 text-accent-foreground" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-accent-foreground mb-4">3. Operamos y Crecemos</h3>
            <p className="text-muted-foreground">
              Tu equipo ejecuta estrategias, optimiza procesos y hace crecer cada área. Tú solo produces y tomas decisiones finales. Nosotros operamos el resto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;