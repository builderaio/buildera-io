import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { StepMission } from "./wizard/StepMission";
import { StepRoles } from "./wizard/StepRoles";
import { StepReview } from "./wizard/StepReview";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TeamCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated: () => void;
}

export const TeamCreationWizard = ({ open, onOpenChange, onTeamCreated }: TeamCreationWizardProps) => {
  const [step, setStep] = useState(1);
  const [teamData, setTeamData] = useState({
    teamName: "",
    missionType: "",
    customMission: "",
    selectedAgents: [] as string[],
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step === 1 && !teamData.teamName) {
      toast({
        title: "Nombre requerido",
        description: "Por favor, ingresa un nombre para tu equipo",
        variant: "destructive",
      });
      return;
    }
    if (step === 1 && !teamData.missionType && !teamData.customMission) {
      toast({
        title: "Misión requerida",
        description: "Por favor, selecciona o describe el objetivo de tu equipo",
        variant: "destructive",
      });
      return;
    }
    if (step === 2 && teamData.selectedAgents.length === 0) {
      toast({
        title: "Agentes requeridos",
        description: "Por favor, selecciona al menos un agente para tu equipo",
        variant: "destructive",
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreateTeam = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Get user's primary company
      const { data: profile } = await supabase
        .from("profiles")
        .select("primary_company_id")
        .eq("user_id", user.id)
        .single();

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("ai_workforce_teams")
        .insert({
          user_id: user.id,
          company_id: profile?.primary_company_id,
          team_name: teamData.teamName,
          mission_objective: teamData.customMission || getMissionDescription(teamData.missionType),
          mission_type: teamData.missionType || "custom",
          status: "active",
          activated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add team members
      const members = teamData.selectedAgents.map(agentId => ({
        team_id: team.id,
        agent_id: agentId,
      }));

      const { error: membersError } = await supabase
        .from("ai_workforce_team_members")
        .insert(members);

      if (membersError) throw membersError;

      toast({
        title: "¡Equipo creado!",
        description: `Tu equipo "${teamData.teamName}" está listo para trabajar`,
      });

      onTeamCreated();
      resetWizard();
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el equipo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setTeamData({
      teamName: "",
      missionType: "",
      customMission: "",
      selectedAgents: [],
    });
  };

  const getMissionDescription = (type: string) => {
    const missions: Record<string, string> = {
      marketing_campaign: "Lanzar una campaña de marketing",
      content_generation: "Generar contenido continuo para redes sociales",
      performance_analysis: "Analizar rendimiento y competencia",
      seo_improvement: "Mejorar el posicionamiento SEO",
      community_management: "Gestionar la comunidad online",
    };
    return missions[type] || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Crear Nuevo Equipo de IA - Paso {step} de 3
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {step === 1 && (
            <StepMission
              teamData={teamData}
              setTeamData={setTeamData}
            />
          )}
          {step === 2 && (
            <StepRoles
              selectedAgents={teamData.selectedAgents}
              onAgentsChange={(agents) => setTeamData({ ...teamData, selectedAgents: agents })}
            />
          )}
          {step === 3 && (
            <StepReview
              teamData={teamData}
            />
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext}>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateTeam}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-purple-600"
            >
              {isSubmitting ? "Creando..." : "Crear Equipo"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getMissionDescription = (type: string) => {
  const missions: Record<string, string> = {
    marketing_campaign: "Lanzar una campaña de marketing",
    content_generation: "Generar contenido continuo para redes sociales",
    performance_analysis: "Analizar rendimiento y competencia",
    seo_improvement: "Mejorar el posicionamiento SEO",
    community_management: "Gestionar la comunidad online",
  };
  return missions[type] || "";
};
