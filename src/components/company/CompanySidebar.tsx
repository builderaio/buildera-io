import { Activity, Building, Users, Settings, Bell, Calendar, Search, FolderOpen, GraduationCap, Store, MessageSquare } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ThemeSelector from "@/components/ThemeSelector";

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
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col p-4 fixed h-full">
      <div 
        className="flex items-center space-x-3 pb-6 border-b border-sidebar-border cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => window.location.href = '/company-dashboard'}
      >
        <div className="relative">
          <img 
            src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" 
            alt="Buildera Logo" 
            width="48" 
            height="48" 
            className="object-contain"
          />
        </div>
        <div>
          <span className="font-bold text-2xl tracking-tight text-sidebar-primary">BUILDERA</span>
          <p className="text-xs text-sidebar-foreground/70 mt-0.5">AI Business Platform</p>
        </div>
      </div>
      
      <nav className="mt-8 flex-1 overflow-y-auto">
        {menuItems.map((category) => (
          <div key={category.category} className="mb-6">
            <p className="px-3 text-xs font-bold uppercase text-sidebar-foreground/70 mb-2">
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
                          ? "bg-sidebar-accent text-sidebar-primary transform translate-x-1"
                          : isProfileIncomplete && item.id !== "adn-empresa"
                          ? "opacity-50 cursor-not-allowed text-sidebar-foreground/50"
                          : "hover:bg-sidebar-accent/80 hover:text-sidebar-primary hover:transform hover:translate-x-1"
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
      
      <div className="pt-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-sidebar-foreground/70 font-medium">Tema</span>
          <ThemeSelector />
        </div>
        
        <button
          onClick={() => handleMenuClick("configuracion")}
          disabled={isProfileIncomplete}
          className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 text-left mb-4 ${
            activeView === "configuracion"
              ? "bg-sidebar-accent text-sidebar-primary"
              : isProfileIncomplete
              ? "opacity-50 cursor-not-allowed text-sidebar-foreground/50"
              : "hover:bg-sidebar-accent/80"
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Administración
          {isProfileIncomplete && (
            <span className="ml-auto text-xs">🔒</span>
          )}
        </button>
        
        <div className="flex items-center">
          <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center text-sidebar-primary font-bold">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <div className="ml-3 flex-1">
            <p className="font-bold text-sm text-sidebar-primary">{profile?.full_name || "Usuario"}</p>
            <div className="flex space-x-2 text-xs">
              <button 
                onClick={() => setActiveView('profile')}
                className="text-sidebar-foreground/70 hover:text-sidebar-primary hover:underline"
              >
                Ver perfil
              </button>
              <span className="text-sidebar-foreground/50">•</span>
              <button 
                onClick={onSignOut}
                className="text-sidebar-foreground/70 hover:text-sidebar-primary hover:underline"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CompanySidebar;