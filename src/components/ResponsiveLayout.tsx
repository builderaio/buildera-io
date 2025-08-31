import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Building, Bot, Store, Bell, Search, GraduationCap, Users, Settings, User, LogOut, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
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
}
const ResponsiveLayout = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  useAutoLogout();
  useEffect(() => {
    checkAuth();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/auth');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const checkAuth = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      const {
        data: profileData,
        error
      } = await supabase
        .from('profiles')
        .select(`
          *,
          companies!profiles_primary_company_id_fkey(
            name
          )
        `)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Asignar el nombre de la empresa desde la relación
      const profileWithCompanyName = {
        ...profileData,
        company_name: profileData.companies?.name || profileData.company_name
      };
      
      setProfile(profileWithCompanyName);
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      await supabase.auth.signOut({
        scope: 'global'
      });
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
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
      'perfil': '/profile'
    };
    if (routes[view]) {
      navigate(routes[view]);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>;
  }
  if (!profile) {
    return null;
  }

  // Layout simplificado para desarrolladores y expertos
  if (profile.user_type !== 'company') {
    return <div className="min-h-screen bg-background">
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
      </div>;
  }

  // Layout con sidebar para empresas
  return <SidebarProvider>
      <CompanyLayout profile={profile} handleSignOut={handleSignOut} />
    </SidebarProvider>;
};
const CompanyLayout = ({
  profile,
  handleSignOut
}: {
  profile: Profile;
  handleSignOut: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  // Check onboarding completion status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!profile?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_onboarding_status')
          .select('onboarding_completed_at, dna_empresarial_completed')
          .eq('user_id', profile.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking onboarding status:', error);
          return;
        }
        
        // Usuario completa onboarding si tiene onboarding_completed_at O si tiene dna_empresarial_completed
        const hasCompletedOnboarding = data?.onboarding_completed_at || data?.dna_empresarial_completed;
        setOnboardingComplete(!!hasCompletedOnboarding);
      } catch (error) {
        console.error('Error in checkOnboardingStatus:', error);
      }
    };
    
    checkOnboardingStatus();

    // Listener para detectar cuando se completa el onboarding
    const handleOnboardingComplete = () => {
      console.log('🔄 Actualizando estado de onboarding...');
      checkOnboardingStatus();
    };

    // Escuchar cuando se complete el onboarding
    window.addEventListener('onboarding-completed', handleOnboardingComplete);
    
    // También verificar cuando cambie la URL
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('onboarding_completed') === 'true') {
      setTimeout(checkOnboardingStatus, 1000);
    }

    return () => {
      window.removeEventListener('onboarding-completed', handleOnboardingComplete);
    };
  }, [profile?.id, location.search]);
  
  const isProfileIncomplete = !profile?.company_name || profile.company_name === 'Mi Negocio' || !profile?.full_name;
  const shouldBlockNavigation = !onboardingComplete && isProfileIncomplete;

  const getActiveView = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');

    if (viewParam) return viewParam;
    if (path.includes('/company/agents')) return 'mis-agentes';
    if (path.includes('/marketplace/agents')) return 'marketplace';
    if (path.includes('/profile')) return 'profile';
    return 'mando-central';
  };

  const setActiveView = (view: string) => {
    if (shouldBlockNavigation && view !== "adn-empresa") {
      console.log('Onboarding not complete, access blocked');
      return;
    }

    // Aseguramos que las rutas con parámetros de consulta funcionen correctamente
    const routes: Record<string, string> = {
      'mando-central': '/company-dashboard',
      'adn-empresa': '/company-dashboard?view=adn-empresa',
      'base-conocimiento': '/company-dashboard?view=base-conocimiento',
      'marketing-hub': '/company-dashboard?view=marketing-hub',
      'inteligencia-competitiva': '/company-dashboard?view=inteligencia-competitiva',
      'academia-buildera': '/company-dashboard?view=academia-buildera',
      'expertos': '/company-dashboard?view=expertos',
      'configuracion': '/company-dashboard?view=configuracion',
      'mis-agentes': '/company/agents',
      'marketplace': '/marketplace/agents',
      'profile': '/profile'
    };
    
    const targetRoute = routes[view];
    if (targetRoute) {
      navigate(targetRoute);
      if (isMobile) {
        setTimeout(() => setOpenMobile(false), 100);
      }
    }
  };

  const sidebarMenuItems = [{
    category: "Central",
    icon: "🎯",
    items: [{ id: "mando-central", label: "Dashboard", icon: Activity, description: "Vista general y KPIs", priority: "high" }]
  }, {
    category: "Mi Empresa",
    icon: "🏢",
    items: [{ id: "adn-empresa", label: "Configuración Empresarial", icon: Building, description: "Datos y configuración", priority: "high" }, { id: "base-conocimiento", label: "Base de Conocimiento", icon: User, description: "Gestión de información", priority: "medium" }]
  }, {
    category: "Marketing & Ventas",
    icon: "📈",
    items: [{ id: "marketing-hub", label: "Marketing Hub", icon: Bell, description: "Campañas y automatización", priority: "high" }, { id: "inteligencia-competitiva", label: "Análisis Competitivo", icon: Search, description: "Inteligencia de mercado", priority: "medium" }]
  }, {
    category: "Agentes IA",
    icon: "🤖",
    items: [{ id: "mis-agentes", label: "Mis Agentes", icon: Bot, description: "Gestionar agentes creados", priority: "medium" }, { id: "marketplace", label: "Marketplace", icon: Store, description: "Descubrir nuevos agentes", priority: "medium" }]
  }, {
    category: "Aprendizaje",
    icon: "🎓",
    items: [{ id: "academia-buildera", label: "Academia Buildera", icon: GraduationCap, description: "Cursos y certificaciones", priority: "low" }, { id: "expertos", label: "Red de Expertos", icon: Users, description: "Conectar con especialistas", priority: "low" }]
  }];

  const activeView = getActiveView();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Funcionalidad: Controlamos el ancho directamente aquí para evitar conflictos.
        Estética: Usamos w-16 (64px) para el modo colapsado, que da un buen espacio.
      */}
      <Sidebar 
        variant="sidebar" 
        collapsible="icon" 
        className="data-[state=expanded]:w-80 data-[state=collapsed]:w-16 border-r bg-sidebar shadow-xl z-40 transition-all duration-300 ease-in-out"
      >
        {/* Funcionalidad: El "group-data-" asegura que este header reaccione al estado del Sidebar.
          Estética: Se oculta limpiamente al colapsar.
        */}
        <SidebarHeader className="p-6 border-b border-sidebar-border/50 group-data-[state=collapsed]:hidden">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveView('mando-central')}>
            <div className="flex aspect-square size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-xl">
              <img src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" alt="Buildera Logo" className="size-7 object-contain filter brightness-0 invert" />
            </div>
            <div className="grid flex-1 text-left">
              <span className="font-heading font-bold text-xl tracking-tight text-sidebar-foreground">BUILDERA</span>
              <span className="text-xs font-medium text-sidebar-muted-foreground tracking-wide uppercase">AI Business Platform</span>
            </div>
          </div>
        </SidebarHeader>

        {/* Logo colapsado: aparece cuando el group/sidebar está colapsado */}
        <div className="hidden group-data-[state=collapsed]:flex items-center justify-center p-4 border-b border-sidebar-border/30">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
            <img src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" alt="Buildera Logo" className="size-5 object-contain filter brightness-0 invert" />
          </div>
        </div>
          
        <SidebarContent className="px-2 py-6 space-y-2">
          {sidebarMenuItems.map((category) => (
            <SidebarGroup key={category.category} className="p-0 space-y-1">
              <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase text-sidebar-muted-foreground group-data-[state=collapsed]:hidden">
                {category.category}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1.5">
                  {category.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const isDisabled = shouldBlockNavigation && item.id !== "adn-empresa";
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          disabled={isDisabled}
                          className={`
                            h-auto justify-start
                            group/item relative transition-all duration-300 font-medium text-sm
                            data-[state=expanded]:p-3 data-[state=expanded]:rounded-lg
                            data-[state=collapsed]:h-12 data-[state=collapsed]:w-12 data-[state=collapsed]:rounded-full data-[state=collapsed]:mx-auto
                            ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md" : isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-sidebar-accent/50"}
                          `}
                          onClick={isDisabled ? undefined : () => setActiveView(item.id)}
                          tooltip={item.label}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="size-5 shrink-0" />
                            <div className="flex flex-col items-start group-data-[state=collapsed]:hidden">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-xs text-sidebar-muted-foreground">{item.description}</span>
                            </div>
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
      </Sidebar>
      
      {/* El resto del Layout (header y contenido principal) */}
      <SidebarInset className="flex-1 overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
          <div className='flex items-center gap-2'>
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">{profile?.company_name || 'Mi Empresa'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSelector />
            <SmartNotifications />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-auto px-2 rounded-full">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7"><AvatarImage src={profile.avatar_url} /><AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback></Avatar>
                    <div className="hidden md:block"><span className="text-sm font-medium truncate max-w-[120px]">{profile?.full_name || "Usuario"}</span></div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="size-8"><AvatarImage src={profile.avatar_url} /><AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback></Avatar>
                  <div className="flex flex-col"><p className="font-medium">{profile?.full_name}</p><p className="w-[200px] truncate text-sm text-muted-foreground">{profile?.email}</p></div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveView('profile')}><User className="mr-2 h-4 w-4" /><span>Mi Perfil</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('configuracion')} disabled={shouldBlockNavigation}><Settings className="mr-2 h-4 w-4" /><span>Administración</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive"><LogOut className="mr-2 h-4 w-4" /><span>Cerrar sesión</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 w-full h-full overflow-auto">
          <div className="p-4 md:p-6"><Outlet /></div>
        </main>
      </SidebarInset>
    </div>
  );
};
export default ResponsiveLayout;