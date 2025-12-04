import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Star, Lock } from "lucide-react";
import { PlatformAgent } from "@/hooks/usePlatformAgents";
import { useTranslation } from "react-i18next";

interface AgentCardProps {
  agent: PlatformAgent;
  isEnabled: boolean;
  onExecute: () => void;
  onEnable?: () => void;
  compact?: boolean;
}

const categoryIcons: Record<string, string> = {
  strategy: "🧠",
  content: "🎨",
  analytics: "📊",
  branding: "✨",
  assistant: "💬",
  publishing: "📤",
};

const categoryColors: Record<string, string> = {
  strategy: "from-blue-500 to-indigo-600",
  content: "from-purple-500 to-pink-500",
  analytics: "from-emerald-500 to-teal-500",
  branding: "from-amber-500 to-orange-500",
  assistant: "from-cyan-500 to-blue-500",
  publishing: "from-green-500 to-emerald-500",
};

export const AgentCard = ({ agent, isEnabled, onExecute, onEnable, compact = false }: AgentCardProps) => {
  const { t } = useTranslation(['common']);
  
  const categoryIcon = categoryIcons[agent.category] || "🤖";
  const categoryColor = categoryColors[agent.category] || "from-gray-500 to-gray-600";

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isEnabled 
            ? "bg-sidebar-accent/50 hover:bg-sidebar-accent" 
            : "bg-muted/30 hover:bg-muted/50 opacity-70"
        }`}
        onClick={isEnabled ? onExecute : onEnable}
      >
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${categoryColor} flex items-center justify-center text-white text-sm shadow-md`}>
          {categoryIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {agent.credits_per_use} cr
            </span>
            {agent.is_premium && (
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            )}
          </div>
        </div>
        {!isEnabled && <Lock className="w-4 h-4 text-muted-foreground" />}
      </div>
    );
  }

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      !isEnabled ? "opacity-70" : ""
    }`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryColor} opacity-5 group-hover:opacity-10 transition-opacity`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColor} flex items-center justify-center text-white text-xl shadow-lg`}>
            {categoryIcon}
          </div>
          <div className="flex items-center gap-2">
            {agent.is_premium && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Premium
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {agent.credits_per_use} {t('common:credits', 'créditos')}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg mt-3">{agent.name}</CardTitle>
        <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <Button 
              className="flex-1" 
              onClick={onExecute}
            >
              <Zap className="w-4 h-4 mr-2" />
              {t('common:execute', 'Ejecutar')}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onEnable}
            >
              <Lock className="w-4 h-4 mr-2" />
              {t('common:enable', 'Habilitar')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCard;
