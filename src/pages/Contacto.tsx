import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { useGTM } from "@/hooks/useGTM";

const Contacto = () => {
  useGTM();
  const { t } = useTranslation('landing');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Contacto;
