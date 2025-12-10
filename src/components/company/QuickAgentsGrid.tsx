import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Play, Zap, ArrowRight } from "lucide-react";
import { PlatformAgent } from "@/hooks/usePlatformAgents";
import { motion } from "framer-motion";
import { AgentIconRenderer } from "@/components/agents/AgentIconRenderer";
import { useTranslation } from "react-i18next";

interface QuickAgentsGridProps {
  agents: PlatformAgent[];
  onAgentClick: (agent: PlatformAgent) => void;
  onViewAll: () => void;
}

export const QuickAgentsGrid = ({ agents, onAgentClick, onViewAll }: QuickAgentsGridProps) => {
  const { t } = useTranslation(['common']);
  const displayAgents = agents.slice(0, 4);

  if (displayAgents.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            🤖 {t('mando.quickAgents')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bot className="w-14 h-14 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {t('mando.noActiveAgents')}
            </p>
            <Button variant="outline" onClick={onViewAll}>
              {t('mando.exploreMarketplace')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            🤖 {t('mando.quickAgents')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-sm">
            {t('mando.viewAll')}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <AgentIconRenderer icon={agent.icon} size="sm" fallback="🤖" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={agent.name}>{agent.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        {agent.credits_per_use || 1} cr
                      </span>
                      <Badge variant="secondary" className="text-xs gap-1 px-2 py-0.5">
                        <Play className="w-3 h-3" />
                        {t('mando.execute')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
