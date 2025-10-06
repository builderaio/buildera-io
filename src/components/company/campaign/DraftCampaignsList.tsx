import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Trash2, 
  Play, 
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  PenTool,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DraftCampaign {
  id: string;
  company_name: string;
  business_objective: string;
  status: string;
  current_step: string;
  is_draft: boolean;
  draft_data: any;
  last_saved_at: string;
  created_at: string;
}

interface DraftCampaignsListProps {
  drafts: DraftCampaign[];
  onResume: (draft: DraftCampaign) => void;
  onDelete: (draftId: string) => void;
  loading: boolean;
}

const getStepInfo = (stepName: string) => {
  const steps = {
    objective: { name: 'Objetivo', icon: Target, color: 'text-blue-600', progress: 14 },
    audience: { name: 'Audiencia', icon: TrendingUp, color: 'text-green-600', progress: 28 },
    strategy: { name: 'Estrategia', icon: BarChart3, color: 'text-purple-600', progress: 42 },
    calendar: { name: 'Calendario', icon: Calendar, color: 'text-orange-600', progress: 57 },
    content: { name: 'Contenido', icon: PenTool, color: 'text-pink-600', progress: 71 },
    schedule: { name: 'Programación', icon: Clock, color: 'text-indigo-600', progress: 85 },
    measurement: { name: 'Resumen', icon: CheckCircle, color: 'text-green-600', progress: 100 }
  };
  
  return steps[stepName as keyof typeof steps] || steps.objective;
};

export const DraftCampaignsList = ({ 
  drafts, 
  onResume, 
  onDelete, 
  loading 
}: DraftCampaignsListProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Cargando campañas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No tienes campañas en progreso
            </h3>
            <p className="text-sm text-muted-foreground">
              Crea tu primera campaña inteligente para comenzar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Campañas en Progreso ({drafts.length})</h3>
      </div>

      {drafts.map((draft) => {
        const stepInfo = getStepInfo(draft.current_step);
        const IconComponent = stepInfo.icon;
        const timeAgo = formatDistanceToNow(new Date(draft.last_saved_at), {
          addSuffix: true,
          locale: es
        });

        return (
          <Card 
            key={draft.id} 
            className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => onResume(draft)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${stepInfo.color === 'text-blue-600' ? 'bg-blue-100' : 
                      stepInfo.color === 'text-green-600' ? 'bg-green-100' :
                      stepInfo.color === 'text-purple-600' ? 'bg-purple-100' :
                      stepInfo.color === 'text-orange-600' ? 'bg-orange-100' :
                      stepInfo.color === 'text-pink-600' ? 'bg-pink-100' :
                      stepInfo.color === 'text-indigo-600' ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${stepInfo.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-base mb-1">
                        {draft.draft_data?.objective?.name || draft.company_name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {draft.business_objective}
                      </p>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {stepInfo.name}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all"
                          style={{ width: `${stepInfo.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stepInfo.progress}% completado
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResume(draft);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Continuar
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(draft.id);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};