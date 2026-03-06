import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation('common');

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-8xl font-heading font-bold text-primary mb-4">404</h1>
          <p className="text-xl text-foreground mb-2">
            {t('notFound.title', 'Página no encontrada')}
          </p>
          <p className="text-muted-foreground mb-8">
            {t('notFound.description', 'La página que buscas no existe o ha sido movida.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('notFound.goBack', 'Volver')}
            </Button>
            <Link to="/">
              <Button className="shadow-glow w-full">
                <Home className="w-4 h-4 mr-2" />
                {t('notFound.goHome', 'Ir al inicio')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
