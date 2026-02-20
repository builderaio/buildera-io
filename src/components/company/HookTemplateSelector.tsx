import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Sparkles, TrendingUp, Star, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HookTemplate {
  id: string;
  tier: number;
  tier_name: string;
  hook_text: string;
  hook_description: string;
  category: string;
  platform_optimized: string[];
  views_reference: string | null;
}

interface Props {
  onSelect: (hookText: string) => void;
  selectedPlatforms?: string[];
  industrySector?: string;
}

const TIER_CONFIG: Record<number, { icon: React.ReactNode; color: string; label: string }> = {
  1: { icon: <Star className="h-3 w-3" />, color: "bg-yellow-500/10 text-yellow-700 border-yellow-300", label: "Tier 1 — Viral" },
  2: { icon: <TrendingUp className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-700 border-blue-300", label: "Tier 2 — Relatable" },
  3: { icon: <Zap className="h-3 w-3" />, color: "bg-green-500/10 text-green-700 border-green-300", label: "Tier 3 — Direct" },
};

const CATEGORY_MAP: Record<string, string> = {
  general: "general",
  home: "home",
  beauty: "beauty",
  fitness: "fitness",
  productivity: "productivity",
  food: "food",
};

export default function HookTemplateSelector({ onSelect, selectedPlatforms = [], industrySector }: Props) {
  const { t, i18n } = useTranslation('marketing');
  const [hooks, setHooks] = useState<HookTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && hooks.length === 0) {
      fetchHooks();
    }
  }, [isOpen]);

  const fetchHooks = async () => {
    setLoading(true);
    try {
      const lang = i18n.language?.substring(0, 2) || 'es';
      const { data, error } = await supabase
        .from('marketing_hook_templates')
        .select('*')
        .eq('is_active', true)
        .eq('language', lang)
        .order('tier')
        .order('sort_order');

      if (error) throw error;
      setHooks((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching hooks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHooks = hooks.filter(h => {
    if (categoryFilter !== "all" && h.category !== categoryFilter) return false;
    if (selectedPlatforms.length > 0) {
      const hasOverlap = h.platform_optimized?.some(p => selectedPlatforms.includes(p));
      if (!hasOverlap && h.platform_optimized?.length > 0) return false;
    }
    return true;
  });

  const groupedByTier = filteredHooks.reduce((acc, h) => {
    if (!acc[h.tier]) acc[h.tier] = [];
    acc[h.tier].push(h);
    return acc;
  }, {} as Record<number, HookTemplate[]>);

  const inferredCategory = industrySector
    ? Object.keys(CATEGORY_MAP).find(k => industrySector.toLowerCase().includes(k)) || "all"
    : "all";

  useEffect(() => {
    if (inferredCategory !== "all" && categoryFilter === "all") {
      setCategoryFilter(inferredCategory);
    }
  }, [inferredCategory]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs gap-2">
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
            {t('hooks.useViralHook', '🔥 Usar hook viral probado')}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-7 text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('hooks.allCategories', 'Todas')}</SelectItem>
                <SelectItem value="general">{t('hooks.general', 'General')}</SelectItem>
                <SelectItem value="home">{t('hooks.home', 'Hogar')}</SelectItem>
                <SelectItem value="beauty">{t('hooks.beauty', 'Belleza')}</SelectItem>
                <SelectItem value="fitness">{t('hooks.fitness', 'Fitness')}</SelectItem>
                <SelectItem value="productivity">{t('hooks.productivity', 'Productividad')}</SelectItem>
                <SelectItem value="food">{t('hooks.food', 'Comida')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {t('hooks.methodology', 'Metodología Larry — 7M+ views')}
            </p>
          </div>

          <ScrollArea className="max-h-[240px]">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">{t('common:loading', 'Cargando...')}</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedByTier).map(([tier, tierHooks]) => {
                  const config = TIER_CONFIG[Number(tier)] || TIER_CONFIG[3];
                  return (
                    <div key={tier}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {config.icon}
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {config.label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {tierHooks.map(hook => (
                          <button
                            key={hook.id}
                            onClick={() => onSelect(hook.hook_text)}
                            className="w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors group border border-transparent hover:border-border"
                          >
                            <p className="text-xs font-medium group-hover:text-primary">
                              "{hook.hook_text}"
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {hook.views_reference && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                  📊 {hook.views_reference}
                                </Badge>
                              )}
                              {hook.platform_optimized?.slice(0, 3).map(p => (
                                <Badge key={p} variant="outline" className="text-[9px] h-4 px-1 capitalize">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {filteredHooks.length === 0 && !loading && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    {t('hooks.noHooksFound', 'No hay hooks para este filtro')}
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
