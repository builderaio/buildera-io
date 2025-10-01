import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Target, CheckCircle2 } from "lucide-react";
import { MissionCatalog } from "@/components/ai-workforce/MissionCatalog";
import { MissionLauncher } from "@/components/ai-workforce/MissionLauncher";
import { ActiveMissions } from "@/components/ai-workforce/ActiveMissions";
import { MissionResults } from "@/components/ai-workforce/MissionResults";

type ViewState = "catalog" | "launcher" | "missions" | "results";

interface Mission {
  id: string;
  title: string;
  description: string;
  agentRole: string;
  agentId: string;
  area: string;
}

interface Task {
  id: string;
  task_name: string;
  task_description: string;
  status: string;
  output_data: any;
  completed_at: string | null;
}

const AIWorkforce = () => {
  const [view, setView] = useState<ViewState>("catalog");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission);
    setView("launcher");
  };

  const handleLaunchMission = () => {
    setView("missions");
  };

  const handleViewResults = (task: Task) => {
    setSelectedTask(task);
    setView("results");
  };

  const handleBackToCatalog = () => {
    setView("catalog");
    setSelectedMission(null);
  };

  const handleBackToMissions = () => {
    setView("missions");
    setSelectedTask(null);
  };

  return (
    <div className="w-full">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            🎯 Centro de Mando de Agentes
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Asigna misiones a tus agentes de IA y recibe resultados accionables
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Misiones Disponibles</CardTitle>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">6</div>
                <p className="text-xs text-muted-foreground">
                  Listas para ejecutar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Especializados disponibles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Este mes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="mt-8">
          {view === "catalog" && (
            <MissionCatalog onSelectMission={handleSelectMission} />
          )}

          {view === "launcher" && selectedMission && (
            <MissionLauncher 
              mission={selectedMission}
              onBack={handleBackToCatalog}
              onLaunch={handleLaunchMission}
            />
          )}

          {view === "missions" && (
            <ActiveMissions onViewResults={handleViewResults} />
          )}

          {view === "results" && selectedTask && (
            <MissionResults 
              task={selectedTask}
              onBack={handleBackToMissions}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AIWorkforce;
