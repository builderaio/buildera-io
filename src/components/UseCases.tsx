import { useTranslation } from "react-i18next";

const UseCases = () => {
  const { t } = useTranslation('landing');

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
          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-primary">{t('useCases.cases.socialMedia.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('useCases.cases.socialMedia.description')}</p>
            <ul className="space-y-2 text-sm">
              {(t('useCases.cases.socialMedia.features', { returnObjects: true }) as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-secondary">{t('useCases.cases.customerService.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('useCases.cases.customerService.description')}</p>
            <ul className="space-y-2 text-sm">
              {(t('useCases.cases.customerService.features', { returnObjects: true }) as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-accent">{t('useCases.cases.sales.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('useCases.cases.sales.description')}</p>
            <ul className="space-y-2 text-sm">
              {(t('useCases.cases.sales.features', { returnObjects: true }) as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-primary">{t('useCases.cases.ecommerce.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('useCases.cases.ecommerce.description')}</p>
            <ul className="space-y-2 text-sm">
              {(t('useCases.cases.ecommerce.features', { returnObjects: true }) as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-secondary">{t('useCases.cases.professionalServices.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('useCases.cases.professionalServices.description')}</p>
            <ul className="space-y-2 text-sm">
              {(t('useCases.cases.professionalServices.features', { returnObjects: true }) as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="growth-card p-6">
            <h3 className="font-heading text-xl mb-2 text-accent">{t('useCases.cases.education.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('useCases.cases.education.description')}</p>
            <ul className="space-y-2 text-sm">
              {(t('useCases.cases.education.features', { returnObjects: true }) as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
