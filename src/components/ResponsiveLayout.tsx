import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Building, Bot, Store, Bell, Search, GraduationCap, Users, Settings, User, LogOut, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import ThemeSelector from '@/components/ThemeSelector';
import { SmartNotifications } from '@/components/ui/smart-notifications';
import { useIsMobile } from '@/hooks/use-mobile';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  user_type: 'company' | 'developer' | 'expert';
  avatar_url?: string;
  company_name?: string;
  company_size?: string;
  industry_sector?: string;
}

const ResponsiveLayout = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  useAutoLogout();

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      await supabase.auth.signOut({ scope: 'global' });
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });

      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/auth';
    }
  };

  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes('/agents')) return 'mis-agentes';
    if (path.includes('/marketplace')) return 'marketplace';
    if (path.includes('/profile')) return 'perfil';
    if (path.includes('/adn-empresa')) return 'adn-empresa';
    if (path.includes('/base-conocimiento')) return 'base-conocimiento';
    if (path.includes('/marketing-hub')) return 'marketing-hub';
    if (path.includes('/inteligencia-competitiva')) return 'inteligencia-competitiva';
    if (path.includes('/academia-buildera')) return 'academia-buildera';
    if (path.includes('/expertos')) return 'expertos';
    if (path.includes('/configuracion')) return 'configuracion';
    return 'mando-central';
  };

  const setActiveView = (view: string) => {
    const routes: Record<string, string> = {
      'mando-central': '/company-dashboard',
      'adn-empresa': '/company-dashboard/adn-empresa',
      'base-conocimiento': '/company-dashboard/base-conocimiento',
      'mis-agentes': '/company/agents',
      'marketplace': '/marketplace/agents',
      'marketing-hub': '/company-dashboard/marketing-hub',
      'inteligencia-competitiva': '/company-dashboard/inteligencia-competitiva',
      'academia-buildera': '/company-dashboard/academia-buildera',
      'expertos': '/company-dashboard/expertos',
      'configuracion': '/company-dashboard/configuracion',
      'perfil': '/profile',
    };
    
    if (routes[view]) {
      navigate(routes[view]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Layout simplificado para desarrolladores y expertos
  if (profile.user_type !== 'company') {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-foreground">Buildera</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <ThemeSelector />
                <SmartNotifications />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                        <AvatarFallback>
                          {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg z-50" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    );
  }

  // Layout con sidebar para empresas
  return (
    <SidebarProvider>
      <CompanyLayout profile={profile} handleSignOut={handleSignOut} />
    </SidebarProvider>
  );
};

const CompanyLayout = ({ profile, handleSignOut }: { profile: Profile; handleSignOut: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  
  const isProfileIncomplete = !profile?.company_name || 
                               profile.company_name === 'Mi Negocio' ||
                               !profile?.company_size ||
                               !profile?.industry_sector ||
                               !profile?.full_name;

  const getActiveView = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    
    // Prioridad al parámetro view en la URL
    if (viewParam) return viewParam;
    
    // Rutas específicas
    if (path.includes('/agents')) return 'mis-agentes';
    if (path.includes('/marketplace')) return 'marketplace';
    if (path.includes('/profile')) return 'profile';
    
    // Por defecto mando central si estamos en company-dashboard
    if (path.includes('/company-dashboard')) return 'mando-central';
    
    return 'mando-central';
  };

  const setActiveView = (view: string) => {
    if (isProfileIncomplete && view !== "adn-empresa") {
      return;
    }
    
    const routes: Record<string, string> = {
      'mando-central': '/company-dashboard',
      'adn-empresa': '/company-dashboard?view=adn-empresa', 
      'base-conocimiento': '/company-dashboard?view=base-conocimiento',
      'mis-agentes': '/company/agents',
      'marketplace': '/marketplace/agents', 
      'marketing-hub': '/company-dashboard?view=marketing-hub',
      'inteligencia-competitiva': '/company-dashboard?view=inteligencia-competitiva',
      'academia-buildera': '/company-dashboard?view=academia-buildera',
      'expertos': '/company-dashboard?view=expertos',
      'configuracion': '/company-dashboard?view=configuracion',
      'profile': '/profile',
    };
    
    if (routes[view]) {
      navigate(routes[view]);
      
      // Cerrar sidebar en móvil después de navegar
      if (isMobile) {
        setTimeout(() => {
          setOpenMobile(false);
        }, 100);
      }
    }
  };

  // Arquitectura de información reorganizada con mejor jerarquía
  const sidebarMenuItems = [
    {
      category: "Central", 
      icon: "🎯",
      items: [
        { 
          id: "mando-central", 
          label: "Dashboard", 
          icon: Activity, 
          description: "Vista general y KPIs",
          priority: "high"
        },
      ]
    },
    {
      category: "Mi Empresa",
      icon: "🏢", 
      items: [
        { 
          id: "adn-empresa", 
          label: "Información Empresarial", 
          icon: Building, 
          description: "Datos y configuración",
          priority: "high"
        },
        { 
          id: "base-conocimiento", 
          label: "Base de Conocimiento", 
          icon: User, 
          description: "Gestión de información",
          priority: "medium"
        },
      ]
    },
    {
      category: "Marketing & Ventas",
      icon: "📈", 
      items: [
        { 
          id: "marketing-hub", 
          label: "Marketing Hub", 
          icon: Bell, 
          description: "Campañas y automatización",
          priority: "high"
        },
        { 
          id: "inteligencia-competitiva", 
          label: "Análisis Competitivo", 
          icon: Search, 
          description: "Inteligencia de mercado",
          priority: "medium"
        },
      ]
    },
    {
      category: "Agentes IA",
      icon: "🤖", 
      items: [
        { 
          id: "mis-agentes", 
          label: "Mis Agentes", 
          icon: Bot, 
          description: "Gestionar agentes creados",
          priority: "medium"
        },
        { 
          id: "marketplace", 
          label: "Marketplace", 
          icon: Store, 
          description: "Descubrir nuevos agentes",
          priority: "medium"
        },
      ]
    },
    {
      category: "Aprendizaje",
      icon: "🎓",
      items: [
        { 
          id: "academia-buildera", 
          label: "Academia Buildera", 
          icon: GraduationCap, 
          description: "Cursos y certificaciones",
          priority: "low"
        },
        { 
          id: "expertos", 
          label: "Red de Expertos", 
          icon: Users, 
          description: "Conectar con especialistas",
          priority: "low"
        },
      ]
    }
  ];

  const activeView = getActiveView();
  
  console.log('Current activeView:', activeView);
  console.log('Current URL:', location.pathname + location.search);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar variant="sidebar" collapsible="icon" className="w-80 data-[state=collapsed]:w-16 border-r border-sidebar-border bg-sidebar shadow-xl z-40">
        {/* Header mejorado - oculto cuando está colapsado */}
        <SidebarHeader className="p-6 border-b border-sidebar-border/50 bg-gradient-to-r from-sidebar to-sidebar/95 data-[state=collapsed]:hidden">
          <div 
            className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-all duration-300 group"
            onClick={() => setActiveView('mando-central')}
          >
            <div className="flex aspect-square size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <img 
                src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" 
                alt="Buildera Logo" 
                className="size-7 object-contain filter brightness-0 invert"
              />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="font-heading font-bold text-xl tracking-tight text-sidebar-foreground">
                BUILDERA
              </span>
              <span className="text-xs font-medium text-sidebar-muted-foreground tracking-wide uppercase opacity-80">
                AI Business Platform
              </span>
            </div>
          </div>
        </SidebarHeader>

        {/* Logo colapsado - solo visible cuando está colapsado */}
        <div className="hidden data-[state=collapsed]:flex items-center justify-center p-4 border-b border-sidebar-border/30">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-lg">
            <img 
              src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" 
              alt="Buildera Logo" 
              className="size-5 object-contain filter brightness-0 invert"
            />
          </div>
        </div>
          
        {/* Contenido del sidebar mejorado */}
        <SidebarContent className="px-4 py-6 space-y-6 data-[state=collapsed]:px-2 data-[state=collapsed]:space-y-3">
          {sidebarMenuItems.map((category, categoryIndex) => (
            <SidebarGroup key={category.category} className="space-y-3 data-[state=collapsed]:space-y-2">
              <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold uppercase text-sidebar-muted-foreground tracking-wider flex items-center gap-2 border-b border-sidebar-border/30 pb-2 data-[state=collapsed]:hidden">
                <span className="text-sm">{category.icon}</span>
                {category.category}
              </SidebarGroupLabel>
              
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2 data-[state=collapsed]:space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const isDisabled = isProfileIncomplete && item.id !== "adn-empresa";
                    const priorityColors = {
                      high: isActive ? '' : 'hover:bg-primary/5',
                      medium: isActive ? '' : 'hover:bg-sidebar-accent/30',
                      low: isActive ? '' : 'hover:bg-sidebar/80'
                    };
                    
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          disabled={isDisabled}
                          className={`
                            relative group transition-all duration-300 rounded-xl p-4 font-medium text-sm data-[state=collapsed]:p-3
                            ${isActive 
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg border border-sidebar-accent/20 scale-[1.02]" 
                              : isDisabled
                              ? "opacity-40 cursor-not-allowed text-sidebar-muted-foreground"
                              : `text-sidebar-foreground ${priorityColors[item.priority]} hover:scale-[1.01] hover:shadow-md`
                            }
                            ${!isDisabled && !isActive ? 'hover:border hover:border-sidebar-border/40' : ''}
                          `}
                          onClick={isDisabled ? undefined : () => setActiveView(item.id)}
                          tooltip={item.label}
                        >
                          <div className="flex items-center gap-4 w-full group-data-[state=collapsed]:justify-center">
                            <div className={`p-2 rounded-lg transition-all duration-300 group-data-[state=collapsed]:p-1.5 ${
                              isActive 
                                ? 'bg-sidebar-accent-foreground/10' 
                                : 'bg-sidebar-border/30 group-hover:bg-sidebar-border/50'
                            }`}>
                              <Icon className={`size-5 transition-all duration-300 group-data-[state=collapsed]:size-6 ${
                                isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground'
                              }`} />
                            </div>
                            
                            <div className="flex flex-col items-start flex-1 min-w-0 group-data-[state=collapsed]:hidden">
                              <span className={`font-medium truncate transition-colors duration-300 ${
                                isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground'
                              }`}>
                                {item.label}
                              </span>
                              <span className={`text-xs truncate transition-colors duration-300 ${
                                isActive ? 'text-sidebar-accent-foreground/70' : 'text-sidebar-muted-foreground'
                              }`}>
                                {item.description}
                              </span>
                            </div>
                            
                            {isDisabled && (
                              <div className="flex items-center justify-center w-6 h-6 bg-sidebar-border/40 rounded-md group-data-[state=collapsed]:hidden">
                                <span className="text-xs">🔒</span>
                              </div>
                            )}
                            
                            {isActive && (
                              <div className="w-1 h-8 bg-sidebar-accent-foreground rounded-full opacity-60 group-data-[state=collapsed]:hidden"></div>
                            )}
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
        
        {/* Footer del sidebar con configuración */}
        <SidebarFooter className="p-4 border-t border-sidebar-border/30 bg-sidebar/50 data-[state=collapsed]:p-2">
          <SidebarMenuButton
            onClick={() => setActiveView('configuracion')}
            className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-border/20 hover:bg-sidebar-border/40 transition-all duration-300 text-sidebar-foreground hover:text-sidebar-accent hover:scale-[1.02] group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2"
            tooltip="Configuración"
          >
            <div className="p-2 rounded-lg bg-sidebar-border/30 group-data-[state=collapsed]:p-1.5">
              <Settings className="size-4 text-sidebar-muted-foreground group-data-[state=collapsed]:size-5" />
            </div>
            <div className="flex flex-col items-start group-data-[state=collapsed]:hidden">
              <span className="text-sm font-medium">Configuración</span>
              <span className="text-xs text-sidebar-muted-foreground">Ajustes del sistema</span>
            </div>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="flex-1 overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 bg-background/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
          <SidebarTrigger className="-ml-1 text-sidebar-foreground hover:bg-accent" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-border" />
          
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                {profile?.company_name || 'Mi Empresa'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeSelector />
              <SmartNotifications />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-auto px-2 rounded-full hover:bg-accent border border-transparent hover:border-border/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7 ring-1 ring-border/20">
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                          {profile?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left hidden md:block">
                        <span className="text-sm font-medium truncate max-w-[120px] text-foreground">
                          {profile?.full_name || "Usuario"}
                        </span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg z-[60] backdrop-blur-sm">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="size-8 ring-1 ring-border/20">
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                        {profile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-foreground">{profile?.full_name || "Usuario"}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    onClick={() => setActiveView('profile')}
                    className="cursor-pointer hover:bg-accent focus:bg-accent"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveView('configuracion')}
                    disabled={isProfileIncomplete}
                    className={`cursor-pointer ${isProfileIncomplete ? "opacity-50 cursor-not-allowed" : "hover:bg-accent focus:bg-accent"}`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Administración</span>
                    {isProfileIncomplete && <span className="ml-auto text-xs">🔒</span>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
          
        <main className="flex-1 w-full h-full overflow-auto bg-background">
          <div className="w-full h-full p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
      </div>
  );
};

export default ResponsiveLayout;