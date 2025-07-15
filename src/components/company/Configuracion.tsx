import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthMethodManager from "@/components/auth/AuthMethodManager";

interface ConfiguracionProps {
  profile: any;
}

const Configuracion = ({ profile }: ConfiguracionProps) => {
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="usuarios">Usuarios y Roles</TabsTrigger>
              <TabsTrigger value="autenticacion">Autenticación</TabsTrigger>
              <TabsTrigger value="facturacion">Facturación y Suscripción</TabsTrigger>
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