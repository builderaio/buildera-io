import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StepReviewProps {
  teamData: {
    teamName: string;
    missionType: string;
    customMission: string;
    selectedAgents: string[];
  };
}

export const StepReview = ({ teamData }: StepReviewProps) => {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    loadSelectedAgents();
  }, [teamData.selectedAgents]);

  const loadSelectedAgents = async () => {
    if (teamData.selectedAgents.length === 0) return;

    const { data } = await supabase
      .from("ai_workforce_agents")
      .select("*")
      .in("id", teamData.selectedAgents);

    setAgents(data || []);
  };

  const getMissionDescription = () => {
    if (teamData.customMission) {
      return teamData.customMission;
    }

    const missions: Record<string, string> = {
      marketing_campaign: "Lanzar una campaña de marketing",
      content_generation: "Generar contenido continuo para redes sociales",
      performance_analysis: "Analizar rendimiento y competencia",
      seo_improvement: "Mejorar el posicionamiento SEO",
      community_management: "Gestionar la comunidad online",
    };

    return missions[teamData.missionType] || "";
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">¡Equipo Listo!</h3>
        <p className="text-muted-foreground">
          Revisa los detalles antes de activar tu equipo
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Nombre del Equipo</h4>
            </div>
            <p className="text-lg">{teamData.teamName}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Misión</h4>
            </div>
            <p className="text-muted-foreground">{getMissionDescription()}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Miembros del Equipo ({agents.length})</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">{agent.avatar_icon || "🤖"}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{agent.role_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.primary_function}
                    </p>
                  </div>
                  <Badge variant="outline">Nivel {agent.average_sfia_level || "4"}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          Al crear el equipo, los agentes estarán listos para comenzar a trabajar en las
          tareas asignadas
        </p>
      </div>
    </div>
  );
};
