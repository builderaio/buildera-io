import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

import Hero from "@/components/Hero";
import ValueHighlights from "@/components/home/ValueHighlights";
import ProblemSolution from "@/components/ProblemSolution";
import EcosystemSolution from "@/components/home/EcosystemSolution";
import UseCases from "@/components/UseCases";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import OnboardingRedirect from "@/components/OnboardingRedirect";
import Header from "@/components/Header";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    // Load Metricool tracking script
    const loadMetricoolScript = () => {
      const head = document.getElementsByTagName("head")[0];
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://tracker.metricool.com/resources/be.js";
      script.onload = function() {
        if ((window as any).beTracker) {
          (window as any).beTracker.t({hash: "d763705f07d529b5064557dd6979948e"});
        }
      };
      head.appendChild(script);
    };

    loadMetricoolScript();

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // For authenticated users, show onboarding redirect component
      // which will handle all the complex logic
      if (session?.user) {
        setShouldShowOnboarding(true);
      }
      
      setLoading(false);
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setShouldShowOnboarding(true);
      } else {
        setShouldShowOnboarding(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Renderizar landing page para usuarios no autenticados
  const renderPublicContent = () => {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <ValueHighlights />
          <ProblemSolution />
          <EcosystemSolution />
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

  // Si debe mostrar onboarding, usar el componente de redirección
  if (shouldShowOnboarding && user) {
    return <OnboardingRedirect user={user} />;
  }

  // Solo mostrar landing page para usuarios no autenticados
  return renderPublicContent();
};

export default Index;
