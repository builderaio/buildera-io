import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Marketplace = () => {
  const agents = [
    {
      title: "Agente de Soporte 24/7",
      description: "Responde preguntas frecuentes al instante.",
      category: "Atención al Cliente",
      categoryColor: "bg-blue-100 text-blue-800"
    },
    {
      title: "Analista Financiero", 
      description: "Genera reportes de flujo de caja y proyecciones.",
      category: "Finanzas",
      categoryColor: "bg-green-100 text-green-800"
    },
    {
      title: "Redactor de Contenidos",
      description: "Crea borradores para blog y redes sociales.",
      category: "Marketing", 
      categoryColor: "bg-purple-100 text-purple-800"
    }
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Marketplace de Agentes</h1>
        <p className="text-lg text-muted-foreground">
          Descubra e instale agentes de IA pre-construidos por la comunidad de Buildera.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h4 className="text-lg font-bold text-primary mb-2">{agent.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className={agent.categoryColor}>
                  {agent.category}
                </Badge>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Instalar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;