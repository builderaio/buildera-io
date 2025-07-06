import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MarketingHub = () => {
  const [prompt, setPrompt] = useState("");

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Marketing Hub</h1>
        <p className="text-lg text-muted-foreground">
          Su centro de control para crear, ejecutar y medir estrategias de marketing con IA.
        </p>
      </header>

      <Card>
        <CardContent className="p-8">
          <Tabs defaultValue="calendario" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendario">Calendario</TabsTrigger>
              <TabsTrigger value="creacion">Creación con IA</TabsTrigger>
              <TabsTrigger value="pauta">Gestión de Pauta</TabsTrigger>
            </TabsList>

            <TabsContent value="calendario" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Calendario de Contenido - Enero 2025</h3>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
                <div>LUN</div><div>MAR</div><div>MIÉ</div><div>JUE</div><div>VIE</div><div>SÁB</div><div>DOM</div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                <div className="border rounded-md h-24 p-1 bg-card">1</div>
                <div className="border rounded-md h-24 p-1 bg-card">
                  2 
                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded p-1 mt-1">
                    Post LinkedIn
                  </div>
                </div>
                <div className="border rounded-md h-24 p-1 bg-card">3</div>
                <div className="border rounded-md h-24 p-1 bg-card">
                  4 
                  <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded p-1 mt-1">
                    Video TikTok
                  </div>
                </div>
                <div className="border rounded-md h-24 p-1 bg-card">5</div>
                <div className="border rounded-md h-24 p-1 bg-card">6</div>
                <div className="border rounded-md h-24 p-1 bg-card">7</div>
              </div>
            </TabsContent>

            <TabsContent value="creacion" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Estudio de Creación con IA</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Idea o Tema Central</Label>
                  <Textarea
                    id="prompt"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ej: 'Lanzamiento de nuestro nuevo producto ecológico'"
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Generar Texto para Post
                  </Button>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Generar Imagen
                  </Button>
                  <Button variant="secondary">
                    Generar Video Corto
                  </Button>
                </div>
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-bold text-foreground mb-2">Resultado Generado:</h4>
                  <div className="bg-muted p-4 rounded-md min-h-[150px]">
                    <p className="text-muted-foreground italic">El contenido generado por la IA aparecerá aquí...</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pauta" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Gestión de Pauta Publicitaria</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                  <p className="text-3xl font-bold text-primary">$5,000 <span className="text-lg">/ mes</span></p>
                </div>
                <div className="md:col-span-2 bg-card p-4 rounded-lg border">
                  <p className="font-bold mb-4">Distribución y Performance</p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">LinkedIn</span>
                        <span>$2,500 (50%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div className="bg-primary h-3 rounded-full" style={{width: "50%"}}></div>
                      </div>
                      <p className="text-xs text-right text-green-600 mt-1">ROI: 3.5x</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Instagram</span>
                        <span>$1,500 (30%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div className="bg-accent h-3 rounded-full" style={{width: "30%"}}></div>
                      </div>
                      <p className="text-xs text-right text-red-600 mt-1">ROI: 1.2x</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Optimizar Distribución con IA
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingHub;