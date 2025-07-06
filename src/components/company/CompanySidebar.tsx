import { Activity, Building, Users, Settings, Bell, Calendar, Search, FolderOpen, GraduationCap, Store, MessageSquare } from "lucide-react";

interface CompanySidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  profile: any;
  onSignOut: () => void;
}

const CompanySidebar = ({ activeView, setActiveView, profile, onSignOut }: CompanySidebarProps) => {
  // Verificar si la información de la empresa está completa
  const isProfileIncomplete = !profile?.company_name || 
                               profile.company_name === 'Mi Empresa' ||
                               !profile?.company_size ||
                               !profile?.industry_sector ||
                               !profile?.full_name;

  const handleMenuClick = (viewId: string) => {
    if (isProfileIncomplete && viewId !== "adn-empresa") {
      // No permitir acceso a otras secciones si la información está incompleta
      return;
    }
    setActiveView(viewId);
  };
  const menuItems = [
    {
      category: "General",
      items: [
        { id: "mando-central", label: "Mando Central", icon: Activity },
        { id: "adn-empresa", label: "ADN de la Empresa", icon: Building },
      ]
    },
    {
      category: "Operaciones", 
      items: [
        { id: "marketing-hub", label: "Marketing Hub", icon: Bell },
        { id: "inteligencia-competitiva", label: "Inteligencia Competitiva", icon: Search },
      ]
    },
    {
      category: "Recursos",
      items: [
        { id: "base-conocimiento", label: "Base de Conocimiento", icon: FolderOpen },
        { id: "academia-buildera", label: "Academia Buildera", icon: GraduationCap },
        { id: "marketplace", label: "Marketplace", icon: Store },
        { id: "expertos", label: "Conectar Expertos", icon: Users },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-primary text-primary-foreground flex flex-col p-4 fixed h-full">
      <div className="flex items-center space-x-3 pb-6 border-b border-primary/20">
        <div className="relative">
          <svg width="48" height="48" viewBox="0 0 48 48" className="text-primary-foreground">
            {/* Base hexagonal */}
            <path 
              fill="currentColor" 
              d="M24 4L36.66 12V28L24 36L11.34 28V12L24 4Z" 
              opacity="0.2"
            />
            {/* Elementos de construcción */}
            <path 
              fill="currentColor" 
              d="M16 16h4v4h-4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
            />
            <path 
              fill="currentColor" 
              d="M16 22h4v4h-4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
            />
            <path 
              fill="currentColor" 
              d="M19 28h10v4h-10v-4z"
            />
            {/* Acento tecnológico */}
            <circle 
              cx="24" 
              cy="24" 
              r="2" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
            />
            <path 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1" 
              d="M24 22v-2m0 8v-2m2-2h2m-8 0h2"
            />
          </svg>
        </div>
        <div>
          <span className="font-bold text-2xl tracking-tight">BUILDERA</span>
          <p className="text-xs text-primary-foreground/70 mt-0.5">AI Business Platform</p>
        </div>
      </div>
      
      <nav className="mt-8 flex-1 overflow-y-auto">
        {menuItems.map((category) => (
          <div key={category.category} className="mb-6">
            <p className="px-3 text-xs font-bold uppercase text-primary-foreground/70 mb-2">
              {category.category}
            </p>
            <ul className="space-y-2">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      disabled={isProfileIncomplete && item.id !== "adn-empresa"}
                      className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 text-left ${
                        activeView === item.id
                          ? "bg-primary-foreground/20 text-primary-foreground transform translate-x-1"
                          : isProfileIncomplete && item.id !== "adn-empresa"
                          ? "opacity-50 cursor-not-allowed text-primary-foreground/50"
                          : "hover:bg-primary-foreground/10 hover:text-primary-foreground hover:transform hover:translate-x-1"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                      {isProfileIncomplete && item.id !== "adn-empresa" && (
                        <span className="ml-auto text-xs">🔒</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      
      <div className="pt-4 mt-auto border-t border-primary/20">
        <button
          onClick={() => handleMenuClick("configuracion")}
          disabled={isProfileIncomplete}
          className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 text-left mb-4 ${
            activeView === "configuracion"
              ? "bg-primary-foreground/20 text-primary-foreground"
              : isProfileIncomplete
              ? "opacity-50 cursor-not-allowed text-primary-foreground/50"
              : "hover:bg-primary-foreground/10"
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Administración
          {isProfileIncomplete && (
            <span className="ml-auto text-xs">🔒</span>
          )}
        </button>
        
        <div className="flex items-center">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold">
            {profile?.company_name?.charAt(0) || "E"}
          </div>
          <div className="ml-3 flex-1">
            <p className="font-bold text-sm">{profile?.company_name || "Empresa"}</p>
            <button 
              onClick={onSignOut}
              className="text-xs text-primary-foreground/70 hover:text-primary-foreground hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CompanySidebar;