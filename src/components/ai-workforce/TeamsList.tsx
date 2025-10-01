import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Play, Pause, Trash2, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Team {
  id: string;
  team_name: string;
  mission_objective: string;
  mission_type: string;
  status: string;
  created_at: string;
  member_count?: number;
}

export const TeamsList = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ai_workforce_teams")
        .select(`
          *,
          ai_workforce_team_members(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const teamsWithCount = data?.map(team => ({
        ...team,
        member_count: team.ai_workforce_team_members?.[0]?.count || 0,
      })) || [];

      setTeams(teamsWithCount);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (teamId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("ai_workforce_teams")
        .update({ status: newStatus })
        .eq("id", teamId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El equipo está ahora ${newStatus === 'active' ? 'activo' : 'pausado'}`,
      });

      loadTeams();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este equipo?")) return;

    try {
      const { error } = await supabase
        .from("ai_workforce_teams")
        .delete()
        .eq("id", teamId);

      if (error) throw error;

      toast({
        title: "Equipo eliminado",
        description: "El equipo ha sido eliminado correctamente",
      });

      loadTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el equipo",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      paused: "secondary",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando equipos...</div>;
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tienes equipos aún</h3>
          <p className="text-muted-foreground">
            Crea tu primer equipo de IA para empezar a trabajar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tus Equipos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{team.team_name}</CardTitle>
                  <CardDescription className="mt-2">
                    {team.mission_objective}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(
                        team.id,
                        team.status === 'active' ? 'paused' : 'active'
                      )}
                    >
                      {team.status === 'active' ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Activar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(team.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {team.member_count} agentes
                  </span>
                </div>
                {getStatusBadge(team.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
