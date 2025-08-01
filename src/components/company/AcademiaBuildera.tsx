import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Award, Users, TrendingUp, Brain, Zap } from "lucide-react";
import { useAcademyData } from "@/hooks/useAcademyData";
import { AcademyHeader } from "./academy/AcademyHeader";
import { LearningModuleCard } from "./academy/LearningModuleCard";
import { AITutorChat } from "./academy/AITutorChat";

const AcademiaBuildera = () => {
  const { modules, userProgress, gamification, badges, loading, startModule } = useAcademyData();
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  
  const completedModules = userProgress.filter(p => p.status === 'completed').length;
  const totalTimeSpent = userProgress.reduce((total, p) => total + p.time_spent_minutes, 0);

  const getModuleProgress = (moduleId: string) => {
    return userProgress.find(p => p.module_id === moduleId);
  };

  const getRecommendedModules = () => {
    return modules
      .filter(module => !userProgress.some(p => p.module_id === module.id))
      .slice(0, 3);
  };

  const getContinueModules = () => {
    return userProgress
      .filter(p => p.status === 'in_progress')
      .map(p => p.module)
      .filter(Boolean)
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Academia Buildera</h1>
          <div className="animate-pulse bg-muted h-6 w-96 mx-auto rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AcademyHeader 
        gamification={gamification}
        completedModules={completedModules}
        totalModules={modules.length}
        totalTimeSpent={totalTimeSpent}
      />

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Módulos
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Certificaciones
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="ai-tutor" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Tutor IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Continuar Aprendizaje */}
          {getContinueModules().length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Continúa tu Aprendizaje</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getContinueModules().map((module) => (
                  <LearningModuleCard
                    key={module.id}
                    module={module}
                    progress={getModuleProgress(module.id)}
                    onStart={startModule}
                    onContinue={() => console.log('Continue module:', module.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Módulos Recomendados */}
          <div>
            <h2 className="text-2xl font-bold text-primary mb-4">Módulos Recomendados para Ti</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getRecommendedModules().map((module) => (
                <LearningModuleCard
                  key={module.id}
                  module={module}
                  progress={getModuleProgress(module.id)}
                  onStart={startModule}
                />
              ))}
            </div>
          </div>

          {/* Logros Recientes */}
          {badges.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Logros Recientes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {badges.slice(0, 3).map((badge) => (
                  <Card key={badge.id} className="text-center">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold mb-2">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                      <Badge variant="outline">Nivel {badge.level}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="modules">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">Todos los Módulos</h2>
              <Badge variant="outline">{modules.length} módulos disponibles</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <LearningModuleCard
                  key={module.id}
                  module={module}
                  progress={getModuleProgress(module.id)}
                  onStart={startModule}
                  onContinue={() => console.log('Continue module:', module.id)}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">Tus Certificaciones</h2>
              <Badge variant="outline">{badges.length} obtenidas</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((badge) => (
                <Card key={badge.id} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <Award className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-bold mb-2">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                    <div className="space-y-2">
                      <Badge variant="outline">Nivel {badge.level}</Badge>
                      {badge.verification_code && (
                        <div className="text-xs text-muted-foreground">
                          Código: {badge.verification_code}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => window.open(`https://linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(badge.name)}&organizationName=Academia%20Buildera&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certificationUrl=${encodeURIComponent(window.location.origin)}&certId=${badge.verification_code}`, '_blank')}
                    >
                      Compartir en LinkedIn
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">Ranking en Desarrollo</h3>
            <p className="text-muted-foreground">El sistema de ranking estará disponible próximamente</p>
          </div>
        </TabsContent>

        <TabsContent value="ai-tutor">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">Tutor de IA Personalizado</h2>
              <p className="text-muted-foreground mb-6">
                Obtén ayuda personalizada, resuelve dudas y acelera tu aprendizaje con nuestro tutor de IA
              </p>
              <Button 
                onClick={() => setIsTutorOpen(true)}
                className="bg-gradient-to-r from-primary to-accent text-white"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Activar Tutor IA
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-bold mb-2">Personalizado</h3>
                  <p className="text-sm text-muted-foreground">
                    Adapta su enseñanza a tu nivel y estilo de aprendizaje
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-bold mb-2">Instantáneo</h3>
                  <p className="text-sm text-muted-foreground">
                    Respuestas inmediatas a todas tus preguntas
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-bold mb-2">Inteligente</h3>
                  <p className="text-sm text-muted-foreground">
                    Recomienda contenido basado en tu progreso
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AITutorChat 
        isOpen={isTutorOpen}
        onToggle={() => setIsTutorOpen(!isTutorOpen)}
      />
    </div>
  );
};

export default AcademiaBuildera;