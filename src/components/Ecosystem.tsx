import { Brain, Database, TrendingUp } from "lucide-react";

const Ecosystem = () => {
  return (
    <section id="ecosistema" className="bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Buildera: donde la inteligencia artificial se vuelve simple
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            En Buildera creemos que cada negocio necesita un equipo completo y actualizado. ERA crea asistentes especializados, investiga tu competencia y trae información externa relevante. Todo funciona junto para acelerar tu crecimiento sin complicaciones.
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
            <h3 className="font-heading text-2xl text-primary mb-4">ERA Recolecta</h3>
            <p className="text-muted-foreground">
              Tu asistente reúne información de todas las fuentes: tus redes sociales, datos de competencia, tendencias del mercado y fuentes externas relevantes. Todo en un solo lugar para entender tu negocio completamente.
            </p>
          </div>
          {/* Análisis */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-secondary/10 p-4 rounded-full">
                <Brain className="w-12 h-12 text-secondary" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-secondary mb-4">ERA Entiende</h3>
            <p className="text-muted-foreground">
              Con inteligencia artificial avanzada, ERA crea asistentes especializados para cada área: marketing, finanzas, recursos humanos, legal y más. Cada uno entiende las necesidades específicas de su función.
            </p>
          </div>
          {/* Recomendaciones */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-accent/50 p-4 rounded-full">
                <TrendingUp className="w-12 h-12 text-accent-foreground" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-accent-foreground mb-4">ERA Recomienda</h3>
            <p className="text-muted-foreground">
              Combinando información interna, análisis de competencia y datos externos, cada asistente especializado te da recomendaciones precisas para acelerar su área específica y el crecimiento general del negocio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;