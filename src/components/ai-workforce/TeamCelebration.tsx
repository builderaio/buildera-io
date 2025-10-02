import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Users, Zap, Trophy, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TeamCelebrationProps {
  teamName: string;
  agentCount: number;
  onComplete: () => void;
}

export const TeamCelebration = ({ teamName, agentCount, onComplete }: TeamCelebrationProps) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 1000),
      setTimeout(() => setStep(3), 1800),
      setTimeout(() => setStep(4), 2600),
      setTimeout(() => onComplete(), 4000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const metrics = [
    { 
      icon: Users, 
      label: "Miembros del Equipo", 
      value: agentCount,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      icon: Zap, 
      label: "Capacidad de Ejecución", 
      value: "+300%",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    { 
      icon: TrendingUp, 
      label: "Productividad Estimada", 
      value: "+500%",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      icon: Target, 
      label: "Misiones Activas", 
      value: "1",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="loading"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="text-center"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-12 h-12 text-white animate-pulse" />
            </div>
            <p className="text-xl font-semibold">Activando tu equipo...</p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="success"
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: -50, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="text-center max-w-2xl px-6"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center mb-6 mx-auto"
            >
              <Trophy className="w-16 h-16 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
            >
              ¡Equipo Creado Exitosamente!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-muted-foreground mb-2"
            >
              <strong className="text-foreground">{teamName}</strong> está listo para trabajar
            </motion.p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="max-w-4xl px-6 w-full"
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2">Tu Negocio Está Creciendo</h3>
              <p className="text-muted-foreground">Mira el impacto de tu nuevo equipo</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-6 text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.1 + 0.2, type: "spring" }}
                          className={`w-16 h-16 rounded-full ${metric.bgColor} flex items-center justify-center mx-auto mb-3`}
                        >
                          <Icon className={`w-8 h-8 ${metric.color}`} />
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.1 + 0.3, type: "spring" }}
                          className="text-3xl font-bold mb-1"
                        >
                          {metric.value}
                        </motion.div>
                        <div className="text-xs text-muted-foreground">
                          {metric.label}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {step >= 3 && (
          <motion.div
            key="final"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center max-w-2xl px-6"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Sparkles className="w-20 h-20 mx-auto mb-6 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-4">
              ¡Comienza a Asignar Misiones!
            </h3>
            <p className="text-muted-foreground">
              Tu equipo está listo para ejecutar tareas y hacer crecer tu negocio
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Effect */}
      {step >= 1 && step <= 3 && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: -20,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: window.innerHeight + 20,
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "linear",
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: [
                  "hsl(var(--primary))",
                  "#10b981",
                  "#f59e0b",
                  "#8b5cf6",
                  "#ec4899",
                ][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
