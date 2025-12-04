import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Palette, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Instagram,
  Linkedin,
  Facebook,
  Target,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingWowResultsProps {
  results: {
    strategy: any;
    content: any;
    insights: any;
  };
  summary: {
    title: string;
    description: string;
    highlights: string[];
  };
  totalTime: number;
  onContinue: () => void;
}

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook
};

export const OnboardingWowResults = ({ 
  results, 
  summary, 
  totalTime, 
  onContinue 
}: OnboardingWowResultsProps) => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header con celebración */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
            >
              <Sparkles className="w-16 h-16 mx-auto text-primary" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-foreground"
            >
              {summary.title}
            </motion.h2>
            
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {summary.description}
            </p>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {summary.highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    {highlight}
                  </Badge>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
              <Clock className="w-4 h-4" />
              <span>Generado en {(totalTime / 1000).toFixed(1)} segundos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de resultados */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Estrategia</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Contenido</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Estrategia */}
        <TabsContent value="summary" className="space-y-4 mt-4">
          {results.strategy && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Posicionamiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {results.strategy.posicionamiento}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Audiencia Principal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {results.strategy.audiencia_principal}
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pilares de Contenido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {results.strategy.pilares_contenido?.map((pilar: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="py-1 px-3">
                        {pilar}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Quick Wins - Acciones Inmediatas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.strategy.quick_wins?.map((win: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                        <span className="text-muted-foreground">{win}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab: Contenido */}
        <TabsContent value="content" className="space-y-4 mt-4">
          {results.content?.posts?.map((post: any, idx: number) => {
            const PlatformIcon = platformIcons[post.platform] || Instagram;
            return (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlatformIcon className="w-5 h-5 text-primary" />
                    {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                    <Badge variant="secondary" className="ml-2">
                      {post.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{post.copy}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Palette className="w-4 h-4" />
                      <span>{post.visual_suggestion}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.best_time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab: Insights */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          {results.insights?.insights?.map((insight: any, idx: number) => (
            <Card key={idx} className={`border-l-4 ${
              insight.priority === 'alta' ? 'border-l-red-500' :
              insight.priority === 'media' ? 'border-l-yellow-500' : 'border-l-green-500'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                  <Badge variant={
                    insight.category === 'oportunidad' ? 'default' :
                    insight.category === 'mejora' ? 'secondary' :
                    insight.category === 'tendencia' ? 'outline' : 'destructive'
                  }>
                    {insight.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">{insight.description}</p>
                <div className="bg-primary/5 rounded-lg p-3 mt-2">
                  <p className="text-sm font-medium">💡 Acción recomendada:</p>
                  <p className="text-sm text-muted-foreground">{insight.action}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {results.insights?.growth_opportunities && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Oportunidades de Crecimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.insights.growth_opportunities.map((opp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <span className="text-muted-foreground">{opp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Botón de continuar */}
      <div className="flex justify-center pt-4">
        <Button 
          size="lg" 
          onClick={onContinue}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          Continuar al Dashboard
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};
