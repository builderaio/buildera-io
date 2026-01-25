import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, ArrowLeft, Calendar, CheckCircle2, AlertCircle, 
  Target, BarChart3, TrendingUp, Clock, FileText, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayToWinStrategy, PTWReview, PTW_STEPS } from '@/types/playToWin';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StrategyDashboardProps {
  strategy: PlayToWinStrategy | null;
  reviews: PTWReview[];
  onCreateReview: (data: Partial<PTWReview>) => Promise<any>;
  onBackToWizard: () => void;
}

export default function StrategyDashboard({ 
  strategy, 
  reviews, 
  onCreateReview, 
  onBackToWizard 
}: StrategyDashboardProps) {
  const { t } = useTranslation();

  if (!strategy) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h3 className="text-xl font-semibold mb-2">Sin estrategia definida</h3>
        <p className="text-muted-foreground mb-6">
          Completa el wizard para ver tu dashboard estratégico
        </p>
        <Button onClick={onBackToWizard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ir al Wizard
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-500">Completa</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">En Progreso</Badge>;
      case 'reviewing':
        return <Badge className="bg-yellow-500">En Revisión</Badge>;
      default:
        return <Badge variant="secondary">Borrador</Badge>;
    }
  };

  // Calculate OKR progress
  const okrProgress = strategy.okrs.length > 0
    ? strategy.okrs.reduce((acc, okr) => {
        const krProgress = okr.keyResults.reduce((krAcc, kr) => {
          const current = parseFloat(kr.current) || 0;
          const target = parseFloat(kr.target) || 1;
          return krAcc + Math.min(100, (current / target) * 100);
        }, 0);
        return acc + (okr.keyResults.length > 0 ? krProgress / okr.keyResults.length : 0);
      }, 0) / strategy.okrs.length
    : 0;

  // Count metrics
  const totalMetrics = strategy.aspirationMetrics.length;
  const totalCapabilities = strategy.requiredCapabilities.length;
  const totalOKRs = strategy.okrs.length;
  const totalKPIs = strategy.kpiDefinitions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBackToWizard} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al Wizard
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onCreateReview({
            reviewType: 'monthly',
            reviewDate: new Date().toISOString().split('T')[0]
          })}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Revisión
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completitud</p>
                <p className="text-3xl font-bold">{strategy.completionPercentage}%</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={strategy.completionPercentage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso OKRs</p>
                <p className="text-3xl font-bold">{Math.round(okrProgress)}%</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <Progress value={okrProgress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capacidades</p>
                <p className="text-3xl font-bold">{totalCapabilities}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {strategy.capabilityRoadmap.filter(m => m.status === 'completed').length} hitos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <div className="mt-1">{getStatusBadge(strategy.status)}</div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                {strategy.status === 'complete' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Clock className="h-6 w-6 text-amber-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cadencia: {strategy.reviewCadence}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Winning Aspiration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Winning Aspiration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strategy.winningAspiration ? (
                <p className="text-sm leading-relaxed">{strategy.winningAspiration}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No definida</p>
              )}
              
              {strategy.aspirationMetrics.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Métricas de Éxito</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {strategy.aspirationMetrics.map((metric) => (
                      <div key={metric.id} className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">{metric.metric}</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-lg font-bold">{metric.current || '0'}</span>
                          <span className="text-xs text-muted-foreground">/ {metric.target} {metric.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OKRs Progress */}
          {strategy.okrs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  OKRs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {strategy.okrs.map((okr, index) => (
                  <div key={okr.id} className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">O{index + 1}</Badge>
                      <p className="text-sm font-medium">{okr.objective || 'Sin objetivo'}</p>
                    </div>
                    <div className="ml-8 space-y-2">
                      {okr.keyResults.map((kr, krIndex) => {
                        const progress = Math.min(100, 
                          (parseFloat(kr.current) || 0) / (parseFloat(kr.target) || 1) * 100
                        );
                        return (
                          <div key={kr.id} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-6">KR{krIndex + 1}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="truncate max-w-[200px]">{kr.result || 'Sin definir'}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                kr.status === 'completed' && "border-green-500 text-green-600",
                                kr.status === 'at_risk' && "border-red-500 text-red-600"
                              )}
                            >
                              {kr.status === 'completed' ? '✓' : kr.status === 'at_risk' ? '!' : '→'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Capability Gaps */}
          {strategy.requiredCapabilities.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  Gaps de Capacidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strategy.requiredCapabilities.map((cap) => (
                    <div key={cap.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{cap.name || 'Sin nombre'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary/30 relative"
                              style={{ width: `${(cap.currentLevel / 5) * 100}%` }}
                            >
                              <div 
                                className="absolute right-0 top-0 h-full w-1 bg-primary"
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {cap.currentLevel} → {cap.targetLevel}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn(
                          cap.gap > 2 && "border-red-500 text-red-600",
                          cap.gap === 2 && "border-orange-500 text-orange-600",
                          cap.gap === 1 && "border-yellow-500 text-yellow-600",
                          cap.gap <= 0 && "border-green-500 text-green-600"
                        )}
                      >
                        {cap.gap > 0 ? `+${cap.gap}` : '✓'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Step Completion */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Cascada Estratégica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PTW_STEPS.map((step) => {
                  const stepCompletion = strategy.completionPercentage >= (step.id * 20);
                  return (
                    <div 
                      key={step.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg",
                        stepCompletion ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/50"
                      )}
                    >
                      {stepCompletion ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={cn(
                        "text-sm",
                        stepCompletion && "text-green-700 dark:text-green-400"
                      )}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Revisiones Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin revisiones aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{review.reviewType}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.reviewDate), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {review.wins?.length || 0} logros
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{totalMetrics}</p>
                  <p className="text-xs text-muted-foreground">Métricas</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{totalOKRs}</p>
                  <p className="text-xs text-muted-foreground">OKRs</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{totalCapabilities}</p>
                  <p className="text-xs text-muted-foreground">Capacidades</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{totalKPIs}</p>
                  <p className="text-xs text-muted-foreground">KPIs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
