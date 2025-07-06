import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AcademiaBuildera = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Academia Buildera</h1>
        <p className="text-lg text-muted-foreground">
          Capacite a su equipo con conocimiento de vanguardia para impulsar el crecimiento.
        </p>
      </header>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">Ruta de Aprendizaje Recomendada</h2>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Fundamentos de la Automatización con IA</h3>
                <p className="text-sm text-muted-foreground">
                  Un curso esencial para que todo su equipo entienda el potencial de la IA.
                </p>
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 ml-4">
                Comenzar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">Catálogo de Cursos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-32 bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">Curso</span>
              </div>
              <CardContent className="p-4">
                <h4 className="font-bold text-md mb-1">Estrategias de Marketing Digital con IA</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Aprenda a usar agentes para optimizar campañas.
                </p>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full" style={{width: "45%"}}></div>
                </div>
                <p className="text-xs text-right">45% completado</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-32 bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold">Curso</span>
              </div>
              <CardContent className="p-4">
                <h4 className="font-bold text-md mb-1">Optimización de la Experiencia del Cliente</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Diseñe flujos de soporte automatizados y efectivos.
                </p>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full" style={{width: "0%"}}></div>
                </div>
                <p className="text-xs text-right">0% completado</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademiaBuildera;