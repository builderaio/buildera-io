import { Activity, Clock, Users, Zap, Store, UserCheck, Bot, TrendingUp, Sparkles, Target, ArrowRight } from "lucide-react";

interface MandoCentralProps {
  profile: any;
  onNavigate?: (view: string) => void;
}

const MandoCentral = ({ profile, onNavigate }: MandoCentralProps) => {
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
          ¡Bienvenido, {profile?.company_name || "Empresa"}! Desde aquí puedes ver todo lo que está pasando en tu negocio y tomar las mejores decisiones para crecer.
        </p>
      </header>

      {/* KPIs Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">Cómo va tu negocio</h2>
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

      {/* Próxima Mejora Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">🚀 Te ayudamos a crecer aún más</h2>
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-6 rounded-lg shadow-sm border border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Vamos a acelerar el crecimiento de tu empresa
              </h3>
              <p className="text-muted-foreground">
                Hemos analizado tu uso actual y encontramos oportunidades perfectas para que crezcas más rápido y con menos esfuerzo.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-primary/20 p-4 rounded-full">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* CTA 1: Conectar más redes sociales */}
            <div 
              className="bg-card p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-transparent hover:border-primary/20"
              onClick={() => onNavigate?.('marketing-hub')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Marketing Automático</h4>
                  <p className="text-sm text-muted-foreground">+40% engagement</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Conecte LinkedIn, Instagram y TikTok para contenido automatizado multiplataforma
              </p>
              <div className="flex items-center text-primary group-hover:text-accent transition-colors">
                <span className="text-sm font-medium">Conectar ahora</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CTA 2: Generar contenido con IA */}
            <div 
              className="bg-card p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-transparent hover:border-secondary/20"
              onClick={() => onNavigate?.('adn-empresa')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-foreground group-hover:text-secondary transition-colors">Contenido IA</h4>
                  <p className="text-sm text-muted-foreground">-70% tiempo</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Genere posts, emails y campañas personalizadas usando IA avanzada
              </p>
              <div className="flex items-center text-secondary group-hover:text-accent transition-colors">
                <span className="text-sm font-medium">Activar IA</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CTA 3: Analytics avanzados */}
            <div 
              className="bg-card p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-transparent hover:border-accent/20"
              onClick={() => onNavigate?.('inteligencia-competitiva')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-foreground group-hover:text-accent-foreground transition-colors">Analytics Pro</h4>
                  <p className="text-sm text-muted-foreground">+150% ROI</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Insights predictivos y optimización automática de sus campañas
              </p>
              <div className="flex items-center text-accent-foreground group-hover:text-primary transition-colors">
                <span className="text-sm font-medium">Ver insights</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary/20 p-2 rounded-lg mr-3">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary">Impulso Empresarial Completo</p>
                  <p className="text-sm text-muted-foreground">
                    Implemente las 3 mejoras y aumente su eficiencia operativa en un 85%
                  </p>
                </div>
              </div>
              <button 
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                onClick={() => onNavigate?.('marketing-hub')}
              >
                Comenzar Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">Herramientas que te van a encantar</h2>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Descubre asistentes inteligentes especializados para cada área de tu empresa.
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
        <h2 className="text-2xl font-bold text-primary mb-4">Ideas para hacer crecer tu empresa</h2>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">
              Oportunidades y recomendaciones personalizadas que hemos preparado para ti.
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