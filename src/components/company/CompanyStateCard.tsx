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
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'partial':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />;
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
            📊 {t('mando.companyState')}
          </CardTitle>
          <Badge className={`${maturityColors[state.maturityLevel]} text-white`}>
            {maturityEmojis[state.maturityLevel]} {getMaturityLabel(state.maturityLevel)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('mando.completed')}</span>
            <span className="font-semibold">{state.completionScore}%</span>
          </div>
          <Progress value={state.completionScore} className="h-2" />
        </div>
        
        {/* Areas Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(state.areas).map(([key, area]) => {
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
                <span className="text-sm">{areaIcons[key]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{getAreaLabel(key)}</p>
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