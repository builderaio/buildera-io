import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpCircle, ExternalLink, CheckCircle2, Copy } from "lucide-react";
import { FaLinkedin, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocialURLHelpDialogProps {
  children?: React.ReactNode;
}

const platformExamples = {
  linkedin: {
    name: "LinkedIn",
    icon: FaLinkedin,
    color: "text-blue-600",
    examples: [
      "https://linkedin.com/in/tu-nombre",
      "https://www.linkedin.com/in/john-doe-123456/",
      "https://linkedin.com/company/tu-empresa"
    ],
    howToFind: [
      "1. Ve a tu perfil de LinkedIn en el navegador",
      "2. Copia la URL de la barra de direcciones",
      "3. La URL debe contener '/in/' para perfiles personales o '/company/' para páginas de empresa",
      "4. Asegúrate de copiar la URL completa incluyendo 'https://'"
    ],
    validation: "La URL debe contener 'linkedin.com/in/' o 'linkedin.com/company/'"
  },
  instagram: {
    name: "Instagram",
    icon: FaInstagram,
    color: "text-pink-600",
    examples: [
      "https://instagram.com/tu_usuario",
      "https://www.instagram.com/empresa_ejemplo/",
      "https://instagram.com/marca.oficial"
    ],
    howToFind: [
      "1. Abre Instagram en tu navegador web (no en la app)",
      "2. Ve a tu perfil haciendo clic en tu foto de perfil",
      "3. Copia la URL de la barra de direcciones",
      "4. La URL debe ser del formato instagram.com/tu_usuario"
    ],
    validation: "La URL debe contener 'instagram.com/' seguido de tu nombre de usuario"
  },
  facebook: {
    name: "Facebook",
    icon: FaFacebook,
    color: "text-blue-700",
    examples: [
      "https://facebook.com/tu.pagina",
      "https://www.facebook.com/EmpresaEjemplo",
      "https://facebook.com/profile.php?id=123456789"
    ],
    howToFind: [
      "1. Ve a tu página de Facebook en el navegador",
      "2. Copia la URL de la barra de direcciones",
      "3. La URL puede ser personalizada (facebook.com/nombre) o numérica (facebook.com/profile.php?id=...)",
      "4. Asegúrate de usar la URL de tu PÁGINA, no tu perfil personal"
    ],
    validation: "La URL debe contener 'facebook.com/' y puede incluir tu nombre de página o ID"
  },
  tiktok: {
    name: "TikTok",
    icon: FaTiktok,
    color: "text-black",
    examples: [
      "https://tiktok.com/@tu_usuario",
      "https://www.tiktok.com/@empresa_oficial",
      "https://tiktok.com/@marca.ejemplo"
    ],
    howToFind: [
      "1. Abre TikTok en tu navegador web",
      "2. Ve a tu perfil",
      "3. Copia la URL de la barra de direcciones",
      "4. La URL debe incluir '@' seguido de tu nombre de usuario"
    ],
    validation: "La URL debe contener 'tiktok.com/@' seguido de tu nombre de usuario"
  }
};

export const SocialURLHelpDialog = ({ children }: SocialURLHelpDialogProps) => {
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExample(`${platform}-${text}`);
    toast({
      title: "Copiado",
      description: "URL de ejemplo copiada al portapapeles"
    });
    setTimeout(() => setCopiedExample(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            ¿Cómo encontrar mi URL?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="w-5 h-5 text-primary" />
            Cómo encontrar las URLs de tus perfiles sociales
          </DialogTitle>
          <DialogDescription>
            Sigue las instrucciones específicas para cada plataforma
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="linkedin" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            {Object.entries(platformExamples).map(([key, platform]) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <platform.icon className={platform.color} />
                <span className="hidden sm:inline">{platform.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(platformExamples).map(([key, platform]) => (
            <TabsContent key={key} value={key} className="space-y-4 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${platform.color.split('-')[1]}-100 to-${platform.color.split('-')[1]}-200 flex items-center justify-center`}>
                  <platform.icon className={`w-6 h-6 ${platform.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground">Instrucciones paso a paso</p>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="w-4 h-4" />
                <AlertDescription className="font-medium">
                  {platform.validation}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                  Cómo encontrar tu URL
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  {platform.howToFind.map((step, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      {step}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                  Ejemplos de URLs válidas
                </h4>
                <div className="space-y-2">
                  {platform.examples.map((example, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/50 transition-colors group"
                    >
                      <code className="text-xs flex-1 text-primary font-mono">{example}</code>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(example, key)}
                        >
                          {copiedExample === `${key}-${example}` ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(example, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Alert className="bg-primary/5 border-primary/20">
                <AlertDescription className="text-xs">
                  <strong>Consejo:</strong> Usa la versión web de {platform.name} en tu navegador para copiar la URL correctamente. 
                  Las URLs de las aplicaciones móviles a veces no funcionan correctamente.
                </AlertDescription>
              </Alert>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
