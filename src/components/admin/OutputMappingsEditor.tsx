import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowRight, Database } from "lucide-react";

export interface OutputMapping {
  source_path: string;
  target_key: string;
  category: string;
}

interface OutputMappingsEditorProps {
  mappings: OutputMapping[];
  onChange: (mappings: OutputMapping[]) => void;
}

const PARAMETER_CATEGORIES = [
  { value: 'strategy', label: 'Estrategia' },
  { value: 'branding', label: 'Branding' },
  { value: 'content', label: 'Contenido' },
  { value: 'audience', label: 'Audiencia' },
  { value: 'analytics', label: 'Analíticas' },
  { value: 'campaign', label: 'Campaña' },
  { value: 'insights', label: 'Insights' },
  { value: 'general', label: 'General' },
];

const COMMON_MAPPINGS = [
  { source_path: 'data.strategy', target_key: 'posicionamiento', category: 'strategy' },
  { source_path: 'data.mission', target_key: 'mision', category: 'strategy' },
  { source_path: 'data.vision', target_key: 'vision', category: 'strategy' },
  { source_path: 'data.value_proposition', target_key: 'propuesta_valor', category: 'strategy' },
  { source_path: 'data.brand_voice', target_key: 'brand_voice', category: 'branding' },
  { source_path: 'data.visual_identity', target_key: 'identidad_visual', category: 'branding' },
  { source_path: 'data.content_ideas', target_key: 'ideas_contenido', category: 'content' },
  { source_path: 'data.audience_segments', target_key: 'segmentos_audiencia', category: 'audience' },
  { source_path: 'data.insights', target_key: 'insights_generados', category: 'insights' },
];

export const OutputMappingsEditor = ({ mappings, onChange }: OutputMappingsEditorProps) => {
  const addMapping = () => {
    onChange([...mappings, { source_path: '', target_key: '', category: 'general' }]);
  };

  const updateMapping = (index: number, updates: Partial<OutputMapping>) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    onChange(newMappings);
  };

  const removeMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  const addCommonMapping = (mapping: OutputMapping) => {
    if (!mappings.find(m => m.target_key === mapping.target_key)) {
      onChange([...mappings, mapping]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Mapeo de Salida a company_parameters
          </CardTitle>
          <CardDescription>
            Define cómo se guardarán los resultados del webhook en la tabla company_parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Common mappings shortcuts */}
          <div className="space-y-2">
            <Label>Agregar mapeos comunes:</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_MAPPINGS.map((mapping, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonMapping(mapping)}
                  disabled={mappings.some(m => m.target_key === mapping.target_key)}
                  className="text-xs"
                >
                  {mapping.target_key}
                </Button>
              ))}
            </div>
          </div>

          {/* Mappings list */}
          <div className="space-y-3">
            {mappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="data.response.field"
                      value={mapping.source_path}
                      onChange={(e) => updateMapping(index, { source_path: e.target.value })}
                      className="flex-1"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="parameter_key"
                      value={mapping.target_key}
                      onChange={(e) => updateMapping(index, { target_key: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <Select
                    value={mapping.category}
                    onValueChange={(value) => updateMapping(index, { category: value })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARAMETER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMapping(index)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {mappings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay mapeos configurados</p>
                <p className="text-xs">Los resultados del webhook no se guardarán en company_parameters</p>
              </div>
            )}
          </div>

          <Button type="button" variant="outline" onClick={addMapping} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Mapeo
          </Button>
        </CardContent>
      </Card>

      {/* Help section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>source_path:</strong> Ruta en notación punto al valor en la respuesta JSON del webhook.
            Ejemplo: <code className="bg-muted px-1 rounded">data.strategy.mission</code>
          </p>
          <p>
            <strong>target_key:</strong> Nombre del parámetro que se guardará en company_parameters.
            Ejemplo: <code className="bg-muted px-1 rounded">mision</code>
          </p>
          <p>
            <strong>category:</strong> Categoría para organizar los parámetros y facilitar su búsqueda.
          </p>
          <div className="bg-muted/50 rounded p-3 font-mono text-xs mt-4">
            <p className="text-foreground mb-1">Ejemplo de respuesta del webhook:</p>
            <pre>{`{
  "data": {
    "strategy": {
      "mission": "Nuestra misión...",
      "vision": "Nuestra visión..."
    }
  }
}`}</pre>
            <p className="text-foreground mt-2 mb-1">Con mapeo:</p>
            <pre>{`source_path: "data.strategy.mission"
target_key: "mision"
category: "strategy"`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
