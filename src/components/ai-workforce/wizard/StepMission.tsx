import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, PenTool, TrendingUp, Search, Users2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface StepMissionProps {
  teamData: {
    teamName: string;
    missionType: string;
    customMission: string;
  };
  setTeamData: (data: any) => void;
}

const missionTemplates = [
  {
    id: "marketing_campaign",
    icon: Rocket,
    title: "Lanzar una campaña de marketing",
    description: "Planificar y ejecutar una campaña de marketing completa",
  },
  {
    id: "content_generation",
    icon: PenTool,
    title: "Generar contenido continuo",
    description: "Crear contenido regular para redes sociales y blog",
  },
  {
    id: "performance_analysis",
    icon: TrendingUp,
    title: "Analizar rendimiento y competencia",
    description: "Monitorear métricas y analizar la competencia",
  },
  {
    id: "seo_improvement",
    icon: Search,
    title: "Mejorar el posicionamiento SEO",
    description: "Optimizar contenido y estrategia SEO",
  },
  {
    id: "community_management",
    icon: Users2,
    title: "Gestionar la comunidad online",
    description: "Moderar y gestionar la comunidad en redes",
  },
  {
    id: "custom",
    icon: Sparkles,
    title: "Objetivo personalizado",
    description: "Define tu propio objetivo específico",
  },
];

export const StepMission = ({ teamData, setTeamData }: StepMissionProps) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label htmlFor="teamName" className="text-lg font-semibold flex items-center gap-2">
          <Users2 className="h-5 w-5 text-primary" />
          Nombre del Equipo
        </Label>
        <Input
          id="teamName"
          placeholder="Ej: Lanzamiento Nuevo Producto Q4"
          value={teamData.teamName}
          onChange={(e) => setTeamData({ ...teamData, teamName: e.target.value })}
          className="mt-2 text-lg"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label className="text-lg font-semibold mb-4 block flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          ¿Cuál es el objetivo principal de este equipo?
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missionTemplates.map((template, idx) => {
            const Icon = template.icon;
            const isSelected = teamData.missionType === template.id;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    isSelected
                      ? "ring-2 ring-primary shadow-lg bg-primary/5"
                      : ""
                  }`}
                  onClick={() => {
                    setTeamData({
                      ...teamData,
                      missionType: template.id,
                      customMission: template.id === "custom" ? teamData.customMission : "",
                    });
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <motion.div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-primary/20" : "bg-primary/10"
                        }`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-primary/70"}`} />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold mb-1">{template.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {teamData.missionType === "custom" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <Label htmlFor="customMission" className="text-base font-semibold">
            Describe tu objetivo personalizado
          </Label>
          <Textarea
            id="customMission"
            placeholder="Describe en detalle qué quieres lograr con este equipo..."
            value={teamData.customMission}
            onChange={(e) =>
              setTeamData({ ...teamData, customMission: e.target.value })
            }
            className="mt-2 min-h-[100px]"
          />
        </motion.div>
      )}
    </div>
  );
};
