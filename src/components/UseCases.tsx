import { useTranslation } from "react-i18next";

const UseCases = () => {
  const { t } = useTranslation('landing');

  const useCases = [
    {
      id: 'socialMedia',
      color: 'primary',
      featureCount: 3
    },
    {
      id: 'customerService',
      color: 'secondary',
      featureCount: 3
    },
    {
      id: 'sales',
      color: 'accent',
      featureCount: 3
    },
    {
      id: 'ecommerce',
      color: 'primary',
      featureCount: 3
    },
    {
      id: 'professionalServices',
      color: 'secondary',
      featureCount: 3
    },
    {
      id: 'education',
      color: 'accent',
      featureCount: 3
    }
  ];

  return (
    <section id="casos-de-uso" className="py-16 scroll-mt-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading text-primary">{t('useCases.title')}</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            {t('useCases.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase) => {
            const features = t(`useCases.cases.${useCase.id}.features`, { returnObjects: true });
            const featuresArray = Array.isArray(features) ? features : [];
            
            return (
              <article key={useCase.id} className="growth-card p-6">
                <h3 className={`font-heading text-xl mb-2 text-${useCase.color}`}>
                  {t(`useCases.cases.${useCase.id}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t(`useCases.cases.${useCase.id}.description`)}
                </p>
                <ul className="space-y-2 text-sm">
                  {featuresArray.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
