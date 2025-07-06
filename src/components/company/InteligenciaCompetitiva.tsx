import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Plus, Brain } from "lucide-react";

const InteligenciaCompetitiva = () => {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitors, setCompetitors] = useState([
    { name: "TechNova", url: "technova.com", status: "Analizado" },
    { name: "InnovateCorp", url: "innovatecorp.com", status: "Pendiente" }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
                onClick={() => {
                  setIsAnalyzing(true);
                  // Simular análisis con IA
                  setTimeout(() => {
                    setCompetitors(prev => [...prev, 
                      { name: "FutureSolutions", url: "futuresolutions.com", status: "Detectado por IA" }
                    ]);
                    setIsAnalyzing(false);
                  }, 2000);
                }}
                disabled={isAnalyzing}
                size="sm"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isAnalyzing ? "Analizando..." : "Detectar con IA"}
              </Button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <Input
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                placeholder="www.competidor.com o @competidor en redes"
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  if (competitorUrl.trim()) {
                    const name = competitorUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
                    setCompetitors(prev => [...prev, { 
                      name: name.charAt(0).toUpperCase() + name.slice(1), 
                      url: competitorUrl, 
                      status: "Pendiente" 
                    }]);
                    setCompetitorUrl("");
                  }
                }}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>

            <div className="space-y-2">
              {competitors.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{competitor.name}</p>
                      <p className="text-xs text-muted-foreground">{competitor.url}</p>
                    </div>
                    <Badge variant={competitor.status === "Analizado" ? "default" : "secondary"}>
                      {competitor.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setCompetitors(prev => prev.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Análisis Rápido</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="font-medium text-blue-800 dark:text-blue-200">🎯 Oportunidades</p>
                <p className="text-xs text-blue-600 dark:text-blue-300">3 gaps detectados en el mercado</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <p className="font-medium text-orange-800 dark:text-orange-200">⚠️ Amenazas</p>
                <p className="text-xs text-orange-600 dark:text-orange-300">2 competidores con nueva funcionalidad</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="font-medium text-green-800 dark:text-green-200">💪 Fortalezas</p>
                <p className="text-xs text-green-600 dark:text-green-300">Tu precio es 20% más competitivo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-primary mb-4">Análisis de Rendimiento</h3>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico de análisis competitivo</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-primary mb-4">Buenas Prácticas Detectadas</h3>
            <ul className="space-y-3 text-sm text-muted-foreground mb-6">
              <li className="flex items-start">
                <span className="text-accent mr-2">→</span>
                <div>
                  <strong>TechNova:</strong> Publican tutoriales en video cortos en TikTok, generando un alto engagement.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">→</span>
                <div>
                  <strong>InnovateCorp:</strong> Su campaña de email post-compra tiene una tasa de apertura 40% superior a la media del sector.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-2">→</span>
                <div>
                  <strong>FutureSolutions:</strong> Responden a las menciones en Twitter en menos de 15 minutos, mejorando la percepción de marca.
                </div>
              </li>
            </ul>
            
            <h4 className="text-xl font-bold text-primary mb-4">Recomendaciones para su Empresa</h4>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg flex items-center justify-between">
                <p className="text-sm text-foreground">
                  Crear una serie de 3 videos cortos para Instagram Reels mostrando usos de su producto.
                </p>
                <Button size="sm" className="ml-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  Activar Agente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InteligenciaCompetitiva;