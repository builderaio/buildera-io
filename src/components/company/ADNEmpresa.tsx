import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [companyData, setCompanyData] = useState({
    company_name: profile?.company_name || "",
    full_name: profile?.full_name || "",
    company_size: profile?.company_size || "",
    industry_sector: profile?.industry_sector || "", 
    website_url: profile?.website_url || ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const companySizes = [
    "1-10 empleados",
    "11-50 empleados", 
    "51-200 empleados",
    "201-500 empleados",
    "501-1000 empleados",
    "1000+ empleados"
  ];

  const sectors = [
    "Tecnología",
    "Finanzas",
    "Salud", 
    "Educación",
    "Retail",
    "Manufactura",
    "Servicios",
    "Construcción",
    "Agricultura",
    "Energía",
    "Otro"
  ];

  const handleSaveCompanyInfo = async () => {
    // Validar campos obligatorios
    if (!companyData.company_name || !companyData.full_name || !companyData.company_size || !companyData.industry_sector) {
      toast({
        title: "Información incompleta",
        description: "Todos los campos marcados con * son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: companyData.company_name,
          full_name: companyData.full_name,
          company_size: companyData.company_size,
          industry_sector: companyData.industry_sector,
          website_url: companyData.website_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      // Actualizar el perfil en el estado
      const updatedProfile = { ...profile, ...companyData };
      onProfileUpdate(updatedProfile);

      toast({
        title: "Información guardada",
        description: "La información de su empresa ha sido actualizada correctamente.",
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
          <p className="text-sm text-muted-foreground">
            Complete toda la información obligatoria (*) para acceder al dashboard completo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de la empresa *</Label>
              <Input
                id="company_name"
                value={companyData.company_name}
                onChange={(e) => setCompanyData({...companyData, company_name: e.target.value})}
                placeholder="Nombre de su empresa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre del contacto *</Label>
              <Input
                id="full_name"
                value={companyData.full_name}
                onChange={(e) => setCompanyData({...companyData, full_name: e.target.value})}
                placeholder="Su nombre completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_size">Tamaño de la empresa *</Label>
              <Select value={companyData.company_size} onValueChange={(value) => setCompanyData({...companyData, company_size: value})} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tamaño" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry_sector">Sector de la industria *</Label>
              <Select value={companyData.industry_sector} onValueChange={(value) => setCompanyData({...companyData, industry_sector: value})} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Sitio web</Label>
              <Input
                id="website_url"
                type="url"
                value={companyData.website_url}
                onChange={(e) => setCompanyData({...companyData, website_url: e.target.value})}
                placeholder="https://suempresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email corporativo (no editable)</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveCompanyInfo}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Guardando..." : "Guardar Información"}
            </Button>
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