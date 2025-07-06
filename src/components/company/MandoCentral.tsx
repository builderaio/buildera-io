import { Activity, Clock, Users, Zap } from "lucide-react";

interface MandoCentralProps {
  profile: any;
}

const MandoCentral = ({ profile }: MandoCentralProps) => {
  const kpis = [
    {
      title: "Tareas Automatizadas",
      value: "12,450",
      change: "+15% vs mes anterior",
      trend: "up",
      icon: Activity,
      color: "bg-blue-100 text-primary"
    },
    {
      title: "Horas Ahorradas", 
      value: "320",
      suffix: "h/mes",
      change: "+25 horas vs mes anterior",
      trend: "up",
      icon: Clock,
      color: "bg-orange-100 text-accent"
    },
    {
      title: "Leads Calificados",
      value: "89",
      change: "Esta semana",
      trend: "neutral",
      icon: Users,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Eficiencia Operativa",
      value: "98.5%",
      change: "-0.2% vs mes anterior",
      trend: "down",
      icon: Zap,
      color: "bg-purple-100 text-purple-600"
    }
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Mando Central</h1>
        <p className="text-lg text-muted-foreground">
          Bienvenido, {profile?.company_name || "Empresa"}. Desde aquí puede construir, monitorear y escalar su operación.
        </p>
      </header>

      {/* KPIs Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">El Pulso de su Negocio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow card-hover">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${kpi.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="ml-3 text-muted-foreground font-semibold">{kpi.title}</p>
                </div>
                <p className="text-4xl font-bold mt-4">
                  {kpi.value}
                  {kpi.suffix && <span className="text-2xl text-muted-foreground ml-1">{kpi.suffix}</span>}
                </p>
                <p className={`text-sm flex items-center mt-1 ${
                  kpi.trend === "up" ? "text-green-500" : 
                  kpi.trend === "down" ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {kpi.trend === "up" && "↗ "}
                  {kpi.trend === "down" && "↘ "}
                  {kpi.change}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Insights Section */}
      <section>
        <h2 className="text-2xl font-bold text-primary mb-4">Insights de su Negocio</h2>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">
              Oportunidades y recomendaciones generadas por nuestros agentes de IA.
            </p>
            <button className="flex items-center text-primary hover:text-accent transition-colors">
              <Zap className="w-5 h-5 mr-2" />
              <span>Generar nuevos insights</span>
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border-l-4 border-primary">
              <p className="font-bold text-primary">Oportunidad de Contenido</p>
              <p className="text-sm text-muted-foreground mt-1">
                El 25% de las búsquedas en su sitio se relacionan con "políticas de garantía". 
                Considere crear un Agente FAQ o una página dedicada para reducir consultas de soporte.
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border-l-4 border-accent">
              <p className="font-bold text-accent">Optimización de Ventas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hemos detectado que los clientes que compran el Producto A, a menudo compran el Producto B dos semanas después. 
                Sugerimos un Agente de Email Marketing para una campaña de cross-selling.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MandoCentral;