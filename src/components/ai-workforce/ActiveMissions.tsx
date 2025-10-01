import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play,
  Eye,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  task_name: string;
  task_description: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  output_data: any;
}

interface ActiveMissionsProps {
  onViewResults: (task: Task) => void;
}

export const ActiveMissions = ({ onViewResults }: ActiveMissionsProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadActiveMissions();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadActiveMissions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveMissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ai_workforce_team_tasks")
        .select(`
          *,
          ai_workforce_teams!inner(user_id)
        `)
        .eq("ai_workforce_teams.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTasks(data || []);
    } catch (error) {
      console.error("Error loading missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      failed: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "Pendiente",
      in_progress: "En Progreso",
      completed: "Completada",
      failed: "Fallida",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getProgress = (task: Task) => {
    if (task.status === "completed") return 100;
    if (task.status === "in_progress") return 50;
    if (task.status === "pending") return 10;
    return 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando misiones...</p>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No tienes misiones activas</h3>
          <p className="text-muted-foreground">
            Selecciona una misión del catálogo para comenzar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Misiones Activas</h2>
        <p className="text-muted-foreground">
          Supervisa el progreso de tus agentes en tiempo real
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <CardTitle className="text-lg">{task.task_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {task.task_description}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(task.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{getProgress(task)}%</span>
                </div>
                <Progress value={getProgress(task)} className="h-2" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Iniciada: {new Date(task.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {task.status === "completed" && (
                  <Button 
                    size="sm" 
                    onClick={() => onViewResults(task)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Resultados
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};