import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users, Target, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

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
      .from("platform_agents")
      .select("id, name, instructions, icon, tools_config")
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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 10 }}
        >
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
        >
          ¡Equipo Listo para Despegar!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground"
        >
          Revisa los detalles antes de activar tu equipo de alto rendimiento
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="overflow-hidden border-primary/20">
          <CardContent className="p-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Nombre del Equipo</h4>
              </div>
              <p className="text-xl font-medium ml-12">{teamData.teamName}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
                <h4 className="font-semibold text-lg">Misión</h4>
              </div>
              <p className="text-muted-foreground ml-12">{getMissionDescription()}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <h4 className="font-semibold text-lg">Miembros del Equipo ({agents.length})</h4>
              </div>
              <div className="grid grid-cols-1 gap-3 ml-12">
                {agents.map((agent, idx) => {
                  const sfiaLevel = agent.tools_config?.average_sfia_level || 4;
                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + idx * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-lg border border-primary/10"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl">{agent.icon || "🤖"}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.instructions}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Nivel {sfiaLevel}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-lg border border-green-500/20"
      >
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="h-6 w-6 text-green-500" />
          <h4 className="font-semibold text-lg">Impacto Esperado</h4>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-green-600">+{agents.length * 150}%</div>
            <div className="text-xs text-muted-foreground">Productividad</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">24/7</div>
            <div className="text-xs text-muted-foreground">Disponibilidad</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">{agents.length}x</div>
            <div className="text-xs text-muted-foreground">Capacidad</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground">
          🚀 Al activar el equipo, los agentes estarán listos para ejecutar misiones inmediatamente
        </p>
      </motion.div>
    </div>
  );
};
