import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  PartyPopper, Trophy, Users, Zap, 
  ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayToWinStrategy } from '@/types/playToWin';
import confetti from 'canvas-confetti';

interface FounderCompletionScreenProps {
  companyName?: string;
  strategy: PlayToWinStrategy | null;
  onGoToADN: () => void;
}

export default function FounderCompletionScreen({ 
  companyName, 
  strategy,
  onGoToADN
}: FounderCompletionScreenProps) {
  const { t } = useTranslation();

  // Trigger confetti on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const summaryItems = [
    {
      icon: Trophy,
      title: t('journey.founder.summaryAspiration', 'Tu Visión'),
      content: strategy?.winningAspiration || t('journey.founder.notDefined', 'No definido'),
      color: 'text-yellow-600'
    },
    {
      icon: Users,
      title: t('journey.founder.summaryCustomer', 'Tu Cliente'),
      content: strategy?.targetSegments?.[0]?.name || t('journey.founder.notDefined', 'No definido'),
      color: 'text-blue-600'
    },
    {
      icon: Zap,
      title: t('journey.founder.summaryDifferentiator', 'Tu Diferenciador'),
      content: strategy?.competitiveAdvantage || t('journey.founder.notDefined', 'No definido'),
      color: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full space-y-6"
      >
        {/* Success Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg"
          >
            <PartyPopper className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t('journey.founder.completionTitle', '¡Felicidades!')} 🎉
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              {companyName 
                ? t('journey.founder.completionSubtitle', 'Tu estrategia para {{company}} está lista', { company: companyName })
                : t('journey.founder.completionSubtitleGeneric', 'Tu estrategia inicial está lista')
              }
            </p>
          </motion.div>
        </div>

        {/* Strategy Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('journey.founder.summaryTitle', 'Resumen de tu Estrategia')}
              </CardTitle>
              <CardDescription>
                {t('journey.founder.summaryDescription', 'Estos son los pilares de tu negocio')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {summaryItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className={`p-2 rounded-lg bg-background ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {item.content}
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <h3 className="font-semibold text-center">
            {t('journey.founder.nextStepsTitle', '¿Qué quieres hacer ahora?')}
          </h3>
          
          <Button
            size="lg"
            onClick={onGoToADN}
            className="gap-2 h-auto py-4 w-full"
          >
            <ArrowRight className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">
                {t('journey.founder.goToADN', 'Configurar mi Negocio')}
              </div>
              <div className="text-xs opacity-80">
                {t('journey.founder.goToADNHint', 'Completar perfil de empresa')}
              </div>
            </div>
          </Button>
        </motion.div>

        {/* Encouragement */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-muted-foreground"
        >
          {t('journey.founder.encouragement', 'Has dado el primer paso más importante. Ahora es momento de ejecutar. 🚀')}
        </motion.p>
      </motion.div>
    </div>
  );
}
