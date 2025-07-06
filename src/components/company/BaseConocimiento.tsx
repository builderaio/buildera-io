import { Card, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle, Clock } from "lucide-react";

const BaseConocimiento = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Base de Conocimiento</h1>
        <p className="text-lg text-muted-foreground">
          Alimente a nuestros agentes con sus documentos de negocio. Su información es procesada de forma segura y confidencial.
        </p>
      </header>

      <Card>
        <CardContent className="p-8">
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-2">Subir Documentos</label>
            <div className="border-2 border-dashed border-primary/50 rounded-lg p-10 text-center hover:border-primary transition-colors">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Arrastre y suelte sus archivos aquí (PDF, DOCX, TXT)
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Documentos Procesados</h3>
            <ul className="space-y-3">
              <li className="bg-muted p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Reporte_Ventas_Q2.pdf</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Analizado</span>
              </li>
              <li className="bg-muted p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-500 mr-3" />
                  <span>Manual_Producto_V3.docx</span>
                </div>
                <span className="text-sm text-yellow-600 font-medium">Procesando...</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaseConocimiento;