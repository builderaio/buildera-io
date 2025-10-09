import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain,
  Users,
  BarChart3,
  Target,
  Lightbulb
} from "lucide-react";

interface StrategyGenerationLoaderProps {
  isVisible: boolean;
}

const marketingTips = [
  {
    icon: Brain,
    tip: "El 60% de las empresas que usan estrategias de marketing planificadas logran sus objetivos"
  },
  {
    icon: Users,
    tip: "Conocer a tu audiencia aumenta la efectividad de tus campañas en un 73%"
  },
  {
    icon: Target,
    tip: "Las empresas con estrategia clara tienen 313% más probabilidades de éxito"
  },
  {
    icon: BarChart3,
    tip: "El contenido personalizado genera 6 veces más conversiones"
  },
  {
    icon: Lightbulb,
    tip: "La consistencia en redes sociales aumenta el engagement hasta un 67%"
  }
];

export function StrategyGenerationLoader({ 
  isVisible
}: StrategyGenerationLoaderProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const CurrentTipIcon = marketingTips[currentTipIndex].icon;

  useEffect(() => {
    if (!isVisible) {
      setCurrentTipIndex(0);
      return;
    }

    // Rotate tips every 8 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % marketingTips.length);
    }, 8000);

    return () => {
      clearInterval(tipInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
          <CardContent className="p-12 space-y-8">
            {/* Header with animated icon */}
            <div className="text-center space-y-4">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
              >
                <Brain className="h-16 w-16 text-primary" />
              </motion.div>
              
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Generando tu Estrategia de Marketing
                </h2>
                <p className="text-muted-foreground mt-3 text-lg">
                  Nuestra IA está analizando datos y creando una estrategia personalizada para ti
                </p>
              </div>
            </div>

            {/* Marketing Tip */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary/20"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 rounded-full bg-primary/20">
                    <CurrentTipIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
                      Sabías que...
                    </p>
                    <p className="text-base text-foreground font-medium">
                      {marketingTips[currentTipIndex].tip}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Loading indicator dots */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
