import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Rocket, 
  Upload, 
  Calendar,
  FileText,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  title: string;
  description: string;
  agentRole: string;
  agentId: string;
  area: string;
}

interface MissionLauncherProps {
  mission: Mission;
  onBack: () => void;
  onLaunch: (taskId: string) => void;
}

export const MissionLauncher = ({ mission, onBack, onLaunch }: MissionLauncherProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const handleLaunchMission = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Get or create a default team
      let { data: teams } = await supabase
        .from("ai_workforce_teams")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      let teamId;
      if (!teams || teams.length === 0) {
        const { data: newTeam, error: teamError } = await supabase
          .from("ai_workforce_teams")
          .insert({
            user_id: user.id,
            team_name: "Equipo Principal",
            mission_objective: "Misiones automáticas",
            mission_type: "automated"
          })
          .select()
          .single();

        if (teamError) throw teamError;
        teamId = newTeam.id;
      } else {
        teamId = teams[0].id;
      }

      // Create the mission task
      const { data: task, error: taskError } = await supabase
        .from("ai_workforce_team_tasks")
        .insert({
          team_id: teamId,
          agent_id: null, // Will be assigned based on mission type
          task_name: mission.title,
          task_description: mission.description,
          task_type: mission.id,
          input_data: formData,
          status: "pending"
        })
        .select()
        .single();

      if (taskError) throw taskError;

      toast({
        title: "🚀 Misión Iniciada",
        description: "Tu agente de IA está trabajando en la misión",
      });

      onLaunch(task.id);
    } catch (error) {
      console.error("Error launching mission:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la misión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMissionForm = () => {
    switch (mission.id) {
      case "financial-profitability":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-upload">Carga de Datos</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Conecta tu sistema contable o sube tus reportes de ventas y costos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV, Excel, o conexión directa (QuickBooks, Xero)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Define el Periodo</Label>
              <div className="flex gap-2">
                <Input 
                  type="date" 
                  id="period-start"
                  onChange={(e) => setFormData({...formData, periodStart: e.target.value})}
                />
                <Input 
                  type="date" 
                  id="period-end"
                  onChange={(e) => setFormData({...formData, periodEnd: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Establece el Reto (Parámetros Específicos)</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-marketing"
                    onCheckedChange={(checked) => 
                      setFormData({...formData, includeMarketing: checked})
                    }
                  />
                  <label htmlFor="include-marketing" className="text-sm cursor-pointer">
                    Incluir costos indirectos de marketing en el análisis
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin-target">Objetivo de Margen (%)</Label>
                <Input 
                  id="margin-target"
                  type="number"
                  placeholder="20"
                  onChange={(e) => setFormData({...formData, marginTarget: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Identificar productos por debajo de este margen
                </p>
              </div>
            </div>
          </div>
        );

      case "legal-contract-review":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract-upload">Carga de Documento</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Sube el borrador del contrato
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF o Word
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-type">Define el Contexto</Label>
              <Select onValueChange={(value) => setFormData({...formData, contractType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">Proveedor</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="rental">Alquiler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Establece el Reto (Puntos de Enfoque)</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="check-confidentiality"
                    onCheckedChange={(checked) => 
                      setFormData({...formData, checkConfidentiality: checked})
                    }
                  />
                  <label htmlFor="check-confidentiality" className="text-sm cursor-pointer">
                    Analizar cláusulas de confidencialidad y no competencia
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="check-payment"
                    onCheckedChange={(checked) => 
                      setFormData({...formData, checkPayment: checked})
                    }
                  />
                  <label htmlFor="check-payment" className="text-sm cursor-pointer">
                    Verificar plazos de pago y penalidades por mora
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="check-termination"
                    onCheckedChange={(checked) => 
                      setFormData({...formData, checkTermination: checked})
                    }
                  />
                  <label htmlFor="check-termination" className="text-sm cursor-pointer">
                    Identificar condiciones de terminación anticipada
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "hr-job-profile":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position-title">Título del Cargo</Label>
              <Input 
                id="position-title"
                placeholder="Ej: Gerente de Marketing Digital"
                onChange={(e) => setFormData({...formData, positionTitle: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select onValueChange={(value) => setFormData({...formData, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="operations">Operaciones</SelectItem>
                  <SelectItem value="finance">Finanzas</SelectItem>
                  <SelectItem value="hr">Recursos Humanos</SelectItem>
                  <SelectItem value="it">Tecnología</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key-responsibilities">Responsabilidades Clave (3-5)</Label>
              <Textarea 
                id="key-responsibilities"
                placeholder="Lista las principales responsabilidades, una por línea"
                rows={5}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requisitos y Habilidades</Label>
              <Textarea 
                id="requirements"
                placeholder="Experiencia requerida, educación, habilidades técnicas y soft skills"
                rows={4}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mission-details">Detalles de la Misión</Label>
              <Textarea 
                id="mission-details"
                placeholder="Describe los detalles específicos de tu necesidad..."
                rows={6}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Catálogo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{mission.title}</CardTitle>
              <CardDescription className="text-base">
                {mission.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-4">
              {mission.area === "financial" ? "Financiera" :
               mission.area === "legal" ? "Jurídica" : "RRHH"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Agente asignado:</span>
            <span className="text-sm text-muted-foreground">{mission.agentRole}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderMissionForm()}

          <div className="pt-4 border-t">
            <Button 
              size="lg" 
              className="w-full"
              onClick={handleLaunchMission}
              disabled={loading}
            >
              <Rocket className="h-5 w-5 mr-2" />
              {loading ? "Iniciando..." : "🚀 Iniciar Análisis"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};