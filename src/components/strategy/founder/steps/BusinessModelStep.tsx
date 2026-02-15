import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Store, Building2, ArrowLeftRight, Shuffle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type BusinessModel = 'b2b' | 'b2c' | 'b2b2c' | 'mixed';

interface BusinessModelStepProps {
  value: BusinessModel | null;
  onChange: (model: BusinessModel) => void;
  onNext: () => void;
}

const MODEL_OPTIONS: { value: BusinessModel; icon: React.ComponentType<any>; labelKey: string; descKey: string }[] = [
  {
    value: 'b2b',
    icon: Building2,
    labelKey: 'journey.sdna.bm.b2b',
    descKey: 'journey.sdna.bm.b2bDesc',
  },
  {
    value: 'b2c',
    icon: Store,
    labelKey: 'journey.sdna.bm.b2c',
    descKey: 'journey.sdna.bm.b2cDesc',
  },
  {
    value: 'b2b2c',
    icon: ArrowLeftRight,
    labelKey: 'journey.sdna.bm.b2b2c',
    descKey: 'journey.sdna.bm.b2b2cDesc',
  },
  {
    value: 'mixed',
    icon: Shuffle,
    labelKey: 'journey.sdna.bm.mixed',
    descKey: 'journey.sdna.bm.mixedDesc',
  },
];

export default function BusinessModelStep({ value, onChange, onNext }: BusinessModelStepProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl">
            {t('journey.sdna.bm.title', '¿Cómo vendes principalmente?')}
          </CardTitle>
          <CardDescription className="text-base mt-1 max-w-lg mx-auto">
            {t('journey.sdna.bm.subtitle', 'Esto adaptará todas las preguntas a tu modelo de negocio real.')}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODEL_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "p-3 rounded-lg shrink-0",
                isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">{t(option.labelKey)}</p>
                <p className="text-sm text-muted-foreground mt-1">{t(option.descKey)}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!value}
          className="gap-2 px-8"
        >
          {t('common.next', 'Siguiente')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
