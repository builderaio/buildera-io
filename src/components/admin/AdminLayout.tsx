import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Eye
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import ThemeSelector from '@/components/ThemeSelector';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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
        { icon: Key, label: "API Keys", path: "/admin/api-keys" },
        { icon: Brain, label: "Configuración IA", path: "/admin/ai-config" },
        { icon: Activity, label: "Monitoreo IA", path: "/admin/ai-monitoring" },
        { icon: Trophy, label: "Champion Challenge", path: "/admin/champion-challenge" },
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Portal Admin</h1>
              <p className="text-sm text-muted-foreground">Buildera</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
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
                      className={`w-full justify-start gap-3 text-left transition-smooth ${
                        active 
                          ? "bg-secondary text-secondary-foreground shadow-sm" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={() => navigate(item.path)}
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
        <div className="p-4 border-t bg-muted/50">
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
              className="flex-1 gap-2 transition-smooth"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default AdminLayout;