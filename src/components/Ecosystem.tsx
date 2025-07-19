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
            En Buildera creemos que la mejor tecnología es la que no necesitas entender para usarla. ERA maneja toda la complejidad por ti, para que te enfoques en lo que realmente importa: hacer crecer tu negocio.
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
              Tu asistente conecta todas tus redes sociales y reúne todo tu contenido en un solo lugar. No importa cuánto hayas publicado, ERA lo revisa todo en minutos.
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
              Con inteligencia artificial avanzada, ERA identifica patrones que tú no podrías ver. Entiende qué temas, formatos y momentos funcionan mejor para tu audiencia.
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
              Basándose en tu historial de éxito, ERA te dice exactamente qué hacer: qué contenido crear, cuándo publicarlo y cómo optimizarlo para mejores resultados.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;