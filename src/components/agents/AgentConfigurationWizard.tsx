import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Settings, Zap, Save } from "lucide-react";

interface InputSchema {
  type: string;
  required?: string[];
  recurring_capable?: boolean;
  properties: Record<string, SchemaProperty>;
}

interface SchemaProperty {
  type: string;
  title: string;
  description?: string;
  enum?: string[];
  default?: any;
  items?: {
    type: string;
    enum?: string[];
  };
  minimum?: number;
  maximum?: number;
  properties?: Record<string, SchemaProperty>;
}

interface AgentConfigurationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentDescription: string;
  inputSchema: InputSchema | null;
  creditsPerUse: number;
  existingConfig?: Record<string, any>;
  onSave: (config: Record<string, any>) => Promise<boolean>;
  saving?: boolean;
}

export const AgentConfigurationWizard = ({
  isOpen,
  onClose,
  agentName,
  agentDescription,
  inputSchema,
  creditsPerUse,
  existingConfig,
  onSave,
  saving = false
}: AgentConfigurationWizardProps) => {
  const { t } = useTranslation(['common']);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize form data with defaults or existing config
  useEffect(() => {
    if (!inputSchema?.properties) return;

    const initialData: Record<string, any> = {};
    
    Object.entries(inputSchema.properties).forEach(([key, prop]) => {
      if (existingConfig?.[key] !== undefined) {
        initialData[key] = existingConfig[key];
      } else if (prop.default !== undefined) {
        initialData[key] = prop.default;
      } else if (prop.type === 'boolean') {
        initialData[key] = false;
      } else if (prop.type === 'array') {
        initialData[key] = [];
      } else if (prop.type === 'object') {
        initialData[key] = {};
      }
    });

    setFormData(initialData);
  }, [inputSchema, existingConfig]);

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayToggle = (key: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[key] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v: string) => v !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  const handleSave = async () => {
    const success = await onSave(formData);
    if (success) {
      onClose();
    }
  };

  const renderField = (key: string, prop: SchemaProperty) => {
    const isRequired = inputSchema?.required?.includes(key);
    const value = formData[key];

    // String with enum (select)
    if (prop.type === 'string' && prop.enum) {
      return (
        <div key={key} className="space-y-2">
          <Label className="flex items-center gap-2">
            {prop.title}
            {isRequired && <Badge variant="destructive" className="text-xs">Requerido</Badge>}
          </Label>
          {prop.description && (
            <p className="text-xs text-muted-foreground">{prop.description}</p>
          )}
          <Select value={value || ''} onValueChange={(v) => handleFieldChange(key, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecciona ${prop.title.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {prop.enum.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatEnumLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Regular string input
    if (prop.type === 'string') {
      return (
        <div key={key} className="space-y-2">
          <Label className="flex items-center gap-2">
            {prop.title}
            {isRequired && <Badge variant="destructive" className="text-xs">Requerido</Badge>}
          </Label>
          {prop.description && (
            <p className="text-xs text-muted-foreground">{prop.description}</p>
          )}
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={prop.description || prop.title}
          />
        </div>
      );
    }

    // Boolean (switch)
    if (prop.type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between py-2">
          <div>
            <Label>{prop.title}</Label>
            {prop.description && (
              <p className="text-xs text-muted-foreground">{prop.description}</p>
            )}
          </div>
          <Switch
            checked={value || false}
            onCheckedChange={(checked) => handleFieldChange(key, checked)}
          />
        </div>
      );
    }

    // Integer with slider
    if (prop.type === 'integer' && prop.minimum !== undefined && prop.maximum !== undefined) {
      return (
        <div key={key} className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{prop.title}</Label>
            <Badge variant="secondary">{value || prop.default || prop.minimum}</Badge>
          </div>
          {prop.description && (
            <p className="text-xs text-muted-foreground">{prop.description}</p>
          )}
          <Slider
            value={[value || prop.default || prop.minimum]}
            onValueChange={([v]) => handleFieldChange(key, v)}
            min={prop.minimum}
            max={prop.maximum}
            step={1}
          />
        </div>
      );
    }

    // Array with enum items (multi-select checkboxes)
    if (prop.type === 'array' && prop.items?.enum) {
      const selectedValues = value || [];
      return (
        <div key={key} className="space-y-2">
          <Label className="flex items-center gap-2">
            {prop.title}
            {isRequired && <Badge variant="destructive" className="text-xs">Requerido</Badge>}
          </Label>
          {prop.description && (
            <p className="text-xs text-muted-foreground">{prop.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {prop.items.enum.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  id={`${key}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={() => handleArrayToggle(key, option)}
                />
                <Label htmlFor={`${key}-${option}`} className="text-sm font-normal cursor-pointer">
                  {formatEnumLabel(option)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Object with nested properties
    if (prop.type === 'object' && prop.properties) {
      const objectValue = value || {};
      return (
        <div key={key} className="space-y-3 p-3 rounded-lg bg-muted/50">
          <Label className="font-medium">{prop.title}</Label>
          <div className="space-y-3">
            {Object.entries(prop.properties).map(([nestedKey, nestedProp]) => (
              <div key={nestedKey} className="flex items-center justify-between">
                <Label className="text-sm font-normal">{nestedKey}</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[objectValue[nestedKey] || nestedProp.default || 0]}
                    onValueChange={([v]) => handleFieldChange(key, { ...objectValue, [nestedKey]: v })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-24"
                  />
                  <Badge variant="outline" className="w-12 justify-center">
                    {objectValue[nestedKey] || nestedProp.default || 0}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // Check if all required fields are filled
  const isValid = () => {
    if (!inputSchema?.required) return true;
    return inputSchema.required.every(key => {
      const value = formData[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '' && value !== null;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurar {agentName}
          </DialogTitle>
          <DialogDescription>
            {existingConfig 
              ? "Modifica la configuración del agente antes de ejecutarlo"
              : "Configura el agente por primera vez para poder ejecutarlo"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agent Info */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">{agentDescription}</p>
            <div className="flex items-center gap-2 mt-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">{creditsPerUse} créditos por ejecución</span>
            </div>
          </div>

          {/* Dynamic Fields */}
          {inputSchema?.properties ? (
            <div className="space-y-4">
              {Object.entries(inputSchema.properties).map(([key, prop]) => 
                renderField(key, prop)
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Este agente no requiere configuración adicional
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !isValid()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {existingConfig ? 'Actualizar y Ejecutar' : 'Guardar Configuración'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper to format enum values to readable labels
function formatEnumLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export default AgentConfigurationWizard;
