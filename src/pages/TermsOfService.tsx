import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGTM } from "@/hooks/useGTM";
import { useTranslation } from "react-i18next";

const TermsOfService = () => {
  useGTM();
  const { t } = useTranslation('legal');

  const section3Items = t('terms.section3Items', { returnObjects: true }) as string[];
  const section4Items = t('terms.section4Items', { returnObjects: true }) as string[];
  const section7Items = t('terms.section7Items', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToHome')}
              </Button>
            </Link>
            <h1 className="text-4xl font-heading font-bold text-primary mb-4">
              {t('terms.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('terms.lastUpdated')}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section1Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('terms.section1Content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section2Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('terms.section2Content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section3Title')}</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{t('terms.section3Intro')}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  {Array.isArray(section3Items) && section3Items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section4Title')}</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{t('terms.section4Intro')}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  {Array.isArray(section4Items) && section4Items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section5Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('terms.section5Content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section6Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms.section6Content')}
                <Link to="/privacy-policy" className="text-primary hover:underline"> {t('terms.section6Link')}</Link>
                {t('terms.section6Suffix')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section7Title')}</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{t('terms.section7Intro')}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  {Array.isArray(section7Items) && section7Items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section8Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('terms.section8Content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section9Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('terms.section9Content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section10Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('terms.section10Content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section11Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('terms.section11Content')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section12Title')}</h2>
              <p className="text-muted-foreground leading-relaxed">{t('terms.section12Content')}</p>
              <div className="mt-4 text-muted-foreground">
                <p>{t('terms.companyName')}</p>
                <p>{t('terms.companyEmail')}</p>
                <p>{t('terms.companyCountry')}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
