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
                  <DropdownMenuContent className="w-56 bg-card border shadow-lg z-50" align="end" forceMount>
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
  
  const isProfileIncomplete = !profile?.company_name || 
                               profile.company_name === 'Mi Negocio' ||
                               !profile?.company_size ||
                               !profile?.industry_sector ||
                               !profile?.full_name;

  const getActiveView = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    
    if (viewParam) return viewParam;
    if (path.includes('/agents')) return 'mis-agentes';
    if (path.includes('/marketplace')) return 'marketplace';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/adn-empresa') || path.includes('view=adn-empresa')) return 'adn-empresa';
    if (path.includes('/base-conocimiento')) return 'base-conocimiento';
    if (path.includes('/marketing-hub')) return 'marketing-hub';
    if (path.includes('/inteligencia-competitiva')) return 'inteligencia-competitiva';
    if (path.includes('/academia-buildera')) return 'academia-buildera';
    if (path.includes('/expertos')) return 'expertos';
    if (path.includes('/configuracion')) return 'configuracion';
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
    }
  };

  // Nueva estructura de menú integrada en la sidebar
  const sidebarMenuItems = [
    {
      category: "🏢 Mi Empresa",
      items: [
        { id: "mando-central", label: "Mando Central", icon: Activity, description: "Dashboard principal" },
        { id: "adn-empresa", label: "Mi Negocio", icon: Building, description: "Información empresarial" },
        { id: "base-conocimiento", label: "Mi Información", icon: User, description: "Base de conocimiento" },
      ]
    },
    {
      category: "🤖 Inteligencia Artificial", 
      items: [
        { id: "mis-agentes", label: "Mis Agentes", icon: Bot, description: "Agentes creados" },
        { id: "marketplace", label: "Marketplace", icon: Store, description: "Explorar agentes" },
      ]
    },
    {
      category: "📈 Operaciones", 
      items: [
        { id: "marketing-hub", label: "Marketing Hub", icon: Bell, description: "Campañas y promociones" },
        { id: "inteligencia-competitiva", label: "Inteligencia Competitiva", icon: Search, description: "Análisis de mercado" },
      ]
    },
    {
      category: "🎓 Recursos",
      items: [
        { id: "academia-buildera", label: "Academia", icon: GraduationCap, description: "Cursos y tutoriales" },
        { id: "expertos", label: "Expertos", icon: Users, description: "Conectar con especialistas" },
      ]
    }
  ];

  const activeView = getActiveView();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-sidebar shadow-lg">
        <SidebarHeader className="p-4 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all duration-300 group"
               onClick={() => setActiveView('mando-central')}>
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <img 
                src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" 
                alt="Buildera Logo" 
                className="size-6 object-contain filter brightness-0 invert"
              />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-black text-lg tracking-wide text-sidebar-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BUILDERA
              </span>
              <span className="truncate text-[10px] font-medium text-sidebar-muted-foreground tracking-widest uppercase">
                AI Business Platform
              </span>
            </div>
          </div>
        </SidebarHeader>
          
        <SidebarContent className="px-3 py-4">
          {sidebarMenuItems.map((category) => (
            <SidebarGroup key={category.category} className="mb-6">
              <SidebarGroupLabel className="px-3 text-xs font-bold uppercase text-sidebar-foreground/70 mb-3 tracking-wider">
                {category.category}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const isDisabled = isProfileIncomplete && item.id !== "adn-empresa";
                    
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          disabled={isDisabled}
                          className={`
                            relative group transition-all duration-200 rounded-lg p-3
                            ${isActive 
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm transform translate-x-1" 
                              : isDisabled
                              ? "opacity-50 cursor-not-allowed text-sidebar-foreground/50"
                              : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:transform hover:translate-x-1"
                            }
                          `}
                          onClick={isDisabled ? undefined : () => setActiveView(item.id)}
                        >
                          <Icon className="size-5 mr-3 flex-shrink-0" />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{item.label}</span>
                            <span className="text-xs text-sidebar-foreground/60">{item.description}</span>
                          </div>
                          {isDisabled && <span className="ml-auto text-xs">🔒</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {profile?.company_name || 'Mi Empresa'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeSelector />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-auto px-2 rounded-full hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                        <AvatarFallback className="text-xs">
                          {profile?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left hidden md:block">
                        <span className="text-sm font-medium truncate max-w-[120px]">
                          {profile?.full_name || "Usuario"}
                        </span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border shadow-lg z-50">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="size-8">
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                      <AvatarFallback className="text-xs">
                        {profile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.full_name || "Usuario"}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveView('perfil')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveView('configuracion')}
                    disabled={isProfileIncomplete}
                    className={isProfileIncomplete ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Administración</span>
                    {isProfileIncomplete && <span className="ml-auto text-xs">🔒</span>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
  );
};

export default ResponsiveLayout;