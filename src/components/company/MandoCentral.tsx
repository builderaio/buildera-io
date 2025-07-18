import { Activity, Clock, Users, Zap, Store, UserCheck, Bot } from "lucide-react";

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
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Horas Ahorradas", 
      value: "320",
      suffix: "h/mes",
      change: "+25 horas vs mes anterior",
      trend: "up",
      icon: Clock,
      color: "bg-secondary/10 text-secondary"
    },
    {
      title: "Leads Calificados",
      value: "89",
      change: "Esta semana",
      trend: "neutral",
      icon: Users,
      color: "bg-accent/20 text-accent-foreground"
    },
    {
      title: "Eficiencia Operativa",
      value: "98.5%",
      change: "-0.2% vs mes anterior",
      trend: "down",
      icon: Zap,
      color: "bg-muted text-muted-foreground"
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

      {/* Marketplace Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">Marketplace de Agentes IA</h2>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Descubra agentes de IA especializados para cada área de su empresa.
            </p>
            <button className="flex items-center text-primary hover:text-accent transition-colors">
              <Store className="w-5 h-5 mr-2" />
              <span>Ver Marketplace Completo</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Bot className="w-5 h-5 text-primary mr-2" />
                <h3 className="font-semibold text-primary">Agentes Activos</h3>
              </div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">En funcionamiento</p>
            </div>
            <div className="bg-secondary/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Store className="w-5 h-5 text-secondary mr-2" />
                <h3 className="font-semibold text-secondary">Disponibles</h3>
              </div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">Agentes para instalar</p>
            </div>
            <div className="bg-accent/20 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <UserCheck className="w-5 h-5 text-accent-foreground mr-2" />
                <h3 className="font-semibold text-accent-foreground">Roles Cubiertos</h3>
              </div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Departamentos</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Roles Empresariales Soportados</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { role: "CEO/Dirección", agents: 3, color: "bg-red-100 text-red-800" },
                { role: "Marketing", agents: 5, color: "bg-purple-100 text-purple-800" },
                { role: "Ventas", agents: 4, color: "bg-blue-100 text-blue-800" },
                { role: "Finanzas", agents: 3, color: "bg-green-100 text-green-800" },
                { role: "RRHH", agents: 3, color: "bg-yellow-100 text-yellow-800" },
                { role: "Operaciones", agents: 4, color: "bg-orange-100 text-orange-800" },
                { role: "IT/Desarrollo", agents: 3, color: "bg-cyan-100 text-cyan-800" },
                { role: "Atención Cliente", agents: 5, color: "bg-pink-100 text-pink-800" }
              ].map((item, index) => (
                <div key={index} className="bg-muted p-3 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 ${item.color}`}>
                    {item.role}
                  </div>
                  <p className="text-sm font-semibold">{item.agents} agentes</p>
                </div>
              ))}
            </div>
          </div>
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
            <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
              <p className="font-bold text-primary">Oportunidad de Contenido</p>
              <p className="text-sm text-muted-foreground mt-1">
                El 25% de las búsquedas en su sitio se relacionan con "políticas de garantía". 
                Considere crear un Agente FAQ o una página dedicada para reducir consultas de soporte.
              </p>
            </div>
            <div className="bg-secondary/5 p-4 rounded-lg border-l-4 border-secondary">
              <p className="font-bold text-secondary">Optimización de Ventas</p>
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