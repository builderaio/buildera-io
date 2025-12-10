import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Building, Bot, Store, Settings, User, LogOut, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import ThemeSelector from '@/components/ThemeSelector';
import { SmartNotifications } from '@/components/ui/smart-notifications';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { AgentInteractionPanel } from '@/components/agents/AgentInteractionPanel';
import { PlatformAgent, usePlatformAgents } from '@/hooks/usePlatformAgents';
import { useCompanyCredits } from '@/hooks/useCompanyCredits';
import { useCompany } from '@/contexts/CompanyContext';

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
    try {
      let session = null as any;
      for (let i = 0; i < 6; i++) {
        const { data: { session: s } } = await supabase.auth.getSession();
        session = s;
        if (session?.user) break;
        await new Promise(r => setTimeout(r, 500));
      }
      
      if (!session || !session.user) {
        navigate('/auth');
        return;
      }

      const user = session.user;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
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
      
      setProfile(profileWithCompanyName);
    } catch (error) {
      console.error('Error in checkAuth:', error);
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
      
      await supabase.auth.signOut({ scope: 'global' });
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente" });
      window.location.href = '/auth';
    } catch (error) {
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

  if (!profile) return null;

  // Layout for non-company users
  if (profile.user_type !== 'company') {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-foreground">Buildera</h1>
              <div className="flex items-center space-x-4">
                <ThemeSelector />
                <SmartNotifications />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                        <AvatarFallback>{profile.full_name?.charAt(0) || profile.email.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{profile.email}</p>
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

  return (
    <SidebarProvider>
      <CompanyLayout profile={profile} handleSignOut={handleSignOut} />
    </SidebarProvider>
  );
};

// Sidebar Logo Header Component with company logo fallback
const SidebarLogoHeader = ({ 
  companyName, 
  onLogoClick 
}: { 
  companyName: string; 
  onLogoClick: () => void;
}) => {
  const { company } = useCompany();
  const defaultLogo = "/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png";
  const hasCompanyLogo = !!company?.logo_url;
  
  return (
    <div className="flex items-center gap-3 cursor-pointer mb-3" onClick={onLogoClick}>
      <div className={`flex aspect-square size-10 items-center justify-center rounded-xl shadow-lg overflow-hidden ${
        hasCompanyLogo ? 'bg-background' : 'bg-gradient-to-br from-primary to-secondary'
      }`}>
        <img 
          src={company?.logo_url || defaultLogo}
          alt={hasCompanyLogo ? `${company?.name || companyName} Logo` : "Buildera Logo"}
          className={`${hasCompanyLogo ? 'size-10 object-cover' : 'size-6 object-contain filter brightness-0 invert'}`}
        />
      </div>
      <div className="grid flex-1 text-left">
        <span className="font-heading font-bold text-lg tracking-tight text-sidebar-foreground">
          {company?.name || companyName}
        </span>
        <span className="text-xs font-medium text-sidebar-muted-foreground tracking-wide">
          AI Business Platform
        </span>
      </div>
    </div>
  );
};

// Collapsed Sidebar Logo Component
const CollapsedSidebarLogo = () => {
  const { company } = useCompany();
  const defaultLogo = "/lovable-uploads/255a63ec-9f96-4ae3-88c5-13f1eacfc672.png";
  const hasCompanyLogo = !!company?.logo_url;
  
  return (
    <div className="hidden group-data-[state=collapsed]:flex items-center justify-center p-3 border-b border-sidebar-border/30">
      <div className={`flex aspect-square size-9 items-center justify-center rounded-xl shadow-lg overflow-hidden ${
        hasCompanyLogo ? 'bg-background' : 'bg-gradient-to-br from-primary to-secondary text-primary-foreground'
      }`}>
        <img 
          src={company?.logo_url || defaultLogo}
          alt={hasCompanyLogo ? `${company?.name} Logo` : "Buildera Logo"}
          className={`${hasCompanyLogo ? 'size-9 object-cover' : 'size-5 object-contain filter brightness-0 invert'}`}
        />
      </div>
    </div>
  );
};

const CompanyLayout = ({ profile, handleSignOut }: { profile: Profile; handleSignOut: () => void }) => {
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
  
  const { enabledAgents } = usePlatformAgents(companyId || undefined);
  const { availableCredits, refetch: refetchCredits } = useCompanyCredits(companyId || undefined, profile?.user_id);
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!profile?.user_id || checkOnboardingInFlight.current) return;
      checkOnboardingInFlight.current = true;

      try {
        const { data } = await supabase
          .from('user_onboarding_status')
          .select('onboarding_completed_at, dna_empresarial_completed')
          .eq('user_id', profile.user_id)
          .maybeSingle();
          
        setOnboardingComplete(!!data?.onboarding_completed_at || !!data?.dna_empresarial_completed);
        
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('created_by', profile.user_id)
          .maybeSingle();
        
        if (company?.id) setCompanyId(company.id);
      } finally {
        checkOnboardingInFlight.current = false;
      }
    };
    
    const urlParams = new URLSearchParams(location.search);
    setIsInOnboarding(urlParams.get('view') === 'onboarding');
    checkOnboardingStatus();

    const handleOnboardingComplete = () => checkOnboardingStatus();
    window.addEventListener('onboarding-completed', handleOnboardingComplete);
    return () => window.removeEventListener('onboarding-completed', handleOnboardingComplete);
  }, [profile?.user_id, location.search]);

  const shouldBlockNavigation = !onboardingComplete && (!profile?.company_name || profile.company_name === 'Mi Negocio');

  const getActiveView = () => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    if (viewParam) return viewParam;
    if (location.pathname.includes('/company/agents')) return 'mis-agentes';
    if (location.pathname.includes('/marketplace/agents')) return 'marketplace';
    return 'mando-central';
  };

  const setActiveView = (view: string) => {
    if (shouldBlockNavigation && view !== "adn-empresa") return;

    const routes: Record<string, string> = {
      'mando-central': '/company-dashboard?view=mando-central',
      'mis-agentes': '/company-dashboard?view=mis-agentes',
      'marketplace': '/marketplace/agents',
      'adn-empresa': '/company-dashboard?view=adn-empresa',
      'configuracion': '/company-dashboard?view=configuracion',
      'profile': '/profile'
    };
    
    const targetRoute = routes[view];
    if (targetRoute) {
      navigate(targetRoute);
      if (isMobile) setTimeout(() => setOpenMobile(false), 100);
    }
  };

  const activeView = getActiveView();

  // Simplified sidebar items - only 5 main sections
  const sidebarItems = [
    { id: 'mando-central', label: t('common:sidebar.dashboard', 'Mi Panel'), icon: Activity, emoji: '🏠' },
    { id: 'mis-agentes', label: t('common:sidebar.myAgents', 'Mis Agentes'), icon: Bot, emoji: '🤖' },
    { id: 'marketplace', label: t('common:sidebar.marketplace', 'Marketplace'), icon: Store, emoji: '🛒' },
    { id: 'adn-empresa', label: t('common:sidebar.companyDna', 'Mi Empresa'), icon: Building, emoji: '🏢' },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background">
      {!isInOnboarding && (
        <Sidebar variant="sidebar" collapsible="icon" className="border-r bg-sidebar shadow-xl z-40">
          <SidebarHeader className="p-4 border-b border-sidebar-border/50 group-data-[state=collapsed]:hidden">
            <SidebarLogoHeader 
              companyName={profile?.company_name || "BUILDERA"} 
              onLogoClick={() => setActiveView('mando-central')} 
            />
            
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <Zap className="size-4 text-amber-500" />
              <span className="text-xs font-medium text-sidebar-foreground">Créditos:</span>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 bg-primary/20 text-primary font-bold">
                {availableCredits} cr
              </Badge>
            </div>
          </SidebarHeader>

          <CollapsedSidebarLogo />
            
          <SidebarContent className="px-2 py-4">
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider group-data-[state=collapsed]:hidden text-sidebar-muted-foreground">
                Navegación
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {sidebarItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const isDisabled = shouldBlockNavigation && item.id !== "adn-empresa";
                    
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          disabled={isDisabled}
                          className={`
                            h-auto justify-start transition-all duration-200 font-medium text-sm
                            data-[state=expanded]:px-3 data-[state=expanded]:py-3 data-[state=expanded]:rounded-lg
                            ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md" : 
                              isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-sidebar-accent/50"}
                          `}
                          onClick={isDisabled ? undefined : () => setActiveView(item.id)}
                          tooltip={item.label}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg group-data-[state=collapsed]:hidden">{item.emoji}</span>
                            <Icon className="size-5 shrink-0 hidden group-data-[state=collapsed]:block" />
                            <span className="font-medium group-data-[state=collapsed]:hidden">{item.label}</span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-3 border-t border-sidebar-border/50">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveView('configuracion')} 
                  disabled={shouldBlockNavigation} 
                  className="justify-start"
                  tooltip="Configuración"
                >
                  <Settings className="size-5" />
                  <span className="group-data-[state=collapsed]:hidden">{t('common:sidebar.settings', 'Configuración')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      )}

      <SidebarInset className="flex-1 overflow-auto">
        {!isInOnboarding && (
          <header className="flex items-center gap-4 border-b bg-background/95 backdrop-blur px-6 py-3 sticky top-0 z-30">
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
                      <span className="hidden md:block text-sm font-medium truncate max-w-[120px]">
                        {profile?.full_name || "Usuario"}
                      </span>
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
      
      <AgentInteractionPanel
        agent={selectedAgent}
        isOpen={agentPanelOpen}
        onClose={() => {
          setAgentPanelOpen(false);
          setSelectedAgent(null);
        }}
        isEnabled={true}
        creditsAvailable={availableCredits}
        companyId={companyId || undefined}
        userId={profile?.user_id}
        onExecutionComplete={refetchCredits}
      />
    </div>
  );
};

export default ResponsiveLayout;
