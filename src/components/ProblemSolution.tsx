import { useTranslation } from "react-i18next";
import { X, CheckCircle } from "lucide-react";

const ProblemSolution = () => {
  const { t } = useTranslation('landing');
  return (
    <section id="como-funciona" className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading text-primary">
            {t('problem.title')}
          </h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground px-4">
            {t('problem.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* El Problema */}
          <article className="bg-muted/50 p-6 md:p-8 rounded-lg border-l-4 border-muted-foreground/30">
            <h3 className="font-heading text-xl md:text-2xl text-muted-foreground mb-4">
              {t('problem.challenges.title')}
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{t('problem.challenges.dispersed.title')}</strong> — {t('problem.challenges.dispersed.description')}
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{t('problem.challenges.expertise.title')}</strong> — {t('problem.challenges.expertise.description')}
                </span>
              </li>
              <li className="flex items-start">
                <X className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{t('problem.challenges.visibility.title')}</strong> — {t('problem.challenges.visibility.description')}
                </span>
              </li>
            </ul>
          </article>

          {/* La Solución */}
          <article className="bg-primary/5 p-6 md:p-8 rounded-lg border-l-4 border-primary shadow-card">
            <h3 className="font-heading text-xl md:text-2xl text-primary mb-4">
              {t('problem.solution.title')}
            </h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">{t('problem.solution.specialists.title')}</strong> — {t('problem.solution.specialists.description')}
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">{t('problem.solution.security.title')}</strong> — {t('problem.solution.security.description')}
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">{t('problem.solution.measurable.title')}</strong> — {t('problem.solution.measurable.description')}
                </span>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
