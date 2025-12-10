import { useEffect } from "react";

import Hero from "@/components/Hero";
import AgentShowcase from "@/components/home/AgentShowcase";
import HowItWorks from "@/components/home/HowItWorks";
import ValueHighlights from "@/components/home/ValueHighlights";
import AgentsInAction from "@/components/home/AgentsInAction";
import UseCases from "@/components/UseCases";
import EcosystemSolution from "@/components/home/EcosystemSolution";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const Index = () => {
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
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <AgentShowcase />
        <HowItWorks />
        <ValueHighlights />
        <AgentsInAction />
        <UseCases />
        <EcosystemSolution />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
