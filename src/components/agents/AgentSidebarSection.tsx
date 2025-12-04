import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Zap, Star, Lock, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { PlatformAgent, usePlatformAgents } from "@/hooks/usePlatformAgents";
import { useTranslation } from "react-i18next";

interface AgentSidebarSectionProps {
  companyId?: string;
  onAgentClick: (agent: PlatformAgent) => void;
}

const categoryConfig: Record<string, { icon: string; label: string; labelKey: string }> = {
  strategy: { icon: "🧠", label: "Estrategia", labelKey: "strategy" },
  content: { icon: "🎨", label: "Contenido", labelKey: "content" },
  analytics: { icon: "📊", label: "Analytics", labelKey: "analytics" },
  branding: { icon: "✨", label: "Branding", labelKey: "branding" },
  assistant: { icon: "💬", label: "Asistente", labelKey: "assistant" },
  publishing: { icon: "📤", label: "Publicación", labelKey: "publishing" },
};

export const AgentSidebarSection = ({ companyId, onAgentClick }: AgentSidebarSectionProps) => {
  const { t } = useTranslation(['common']);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { agents, enabledAgents, loading, isAgentEnabled } = usePlatformAgents(companyId);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    strategy: true,
    content: true,
    analytics: false,
    branding: false,
    assistant: false,
    publishing: false,
  });

  // Group agents by category
  const agentsByCategory = agents.reduce((acc, agent) => {
    const category = agent.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(agent);
    return acc;
  }, {} as Record<string, PlatformAgent[]>);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          {!isCollapsed && <span>{t('common:sidebar.aiAgents', 'Agentes IA')}</span>}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-center">
            <div className="animate-pulse flex flex-col gap-2">
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const categories = Object.keys(agentsByCategory).sort((a, b) => {
    const order = ['strategy', 'content', 'analytics', 'branding', 'assistant', 'publishing'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2 text-primary font-semibold">
        <span className="text-lg">🤖</span>
        {!isCollapsed && (
          <>
            <span>{t('common:sidebar.aiAgents', 'Agentes IA')}</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {enabledAgents.length}/{agents.length}
            </Badge>
          </>
        )}
      </SidebarGroupLabel>
      
      <SidebarGroupContent>
        {categories.map((category) => {
          const config = categoryConfig[category] || { icon: "🤖", label: category, labelKey: category };
          const categoryAgents = agentsByCategory[category];
          const enabledInCategory = categoryAgents.filter(a => isAgentEnabled(a.id)).length;
          
          if (isCollapsed) {
            // In collapsed mode, show just icons
            return (
              <SidebarMenu key={category}>
                {categoryAgents.slice(0, 3).map((agent) => (
                  <SidebarMenuItem key={agent.id}>
                    <SidebarMenuButton
                      onClick={() => onAgentClick(agent)}
                      tooltip={`${agent.name} (${agent.credits_per_use} cr)`}
                      className={!isAgentEnabled(agent.id) ? "opacity-50" : ""}
                    >
                      <span className="text-base">{config.icon}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            );
          }

          return (
            <Collapsible
              key={category}
              open={openCategories[category]}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors">
                <span>{config.icon}</span>
                <span className="flex-1 text-left">
                  {t(`common:agentCategories.${config.labelKey}`, config.label)}
                </span>
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  {enabledInCategory}/{categoryAgents.length}
                </Badge>
                {openCategories[category] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <SidebarMenu className="ml-4 mt-1 border-l border-border/50 pl-2">
                  {categoryAgents.map((agent) => {
                    const enabled = isAgentEnabled(agent.id);
                    
                    return (
                      <SidebarMenuItem key={agent.id}>
                        <SidebarMenuButton
                          onClick={() => onAgentClick(agent)}
                          className={`text-xs py-1.5 ${!enabled ? "opacity-60" : ""}`}
                          tooltip={agent.description}
                        >
                          <span className="flex-1 truncate">{agent.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground flex items-center">
                              <Zap className="w-2.5 h-2.5 mr-0.5" />
                              {agent.credits_per_use}
                            </span>
                            {agent.is_premium && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            )}
                            {!enabled && (
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default AgentSidebarSection;
