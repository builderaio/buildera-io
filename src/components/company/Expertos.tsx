import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Expertos = () => {
  const experts = [
    {
      name: "Laura Gómez",
      specialty: "Especialista en Optimización de Cadenas de Suministro",
      initials: "LG"
    },
    {
      name: "Carlos Mendoza", 
      specialty: "Experto en Estrategias de Marketing Digital para E-commerce",
      initials: "CM"
    }
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Conectar con Expertos</h1>
        <p className="text-lg text-muted-foreground">
          Acceda a conocimiento estratégico para guiar su crecimiento.
        </p>
      </header>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {experts.map((expert, index) => (
              <div key={index} className="border border-border rounded-lg p-4 flex items-center hover:shadow-md transition-shadow">
                <Avatar className="w-15 h-15">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {expert.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-1">
                  <h4 className="font-bold">{expert.name}</h4>
                  <p className="text-sm text-muted-foreground">{expert.specialty}</p>
                </div>
                <Button variant="outline" className="ml-4">
                  Contactar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Expertos;