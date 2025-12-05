import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { CompanyState, AreaStatus, MaturityLevel } from "@/hooks/useCompanyState";
import { useTranslation } from "react-i18next";

interface CompanyStateCardProps {
  state: CompanyState;
}

const maturityLabels: Record<MaturityLevel, { label: string; color: string; emoji: string }> = {
  starter: { label: 'Iniciando', color: 'bg-slate-500', emoji: '🌱' },
  growing: { label: 'Creciendo', color: 'bg-emerald-500', emoji: '🌿' },
  established: { label: 'Establecido', color: 'bg-blue-500', emoji: '🌳' },
  scaling: { label: 'Escalando', color: 'bg-purple-500', emoji: '🚀' },
};

const areaLabels: Record<string, { label: string; icon: string }> = {
  profile: { label: 'Perfil', icon: '🏢' },
  strategy: { label: 'Estrategia', icon: '🎯' },
  content: { label: 'Contenido', icon: '📝' },
  agents: { label: 'Agentes', icon: '🤖' },
  audience: { label: 'Audiencia', icon: '👥' },
  social: { label: 'Social', icon: '📱' },
};

const StatusIcon = ({ status }: { status: AreaStatus }) => {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'partial':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />;
  }
};

export const CompanyStateCard = ({ state }: CompanyStateCardProps) => {
  const { t } = useTranslation(['common']);
  const maturity = maturityLabels[state.maturityLevel];
  
  if (state.loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
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
            📊 Estado de tu Empresa
          </CardTitle>
          <Badge className={`${maturity.color} text-white`}>
            {maturity.emoji} {maturity.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completado</span>
            <span className="font-semibold">{state.completionScore}%</span>
          </div>
          <Progress value={state.completionScore} className="h-2" />
        </div>
        
        {/* Areas Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(state.areas).map(([key, area]) => {
            const areaInfo = areaLabels[key];
            return (
              <div
                key={key}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border
                  ${area.status === 'complete' ? 'bg-emerald-500/10 border-emerald-500/20' :
                    area.status === 'partial' ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-muted/50 border-border'}
                `}
              >
                <span className="text-sm">{areaInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{areaInfo.label}</p>
                </div>
                <StatusIcon status={area.status} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
