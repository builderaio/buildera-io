import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SfiaSkill {
  code: string;
  name: string;
  level_1_description: string;
  level_2_description: string;
  level_3_description: string;
  level_4_description: string;
  level_5_description: string;
  level_6_description: string;
  level_7_description: string;
}

interface SfiaSkillSelectorProps {
  onSkillAdded: (skill: { skill_code: string; level: number; custom_description?: string }) => void;
}

export const SfiaSkillSelector = ({ onSkillAdded }: SfiaSkillSelectorProps) => {
  const [availableSkills, setAvailableSkills] = useState<SfiaSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("4");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadSfiaSkills();
  }, []);

  const loadSfiaSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("sfia_skills")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setAvailableSkills(data || []);
    } catch (error) {
      console.error("Error loading SFIA skills:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las habilidades SFIA",
        variant: "destructive",
      });
    }
  };

  const filteredSkills = availableSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelDescription = (skill: SfiaSkill, level: number) => {
    const key = `level_${level}_description` as keyof SfiaSkill;
    return skill[key] as string;
  };

  const handleAddSkill = () => {
    if (!selectedSkill || !selectedLevel) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona una habilidad y un nivel",
        variant: "destructive",
      });
      return;
    }

    const skill = availableSkills.find((s) => s.code === selectedSkill);
    if (!skill) return;

    const levelNum = parseInt(selectedLevel);
    const description = getLevelDescription(skill, levelNum);

    onSkillAdded({
      skill_code: skill.code,
      level: levelNum,
      custom_description: description,
    });

    setSelectedSkill("");
    setSelectedLevel("4");
    setSearchTerm("");

    toast({
      title: "Habilidad añadida",
      description: `${skill.code} - Nivel ${levelNum}`,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label>Buscar Habilidad SFIA</Label>
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Habilidad</Label>
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una habilidad" />
              </SelectTrigger>
              <SelectContent>
                {filteredSkills.map((skill) => (
                  <SelectItem key={skill.code} value={skill.code}>
                    {skill.code} - {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nivel de Responsabilidad</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Nivel {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedSkill && selectedLevel && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2">
              Descripción del Nivel {selectedLevel}:
            </p>
            <p className="text-sm text-muted-foreground">
              {getLevelDescription(
                availableSkills.find((s) => s.code === selectedSkill)!,
                parseInt(selectedLevel)
              )}
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleAddSkill}
          disabled={!selectedSkill || !selectedLevel}
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir Habilidad
        </Button>
      </CardContent>
    </Card>
  );
};
