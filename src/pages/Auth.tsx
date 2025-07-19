import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DeveloperAuth from "@/components/auth/DeveloperAuth";
import ExpertAuth from "@/components/auth/ExpertAuth";
import CompanyAuth from "@/components/auth/CompanyAuth";
import authBackground from "@/assets/auth-background.jpg";
import builderaLogo from "@/assets/buildera-logo.png";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [activeTab, setActiveTab] = useState("company");

  useEffect(() => {
    // Read URL parameters to set initial state
    const mode = searchParams.get("mode");
    const userType = searchParams.get("userType");
    
    if (mode === "register" || mode === "signup") {
      setAuthMode("signup");
    } else if (mode === "login" || mode === "signin") {
      setAuthMode("signin");
    }
    
    if (userType === "developer" || userType === "expert" || userType === "company") {
      setActiveTab(userType);
    }
  }, [searchParams]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <a href="/">
            <Button variant="ghost" size="lg" className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Volver al Inicio
            </Button>
          </a>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={builderaLogo} 
                alt="Buildera Logo" 
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-3xl font-heading text-white mb-2">
              Únete a Buildera
            </h1>
            <p className="text-white/80 mt-2">
              Conecta con el futuro de la automatización inteligente
            </p>
          </div>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        <Card className="shadow-elegant backdrop-blur-sm bg-card/95 border border-white/10">
          <CardHeader className="text-center">
            <div className="flex justify-center space-x-4 mb-4">
              <button
                onClick={() => setAuthMode("signin")}
                className={`px-4 py-2 rounded-md font-medium transition-smooth ${
                  authMode === "signin"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setAuthMode("signup")}
                className={`px-4 py-2 rounded-md font-medium transition-smooth ${
                  authMode === "signup"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Registrarse
              </button>
            </div>
            <CardTitle>
              {authMode === "signin" ? "Bienvenido de nuevo" : "Crear cuenta"}
            </CardTitle>
            <CardDescription>
              {authMode === "signin"
                ? "Ingresa a tu cuenta"
                : "Selecciona tu perfil para comenzar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="developer">Desarrollador</TabsTrigger>
                <TabsTrigger value="expert">Experto</TabsTrigger>
                <TabsTrigger value="company">Empresa</TabsTrigger>
              </TabsList>
              <TabsContent value="developer" className="mt-6">
                <DeveloperAuth mode={authMode} onModeChange={setAuthMode} />
              </TabsContent>
              <TabsContent value="expert" className="mt-6">
                <ExpertAuth mode={authMode} onModeChange={setAuthMode} />
              </TabsContent>
              <TabsContent value="company" className="mt-6">
                <CompanyAuth mode={authMode} onModeChange={setAuthMode} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;