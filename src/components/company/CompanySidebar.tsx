import { Activity, Building, Users, Settings, Bell, Calendar, Search, FolderOpen, GraduationCap, Store, MessageSquare } from "lucide-react";

interface CompanySidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  profile: any;
  onSignOut: () => void;
}

const CompanySidebar = ({ activeView, setActiveView, profile, onSignOut }: CompanySidebarProps) => {
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
      <div className="flex items-center space-x-2 pb-4 border-b border-primary/20">
        <svg width="40" height="40" viewBox="0 0 100 100">
          <path fill="currentColor" d="M10,90 L10,70 L30,70 L30,50 L50,50 L50,30 L70,30 L70,50 L90,50 L90,70 L70,70 L70,90 L50,90 L50,70 L30,70 L30,90 L10,90 Z M30,10 L50,10 L50,30 L30,30 L30,10 Z"/>
        </svg>
        <span className="font-bold text-2xl">BUILDERA</span>
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
                      onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 text-left ${
                        activeView === item.id
                          ? "bg-primary-foreground/20 text-primary-foreground transform translate-x-1"
                          : "hover:bg-primary-foreground/10 hover:text-primary-foreground hover:transform hover:translate-x-1"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
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
          onClick={() => setActiveView("configuracion")}
          className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 text-left mb-4 ${
            activeView === "configuracion"
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "hover:bg-primary-foreground/10"
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Administración
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