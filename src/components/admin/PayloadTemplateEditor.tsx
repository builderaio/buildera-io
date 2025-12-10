import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, Copy, FileJson, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayloadTemplateEditorProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  agentCategory?: string;
}

const VARIABLE_CATEGORIES = [
  {
    category: "Empresa",
    icon: "🏢",
    variables: [
      { key: "{{company.id}}", label: "ID", desc: "UUID de la empresa" },
      { key: "{{company.name}}", label: "Nombre", desc: "Nombre de la empresa" },
      { key: "{{company.industry_sector}}", label: "Industria", desc: "Sector industrial" },
      { key: "{{company.description}}", label: "Descripción", desc: "Descripción de la empresa" },
      { key: "{{company.website_url}}", label: "Website", desc: "URL del sitio web" },
      { key: "{{company.country}}", label: "País", desc: "País de operación" },
    ]
  },
  {
    category: "Estrategia",
    icon: "🎯",
    variables: [
      { key: "{{strategy.mision}}", label: "Misión", desc: "Misión empresarial" },
      { key: "{{strategy.vision}}", label: "Visión", desc: "Visión de futuro" },
      { key: "{{strategy.propuesta_valor}}", label: "Propuesta de Valor", desc: "Propuesta de valor única" },
    ]
  },
  {
    category: "Branding",
    icon: "🎨",
    variables: [
      { key: "{{branding.primary_color}}", label: "Color Principal", desc: "Color primario de marca" },
      { key: "{{branding.secondary_color}}", label: "Color Secundario", desc: "Color secundario" },
      { key: "{{branding.visual_identity}}", label: "Identidad Visual", desc: "Descripción visual de marca" },
      { key: "{{branding.brand_voice}}", label: "Voz de Marca", desc: "Tono y personalidad" },
    ]
  },
  {
    category: "Usuario",
    icon: "👤",
    variables: [
      { key: "{{userId}}", label: "User ID", desc: "ID del usuario autenticado" },
      { key: "{{language}}", label: "Idioma", desc: "Idioma preferido (es/en/pt)" },
      { key: "{{audiences}}", label: "Audiencias", desc: "Array completo de audiencias" },
    ]
  },
  {
    category: "Configuración",
    icon: "⚙️",
    variables: [
      { key: "{{configuration.prompt}}", label: "Prompt", desc: "Prompt del usuario" },
      { key: "{{configuration.platform}}", label: "Plataforma", desc: "Plataforma seleccionada" },
      { key: "{{configuration.content_type}}", label: "Tipo de Contenido", desc: "Tipo de contenido" },
    ]
  },
];

const PRESET_TEMPLATES: Record<string, { name: string; template: Record<string, any> }[]> = {
  analytics: [
    {
      name: "Analizador de Insights",
      template: {
        companyId: "{{company.id}}",
        userId: "{{userId}}",
        language: "{{language}}",
        analysisType: "full"
      }
    },
    {
      name: "Analizador por Plataforma",
      template: {
        userId: "{{userId}}",
        platform: "{{configuration.platform}}",
        companyId: "{{company.id}}"
      }
    }
  ],
  marketing: [
    {
      name: "Estrategia de Marketing",
      template: {
        nombre_empresa: "{{company.name}}",
        objetivo_de_negocio: "{{company.description}}",
        propuesta_valor: "{{strategy.propuesta_valor}}",
        sitio_web: "{{company.website_url}}",
        sector_industria: "{{company.industry_sector}}",
        language: "{{language}}"
      }
    },
    {
      name: "Generador de Campañas",
      template: {
        companyId: "{{company.id}}",
        companyName: "{{company.name}}",
        objective: "{{configuration.objective}}",
        audiences: "{{audiences}}",
        language: "{{language}}"
      }
    }
  ],
  content: [
    {
      name: "Creador de Contenido",
      template: {
        companyId: "{{company.id}}",
        prompt: "{{configuration.prompt}}",
        platform: "{{configuration.platform}}",
        content_type: "{{configuration.content_type}}",
        brand_voice: "{{branding.brand_voice}}",
        language: "{{language}}"
      }
    },
    {
      name: "Calendario de Contenido",
      template: {
        companyId: "{{company.id}}",
        userId: "{{userId}}",
        propuesta_valor: "{{strategy.propuesta_valor}}",
        mision: "{{strategy.mision}}",
        identidad_visual: "{{branding.visual_identity}}",
        language: "{{language}}"
      }
    }
  ],
  strategy: [
    {
      name: "Estratega de Negocios",
      template: {
        companyId: "{{company.id}}",
        language: "{{language}}"
      }
    }
  ],
  general: [
    {
      name: "Template Básico",
      template: {
        companyId: "{{company.id}}",
        userId: "{{userId}}",
        language: "{{language}}"
      }
    }
  ]
};

export const PayloadTemplateEditor = ({ value, onChange, agentCategory = "general" }: PayloadTemplateEditorProps) => {
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState(JSON.stringify(value, null, 2) === '{}' ? '' : JSON.stringify(value, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setJsonError(null);
      onChange({});
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      onChange(parsed);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const handleInsertVariable = (variable: string) => {
    // Insert at cursor position or append
    const textarea = document.querySelector('textarea[data-json-editor]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = jsonText.slice(0, start) + variable + jsonText.slice(end);
      setJsonText(newText);
      handleJsonChange(newText);
      // Reset cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleApplyPreset = (template: Record<string, any>) => {
    const newJson = JSON.stringify(template, null, 2);
    setJsonText(newJson);
    onChange(template);
    setJsonError(null);
  };

  const presets = PRESET_TEMPLATES[agentCategory] || PRESET_TEMPLATES.general;
  const hasContent = Object.keys(value).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Template de Payload (JSON)</Label>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="visual" className="text-xs px-3">
              <Sparkles className="h-3 w-3 mr-1" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs px-3">
              <FileJson className="h-3 w-3 mr-1" />
              JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <p className="text-sm text-muted-foreground">
        Define cómo mapear datos de la empresa al payload del edge function. 
        Usa <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{"{{variable.path}}"}</code> para interpolar valores dinámicos.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-2">Plantillas:</span>
        {presets.map((preset) => (
          <Button
            key={preset.name}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleApplyPreset(preset.template)}
          >
            <Plus className="h-3 w-3 mr-1" />
            {preset.name}
          </Button>
        ))}
      </div>

      <TabsContent value="visual" className="mt-0 space-y-4">
        {/* Variable Reference Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {VARIABLE_CATEGORIES.map((cat) => (
            <Card key={cat.category} className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span>{cat.icon}</span>
                  <span className="font-medium text-sm">{cat.category}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cat.variables.map((v) => (
                    <Badge
                      key={v.key}
                      variant="secondary"
                      className={cn(
                        "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs",
                        copiedVar === v.key && "bg-green-500 text-white"
                      )}
                      onClick={() => handleCopyVariable(v.key)}
                      title={v.desc}
                    >
                      {copiedVar === v.key ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {v.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current template preview */}
        <div>
          <Label className="text-sm mb-2 block">Template Actual</Label>
          {hasContent ? (
            <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
              {JSON.stringify(value, null, 2)}
            </pre>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileJson className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay template configurado. Selecciona una plantilla o edita el JSON directamente.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Se usará el mapeo hardcodeado para agentes legacy.
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="json" className="mt-0 space-y-4">
        {/* Quick insert buttons */}
        <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-lg">
          <span className="text-xs text-muted-foreground self-center mr-2">Insertar:</span>
          {["{{company.id}}", "{{company.name}}", "{{userId}}", "{{language}}"].map((v) => (
            <Button
              key={v}
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs font-mono"
              onClick={() => handleInsertVariable(v)}
            >
              {v}
            </Button>
          ))}
        </div>

        {/* JSON Editor */}
        <div className="relative">
          <Textarea
            data-json-editor
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={`{
  "companyId": "{{company.id}}",
  "companyName": "{{company.name}}",
  "industry": "{{company.industry_sector}}",
  "propuesta_valor": "{{strategy.propuesta_valor}}",
  "brand_colors": {
    "primary": "{{branding.primary_color}}",
    "secondary": "{{branding.secondary_color}}"
  },
  "language": "{{language}}"
}`}
            rows={14}
            className={cn(
              "font-mono text-xs",
              jsonError && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {jsonError && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded text-xs">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{jsonError}</span>
            </div>
          )}
          {!jsonError && hasContent && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs">
              <Check className="h-3 w-3" />
              JSON válido
            </div>
          )}
        </div>
      </TabsContent>
    </div>
  );
};
