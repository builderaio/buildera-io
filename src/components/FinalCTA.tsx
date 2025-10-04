import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  const { t } = useTranslation('landing');
  return (
    <section id="contacto" className="bg-primary text-primary-foreground py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-heading">
          {t('finalCta.title')}
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
          {t('finalCta.description')}
        </p>
        <div className="mt-8">
          <a href="/auth?mode=register&userType=company">
            <Button 
              variant="secondary" 
              size="xl"
              className="bg-background text-primary hover:bg-background/90 shadow-glow"
            >
              {t('finalCta.button')}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;