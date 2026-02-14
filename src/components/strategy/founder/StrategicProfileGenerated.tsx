import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Cpu, Crosshair, Shield, 
  ArrowRight, Expand, CheckCircle2, Dna
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayToWinStrategy } from '@/types/playToWin';
import confetti from 'canvas-confetti';

interface StrategicProfileGeneratedProps {
  companyName?: string;
  strategy: PlayToWinStrategy | null;
  onGoToADN: () => void;
  onExpandStrategy: () => void;
}

export default function StrategicProfileGenerated({ 
  companyName, 
  strategy,
  onGoToADN,
  onExpandStrategy
}: StrategicProfileGeneratedProps) {
  const { t } = useTranslation();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const summaryItems = [
    {
      icon: Cpu,
      title: t('journey.sdna.summaryMission', 'Core Mission Logic'),
      content: strategy?.winningAspiration || t('journey.sdna.notDefined', 'No definido'),
      color: 'text-blue-600'
    },
    {
      icon: Crosshair,
      title: t('journey.sdna.summaryTarget', 'Target Market'),
      content: strategy?.targetSegments?.[0]?.name || t('journey.sdna.notDefined', 'No definido'),
      color: 'text-emerald-600'
    },
    {
      icon: Shield,
      title: t('journey.sdna.summaryPositioning', 'Competitive Positioning'),
      content: strategy?.competitiveAdvantage || t('journey.sdna.notDefined', 'No definido'),
      color: 'text-purple-600'
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
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg"
          >
            <Dna className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t('journey.sdna.profileGenerated', 'Strategic Operating Profile Generated')}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              {companyName 
                ? t('journey.sdna.profileGeneratedSub', 'El perfil estratégico de {{company}} está activo.', { company: companyName })
                : t('journey.sdna.profileGeneratedSubGeneric', 'Tu perfil estratégico operativo está activo.')
              }
            </p>
          </motion.div>
        </div>

        {/* Strategic Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dna className="h-5 w-5 text-primary" />
                {t('journey.sdna.strategicDNA', 'Strategic DNA')}
              </CardTitle>
              <CardDescription>
                {t('journey.sdna.strategicDNADesc', 'Los 3 pilares operativos de tu negocio')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {summaryItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className={`p-2 rounded-lg bg-background ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">{item.content}</div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <div className="text-center space-y-2">
                <p className="font-mono text-sm text-primary">
                  {t('journey.sdna.systemStatus', 'SISTEMA: ACTIVADO')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('journey.sdna.systemStatusDesc', 'Los módulos de IA ahora operan con tu perfil estratégico. Todas las decisiones autónomas están calibradas.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button size="lg" onClick={onGoToADN} className="gap-2 h-auto py-4">
              <ArrowRight className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">{t('journey.sdna.goToADN', 'Configurar ADN Completo')}</div>
                <div className="text-xs opacity-80">{t('journey.sdna.goToADNHint', 'Marca, canales, productos')}</div>
              </div>
            </Button>
            <Button size="lg" variant="outline" onClick={onExpandStrategy} className="gap-2 h-auto py-4">
              <Expand className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">{t('journey.sdna.expandStrategy', 'Expandir Estrategia')}</div>
                <div className="text-xs opacity-80">{t('journey.sdna.expandStrategyHint', 'Capacidades y sistemas')}</div>
              </div>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
