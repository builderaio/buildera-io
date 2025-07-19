import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import Ecosystem from "@/components/Ecosystem";
import UseCases from "@/components/UseCases";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, Users, Zap } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
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
      setLoading(false);
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
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

  // Redirección automática para usuarios autenticados al mando central
  useEffect(() => {
    if (user && profile && !loading) {
      window.location.href = '/company-dashboard';
    }
  }, [user, profile, loading]);

  // Contenido para usuarios autenticados
  const renderAuthenticatedContent = () => {
    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "Usuario";
    const companyName = profile?.company_name || "tu negocio";

    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-6 py-12">
          {/* Hero Section for Authenticated Users */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bienvenido de nuevo, <span className="text-primary">{displayName}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Acelera el crecimiento de {companyName} con herramientas de IA diseñadas para negocios como el tuyo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '/company-dashboard'}
              >
                Ir al Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '/company-dashboard?view=marketing-hub'}
              >
                Marketing Hub
              </Button>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/company-dashboard?view=mando-central'}>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Mando Central</h3>
                <p className="text-muted-foreground">Supervisa todas las métricas de tu negocio en un solo lugar</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/company-dashboard?view=marketing-hub'}>
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Marketing Hub</h3>
                <p className="text-muted-foreground">Cree y gestione campañas de marketing con IA</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/company-dashboard?view=adn-empresa'}>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">ADN Negocio</h3>
                <p className="text-muted-foreground">Configura la identidad y estrategia de tu negocio</p>
              </CardContent>
            </Card>
          </div>

          {/* Company Status */}
          {profile && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Estado de {companyName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {profile.company_size || 'No especificado'}
                    </p>
                    <p className="text-sm text-muted-foreground">Tamaño del negocio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">
                      {profile.industry_sector || 'No especificado'}
                    </p>
                    <p className="text-sm text-muted-foreground">Sector</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">
                      {profile.website_url ? 'Configurado' : 'Pendiente'}
                    </p>
                    <p className="text-sm text-muted-foreground">Sitio web</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">Activa</p>
                    <p className="text-sm text-muted-foreground">Cuenta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
        <Footer />
      </div>
    );
  };

  // Contenido para usuarios no autenticados (landing page original)
  const renderPublicContent = () => {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <ProblemSolution />
          <Ecosystem />
          <UseCases />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? renderAuthenticatedContent() : renderPublicContent();
};

export default Index;
