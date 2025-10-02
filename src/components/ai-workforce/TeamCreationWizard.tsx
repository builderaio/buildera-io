import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { StepMission } from "./wizard/StepMission";
import { StepRoles } from "./wizard/StepRoles";
import { StepReview } from "./wizard/StepReview";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TeamCelebration } from "./TeamCelebration";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showCelebration, setShowCelebration] = useState(false);

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

      // Show celebration instead of simple toast
      setShowCelebration(true);
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

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    onTeamCreated();
    resetWizard();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Crear Nuevo Equipo de IA - Paso {step} de 3
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepMission
                    teamData={teamData}
                    setTeamData={setTeamData}
                  />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepRoles
                    selectedAgents={teamData.selectedAgents}
                    onAgentsChange={(agents) => setTeamData({ ...teamData, selectedAgents: agents })}
                  />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepReview
                    teamData={teamData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
              <Button onClick={handleNext} className="bg-gradient-to-r from-primary to-purple-600">
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateTeam}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
                <Sparkles className="mr-2 h-4 w-4" />
                {isSubmitting ? "Creando tu equipo..." : "🚀 Activar Equipo"}
              </Button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? "w-8 bg-primary" : s < step ? "w-2 bg-green-500" : "w-2 bg-muted"
                }`}
                initial={false}
                animate={{
                  scale: s === step ? 1.2 : 1,
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {showCelebration && (
        <TeamCelebration
          teamName={teamData.teamName}
          agentCount={teamData.selectedAgents.length}
          onComplete={handleCelebrationComplete}
        />
      )}
    </>
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
