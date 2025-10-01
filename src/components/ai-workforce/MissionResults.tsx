import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  Share2,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  FileText
} from "lucide-react";

interface Task {
  id: string;
  task_name: string;
  task_description: string;
  status: string;
  output_data: any;
  completed_at: string | null;
}

interface MissionResultsProps {
  task: Task;
  onBack: () => void;
}

export const MissionResults = ({ task, onBack }: MissionResultsProps) => {
  const renderResults = () => {
    // Mock results based on mission type
    if (task.task_name.includes("Rentabilidad")) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard de Rentabilidad</CardTitle>
              <CardDescription>
                Análisis del último trimestre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Ranking de Productos
                </h3>
                <div className="space-y-2">
                  {[
                    { name: "Producto Premium A", margin: 45, volume: "Alto", status: "excellent" },
                    { name: "Servicio Consultoría B", margin: 38, volume: "Medio", status: "good" },
                    { name: "Producto Standard C", margin: 18, volume: "Alto", status: "warning" },
                    { name: "Servicio Básico D", margin: 12, volume: "Bajo", status: "alert" }
                  ].map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">Volumen: {product.volume}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">{product.margin}%</p>
                        <Badge 
                          variant={product.status === "excellent" ? "default" : 
                                  product.status === "good" ? "secondary" :
                                  product.status === "warning" ? "outline" : "destructive"}
                        >
                          {product.status === "excellent" ? "Excelente" :
                           product.status === "good" ? "Bueno" :
                           product.status === "warning" ? "Bajo objetivo" : "Revisar"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Recomendaciones de la IA
                </h3>
                <div className="space-y-3">
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">Producto Standard C - Acción Requerida</p>
                          <p className="text-sm text-amber-800 mt-1">
                            Alto volumen pero bajo margen (18%). Sugerencia: Iniciar una misión de 
                            "Optimización de Costos de Proveedor" o revisar estrategia de pricing.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-rose-200 bg-rose-50">
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-rose-900">Servicio Básico D - Alerta</p>
                          <p className="text-sm text-rose-800 mt-1">
                            Margen del 12% está significativamente por debajo del objetivo del 20%. 
                            Considerar discontinuar o aumentar precio en 15%.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (task.task_name.includes("Contrato")) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis del Contrato</CardTitle>
              <CardDescription>
                Revisión preliminar completada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Resumen Ejecutivo
                </h3>
                <div className="space-y-3">
                  <Card className="border-rose-200 bg-rose-50">
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-rose-900">🔴 Riesgo Alto: Penalidad por mora excesiva</p>
                          <p className="text-sm text-rose-800 mt-1">
                            La cláusula establece una penalidad del 25% por mora, muy por encima del 
                            estándar del mercado (5-10%). Recomendación: Negociar reducción al 5%.
                          </p>
                          <div className="mt-2 p-2 bg-white rounded border border-rose-200">
                            <p className="text-xs text-muted-foreground">Cláusula 8.3, Página 4</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-amber-900">🟡 Alerta: Terminación unilateral</p>
                          <p className="text-sm text-amber-800 mt-1">
                            La cláusula de terminación permite al proveedor finalizar el contrato con 
                            solo 15 días de aviso, pero requiere 60 días de su parte. Sugerencia: 
                            Proponer condiciones recíprocas de 30 días.
                          </p>
                          <div className="mt-2 p-2 bg-white rounded border border-amber-200">
                            <p className="text-xs text-muted-foreground">Cláusula 12.1, Página 7</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-emerald-900">✓ Aprobado: Cláusulas de confidencialidad</p>
                          <p className="text-sm text-emerald-800 mt-1">
                            Las cláusulas de confidencialidad y protección de datos son robustas y 
                            están alineadas con las mejores prácticas y normativas vigentes.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Default generic results
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados de la Misión</CardTitle>
          <CardDescription>
            El agente ha completado el análisis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Análisis Completado</h3>
              <p className="text-muted-foreground">
                Los resultados están siendo procesados y estarán disponibles en breve
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Misiones
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Descargar Reporte
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">{task.task_name}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Completada: {task.completed_at ? 
            new Date(task.completed_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'
          }</span>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        </div>
      </div>

      {renderResults()}
    </div>
  );
};