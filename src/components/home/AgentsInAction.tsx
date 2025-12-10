import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Sparkles,
  ChevronRight,
  Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";

const demoAgents = [
  {
    id: "strategist",
    icon: Brain,
    color: "from-primary to-primary/70",
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
  },
  {
    id: "content",
    icon: MessageSquare,
    color: "from-secondary to-secondary/70",
    bgColor: "bg-secondary/5",
    borderColor: "border-secondary/20",
  },
  {
    id: "insights",
    icon: BarChart3,
    color: "from-accent to-accent/70",
    bgColor: "bg-accent/5",
    borderColor: "border-accent/20",
  },
];

const AgentsInAction = () => {
  const { t } = useTranslation('landing');
  const [activeAgent, setActiveAgent] = useState(demoAgents[0].id);

  const activeAgentData = demoAgents.find(a => a.id === activeAgent)!;

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background gradient */}
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
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t('agentsInAction.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            {t('agentsInAction.title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('agentsInAction.subtitle')}
          </p>
        </motion.div>

        {/* Demo container */}
        <div className="max-w-5xl mx-auto">
          {/* Agent tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {demoAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  activeAgent === agent.id
                    ? `bg-gradient-to-r ${agent.color} text-white shadow-lg`
                    : "bg-card border border-border hover:border-primary/30"
                }`}
              >
                <agent.icon className="w-4 h-4" />
                <span className="font-medium">
                  {t(`agentsInAction.demos.${agent.id}.agentName`)}
                </span>
              </button>
            ))}
          </div>

          {/* Demo content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAgent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl border ${activeAgentData.borderColor} ${activeAgentData.bgColor} p-8 md:p-12`}
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Input side */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-bold">👤</span>
                    </div>
                    <span className="font-medium text-muted-foreground">
                      {t('agentsInAction.inputLabel')}
                    </span>
                  </div>
                  
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <p className="text-lg">
                      {t(`agentsInAction.demos.${activeAgent}.input`)}
                    </p>
                  </div>
                </div>

                {/* Output side */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${activeAgentData.color} flex items-center justify-center`}>
                      <activeAgentData.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-muted-foreground">
                      {t(`agentsInAction.demos.${activeAgent}.agentName`)}
                    </span>
                  </div>
                  
                  <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                    <div className="flex items-start gap-2">
                      <Quote className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <p className="text-lg font-medium">
                        {t(`agentsInAction.demos.${activeAgent}.output.title`)}
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      {t(`agentsInAction.demos.${activeAgent}.output.content`)}
                    </p>
                    
                    {/* Output metrics */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                      {[1, 2, 3].map((num) => (
                        <span key={num} className="px-3 py-1 rounded-full bg-muted text-sm">
                          {t(`agentsInAction.demos.${activeAgent}.output.tags.${num}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <a href="/auth?mode=signup&userType=company">
              <Button variant="hero" size="lg" className="group">
                {t('agentsInAction.cta')}
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AgentsInAction;
