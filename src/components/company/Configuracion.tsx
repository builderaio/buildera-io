import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Zap } from "lucide-react";
import AuthMethodManager from "@/components/auth/AuthMethodManager";

interface ConfiguracionProps {
  profile: any;
  resetTutorial?: () => Promise<void>;
}

const Configuracion = ({ profile, resetTutorial }: ConfiguracionProps) => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Administración</h1>
        <p className="text-lg text-muted-foreground">
          Gestione el acceso, los roles y la suscripción de su empresa.
        </p>
      </header>

      <Card>
        <CardContent className="p-8">
          <Tabs defaultValue="usuarios" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="usuarios">Usuarios y Roles</TabsTrigger>
              <TabsTrigger value="autenticacion">Autenticación</TabsTrigger>
              <TabsTrigger value="tutoriales">Tutoriales</TabsTrigger>
              <TabsTrigger value="facturacion">Facturación</TabsTrigger>
            </TabsList>

            <TabsContent value="usuarios" className="mt-6">
              <div className="flex justify-end mb-4">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Invitar Usuario
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Último Acceso
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Editar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">Ana Torres</td>
                      <td className="px-6 py-4 whitespace-nowrap">Admin</td>
                      <td className="px-6 py-4 whitespace-nowrap">Hace 2 horas</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-accent hover:underline">Editar</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">Juan Pérez</td>
                      <td className="px-6 py-4 whitespace-nowrap">Editor</td>
                      <td className="px-6 py-4 whitespace-nowrap">Ayer</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-accent hover:underline">Editar</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="autenticacion" className="mt-6">
              <AuthMethodManager />
            </TabsContent>

            <TabsContent value="tutoriales" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Tutoriales y Guías</h3>
                  <p className="text-muted-foreground">
                    Gestiona los tutoriales y guías de introducción que ya has visto.
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Tutorial de Era</h4>
                        <p className="text-sm text-muted-foreground">
                          Introducción al asistente de IA de Buildera
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={resetTutorial}
                      disabled={!resetTutorial}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Ver de nuevo
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 Al hacer clic en "Ver de nuevo", el tutorial de Era aparecerá la próxima vez que cargues la página o inmediatamente si recargas.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="facturacion" className="mt-6">
              <div className="space-y-6">
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-foreground mb-2">Plan Actual</h3>
                  <p className="text-2xl font-bold text-primary">Plan Empresarial</p>
                  <p className="text-muted-foreground">$99/mes - Facturación anual</p>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-bold text-foreground mb-4">Historial de Facturación</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                      <span>Enero 2025</span>
                      <span className="font-medium">$99.00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                      <span>Diciembre 2024</span>
                      <span className="font-medium">$99.00</span>
                    </div>
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

export default Configuracion;