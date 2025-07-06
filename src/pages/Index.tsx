import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import Ecosystem from "@/components/Ecosystem";
import UseCases from "@/components/UseCases";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
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

export default Index;
