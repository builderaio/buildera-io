import SubscriptionPlans from "@/components/SubscriptionPlans";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useGTM } from "@/hooks/useGTM";

const Pricing = () => {
  useGTM();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubscriptionPlans />
      <Footer />
    </div>
  );
};

export default Pricing;