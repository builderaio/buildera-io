import { Activity, Building, Users, Settings, Bell, Calendar, Search, FolderOpen, GraduationCap, Store, MessageSquare, User, Menu, X, Bot } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ThemeSelector from "@/components/ThemeSelector";

interface CompanySidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  profile: any;
  onSignOut: () => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const CompanySidebar = ({ activeView, setActiveView, profile, onSignOut, isMobileMenuOpen = false, setIsMobileMenuOpen }: CompanySidebarProps) => {
  // Verificar si la información del negocio está completa
  const isProfileIncomplete = !profile?.company_name || 
                               profile.company_name === 'Mi Negocio' ||
                               !profile?.company_size ||
                               !profile?.industry_sector ||
                               !profile?.full_name;

  const handleMenuClick = (viewId: string) => {
    if (isProfileIncomplete && viewId !== "adn-empresa") {
      // No permitir acceso a otras secciones si la información está incompleta
      return;
    }
    setActiveView(viewId);
    // Cerrar menú móvil al seleccionar una opción
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };
  const menuItems = [
    {
      category: "General",
      items: [
        { id: "mando-central", label: "Mando Central", icon: Activity },
        { id: "adn-empresa", label: "Mi Negocio", icon: Building },
        { id: "base-conocimiento", label: "Mi Información", icon: User },
      ]
    },
    {
      category: "Agentes IA", 
      items: [
        { id: "mis-agentes", label: "Mis Agentes", icon: Bot },
        { id: "marketplace", label: "Marketplace", icon: Store },
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
        { id: "academia-buildera", label: "Academia Buildera", icon: GraduationCap },
        { id: "expertos", label: "Conectar Expertos", icon: Users },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground flex flex-col p-4 z-50 transition-transform duration-300 ease-in-out
        w-72 md:w-64
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen?.(false)}
          className="absolute top-4 right-4 md:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div 
          className="flex items-center space-x-3 pb-6 border-b border-sidebar-border cursor-pointer hover:opacity-80 transition-all duration-300 group"
          onClick={() => window.location.href = '/company-dashboard'}
        >
          <div className="relative">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <img 
                src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" 
                alt="Buildera Logo" 
                width="28" 
                height="28" 
                className="md:w-8 md:h-8 object-contain filter brightness-0 invert"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl md:text-2xl tracking-wider text-sidebar-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BUILDERA
            </span>
            <p className="text-[9px] md:text-[10px] font-medium text-sidebar-foreground/60 tracking-widest uppercase mt-0.5 leading-none">
              AI Business Platform
            </p>
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
    </>
  );
};

export default CompanySidebar;