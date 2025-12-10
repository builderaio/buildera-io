import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { CompanyState, AreaStatus, MaturityLevel } from "@/hooks/useCompanyState";
import { useTranslation } from "react-i18next";

interface CompanyStateCardProps {
  state: CompanyState;
}

const StatusIcon = ({ status }: { status: AreaStatus }) => {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    case 'partial':
      return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
    default:
      return <Circle className="w-5 h-5 text-muted-foreground shrink-0" />;
  }
};

const areaIcons: Record<string, string> = {
  profile: '🏢',
  strategy: '🎯',
  content: '📝',
  agents: '🤖',
  audience: '👥',
  social: '📱',
};

const maturityColors: Record<MaturityLevel, string> = {
  starter: 'bg-slate-500',
  growing: 'bg-emerald-500',
  established: 'bg-blue-500',
  scaling: 'bg-purple-500',
};

const maturityEmojis: Record<MaturityLevel, string> = {
  starter: '🌱',
  growing: '🌿',
  established: '🌳',
  scaling: '🚀',
};

export const CompanyStateCard = ({ state }: CompanyStateCardProps) => {
  const { t } = useTranslation(['common']);
  
  const getMaturityLabel = (level: MaturityLevel) => t(`maturity.${level}`);
  const getAreaLabel = (area: string) => t(`areas.${area}`);
  
  if (state.loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-14 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            📊 {t('mando.companyState')}
          </CardTitle>
          <Badge className={`${maturityColors[state.maturityLevel]} text-white text-sm px-3 py-1`}>
            {maturityEmojis[state.maturityLevel]} {getMaturityLabel(state.maturityLevel)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('mando.completed')}</span>
            <span className="text-lg font-bold">{state.completionScore}%</span>
          </div>
          <Progress value={state.completionScore} className="h-3" />
        </div>
        
        {/* Areas Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(state.areas).map(([key, area]) => {
            return (
              <div
                key={key}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border
                  ${area.status === 'complete' ? 'bg-emerald-500/10 border-emerald-500/20' :
                    area.status === 'partial' ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-muted/50 border-border'}
                `}
              >
                <span className="text-lg">{areaIcons[key]}</span>
                <span className="text-sm font-medium flex-1">{getAreaLabel(key)}</span>
                <StatusIcon status={area.status} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
