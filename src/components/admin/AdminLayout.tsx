import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Shield, 
  LogOut,
  Home,
  Users, 
  Key,
  Activity,
  BarChart3,
  Database,
  Trophy,
  Settings,
  Brain,
  Eye,
  Menu
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ThemeSelector from '@/components/ThemeSelector';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Ha salido del portal admin exitosamente",
    });
    navigate('/admin/login');
  };

  const navigationItems = [
    {
      group: "Principal",
      items: [
        { icon: Home, label: "Dashboard", path: "/admin/dashboard" },
        { icon: Users, label: "Usuarios", path: "/admin/users" },
        { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
      ]
    },
    {
      group: "Inteligencia Artificial",
      items: [
        { icon: Brain, label: "Configuración de IA", path: "/admin/ai-config" },
        { icon: Settings, label: "Configuración de funciones", path: "/admin/function-config" },
        { icon: Activity, label: "Monitoreo de IA", path: "/admin/ai-monitoring" },
        { icon: Trophy, label: "Champion Challenge", path: "/admin/champion-challenge" },
      ]
    },
    {
      group: "Agentes",
      items: [
        { icon: Brain, label: "Plantillas de Agentes", path: "/admin/agent-templates" },
      ]
    },
    {
      group: "Sistema",
      items: [
        { icon: Database, label: "Base de Datos", path: "/admin/database" },
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) {
    return null;
  }

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-foreground">Portal Admin</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Buildera</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto">
        {navigationItems.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Button
                    key={itemIndex}
                    variant={active ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 text-left text-sm sm:text-base transition-smooth ${
                      active 
                        ? "bg-secondary text-secondary-foreground shadow-sm" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setSidebarOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                );
              })}
            </div>
            {groupIndex < navigationItems.length - 1 && (
              <Separator className="mt-4" />
            )}
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 sm:p-4 border-t bg-muted/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.username || 'Admin'}
            </p>
            <Badge variant="secondary" className="text-xs">
              {user?.role || 'Administrador'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex-1 gap-2 transition-smooth text-xs sm:text-sm"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <div className="flex flex-col h-full">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="font-bold text-sm text-foreground">Portal Admin</h1>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-64 bg-card border-r flex flex-col">
          <SidebarContent />
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobile ? 'pt-16' : ''}`}>
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default AdminLayout;