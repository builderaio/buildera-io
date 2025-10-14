import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, TrendingUp, Sparkles } from "lucide-react";

interface InsightsFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: {
    all: number;
    active: number;
    completed: number;
    dismissed: number;
    audience: number;
    content_ideas: number;
  };
}

export const InsightsFilters = ({
  activeFilter,
  onFilterChange,
  counts
}: InsightsFiltersProps) => {
  const filters = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'active', label: 'Activos', count: counts.active },
    { id: 'completed', label: 'Completados', count: counts.completed },
    { id: 'dismissed', label: 'Descartados', count: counts.dismissed },
    { id: 'audience', label: 'Audiencia', count: counts.audience, icon: TrendingUp },
    { id: 'content_ideas', label: 'Ideas de Contenido', count: counts.content_ideas, icon: Sparkles },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap bg-card/50 p-4 rounded-lg border">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="w-4 h-4" />
        Filtrar:
      </div>
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={`transition-all ${isActive ? 'scale-105 shadow-md' : 'hover:scale-105'}`}
          >
            {Icon && <Icon className="w-3 h-3 mr-2" />}
            {filter.label}
            <Badge 
              variant={isActive ? "secondary" : "outline"}
              className="ml-2 min-w-[20px] justify-center"
            >
              {filter.count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
};
