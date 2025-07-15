import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DeveloperAuth from "@/components/auth/DeveloperAuth";
import ExpertAuth from "@/components/auth/ExpertAuth";
import CompanyAuth from "@/components/auth/CompanyAuth";

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
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading gradient-text">
            Únete a Buildera
          </h1>
          <p className="text-muted-foreground mt-2">
            Conecta con el futuro de la automatización inteligente
          </p>
        </div>

        <Card className="shadow-elegant">
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
                <DeveloperAuth mode={authMode} />
              </TabsContent>
              <TabsContent value="expert" className="mt-6">
                <ExpertAuth mode={authMode} />
              </TabsContent>
              <TabsContent value="company" className="mt-6">
                <CompanyAuth mode={authMode} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;