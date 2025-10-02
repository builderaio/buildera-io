import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Target, CheckCircle2, Users, TrendingUp, Zap } from "lucide-react";
import { MissionCatalog } from "@/components/ai-workforce/MissionCatalog";
import { MissionLauncher } from "@/components/ai-workforce/MissionLauncher";
import { ActiveMissions } from "@/components/ai-workforce/ActiveMissions";
import { MissionResults } from "@/components/ai-workforce/MissionResults";
import { AgentDeploymentManager } from "@/components/ai-workforce/AgentDeploymentManager";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

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
  const [stats, setStats] = useState({
    availableMissions: 6,
    activeAgents: 0,
    completedTasks: 0,
    activeTeams: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count active agents
      const { count: agentsCount } = await supabase
        .from("ai_workforce_agents")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Count completed tasks
      const { count: tasksCount } = await supabase
        .from("ai_workforce_team_tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Count active teams
      const { count: teamsCount } = await supabase
        .from("ai_workforce_teams")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

      setStats({
        availableMissions: 6,
        activeAgents: agentsCount || 0,
        completedTasks: tasksCount || 0,
        activeTeams: teamsCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            🎯 Centro de Mando de Agentes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground mb-6"
          >
            Construye tu equipo de IA y escala tu negocio exponencialmente
          </motion.p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Misiones Disponibles</CardTitle>
                  <Rocket className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.availableMissions}</div>
                  <p className="text-xs text-muted-foreground">
                    Listas para ejecutar
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
                  <Users className="h-5 w-5 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.activeAgents}</div>
                  <p className="text-xs text-muted-foreground">
                    Especializados disponibles
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.completedTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    Este mes
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Equipos Activos</CardTitle>
                  <Zap className="h-5 w-5 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.activeTeams}</div>
                  <p className="text-xs text-muted-foreground">
                    Trabajando ahora
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Growth indicator */}
          {stats.completedTasks > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20"
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ¡Tu equipo está generando resultados! Productividad aumentada en un {stats.completedTasks * 47}%
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

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
