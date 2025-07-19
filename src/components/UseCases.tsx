import { Badge } from "@/components/ui/badge";

const UseCases = () => {
  return (
    <section id="casos-de-uso" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">
            Así es como te ayudamos día a día
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Mira cómo otros negocios como el tuyo están creciendo con nuestra ayuda.
          </p>
        </div>
        <div className="space-y-20">
          {/* Caso 1: Soporte al Cliente */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h3 className="font-heading text-2xl text-primary mb-4">
                Te ayudamos a cuidar mejor a tus clientes
              </h3>
              <p className="text-muted-foreground mb-6">
                Imagínate tener un asistente que responde a tus clientes las 24 horas, todos los días. Nuestro sistema de atención automática resuelve el 70% de las consultas frecuentes al instante, mientras tu equipo se enfoca en casos especiales y en construir relaciones que realmente importan.
              </p>
              <Badge variant="secondary" className="text-sm font-semibold">
                Atención al Cliente
              </Badge>
            </div>
            <div className="order-1 md:order-2">
              <div className="bg-primary/5 rounded-lg p-8 shadow-card">
                <div className="bg-primary text-primary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">Agente de Soporte IA</h4>
                  <p className="text-sm opacity-90">Respuesta automática 24/7</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Caso 2: Inteligencia Comercial */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-secondary/5 rounded-lg p-8 shadow-card">
                <div className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center">
                  <h4 className="font-heading text-xl mb-2">Generador de Leads IA</h4>
                  <p className="text-sm opacity-90">Calificación inteligente de prospectos</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-secondary mb-4">
                Te ayudamos a encontrar más clientes
              </h3>
              <p className="text-muted-foreground mb-6">
                ¿Qué tal si cada mañana recibieras una lista de clientes potenciales perfectos para tu negocio? Nuestros asistentes inteligentes investigan, analizan y califican prospectos automáticamente, para que tu equipo de ventas pueda enfocarse en cerrar ventas en lugar de buscar clientes.
              </p>
              <Badge variant="outline" className="text-sm font-semibold border-secondary text-secondary">
                Ventas y Marketing
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;