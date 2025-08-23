import SubscriptionPlans from "@/components/SubscriptionPlans";
import Footer from "@/components/Footer";
import { useGTM } from "@/hooks/useGTM";

const Pricing = () => {
  useGTM();
  return (
    <div className="min-h-screen bg-background">
      <SubscriptionPlans />
      <Footer />
    </div>
  );
};

export default Pricing;