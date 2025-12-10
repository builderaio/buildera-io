import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Brain, 
  TrendingUp, 
  Palette, 
  Calendar, 
  Image, 
  BarChart3, 
  MessageSquare, 
  Target,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const agents = [
  {
    id: "strategist",
    icon: Brain,
    category: "strategy",
    color: "from-primary to-primary/70",
  },
  {
    id: "content",
    icon: MessageSquare,
    category: "content",
    color: "from-secondary to-secondary/70",
  },
  {
    id: "calendar",
    icon: Calendar,
    category: "content",
    color: "from-accent to-accent/70",
  },
  {
    id: "insights",
    icon: BarChart3,
    category: "analytics",
    color: "from-primary to-accent",
  },
  {
    id: "brand",
    icon: Palette,
    category: "brand",
    color: "from-secondary to-primary",
  },
  {
    id: "image",
    icon: Image,
    category: "content",
    color: "from-accent to-secondary",
  },
  {
    id: "audience",
    icon: Target,
    category: "analytics",
    color: "from-primary/80 to-secondary/80",
  },
  {
    id: "optimizer",
    icon: TrendingUp,
    category: "strategy",
    color: "from-secondary/80 to-accent/80",
  },
];

const categoryColors: Record<string, string> = {
  strategy: "bg-primary/10 text-primary border-primary/20",
  content: "bg-secondary/10 text-secondary border-secondary/20",
  analytics: "bg-accent/10 text-accent border-accent/20",
  brand: "bg-primary/10 text-primary border-primary/20",
};

const AgentShowcase = () => {
  const { t } = useTranslation('landing');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t('agentShowcase.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            {t('agentShowcase.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('agentShowcase.subtitle')}
          </p>
        </motion.div>

        {/* Agents grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <agent.icon className="w-7 h-7 text-white" />
              </div>

              {/* Category badge */}
              <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${categoryColors[agent.category]} mb-3`}>
                {t(`agentShowcase.categories.${agent.category}`)}
              </span>

              {/* Agent info */}
              <h3 className="font-heading font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {t(`agentShowcase.agents.${agent.id}.name`)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`agentShowcase.agents.${agent.id}.description`)}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <a href="/auth?mode=signup&userType=company">
            <Button variant="outline" size="lg" className="group">
              {t('agentShowcase.cta')}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default AgentShowcase;
