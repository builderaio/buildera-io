import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Briefcase, TrendingUp } from "lucide-react";
import { TeamCreationWizard } from "@/components/ai-workforce/TeamCreationWizard";
import { TeamsList } from "@/components/ai-workforce/TeamsList";

const AIWorkforce = () => {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTeamCreated = () => {
    setShowWizard(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            🤖 Fábrica de Equipos de IA
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Crea equipos de agentes de IA especializados para impulsar tu negocio
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipos Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Listos para trabajar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agentes Disponibles</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">6</div>
                <p className="text-xs text-muted-foreground">
                  Roles especializados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productividad</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+250%</div>
                <p className="text-xs text-muted-foreground">
                  vs. trabajo manual
                </p>
              </CardContent>
            </Card>
          </div>

          <Button
            size="lg"
            onClick={() => setShowWizard(true)}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Crear Nuevo Equipo de IA
          </Button>
        </div>

        {/* Teams List */}
        <TeamsList key={refreshKey} />

        {/* Team Creation Wizard Dialog */}
        <TeamCreationWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onTeamCreated={handleTeamCreated}
        />
      </main>
    </div>
  );
};

export default AIWorkforce;
