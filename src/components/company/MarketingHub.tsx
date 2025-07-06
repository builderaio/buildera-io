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
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="estrategias">Estrategias</TabsTrigger>
              <TabsTrigger value="calendario">Calendario</TabsTrigger>
              <TabsTrigger value="creacion">Creación con IA</TabsTrigger>
              <TabsTrigger value="pauta">Gestión de Pauta</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Performance de Marketing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-card p-4 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground">Alcance Total</p>
                  <p className="text-3xl font-bold text-primary">125,340</p>
                  <p className="text-xs text-green-600">+12% vs mes anterior</p>
                </div>
                <div className="bg-card p-4 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <p className="text-3xl font-bold text-secondary">4.8%</p>
                  <p className="text-xs text-green-600">+0.3% vs mes anterior</p>
                </div>
                <div className="bg-card p-4 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground">Leads Generados</p>
                  <p className="text-3xl font-bold text-accent">89</p>
                  <p className="text-xs text-red-600">-5% vs mes anterior</p>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <h4 className="font-bold mb-4">Performance por Plataforma</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">LinkedIn</span>
                      <span>ROI: 3.5x | Leads: 45</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-primary h-3 rounded-full" style={{width: "70%"}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Instagram</span>
                      <span>ROI: 2.1x | Leads: 28</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-secondary h-3 rounded-full" style={{width: "45%"}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Facebook</span>
                      <span>ROI: 1.8x | Leads: 16</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-accent h-3 rounded-full" style={{width: "30%"}}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Insights Section */}
              <div className="bg-card p-6 rounded-lg border mt-6">
                <h4 className="font-bold mb-4">Insights y Recomendaciones</h4>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">📈 Oportunidad de Crecimiento</p>
                      <p className="text-xs text-muted-foreground">LinkedIn muestra 40% más engagement los martes a las 2 PM</p>
                    </div>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Programar Posts
                    </Button>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">⚠️ Atención Requerida</p>
                      <p className="text-xs text-muted-foreground">Instagram Reels están 25% por debajo del promedio del sector</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Crear Estrategia
                    </Button>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">✅ Rendimiento Óptimo</p>
                      <p className="text-xs text-muted-foreground">Tus posts de LinkedIn generan 3x más leads que la competencia</p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Amplificar
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="estrategias" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Estrategias de Marketing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-bold mb-4">Crear Nueva Estrategia</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Contexto del Negocio</Label>
                      <Textarea 
                        placeholder="Ej: Lanzamiento de producto, temporada alta, crisis..."
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Objetivo Principal</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Aumentar ventas</option>
                        <option>Generar leads</option>
                        <option>Aumentar reconocimiento</option>
                        <option>Fidelizar clientes</option>
                      </select>
                    </div>
                    <div>
                      <Label>Estacionalidad</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Temporada alta</option>
                        <option>Temporada baja</option>
                        <option>Temporada normal</option>
                        <option>Evento especial</option>
                      </select>
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Generar Estrategia con IA
                    </Button>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-bold mb-4">Estrategias Activas</h4>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4 py-2">
                      <p className="font-medium text-sm">Campaña de Lanzamiento Q1</p>
                      <p className="text-xs text-muted-foreground">LinkedIn + Instagram • ROI: 2.8x</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">Editar</Button>
                        <Button size="sm" variant="secondary">Ver Métricas</Button>
                      </div>
                    </div>
                    <div className="border-l-4 border-secondary pl-4 py-2">
                      <p className="font-medium text-sm">Estrategia de Contenido Educativo</p>
                      <p className="text-xs text-muted-foreground">Blog + Redes • 150% más engagement</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">Editar</Button>
                        <Button size="sm" variant="secondary">Ver Métricas</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendario" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Calendario de Contenido</h3>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">Enero 2025</h4>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Hoy: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
                  <div>LUN</div><div>MAR</div><div>MIÉ</div><div>JUE</div><div>VIE</div><div>SÁB</div><div>DOM</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Generar días del mes completo */}
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const isToday = day === new Date().getDate() && new Date().getMonth() === 0;
                    return (
                      <div key={day} className={`border rounded-md h-24 p-1 ${isToday ? 'bg-primary/10 border-primary' : 'bg-card'}`}>
                        <div className={`text-xs ${isToday ? 'font-bold text-primary' : ''}`}>{day}</div>
                        {day === 2 && (
                          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded p-1 mt-1">
                            Post LinkedIn
                          </div>
                        )}
                        {day === 4 && (
                          <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded p-1 mt-1">
                            Video TikTok
                          </div>
                        )}
                        {day === 8 && (
                          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded p-1 mt-1">
                            Instagram Post
                          </div>
                        )}
                        {day === 15 && (
                          <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded p-1 mt-1">
                            Webinar
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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