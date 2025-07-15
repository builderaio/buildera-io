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
import { Lightbulb, Upload, Twitter, Linkedin, Instagram, Music } from "lucide-react";

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
  const [socialConnections, setSocialConnections] = useState({
    instagram: false,
    facebook: false,
    tiktok: false,
    linkedin: false
  });
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

  const handleSocialConnect = async (platform: string) => {
    setLoading(true);
    try {
      console.log(`🔗 Iniciando conexión con ${platform}`);
      
      // Simular el proceso de autenticación para demostración
      // En producción, aquí irían las URLs reales de OAuth
      const platformInfo = {
        instagram: {
          name: "Instagram Business",
          authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
          scopes: ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"]
        },
        facebook: {
          name: "Facebook Business",
          authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
          scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "publish_pages"]
        },
        tiktok: {
          name: "TikTok Business",
          authUrl: "https://www.tiktok.com/auth/authorize",
          scopes: ["user.info.basic", "video.list", "video.upload"]
        },
        linkedin: {
          name: "LinkedIn Company",
          authUrl: "https://www.linkedin.com/oauth/v2/authorization",
          scopes: ["r_organization_social", "w_organization_social", "rw_organization_admin"]
        }
      };

      const selectedPlatform = platformInfo[platform as keyof typeof platformInfo];
      
      if (!selectedPlatform) {
        throw new Error("Plataforma no soportada");
      }

      toast({
        title: "Conectando...",
        description: `Iniciando autenticación con ${selectedPlatform.name}`,
      });

      // Simular delay de autenticación
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Para demostración, simular éxito
      // En producción, aquí se abriría la ventana de OAuth real
      const shouldSucceed = Math.random() > 0.2; // 80% de éxito para demostración

      if (shouldSucceed) {
        // Simular datos de respuesta exitosa
        const mockAuthData = {
          access_token: `mock_token_${Date.now()}`,
          platform: platform,
          user_id: `user_${Math.random().toString(36).substring(7)}`,
          pages: platform === 'facebook' ? [`page_${Math.random().toString(36).substring(7)}`] : undefined,
          scopes: selectedPlatform.scopes
        };

        console.log(`✅ Autenticación exitosa para ${platform}:`, mockAuthData);

        // Actualizar estado de conexión
        setSocialConnections(prev => ({
          ...prev,
          [platform]: true
        }));

        // Aquí se guardarían los tokens en la base de datos
        // await supabase.from('social_connections').upsert({
        //   user_id: profile?.user_id,
        //   platform: platform,
        //   access_token: mockAuthData.access_token,
        //   platform_user_id: mockAuthData.user_id,
        //   scopes: mockAuthData.scopes,
        //   connected_at: new Date().toISOString()
        // });

        toast({
          title: "¡Conexión exitosa!",
          description: `${selectedPlatform.name} conectado correctamente. Ahora puede gestionar contenido y analizar métricas.`,
        });
      } else {
        throw new Error("Error en la autenticación");
      }

    } catch (error: any) {
      console.error(`❌ Error conectando ${platform}:`, error);
      toast({
        title: "Error de conexión",
        description: `No se pudo conectar con ${platform}. ${error.message || 'Inténtelo de nuevo.'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialDisconnect = async (platform: string) => {
    setLoading(true);
    try {
      console.log(`🔌 Desconectando ${platform}`);

      // Simular delay de desconexión
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Actualizar estado de conexión
      setSocialConnections(prev => ({
        ...prev,
        [platform]: false
      }));

      // Aquí se revocarían los tokens en la base de datos
      // await supabase.from('social_connections').delete()
      //   .eq('user_id', profile?.user_id)
      //   .eq('platform', platform);

      toast({
        title: "Desconectado",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} desconectado correctamente`,
      });

    } catch (error: any) {
      console.error(`❌ Error desconectando ${platform}:`, error);
      toast({
        title: "Error",
        description: `Error al desconectar ${platform}. ${error.message || 'Inténtelo de nuevo.'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = (platform: string): boolean => {
    // En producción, esto consultaría la base de datos
    return socialConnections[platform as keyof typeof socialConnections];
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
                type="text"
                value={companyData.website_url}
                onChange={(e) => setCompanyData({...companyData, website_url: e.target.value})}
                placeholder="suempresa.com"
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
                Conecte sus redes sociales empresariales para que nuestros agentes puedan analizar su rendimiento y generar contenido alineado a su marca. Todas las conexiones incluyen permisos para acceder a posts, usuarios y publicar contenido en nombre de la empresa.
              </p>
              <div className="space-y-4">
                {/* Instagram Business */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Instagram className="w-8 h-8 text-pink-600 mr-4" />
                    <div>
                      <span className="font-medium">Instagram Business</span>
                      <p className="text-sm text-muted-foreground">Acceso a posts, stories, usuarios y publicación de contenido</p>
                    </div>
                  </div>
                  {checkConnectionStatus('instagram') ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">Conectado</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSocialDisconnect('instagram')}
                        disabled={loading}
                      >
                        {loading ? "Desconectando..." : "Desconectar"}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="default" 
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                      onClick={() => handleSocialConnect('instagram')}
                      disabled={loading}
                    >
                      {loading ? "Conectando..." : "Conectar"}
                    </Button>
                  )}
                </div>

                {/* Facebook Business */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded mr-4 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">f</span>
                    </div>
                    <div>
                      <span className="font-medium">Facebook Business</span>
                      <p className="text-sm text-muted-foreground">Gestión de páginas, posts y audiencias empresariales</p>
                    </div>
                  </div>
                  {checkConnectionStatus('facebook') ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">Conectado</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSocialDisconnect('facebook')}
                        disabled={loading}
                      >
                        {loading ? "Desconectando..." : "Desconectar"}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="default" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleSocialConnect('facebook')}
                      disabled={loading}
                    >
                      {loading ? "Conectando..." : "Conectar"}
                    </Button>
                  )}
                </div>

                {/* TikTok Business */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Music className="w-8 h-8 text-black mr-4" />
                    <div>
                      <span className="font-medium">TikTok Business</span>
                      <p className="text-sm text-muted-foreground">Subida de videos, análisis y gestión de contenido empresarial</p>
                    </div>
                  </div>
                  {checkConnectionStatus('tiktok') ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">Conectado</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSocialDisconnect('tiktok')}
                        disabled={loading}
                      >
                        {loading ? "Desconectando..." : "Desconectar"}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="default" 
                      className="bg-black hover:bg-gray-800 text-white"
                      onClick={() => handleSocialConnect('tiktok')}
                      disabled={loading}
                    >
                      {loading ? "Conectando..." : "Conectar"}
                    </Button>
                  )}
                </div>

                {/* LinkedIn Company */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Linkedin className="w-8 h-8 text-blue-700 mr-4" />
                    <div>
                      <span className="font-medium">LinkedIn Company</span>
                      <p className="text-sm text-muted-foreground">Gestión de página empresarial, posts y analytics profesionales</p>
                    </div>
                  </div>
                  {checkConnectionStatus('linkedin') ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">Conectado</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSocialDisconnect('linkedin')}
                        disabled={loading}
                      >
                        {loading ? "Desconectando..." : "Desconectar"}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="default" 
                      className="bg-blue-700 hover:bg-blue-800 text-white"
                      onClick={() => handleSocialConnect('linkedin')}
                      disabled={loading}
                    >
                      {loading ? "Conectando..." : "Conectar"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Permisos otorgados por cada conexión:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Instagram Business:</strong> Lectura de posts, stories, comentarios, seguidores y publicación de contenido</li>
                  <li>• <strong>Facebook Business:</strong> Gestión de páginas, publicación de posts, lectura de insights y audiencias</li>
                  <li>• <strong>TikTok Business:</strong> Subida de videos, acceso a analytics y gestión de perfil empresarial</li>
                  <li>• <strong>LinkedIn Company:</strong> Gestión de página de empresa, publicación de contenido y acceso a métricas</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ADNEmpresa;