import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Upload, Twitter, Linkedin } from "lucide-react";

interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const ADNEmpresa = ({ profile, onProfileUpdate }: ADNEmpresaProps) => {
  const [formData, setFormData] = useState({
    mission: "",
    vision: "", 
    valueProposition: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mostrar información de la empresa registrada
  const companyInfo = {
    name: profile?.company_name || "No especificado",
    size: profile?.company_size || "No especificado", 
    sector: profile?.industry_sector || "No especificado",
    website: profile?.website_url || "No especificado",
    contact: profile?.full_name || "No especificado",
    email: profile?.email || "No especificado"
  };

  const handleSave = async (field: string) => {
    setLoading(true);
    try {
      // En un caso real, aquí actualizarías los campos específicos del perfil
      // Por ahora solo mostramos el toast de éxito
      toast({
        title: "Guardado exitosamente",
        description: `${field} actualizada correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = (field: string) => {
    toast({
      title: "Generando con IA",
      description: `Generando ${field} personalizada para su empresa...`,
    });
    // Aquí integrarías con la IA para generar el contenido
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">ADN de la Empresa</h1>
        <p className="text-lg text-muted-foreground">
          Centralice la identidad y estrategia de su empresa para alinear a nuestros agentes de IA.
        </p>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Empresa:</strong> {companyInfo.name}</div>
            <div><strong>Tamaño:</strong> {companyInfo.size}</div>
            <div><strong>Sector:</strong> {companyInfo.sector}</div>
            <div><strong>Sitio web:</strong> {companyInfo.website}</div>
            <div><strong>Contacto:</strong> {companyInfo.contact}</div>
            <div><strong>Email:</strong> {companyInfo.email}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <Tabs defaultValue="estrategia" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="estrategia">Estrategia</TabsTrigger>
              <TabsTrigger value="marca">Marca</TabsTrigger>
              <TabsTrigger value="conexiones">Conexiones</TabsTrigger>
            </TabsList>

            <TabsContent value="estrategia" className="space-y-6 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="mission" className="text-sm font-medium">Misión</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAIGenerate("misión")}
                    className="text-primary hover:text-accent"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generar con IA
                  </Button>
                </div>
                <Textarea
                  id="mission"
                  rows={3}
                  value={formData.mission}
                  onChange={(e) => setFormData({...formData, mission: e.target.value})}
                  placeholder="¿Cuál es el propósito fundamental de su empresa?"
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="vision" className="text-sm font-medium">Visión</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAIGenerate("visión")}
                    className="text-primary hover:text-accent"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generar con IA
                  </Button>
                </div>
                <Textarea
                  id="vision"
                  rows={3}
                  value={formData.vision}
                  onChange={(e) => setFormData({...formData, vision: e.target.value})}
                  placeholder="¿Hacia dónde se dirige su empresa a largo plazo?"
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="valueProposition" className="text-sm font-medium">Propuesta de Valor</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAIGenerate("propuesta de valor")}
                    className="text-primary hover:text-accent"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generar con IA
                  </Button>
                </div>
                <Textarea
                  id="valueProposition"
                  rows={3}
                  value={formData.valueProposition}
                  onChange={(e) => setFormData({...formData, valueProposition: e.target.value})}
                  placeholder="¿Qué valor único ofrecen a sus clientes?"
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave("estrategia")}
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Guardar Estrategia
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="marca" className="space-y-6 mt-6">
              <div>
                <Label className="text-sm font-medium">Manual de Marca</Label>
                <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-dashed border-border rounded-md hover:border-primary/50 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="flex text-sm text-muted-foreground">
                      <p>Sube tu manual de marca (PDF)</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conexiones" className="space-y-6 mt-6">
              <p className="text-muted-foreground">
                Conecte sus redes sociales para que nuestros agentes puedan analizar su rendimiento y generar contenido alineado a su marca.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Twitter className="w-8 h-8 text-blue-600 mr-4" />
                    <span>Twitter / X</span>
                  </div>
                  <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Conectar
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Linkedin className="w-8 h-8 text-blue-700 mr-4" />
                    <span>LinkedIn</span>
                  </div>
                  <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Conectar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ADNEmpresa;