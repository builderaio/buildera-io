import { motion } from "framer-motion";
import { Brain, Lightbulb, Sparkles, Zap, Target, TrendingUp, Video, Image, Type } from "lucide-react";

interface Props {
  type: 'insights' | 'content' | 'image' | 'video';
  isVisible: boolean;
  currentStep?: string;
}

const loaderConfig = {
  insights: {
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    steps: [
      "Analizando tu audiencia...",
      "Identificando patrones de contenido...", 
      "Generando insights personalizados...",
      "Creando ideas específicas...",
      "Optimizando para tu mercado..."
    ]
  },
  content: {
    icon: Type,
    color: "text-blue-500", 
    bgColor: "bg-blue-500/20",
    steps: [
      "Creando contenido atractivo...",
      "Optimizando el copy...",
      "Añadiendo elementos visuales...",
      "Personalizando para tu audiencia...",
      "Finalizando el post..."
    ]
  },
  image: {
    icon: Image,
    color: "text-green-500",
    bgColor: "bg-green-500/20", 
    steps: [
      "Interpretando tu concepto...",
      "Generando elementos visuales...",
      "Aplicando estilo de marca...",
      "Optimizando composición...",
      "Creando imagen final..."
    ]
  },
  video: {
    icon: Video,
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    steps: [
      "Conceptualizando el video...",
      "Generando storyboard...",
      "Creando elementos visuales...",
      "Sincronizando audio...",
      "Renderizando video final..."
    ]
  }
};

export default function ContentCreationLoader({ type, isVisible, currentStep }: Props) {
  const config = loaderConfig[type];
  const IconComponent = config.icon;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center p-8 space-y-4"
    >
      {/* Animated Icon */}
      <div className={`relative ${config.bgColor} rounded-full p-4`}>
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity }
          }}
        >
          <IconComponent className={`w-8 h-8 ${config.color}`} />
        </motion.div>
        
        {/* Orbiting particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 ${config.bgColor} rounded-full`}
            animate={{
              rotate: 360,
              x: [20, -20, 20],
              y: [20, -20, 20],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
            style={{
              transformOrigin: "0 0"
            }}
          />
        ))}
      </div>

      {/* Dynamic text */}
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.h3 
          className="text-lg font-semibold text-foreground"
          key={currentStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep || config.steps[0]}
        </motion.h3>
        
        <div className="flex items-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 ${config.color.replace('text-', 'bg-')} rounded-full`}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${config.color.replace('text-', 'bg-')} rounded-full`}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}