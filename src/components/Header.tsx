import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import ThemeSelector from "@/components/ThemeSelector";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check current session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setProfile(profileData);
      }
    };
    
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer Supabase calls to prevent deadlock
        setTimeout(() => {
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data: profileData }) => {
              setProfile(profileData);
            });
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const renderAuthSection = () => {
    if (user) {
      const displayName = profile?.full_name || user.user_metadata?.full_name || user.email;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/company-dashboard'}>
              <User className="mr-2 h-4 w-4" />
              Dashboard Negocio
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex items-center space-x-4">
        <a href="/auth?mode=login&userType=company">
          <Button variant="ghost" size="lg">
            Iniciar Sesión
          </Button>
        </a>
        <a href="/auth?mode=register&userType=company">
          <Button variant="cta" size="lg">
            Registrarse
          </Button>
        </a>
      </div>
    );
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
        <div>
          <a 
            href={user ? "/company-dashboard" : "#"} 
            className="flex items-center space-x-2 md:space-x-3"
            onClick={(e) => {
              if (user) {
                e.preventDefault();
                window.location.href = "/company-dashboard";
              }
            }}
          >
            <img 
              src="/lovable-uploads/9bbad23a-3f28-47fd-bf57-1a43f0129bff.png" 
              alt="Buildera Logo" 
              className="h-8 md:h-10 w-auto"
            />
          </a>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <a href="#solucion" className="text-muted-foreground hover:text-primary transition-smooth">
            Solución
          </a>
          <a href="#ecosistema" className="text-muted-foreground hover:text-primary transition-smooth">
            Ecosistema
          </a>
          <a href="#casos-de-uso" className="text-muted-foreground hover:text-primary transition-smooth">
            Casos de Uso
          </a>
          <ThemeSelector />
          {renderAuthSection()}
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeSelector />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <a 
              href="#solucion" 
              className="block text-muted-foreground hover:text-primary transition-smooth py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Solución
            </a>
            <a 
              href="#ecosistema" 
              className="block text-muted-foreground hover:text-primary transition-smooth py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Ecosistema
            </a>
            <a 
              href="#casos-de-uso" 
              className="block text-muted-foreground hover:text-primary transition-smooth py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Casos de Uso
            </a>
            <div className="pt-4 border-t">
              {renderAuthSection()}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;