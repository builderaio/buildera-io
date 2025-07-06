import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const InteligenciaCompetitiva = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Inteligencia Competitiva</h1>
        <p className="text-lg text-muted-foreground">
          Analice a sus competidores y convierta sus fortalezas en oportunidades para su negocio.
        </p>
      </header>

      <Card className="mb-8">
        <CardContent className="p-6">
          <label htmlFor="competitor-url" className="block text-sm font-medium text-foreground mb-2">
            Añadir Competidor
          </label>
          <div className="flex gap-2">
            <Input
              id="competitor-url"
              type="text"
              placeholder="www.competidor.com o @competidor en redes"
              className="flex-1"
            />
            <Button variant="outline" className="px-4">
              <Search className="h-4 w-4 mr-2" />
              Analizar
            </Button>
          </div>
        </CardContent>
      </Card>

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