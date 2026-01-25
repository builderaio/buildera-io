import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, TrendingUp, Sparkles, Target, BarChart3, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type JourneyType = 'new_business' | 'existing_business';

interface JourneySelectorProps {
  onSelect: (journeyType: JourneyType) => void;
  companyName?: string;
}

const JourneySelector = ({ onSelect, companyName }: JourneySelectorProps) => {
  const { t } = useTranslation(['common']);
  const [hoveredCard, setHoveredCard] = React.useState<JourneyType | null>(null);

  const journeyOptions = [
    {
      type: 'new_business' as JourneyType,
      icon: Rocket,
      title: t('common:journey.selector.newBusiness.title', 'Estoy empezando'),
      description: t('common:journey.selector.newBusiness.description', 'Tengo una idea de negocio y quiero definir mi estrategia desde cero'),
      cta: t('common:journey.selector.newBusiness.cta', 'Comenzar mi estrategia'),
      features: [
        { icon: Lightbulb, text: t('common:journey.selector.newBusiness.feature1', 'Define tu visión y propósito') },
        { icon: Target, text: t('common:journey.selector.newBusiness.feature2', 'Identifica tu cliente ideal') },
        { icon: Sparkles, text: t('common:journey.selector.newBusiness.feature3', 'Construye tu diferenciador') }
      ],
      gradient: 'from-primary/20 via-primary/10 to-transparent',
      borderColor: 'border-primary/30 hover:border-primary',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    {
      type: 'existing_business' as JourneyType,
      icon: TrendingUp,
      title: t('common:journey.selector.existingBusiness.title', 'Mi empresa ya existe'),
      description: t('common:journey.selector.existingBusiness.description', 'Tengo un negocio activo y quiero crecer con datos e IA'),
      cta: t('common:journey.selector.existingBusiness.cta', 'Diagnosticar mi negocio'),
      features: [
        { icon: BarChart3, text: t('common:journey.selector.existingBusiness.feature1', 'Diagnóstico digital profundo') },
        { icon: Target, text: t('common:journey.selector.existingBusiness.feature2', 'Análisis de gaps vs objetivos') },
        { icon: Sparkles, text: t('common:journey.selector.existingBusiness.feature3', 'Plan de acción priorizado') }
      ],
      gradient: 'from-accent/20 via-accent/10 to-transparent',
      borderColor: 'border-accent/30 hover:border-accent',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <motion.div 
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {t('common:journey.selector.badge', 'Experiencia personalizada')}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {companyName 
              ? t('common:journey.selector.titleWithName', { name: companyName, defaultValue: `¡Bienvenido, ${companyName}!` })
              : t('common:journey.selector.title', '¡Bienvenido a Buildera!')
            }
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('common:journey.selector.subtitle', 'Personalicemos tu experiencia para maximizar los resultados de tu negocio')}
          </p>
        </motion.div>

        {/* Journey Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {journeyOptions.map((option, index) => (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all duration-300",
                  "border-2",
                  option.borderColor,
                  hoveredCard === option.type && "shadow-xl scale-[1.02]"
                )}
                onMouseEnter={() => setHoveredCard(option.type)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => onSelect(option.type)}
              >
                {/* Gradient Background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-50",
                  option.gradient
                )} />
                
                <CardContent className="relative p-6 space-y-6">
                  {/* Icon */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    option.iconBg
                  )}>
                    <option.icon className={cn("w-8 h-8", option.iconColor)} />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {option.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {option.features.map((feature, featureIndex) => (
                      <div 
                        key={featureIndex}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          option.iconBg
                        )}>
                          <feature.icon className={cn("w-4 h-4", option.iconColor)} />
                        </div>
                        <span className="text-foreground/80">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className="w-full mt-4"
                    variant={option.type === 'new_business' ? 'default' : 'outline'}
                    size="lg"
                  >
                    {option.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Help Text */}
        <motion.p 
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {t('common:journey.selector.helpText', '¿No estás seguro? No te preocupes, podrás ajustar tu experiencia más adelante.')}
        </motion.p>
      </div>
    </div>
  );
};

export default JourneySelector;
