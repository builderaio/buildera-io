import { useEffect } from "react";

import Hero from "@/components/Hero";
import AutonomousEnterprise from "@/components/home/AutonomousEnterprise";

import HowItWorks from "@/components/home/HowItWorks";
import BusinessImpact from "@/components/home/BusinessImpact";
import AutonomyDashboardPreview from "@/components/home/AutonomyDashboardPreview";
import ProductArchitecture from "@/components/home/ProductArchitecture";
import CapabilityGenesis from "@/components/home/CapabilityGenesis";
import WhatWeDoNot from "@/components/home/WhatWeDoNot";
import ValueHighlights from "@/components/home/ValueHighlights";
import AgentsInAction from "@/components/home/AgentsInAction";
import UseCases from "@/components/UseCases";
import EcosystemSolution from "@/components/home/EcosystemSolution";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const Index = () => {
  useEffect(() => {
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
        <AutonomousEnterprise />
        <HowItWorks />
        <BusinessImpact />
        <AutonomyDashboardPreview />
        <ProductArchitecture />
        <CapabilityGenesis />
        
        <ValueHighlights />
        <AgentsInAction />
        <WhatWeDoNot />
        <UseCases />
        <EcosystemSolution />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
