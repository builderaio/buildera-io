import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Play, Zap, ArrowRight } from "lucide-react";
import { PlatformAgent } from "@/hooks/usePlatformAgents";
import { motion } from "framer-motion";

interface QuickAgentsGridProps {
  agents: PlatformAgent[];
  onAgentClick: (agent: PlatformAgent) => void;
  onViewAll: () => void;
}

const isEmoji = (str: string) => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(str);
};

export const QuickAgentsGrid = ({ agents, onAgentClick, onViewAll }: QuickAgentsGridProps) => {
  const displayAgents = agents.slice(0, 4);

  if (displayAgents.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            🤖 Agentes Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              No tienes agentes activos
            </p>
            <Button variant="outline" onClick={onViewAll}>
              Explorar Marketplace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            🤖 Agentes Rápidos
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver todos
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {displayAgents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                className="w-full p-3 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 text-left group"
                onClick={() => onAgentClick(agent)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {agent.icon && isEmoji(agent.icon) ? (
                      <span className="text-lg">{agent.icon}</span>
                    ) : (
                      <Bot className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{agent.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-muted-foreground">
                        {agent.credits_per_use || 1} cr
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Play className="w-3 h-3" />
                    Ejecutar
                  </Badge>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
