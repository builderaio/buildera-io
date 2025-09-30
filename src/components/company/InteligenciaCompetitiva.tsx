import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Plus, Brain, ExternalLink, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Competitor {
  id: string;
  name: string;
  url?: string;
  status: string;
  strengths?: string[];
  weaknesses?: string[];
  digital_tactics?: string;
  threat_score?: number;
  analysis_data?: any;
}

interface CompetitiveAnalysis {
  id: string;
  created_at: string;
  industry_sector?: string | null;
  target_market?: string | null;
}

const InteligenciaCompetitiva = () => {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [analyses, setAnalyses] = useState<CompetitiveAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCompetitiveData();
  }, []);

  const loadCompetitiveData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load competitive intelligence analyses
      const { data: analysesData, error: analysesError } = await supabase
        .from('competitive_intelligence')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analysesError) throw analysesError;

      const mappedAnalyses: CompetitiveAnalysis[] = (analysesData || []).map((a: any) => ({
        id: a.id,
        created_at: a.created_at,
        industry_sector: a.industry_sector,
        target_market: a.target_market,
      }));

      setAnalyses(mappedAnalyses);

      // Load all competitor profiles from analyses
      if (mappedAnalyses.length > 0) {
        const analysisIds = mappedAnalyses.map(a => a.id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('competitor_profiles')
          .select('*')
          .in('analysis_id', analysisIds);

        if (profilesError) throw profilesError;

        const competitorsMap = new Map<string, Competitor>();
        (profilesData || []).forEach((profile: any) => {
          const key = (profile.company_name || '').toLowerCase();
          if (!key) return;
          if (!competitorsMap.has(key) || 
              (competitorsMap.get(key)?.threat_score || 0) < (profile.competitive_threat_score || 0)) {
            competitorsMap.set(key, {
              id: profile.id,
              name: profile.company_name,
              url: profile.website_url || undefined,
              status: 'Analizado',
              strengths: profile.strengths || [],
              weaknesses: profile.weaknesses || [],
              digital_tactics: (profile.content_strategy as any)?.digital_tactics,
              threat_score: profile.competitive_threat_score || undefined,
              analysis_data: { sources: profile.data_sources || [] }
            });
          }
        });

        setCompetitors(Array.from(competitorsMap.values()));
      }
    } catch (error) {
      console.error('Error loading competitive data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información competitiva",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeNewCompetitor = async () => {
    if (!competitorUrl.trim()) return;

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Call competitive intelligence agent to analyze the competitor
      const { data, error } = await supabase.functions.invoke('competitive-intelligence-agent', {
        body: {
          action: 'analyze_competitor',
          competitorUrl: competitorUrl,
          userId: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Análisis iniciado",
        description: "El análisis del competidor está en proceso. Esto puede tomar algunos minutos.",
      });

      setCompetitorUrl("");
      
      // Reload data after a delay
      setTimeout(() => {
        loadCompetitiveData();
      }, 3000);

    } catch (error) {
      console.error('Error analyzing competitor:', error);
      toast({
        title: "Error",
        description: "No se pudo analizar el competidor. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addManualCompetitor = () => {
    if (competitorUrl.trim()) {
      const name = competitorUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
      setCompetitors(prev => [...prev, { 
        id: `temp-${Date.now()}`,
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        url: competitorUrl, 
        status: "Pendiente" 
      }]);
      setCompetitorUrl("");
    }
  };

  const removeCompetitor = async (competitorId: string) => {
    try {
      if (!competitorId.startsWith('temp-')) {
        await supabase
          .from('competitor_profiles')
          .delete()
          .eq('id', competitorId);
      }
      setCompetitors(prev => prev.filter(c => c.id !== competitorId));
      
      toast({
        title: "Competidor eliminado",
        description: "El competidor ha sido eliminado correctamente",
      });
    } catch (error) {
      console.error('Error removing competitor:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el competidor",
        variant: "destructive"
      });
    }
  };

  const showCompetitorDetails = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setDetailDialogOpen(true);
  };

  const getThreatLevel = (score?: number) => {
    if (!score) return { label: "Desconocido", color: "secondary" };
    if (score >= 7) return { label: "Alto", color: "destructive" };
    if (score >= 4) return { label: "Medio", color: "default" };
    return { label: "Bajo", color: "secondary" };
  };

  const getOpportunityCount = () => {
    return competitors.filter(c => c.weaknesses && c.weaknesses.length > 0).length;
  };

  const getThreatCount = () => {
    return competitors.filter(c => (c.threat_score || 0) >= 7).length;
  };

  const getAverageCompetitivePosition = () => {
    if (competitors.length === 0) return 0;
    const avgThreat = competitors.reduce((acc, c) => acc + (c.threat_score || 0), 0) / competitors.length;
    return Math.round((10 - avgThreat) * 10); // Convert to percentage where lower threat = better position
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando análisis competitivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Inteligencia Competitiva</h1>
        <p className="text-lg text-muted-foreground">
          Analice a sus competidores y convierta sus fortalezas en oportunidades para su negocio.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Gestión de Competidores</h3>
              <Button 
                onClick={analyzeNewCompetitor}
                disabled={isAnalyzing || !competitorUrl.trim()}
                size="sm"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isAnalyzing ? "Analizando..." : "Analizar con IA"}
              </Button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <Input
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                placeholder="www.competidor.com o URL de red social"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addManualCompetitor()}
              />
              <Button 
                onClick={addManualCompetitor}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {competitors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay competidores registrados aún</p>
                    <p className="text-sm mt-2">Añade un competidor o genera una estrategia de marketing para comenzar</p>
                  </div>
                ) : (
                  competitors.map((competitor) => {
                    const threat = getThreatLevel(competitor.threat_score);
                    return (
                      <div key={competitor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <p className="font-medium">{competitor.name}</p>
                            {competitor.url && (
                              <p className="text-xs text-muted-foreground truncate">{competitor.url}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={competitor.status === "Analizado" ? "default" : "secondary"}>
                              {competitor.status}
                            </Badge>
                            {competitor.threat_score && (
                              <Badge variant={threat.color as any}>
                                Amenaza: {threat.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4">
                          {competitor.status === "Analizado" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => showCompetitorDetails(competitor)}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          )}
                          {competitor.url && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(competitor.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeCompetitor(competitor.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Análisis Rápido</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="font-medium text-blue-800 dark:text-blue-200">Oportunidades</p>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  {getOpportunityCount()} gaps detectados en competidores
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="font-medium text-orange-800 dark:text-orange-200">Amenazas</p>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-300">
                  {getThreatCount()} competidores con amenaza alta
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="font-medium text-green-800 dark:text-green-200">Posición Competitiva</p>
                </div>
                <p className="text-xs text-green-600 dark:text-green-300">
                  {getAverageCompetitivePosition()}% favorable en el mercado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-primary mb-4">Análisis Recientes</h3>
            <ScrollArea className="h-64">
              {analyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay análisis disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">{analysis.industry_sector}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mercado objetivo: {analysis.target_market}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-primary mb-4">Próximos Pasos</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <p className="text-sm text-foreground mb-2">
                  📊 Genera una estrategia de marketing para obtener análisis de competidores automáticamente
                </p>
                <Button size="sm" className="w-full" variant="outline">
                  Ir a Marketing Hub
                </Button>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                <p className="text-sm text-foreground mb-2">
                  🔍 Añade competidores manualmente para análisis detallados con IA
                </p>
                <Button size="sm" className="w-full" variant="outline">
                  Añadir Competidor
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCompetitor?.name}
              {selectedCompetitor?.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(selectedCompetitor.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              Análisis detallado del competidor
            </DialogDescription>
          </DialogHeader>
          
          {selectedCompetitor && (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4">
                {selectedCompetitor.threat_score && (
                  <div>
                    <h4 className="font-semibold mb-2">Nivel de Amenaza</h4>
                    <Badge variant={getThreatLevel(selectedCompetitor.threat_score).color as any}>
                      {getThreatLevel(selectedCompetitor.threat_score).label} ({selectedCompetitor.threat_score}/10)
                    </Badge>
                  </div>
                )}

                {selectedCompetitor.digital_tactics && (
                  <div>
                    <h4 className="font-semibold mb-2">Tácticas Digitales</h4>
                    <p className="text-sm text-muted-foreground">{selectedCompetitor.digital_tactics}</p>
                  </div>
                )}

                {selectedCompetitor.strengths && selectedCompetitor.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Fortalezas</h4>
                    <ul className="space-y-1">
                      {selectedCompetitor.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCompetitor.weaknesses && selectedCompetitor.weaknesses.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Debilidades (Oportunidades)</h4>
                    <ul className="space-y-1">
                      {selectedCompetitor.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-orange-500 mr-2">⚠</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCompetitor.analysis_data?.sources && (
                  <div>
                    <h4 className="font-semibold mb-2">Fuentes</h4>
                    <ul className="space-y-1">
                      {selectedCompetitor.analysis_data.sources.map((source: string, idx: number) => (
                        <li key={idx} className="text-sm">
                          <a 
                            href={source} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InteligenciaCompetitiva;
