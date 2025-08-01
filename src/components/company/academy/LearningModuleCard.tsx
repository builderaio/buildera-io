import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Star, Award, Play, CheckCircle } from "lucide-react";
import { LearningModule, UserProgress } from "@/hooks/useAcademyData";

interface LearningModuleCardProps {
  module: LearningModule;
  progress?: UserProgress;
  onStart: (moduleId: string) => void;
  onContinue?: (moduleId: string) => void;
}

export const LearningModuleCard = ({ 
  module, 
  progress, 
  onStart, 
  onContinue 
}: LearningModuleCardProps) => {
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const progressPercentage = progress?.progress_percentage || 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'básico':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'avanzado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleAction = () => {
    if (isInProgress && onContinue) {
      onContinue(module.id);
    } else {
      onStart(module.id);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
            {isCompleted ? (
              <CheckCircle className="w-8 h-8 text-primary" />
            ) : (
              <Star className="w-8 h-8 text-primary" />
            )}
          </div>
          <Badge className={getDifficultyColor(module.difficulty_level)}>
            {module.difficulty_level}
          </Badge>
        </div>
        
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Award className="w-3 h-3 mr-1" />
              Completado
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
              {module.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {module.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {module.estimated_duration_hours}h
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              {module.points_reward} pts
            </div>
          </div>

          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Progreso</span>
                <span className="text-xs font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Lección {progress.current_lesson} de {progress.total_lessons}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Objetivos:</div>
            <div className="flex flex-wrap gap-1">
              {module.learning_objectives?.slice(0, 2).map((objective, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {objective}
                </Badge>
              ))}
              {module.learning_objectives?.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{module.learning_objectives.length - 2} más
                </Badge>
              )}
            </div>
          </div>

          <Button 
            onClick={handleAction}
            className="w-full"
            variant={isCompleted ? "outline" : "default"}
          >
            <Play className="w-4 h-4 mr-2" />
            {isCompleted ? 'Revisar' : isInProgress ? 'Continuar' : 'Comenzar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};