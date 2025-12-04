import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { 
  Shield, 
  LogOut,
  Home,
  Users, 
  Activity,
  BarChart3,
  Database,
  Trophy,
  Settings,
  Brain,
  Eye,
  Mail,
  Building2,
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
        { icon: Building2, label: "Empresas", path: "/admin/companies" },
        { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
      ]
    },
    {
      group: "Agentes",
      items: [
        { icon: Brain, label: "Constructor de Agentes", path: "/admin/agent-builder" },
      ]
    },
    {
      group: "Sistema",
      items: [
        { icon: Database, label: "Base de Datos", path: "/admin/database" },
        { icon: Mail, label: "Sistema de Email", path: "/admin/email-system" },
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) {
    return null;
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Portal Admin</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Buildera</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {navigationItems.map((group, groupIndex) => (
              <SidebarGroup key={groupIndex}>
                <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      
                      return (
                        <SidebarMenuItem key={itemIndex}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            onClick={() => navigate(item.path)}
                          >
                            <div className="flex items-center gap-2 cursor-pointer">
                              <Icon className="size-4" />
                              <span>{item.label}</span>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          
          <SidebarFooter>
            <div className="p-2 space-y-2">
              <div className="flex items-center gap-3 p-2">
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
                  className="flex-1 gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Portal Administrativo</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;