import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Building, Bot, Store, Bell, Search, GraduationCap, Users, Settings, User, LogOut, Activity, Target, Sparkles, CreditCard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import ThemeSelector from '@/components/ThemeSelector';
import { SmartNotifications } from '@/components/ui/smart-notifications';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { AgentSidebarSection } from '@/components/agents/AgentSidebarSection';
import { AgentInteractionPanel } from '@/components/agents/AgentInteractionPanel';
import { PlatformAgent } from '@/hooks/usePlatformAgents';
import { useCompanyCredits } from '@/hooks/useCompanyCredits';

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
    console.group('🔐 [ResponsiveLayout] checkAuth');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      let session = null as any;
      for (let i = 0; i < 6; i++) {
        const { data: { session: s } } = await supabase.auth.getSession();
        session = s;
        if (session?.user) break;
        console.log(`⏳ Retry ${i + 1}/6 - waiting for session...`);
        await new Promise(r => setTimeout(r, 500));
      }
      
      if (!session || !session.user) {
        console.log('❌ No session found after retries, redirecting to /auth');
        console.groupEnd();
        navigate('/auth');
        return;
      }

      const user = session.user;
      console.log('✅ Session found for user:', user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('⚠️ Error fetching profile, using fallback:', profileError);
      }
      
      const baseProfile: any = profileData ?? {
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        user_type: user.app_metadata?.provider === 'email' ? 'company' : null,
        company_name: 'Mi Empresa'
      };
      
      const { data: companyMember } = await supabase
        .from('company_members')
        .select(`companies (name)`)
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();
      
      const profileWithCompanyName = {
        ...baseProfile,
        company_name: companyMember?.companies?.name || baseProfile.company_name || 'Mi Empresa'
      };
      
      console.log('✅ Profile loaded:', {
        userId: profileWithCompanyName.user_id,
        email: profileWithCompanyName.email,
        userType: profileWithCompanyName.user_type,
        companyName: profileWithCompanyName.company_name
      });
      
      setProfile(profileWithCompanyName);
      console.groupEnd();
    } catch (error) {
      console.error('❌ Exception in checkAuth:', error);
      console.groupEnd();
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 [ResponsiveLayout] Signing out and cleaning localStorage');
    try {
      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith('supabase.auth.') || 
          key.includes('sb-') ||
          key.includes('era-optimizer-') ||
          key.includes('coach-mark-')
        ) {
          console.log('🗑️ Removing:', key);
          localStorage.removeItem(key);
        }
      });
      
      await supabase.auth.signOut({ scope: 'global' });
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      });
      
      window.location.href = '/auth';
    } catch (error) {
      console.error('❌ Error signing out:', error);
      window.location.href = '/auth';
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

  // Layout con sidebar agent-centric para empresas
  return (
    <SidebarProvider>
      <CompanyLayout profile={profile} handleSignOut={handleSignOut} />
    </SidebarProvider>
  );
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
  const { t } = useTranslation(['common']);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isInOnboarding, setIsInOnboarding] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<PlatformAgent | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const checkOnboardingInFlight = useRef(false);
  const lastOnboardingCheckAt = useRef(0);
  
  // Use the credits hook
  const { availableCredits, refetch: refetchCredits } = useCompanyCredits(companyId || undefined, profile?.user_id);
  
  // Check onboarding completion status and load company
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!profile?.user_id) return;

      const now = Date.now();
      if (checkOnboardingInFlight.current || now - lastOnboardingCheckAt.current < 1000) {
        return;
      }
      checkOnboardingInFlight.current = true;

      try {
        const { data, error } = await supabase
          .from('user_onboarding_status')
          .select('onboarding_completed_at, dna_empresarial_completed')
          .eq('user_id', profile.user_id)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking onboarding status:', error);
          return;
        }
        
        const hasCompletedOnboarding = data?.onboarding_completed_at || data?.dna_empresarial_completed;
        setOnboardingComplete(!!hasCompletedOnboarding);
        
        // Load company ID
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('created_by', profile.user_id)
          .maybeSingle();
        
        if (company?.id) {
          setCompanyId(company.id);
        }
      } catch (error) {
        console.error('Error in checkOnboardingStatus:', error);
      } finally {
        lastOnboardingCheckAt.current = Date.now();
        checkOnboardingInFlight.current = false;
      }
    };
    
    // Verificar si estamos en la vista de onboarding
    const urlParams = new URLSearchParams(location.search);
    const viewParam = urlParams.get('view');
    setIsInOnboarding(viewParam === 'onboarding');
    
    checkOnboardingStatus();

    // Listener para detectar cuando se completa el onboarding
    const handleOnboardingComplete = () => {
      console.log('🔄 Actualizando estado de onboarding...');
      checkOnboardingStatus();
    };

    window.addEventListener('onboarding-completed', handleOnboardingComplete);
    
    if (urlParams.get('onboarding_completed') === 'true') {
      setTimeout(checkOnboardingStatus, 1000);
    }

    return () => {
      window.removeEventListener('onboarding-completed', handleOnboardingComplete);
    };
  }, [profile?.user_id, location.search]);
  
  // Handle agent click from sidebar
  const handleAgentClick = (agent: PlatformAgent) => {
    setSelectedAgent(agent);
    setAgentPanelOpen(true);
  };
  
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
    console.log('🎯 [CompanyLayout] setActiveView:', view, 'blocked:', shouldBlockNavigation);
    
    if (shouldBlockNavigation && view !== "adn-empresa") {
      console.log('⚠️ Navigation blocked - onboarding incomplete');
      return;
    }

    const routes: Record<string, string> = {
      'mando-central': '/company-dashboard?view=mando-central',
      'adn-empresa': '/company-dashboard?view=adn-empresa',
      'base-conocimiento': '/company-dashboard?view=base-conocimiento',
      'marketing-hub': '/company-dashboard?view=marketing-hub',
      'inteligencia-competitiva': '/company-dashboard?view=inteligencia-competitiva',
      'ai-workforce': '/company-dashboard?view=ai-workforce',
      'academia-buildera': '/company-dashboard?view=academia-buildera',
      'expertos': '/company-dashboard?view=expertos',
      'configuracion': '/company-dashboard?view=configuracion',
      'mis-agentes': '/company/agents',
      'marketplace': '/marketplace/agents',
      'profile': '/profile'
    };
    
    const targetRoute = routes[view];
    
    if (targetRoute) {
      console.log('✅ Navigating to:', targetRoute);
      navigate(targetRoute);
      if (isMobile) {
        setTimeout(() => setOpenMobile(false), 100);
      }
    } else {
      console.error('❌ No route found for view:', view);
    }
  };

  // Sidebar sections (non-agent items)
  const sidebarMenuItems = [
    {
      category: t('common:sidebar.central', 'Central'),
      icon: "🎯",
      highlight: false,
      items: [
        { 
          id: "mando-central", 
          label: t('common:sidebar.dashboard', 'Mi Panel'), 
          icon: Activity, 
          description: t('common:sidebar.dashboardDesc', 'Vista general y KPIs')
        }
      ]
    },
    {
      category: t('common:sidebar.myCompany', 'Mi Empresa'),
      icon: "🏢",
      highlight: false,
      items: [
        { 
          id: "adn-empresa", 
          label: t('common:sidebar.companyDna', 'ADN Empresa'), 
          icon: Building, 
          description: t('common:sidebar.companyDnaDesc', 'Datos y configuración')
        },
        { 
          id: "base-conocimiento", 
          label: t('common:sidebar.knowledge', 'Base de Conocimiento'), 
          icon: Search, 
          description: t('common:sidebar.knowledgeDesc', 'Documentos y recursos')
        }
      ]
    },
    {
      category: t('common:sidebar.marketing', 'Marketing'),
      icon: "📣",
      highlight: false,
      items: [
        { 
          id: "marketing-hub", 
          label: t('common:sidebar.marketingHub', 'Marketing Hub'), 
          icon: Bell, 
          description: t('common:sidebar.marketingHubDesc', 'Contenido y campañas')
        },
        { 
          id: "inteligencia-competitiva", 
          label: t('common:sidebar.intelligence', 'Inteligencia'), 
          icon: Search, 
          description: t('common:sidebar.intelligenceDesc', 'Análisis de mercado')
        }
      ]
    },
    {
      category: t('common:sidebar.learning', 'Aprendizaje'),
      icon: "🎓",
      highlight: false,
      items: [
        { 
          id: "academia-buildera", 
          label: t('common:sidebar.academy', 'Academia'), 
          icon: GraduationCap, 
          description: t('common:sidebar.academyDesc', 'Cursos y certificaciones')
        },
        { 
          id: "expertos", 
          label: t('common:sidebar.experts', 'Expertos'), 
          icon: Users, 
          description: t('common:sidebar.expertsDesc', 'Conectar con especialistas')
        }
      ]
    }
  ];

  const activeView = getActiveView();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar siempre visible después del onboarding */}
      {!isInOnboarding && (
        <Sidebar 
          variant="sidebar" 
          collapsible="icon" 
          className="data-[state=expanded]:w-80 data-[state=collapsed]:w-16 border-r bg-sidebar shadow-xl z-40 transition-all duration-300 ease-in-out"
        >
          {/* Header con logo y créditos */}
          <SidebarHeader className="p-4 border-b border-sidebar-border/50 group-data-[state=collapsed]:hidden">
            <div className="flex items-center gap-3 cursor-pointer mb-3" onClick={() => setActiveView('mando-central')}>
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
                <img 
                  src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" 
                  alt="Buildera Logo" 
                  className="size-6 object-contain filter brightness-0 invert" 
                />
              </div>
              <div className="grid flex-1 text-left">
                <span className="font-heading font-bold text-lg tracking-tight text-sidebar-foreground">
                  {profile?.company_name || "BUILDERA"}
                </span>
                <span className="text-xs font-medium text-sidebar-muted-foreground tracking-wide">
                  AI Business Platform
                </span>
              </div>
            </div>
            
            {/* Badge de créditos disponibles - Agent Centric */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <Zap className="size-4 text-amber-500" />
              <span className="text-xs font-medium text-sidebar-foreground">
                {t('common:sidebar.credits', 'Créditos')}:
              </span>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 bg-primary/20 text-primary font-bold">
                {availableCredits} cr
              </Badge>
            </div>
          </SidebarHeader>

          {/* Logo colapsado */}
          <div className="hidden group-data-[state=collapsed]:flex items-center justify-center p-3 border-b border-sidebar-border/30">
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
              <img 
                src="/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png" 
                alt="Buildera Logo" 
                className="size-5 object-contain filter brightness-0 invert" 
              />
            </div>
          </div>
            
          <SidebarContent className="px-2 py-4 space-y-1">
            {/* Panel Principal */}
            <SidebarGroup className="p-0 space-y-1">
              <SidebarGroupLabel className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider group-data-[state=collapsed]:hidden text-sidebar-muted-foreground">
                <span className="mr-2">🎯</span>
                {t('common:sidebar.central', 'Central')}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeView === 'mando-central'}
                      className="h-auto justify-start group/item relative transition-all duration-200 font-medium text-sm data-[state=expanded]:px-3 data-[state=expanded]:py-2.5 data-[state=expanded]:rounded-lg"
                      onClick={() => setActiveView('mando-central')}
                      tooltip={t('common:sidebar.dashboard', 'Mi Panel')}
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="size-5 shrink-0" />
                        <div className="flex flex-col items-start group-data-[state=collapsed]:hidden">
                          <span className="font-medium">{t('common:sidebar.dashboard', 'Mi Panel')}</span>
                          <span className="text-xs text-sidebar-muted-foreground">{t('common:sidebar.dashboardDesc', 'Vista general y KPIs')}</span>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {/* AGENT-CENTRIC SECTION - Main highlight */}
            <AgentSidebarSection 
              companyId={companyId || undefined}
              onAgentClick={handleAgentClick}
            />
            
            {/* Remaining menu items */}
            {sidebarMenuItems.slice(1).map((category) => (
              <SidebarGroup key={category.category} className="p-0 space-y-1">
                <SidebarGroupLabel 
                  className={`
                    px-3 py-1.5 text-xs font-semibold uppercase tracking-wider
                    group-data-[state=collapsed]:hidden text-sidebar-muted-foreground
                  `}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.category}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
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
                              group/item relative transition-all duration-200 font-medium text-sm
                              data-[state=expanded]:px-3 data-[state=expanded]:py-2.5 data-[state=expanded]:rounded-lg
                              data-[state=collapsed]:h-10 data-[state=collapsed]:w-10 data-[state=collapsed]:rounded-lg data-[state=collapsed]:mx-auto
                              ${isActive 
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md ring-1 ring-primary/20" 
                                : isDisabled 
                                  ? "opacity-40 cursor-not-allowed" 
                                  : "hover:bg-sidebar-accent/50"
                              }
                            `}
                            onClick={isDisabled ? undefined : () => {
                              console.log('🔄 Clicking sidebar item:', item.id);
                              setActiveView(item.id);
                            }}
                            tooltip={item.label}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="size-5 shrink-0" />
                              <div className="flex flex-col items-start group-data-[state=collapsed]:hidden">
                                <span className="font-medium">{item.label}</span>
                                <span className="text-xs text-sidebar-muted-foreground line-clamp-1">
                                  {item.description}
                                </span>
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
          
          <SidebarFooter className="p-3 border-t border-sidebar-border/50">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveView('configuracion')} 
                  disabled={shouldBlockNavigation} 
                  className="justify-start"
                >
                  <Settings className="size-5" />
                  <span className="group-data-[state=collapsed]:hidden">
                    {t('common:sidebar.settings', 'Configuración')}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      )}

      {/* Main Content Area */}
      <SidebarInset className="flex-1 overflow-auto">
        {/* Header */}
        {!isInOnboarding && (
          <header className="flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3 sticky top-0 z-30">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <ThemeSelector />
              <SmartNotifications />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-auto px-2 rounded-full">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block">
                        <span className="text-sm font-medium truncate max-w-[120px]">
                          {profile?.full_name || "Usuario"}
                        </span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="size-8">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-medium">{profile?.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveView('profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('common:sidebar.profile', 'Mi Perfil')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveView('configuracion')} disabled={shouldBlockNavigation}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('common:sidebar.settings', 'Configuración')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('common:sidebar.logout', 'Cerrar sesión')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        )}
        <main className={isInOnboarding ? "flex-1" : "flex-1 p-6"}>
          <Outlet />
        </main>
      </SidebarInset>
      
      {/* Agent Interaction Panel */}
      <AgentInteractionPanel
        agent={selectedAgent}
        isOpen={agentPanelOpen}
        onClose={() => {
          setAgentPanelOpen(false);
          setSelectedAgent(null);
        }}
        isEnabled={true} // TODO: Check from usePlatformAgents
        creditsAvailable={availableCredits}
        companyId={companyId || undefined}
        userId={profile?.user_id}
        onExecutionComplete={refetchCredits}
      />
    </div>
  );
};

export default ResponsiveLayout;
