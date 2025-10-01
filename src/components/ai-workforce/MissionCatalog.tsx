import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Shield, 
  Users, 
  UserPlus,
  BarChart3,
  Wallet,
  FileCheck,
  Lock,
  Briefcase,
  Target
} from "lucide-react";

interface Mission {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  agentRole: string;
  agentId: string;
  area: string;
  difficulty: "basic" | "intermediate" | "advanced";
}

const missions: Mission[] = [
  // Área Financiera
  {
    id: "financial-profitability",
    title: "📊 Análisis de Rentabilidad de Producto",
    icon: BarChart3,
    description: "No sé cuáles de mis productos o servicios me están generando más ganancias reales.",
    agentRole: "Analista de Planificación y Análisis Financiero (FP&A)",
    agentId: "AGENT_FPA_ANALYST",
    area: "financial",
    difficulty: "advanced"
  },
  {
    id: "financial-cashflow",
    title: "💰 Optimización de Flujo de Caja",
    icon: Wallet,
    description: "Necesito mejorar mi liquidez y entender mis ciclos de cobros y pagos.",
    agentRole: "Especialista en Contabilidad y Tesorería",
    agentId: "AGENT_ACCOUNTING_SPECIALIST",
    area: "financial",
    difficulty: "intermediate"
  },
  // Área Jurídica
  {
    id: "legal-contract-review",
    title: "📄 Revisión Preliminar de Contrato",
    icon: FileCheck,
    description: "Recibí un contrato de un nuevo proveedor y quiero identificar posibles cláusulas de riesgo.",
    agentRole: "Analista de Contratos y Cumplimiento Normativo",
    agentId: "AGENT_CONTRACTS_ANALYST",
    area: "legal",
    difficulty: "intermediate"
  },
  {
    id: "legal-data-compliance",
    title: "🔐 Auditoría de Cumplimiento de Protección de Datos",
    icon: Lock,
    description: "Quiero asegurarme de que mi página web y políticas cumplen con la normativa vigente.",
    agentRole: "Analista de Contratos y Cumplimiento Normativo",
    agentId: "AGENT_CONTRACTS_ANALYST",
    area: "legal",
    difficulty: "advanced"
  },
  // Área de Recursos Humanos
  {
    id: "hr-job-profile",
    title: "📝 Creación de Perfil de Cargo para Contratación",
    icon: Briefcase,
    description: "Necesito contratar a alguien, pero no sé cómo redactar una oferta atractiva y precisa.",
    agentRole: "Especialista en Adquisición de Talento",
    agentId: "AGENT_TALENT_ACQUISITION",
    area: "hr",
    difficulty: "basic"
  },
  {
    id: "hr-climate-survey",
    title: "📈 Diseño de Encuesta de Clima Laboral",
    icon: Target,
    description: "Quiero medir la satisfacción de mi equipo, pero no sé qué preguntas hacer.",
    agentRole: "Generalista de Desarrollo y Cultura Organizacional",
    agentId: "AGENT_HR_BUSINESS_PARTNER",
    area: "hr",
    difficulty: "intermediate"
  }
];

interface MissionCatalogProps {
  onSelectMission: (mission: Mission) => void;
}

export const MissionCatalog = ({ onSelectMission }: MissionCatalogProps) => {
  const [selectedArea, setSelectedArea] = useState<string>("all");

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "basic":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "intermediate":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "advanced":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredMissions = selectedArea === "all" 
    ? missions 
    : missions.filter(m => m.area === selectedArea);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Catálogo de Misiones</h2>
        <p className="text-muted-foreground">
          Selecciona una misión para resolver una necesidad específica de tu negocio
        </p>
      </div>

      <Tabs value={selectedArea} onValueChange={setSelectedArea}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Financiera
          </TabsTrigger>
          <TabsTrigger value="legal">
            <Shield className="h-4 w-4 mr-2" />
            Jurídica
          </TabsTrigger>
          <TabsTrigger value="hr">
            <Users className="h-4 w-4 mr-2" />
            RRHH
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedArea} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMissions.map((mission) => {
              const Icon = mission.icon;
              return (
                <Card 
                  key={mission.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => onSelectMission(mission)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="h-8 w-8 text-primary" />
                      <Badge 
                        variant="outline" 
                        className={getDifficultyColor(mission.difficulty)}
                      >
                        {mission.difficulty === "basic" ? "Básico" : 
                         mission.difficulty === "intermediate" ? "Intermedio" : "Avanzado"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {mission.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {mission.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span className="line-clamp-1">{mission.agentRole}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-primary/10">
                        Iniciar →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {filteredMissions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay misiones disponibles en esta área
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};