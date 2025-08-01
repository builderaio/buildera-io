import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Zap, Clock } from "lucide-react";
import { UserGamification } from "@/hooks/useAcademyData";

interface AcademyHeaderProps {
  gamification: UserGamification | null;
  completedModules: number;
  totalModules: number;
  totalTimeSpent: number;
}

export const AcademyHeader = ({ 
  gamification, 
  completedModules, 
  totalModules,
  totalTimeSpent 
}: AcademyHeaderProps) => {
  const completionPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  const nextLevelPoints = getNextLevelPoints(gamification?.level || 1);
  const currentLevelPoints = getCurrentLevelPoints(gamification?.level || 1);
  const progressToNextLevel = nextLevelPoints > 0 ? 
    ((gamification?.total_points || 0) - currentLevelPoints) / (nextLevelPoints - currentLevelPoints) * 100 : 100;

  function getNextLevelPoints(level: number): number {
    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
    return levelThresholds[level] || levelThresholds[levelThresholds.length - 1];
  }

  function getCurrentLevelPoints(level: number): number {
    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
    return levelThresholds[level - 1] || 0;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Academia Buildera</h1>
        <p className="text-lg text-muted-foreground">
          Capacite a su equipo con conocimiento de vanguardia para impulsar el crecimiento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nivel del Usuario */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">Nivel {gamification?.level || 1}</div>
                <div className="text-xs text-muted-foreground">
                  {gamification?.total_points || 0} puntos totales
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progreso al siguiente nivel</span>
                <span>{Math.round(progressToNextLevel)}%</span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Módulos Completados */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedModules}/{totalModules}</div>
                <div className="text-xs text-muted-foreground">Módulos completados</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progreso general</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Racha Actual */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{gamification?.current_streak || 0}</div>
                <div className="text-xs text-muted-foreground">Días consecutivos</div>
              </div>
            </div>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                Récord: {gamification?.longest_streak || 0} días
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tiempo de Estudio */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(totalTimeSpent / 60)}h</div>
                <div className="text-xs text-muted-foreground">Tiempo total de estudio</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-muted-foreground">
                Promedio: {Math.round(totalTimeSpent / Math.max(1, completedModules))} min/módulo
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};