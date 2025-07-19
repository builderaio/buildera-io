import { Brain, Database, TrendingUp } from "lucide-react";

const Ecosystem = () => {
  return (
    <section id="ecosistema" className="bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Tecnología híbrida que potencia resultados
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Combinamos SQL tradicional, vector stores y análisis semántico para darte insights que realmente impulsan el crecimiento.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Análisis Tradicional */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <Database className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-primary mb-4">Datos Estructurados</h3>
            <p className="text-muted-foreground">
              Procesamiento rápido de métricas, fechas y filtros tradicionales. Base sólida para analytics en tiempo real con SQL optimizado.
            </p>
          </div>
          {/* Análisis Semántico */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-secondary/10 p-4 rounded-full">
                <Brain className="w-12 h-12 text-secondary" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-secondary mb-4">IA Semántica</h3>
            <p className="text-muted-foreground">
              Vector stores con embeddings de OpenAI para análisis profundo de contenido, clustering automático y búsqueda por similitud.
            </p>
          </div>
          {/* Recomendaciones */}
          <div className="bg-background p-8 rounded-lg shadow-card text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-accent/50 p-4 rounded-full">
                <TrendingUp className="w-12 h-12 text-accent-foreground" />
              </div>
            </div>
            <h3 className="font-heading text-2xl text-accent-foreground mb-4">Insights Ejecutables</h3>
            <p className="text-muted-foreground">
              Recomendaciones con scores de confianza basadas en análisis de patrones, tendencias y rendimiento histórico.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;