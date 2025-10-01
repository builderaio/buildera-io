import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, PenTool, TrendingUp, Search, Users2, Sparkles } from "lucide-react";

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
      <div>
        <Label htmlFor="teamName" className="text-lg font-semibold">
          Nombre del Equipo
        </Label>
        <Input
          id="teamName"
          placeholder="Ej: Lanzamiento Nuevo Producto Q4"
          value={teamData.teamName}
          onChange={(e) => setTeamData({ ...teamData, teamName: e.target.value })}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-lg font-semibold mb-4 block">
          ¿Cuál es el objetivo principal de este equipo?
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missionTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  teamData.missionType === template.id
                    ? "ring-2 ring-primary"
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
                    <Icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">{template.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {teamData.missionType === "custom" && (
        <div>
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
        </div>
      )}
    </div>
  );
};
