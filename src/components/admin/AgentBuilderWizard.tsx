import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Save, Bot, Zap, Code, Brain, Shield, Database, AlertCircle } from "lucide-react";
import { PayloadTemplateEditor } from "./PayloadTemplateEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentBuilderWizardProps {
  agentId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

interface SfiaSkill {
  skill_code: string;
  level: number;
  custom_description?: string;
}

const AGENT_CATEGORIES = [
  { value: 'marketing', label: 'Marketing', icon: '📣' },
  { value: 'analytics', label: 'Analytics', icon: '📊' },
  { value: 'content', label: 'Contenido', icon: '✍️' },
  { value: 'strategy', label: 'Estrategia', icon: '🎯' },
  { value: 'customer_service', label: 'Atención al Cliente', icon: '💬' },
  { value: 'sales', label: 'Ventas', icon: '💰' },
  { value: 'operations', label: 'Operaciones', icon: '⚙️' },
  { value: 'general', label: 'General', icon: '🤖' },
];

const AVAILABLE_MODELS = [
  { value: 'gpt-5-2025-08-07', label: 'GPT-5 (Flagship)', description: 'Más potente, ideal para tareas complejas' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini (Recomendado)', description: 'Balance perfecto costo/rendimiento' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano', description: 'Más rápido y económico' },
  { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1', description: 'Modelo estable y confiable' },
  { value: 'o3-2025-04-16', label: 'O3 (Reasoning)', description: 'Razonamiento avanzado' },
  { value: 'o4-mini-2025-04-16', label: 'O4 Mini', description: 'Razonamiento rápido' },
];

export const AgentBuilderWizard = ({ agentId, onSave, onCancel }: AgentBuilderWizardProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Basic info
    internal_code: "",
    name: "",
    description: "",
    icon: "🤖",
    category: "general",
    
    // Agent type
    agent_type: "dynamic" as "static" | "dynamic" | "hybrid",
    execution_type: "openai_response" as string,
    edge_function_name: "",
    
    // OpenAI SDK Config
    model_name: "gpt-5-mini-2025-08-07",
    instructions: "",
    sdk_version: "response-api",
    
    // Tools & capabilities
    tools_config: [] as any[],
    use_file_search: false,
    use_web_search: false,
    use_code_interpreter: false,
    
    // Advanced features
    supports_handoffs: false,
    handoff_agents: [] as string[],
    guardrails_config: {} as any,
    tracing_enabled: false,
    voice_enabled: false,
    
    // SFIA skills
    sfia_skills: [] as SfiaSkill[],
    primary_function: "",
    
    // Pricing
    credits_per_use: 1,
    is_premium: false,
    min_plan_required: "starter",
    
    // Status
    is_active: true,
    is_onboarding_agent: false,
    
    // Payload mapping
    context_requirements: {
      needsStrategy: false,
      needsAudiences: false,
      needsBranding: false,
    },
    payload_template: {} as Record<string, any>,
    
    // Prerequisites
    prerequisites: [] as Array<{
      type: 'strategy' | 'audiences' | 'branding' | 'social_connected';
      required: boolean;
      fields?: string[];
      minCount?: number;
      platforms?: string[];
      message: string;
      actionUrl: string;
    }>,
  });

  const [newSkill, setNewSkill] = useState({ skill_code: "", level: 3, custom_description: "" });

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  const loadAgent = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error) throw error;

      const openaiConfig = (data.openai_agent_config as any) || {};
      
      setFormData({
        internal_code: data.internal_code || "",
        name: data.name || "",
        description: data.description || "",
        icon: data.icon || "🤖",
        category: data.category || "general",
        agent_type: (data.agent_type as any) || "dynamic",
        execution_type: data.execution_type || "openai_response",
        edge_function_name: data.edge_function_name || "",
        model_name: data.model_name || "gpt-5-mini-2025-08-07",
        instructions: data.instructions || "",
        sdk_version: data.sdk_version || "response-api",
        tools_config: (data.tools_config as any) || [],
        use_file_search: openaiConfig.use_file_search || false,
        use_web_search: openaiConfig.use_web_search || false,
        use_code_interpreter: openaiConfig.use_code_interpreter || false,
        supports_handoffs: data.supports_handoffs || false,
        handoff_agents: openaiConfig.handoff_agents || [],
        guardrails_config: (data.guardrails_config as any) || {},
        tracing_enabled: data.tracing_enabled || false,
        voice_enabled: data.voice_enabled || false,
        sfia_skills: (data.sfia_skills as any) || [],
        primary_function: data.primary_function || "",
        credits_per_use: data.credits_per_use || 1,
        is_premium: data.is_premium || false,
        min_plan_required: data.min_plan_required || "starter",
        is_active: data.is_active,
        is_onboarding_agent: data.is_onboarding_agent || false,
        context_requirements: (data.context_requirements as any) || { needsStrategy: false, needsAudiences: false, needsBranding: false },
        payload_template: (data.payload_template as any) || {},
        prerequisites: (data.prerequisites as any) || [],
      });
    } catch (error) {
      console.error("Error loading agent:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el agente",
        variant: "destructive",
      });
    }
  };

  const calculateAverageLevel = (): number | null => {
    if (formData.sfia_skills.length === 0) return null;
    const sum = formData.sfia_skills.reduce((acc, skill) => acc + skill.level, 0);
    return parseFloat((sum / formData.sfia_skills.length).toFixed(1));
  };

  const handleAddSfiaSkill = () => {
    if (!newSkill.skill_code) return;
    setFormData({
      ...formData,
      sfia_skills: [...formData.sfia_skills, { ...newSkill }],
    });
    setNewSkill({ skill_code: "", level: 3, custom_description: "" });
  };

  const handleRemoveSfiaSkill = (index: number) => {
    setFormData({
      ...formData,
      sfia_skills: formData.sfia_skills.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const agentData = {
        internal_code: formData.internal_code,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        category: formData.category,
        agent_type: formData.agent_type,
        execution_type: formData.agent_type === 'static' ? 'edge_function' : formData.execution_type,
        edge_function_name: formData.agent_type === 'static' ? formData.edge_function_name : null,
        model_name: formData.model_name,
        instructions: formData.instructions,
        sdk_version: formData.sdk_version,
        tools_config: formData.tools_config as any,
        openai_agent_config: {
          use_file_search: formData.use_file_search,
          use_web_search: formData.use_web_search,
          use_code_interpreter: formData.use_code_interpreter,
          handoff_agents: formData.handoff_agents,
        },
        supports_handoffs: formData.supports_handoffs,
        guardrails_config: formData.guardrails_config as any,
        tracing_enabled: formData.tracing_enabled,
        voice_enabled: formData.voice_enabled,
        sfia_skills: formData.sfia_skills as any,
        average_sfia_level: calculateAverageLevel(),
        primary_function: formData.primary_function,
        credits_per_use: formData.credits_per_use,
        is_premium: formData.is_premium,
        min_plan_required: formData.min_plan_required,
        is_active: formData.is_active,
        is_onboarding_agent: formData.is_onboarding_agent,
        context_requirements: formData.context_requirements,
        payload_template: formData.payload_template,
        prerequisites: formData.prerequisites,
        created_by: user?.id,
      };

      if (agentId) {
        const { error } = await supabase
          .from("platform_agents")
          .update(agentData as any)
          .eq("id", agentId);

        if (error) throw error;

        toast({
          title: "Agente actualizado",
          description: "Los cambios se han guardado correctamente",
        });
      } else {
        const { error } = await supabase
          .from("platform_agents")
          .insert(agentData as any);

        if (error) throw error;

        toast({
          title: "Agente creado",
          description: "El nuevo agente ha sido creado correctamente",
        });
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving agent:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el agente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Ejecución
          </TabsTrigger>
          <TabsTrigger value="payload" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Payload
          </TabsTrigger>
          <TabsTrigger value="prerequisites" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Prereq.
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Herramientas
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            SFIA
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        {/* BASIC TAB */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos del agente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="internal_code">Código Interno *</Label>
                  <Input
                    id="internal_code"
                    value={formData.internal_code}
                    onChange={(e) => setFormData({ ...formData, internal_code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="MKTG_STRATEGIST"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Identificador único (ej: MKTG_STRATEGIST)</p>
                </div>
                <div>
                  <Label htmlFor="name">Nombre del Agente *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Estratega de Marketing"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icono (Emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🧠"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe qué hace este agente..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="primary_function">Función Principal</Label>
                <Input
                  id="primary_function"
                  value={formData.primary_function}
                  onChange={(e) => setFormData({ ...formData, primary_function: e.target.value })}
                  placeholder="Define estrategias de marketing basadas en datos"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="credits">Créditos por Uso</Label>
                  <Input
                    id="credits"
                    type="number"
                    min={1}
                    value={formData.credits_per_use}
                    onChange={(e) => setFormData({ ...formData, credits_per_use: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="min_plan">Plan Mínimo</Label>
                  <Select
                    value={formData.min_plan_required}
                    onValueChange={(value) => setFormData({ ...formData, min_plan_required: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Opciones</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_premium}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                      />
                      <span className="text-sm">Premium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <span className="text-sm">Activo</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXECUTION TAB */}
        <TabsContent value="execution" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipo y Configuración de Ejecución</CardTitle>
              <CardDescription>Define cómo se ejecutará el agente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Agente *</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {[
                    { value: 'static', label: 'Estático', desc: 'Ejecuta Edge Function', icon: '⚡' },
                    { value: 'dynamic', label: 'Dinámico', desc: 'OpenAI Agents SDK', icon: '🧠' },
                    { value: 'hybrid', label: 'Híbrido', desc: 'Ambos métodos', icon: '🔄' },
                  ].map((type) => (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-all ${formData.agent_type === type.value ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setFormData({ ...formData, agent_type: type.value as any })}
                    >
                      <CardContent className="p-4 text-center">
                        <span className="text-2xl">{type.icon}</span>
                        <h4 className="font-semibold mt-2">{type.label}</h4>
                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {(formData.agent_type === 'static' || formData.agent_type === 'hybrid') && (
                <div>
                  <Label htmlFor="edge_function">Nombre de Edge Function</Label>
                  <Input
                    id="edge_function"
                    value={formData.edge_function_name}
                    onChange={(e) => setFormData({ ...formData, edge_function_name: e.target.value })}
                    placeholder="marketing-hub-marketing-strategy"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Nombre de la función en supabase/functions/</p>
                </div>
              )}

              {(formData.agent_type === 'dynamic' || formData.agent_type === 'hybrid') && (
                <>
                  <div>
                    <Label htmlFor="model">Modelo de IA *</Label>
                    <Select
                      value={formData.model_name}
                      onValueChange={(value) => setFormData({ ...formData, model_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div>
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sdk_version">Versión del SDK</Label>
                    <Select
                      value={formData.sdk_version}
                      onValueChange={(value) => setFormData({ ...formData, sdk_version: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="response-api">Response API (Recomendado)</SelectItem>
                        <SelectItem value="assistants-v2">Assistants API v2</SelectItem>
                        <SelectItem value="agents-sdk">Agents SDK (Beta)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="instructions">Instructions (System Prompt) *</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Eres un agente especializado en..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Define el comportamiento y personalidad del agente
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYLOAD TAB */}
        <TabsContent value="payload" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Payload</CardTitle>
              <CardDescription>
                Define qué datos de la empresa necesita el agente y cómo mapearlos al edge function
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Context Requirements */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Datos de Contexto Requeridos</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona qué información de la empresa debe cargarse automáticamente antes de ejecutar el agente
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>🎯 Estrategia</Label>
                      <p className="text-xs text-muted-foreground">Misión, visión, propuesta de valor</p>
                    </div>
                    <Switch
                      checked={formData.context_requirements.needsStrategy}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        context_requirements: { ...formData.context_requirements, needsStrategy: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>👥 Audiencias</Label>
                      <p className="text-xs text-muted-foreground">Segmentos de audiencia objetivo</p>
                    </div>
                    <Switch
                      checked={formData.context_requirements.needsAudiences}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        context_requirements: { ...formData.context_requirements, needsAudiences: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>🎨 Branding</Label>
                      <p className="text-xs text-muted-foreground">Colores, identidad visual, voz de marca</p>
                    </div>
                    <Switch
                      checked={formData.context_requirements.needsBranding}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        context_requirements: { ...formData.context_requirements, needsBranding: checked }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Payload Template - Using Visual Editor */}
              <PayloadTemplateEditor
                value={formData.payload_template}
                onChange={(template) => setFormData({ ...formData, payload_template: template })}
                agentCategory={formData.category}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREREQUISITES TAB */}
        <TabsContent value="prerequisites" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prerequisitos del Agente</CardTitle>
              <CardDescription>
                Define qué datos necesita el usuario antes de poder ejecutar este agente. 
                Los prerequisitos obligatorios bloquean la ejecución; los opcionales muestran advertencias.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add prerequisite buttons */}
              <div className="flex flex-wrap gap-2">
                {!formData.prerequisites.find(p => p.type === 'strategy') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      prerequisites: [...formData.prerequisites, {
                        type: 'strategy',
                        required: true,
                        fields: [],
                        message: 'Define tu estrategia de marketing primero',
                        actionUrl: '/company/adn'
                      }]
                    })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Estrategia
                  </Button>
                )}
                {!formData.prerequisites.find(p => p.type === 'audiences') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      prerequisites: [...formData.prerequisites, {
                        type: 'audiences',
                        required: true,
                        minCount: 1,
                        message: 'Define al menos una audiencia objetivo',
                        actionUrl: '/company/audiencias'
                      }]
                    })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Audiencias
                  </Button>
                )}
                {!formData.prerequisites.find(p => p.type === 'branding') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      prerequisites: [...formData.prerequisites, {
                        type: 'branding',
                        required: false,
                        fields: [],
                        message: 'Configura tu identidad visual para mejores resultados',
                        actionUrl: '/company/adn'
                      }]
                    })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Branding
                  </Button>
                )}
                {!formData.prerequisites.find(p => p.type === 'social_connected') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      prerequisites: [...formData.prerequisites, {
                        type: 'social_connected',
                        required: false,
                        platforms: [],
                        message: 'Conecta tus redes sociales para análisis más precisos',
                        actionUrl: '/company/redes'
                      }]
                    })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Redes Sociales
                  </Button>
                )}
              </div>

              {/* List of configured prerequisites */}
              {formData.prerequisites.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No hay prerequisitos configurados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este agente podrá ejecutarse sin verificación de datos previos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.prerequisites.map((prereq, idx) => (
                    <Card key={idx} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={prereq.required ? 'destructive' : 'secondary'}>
                                {prereq.required ? 'Obligatorio' : 'Recomendado'}
                              </Badge>
                              <Badge variant="outline">
                                {prereq.type === 'strategy' && '🎯 Estrategia'}
                                {prereq.type === 'audiences' && '👥 Audiencias'}
                                {prereq.type === 'branding' && '🎨 Branding'}
                                {prereq.type === 'social_connected' && '📱 Redes Sociales'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Mensaje para el usuario</Label>
                                <Input
                                  value={prereq.message}
                                  onChange={(e) => {
                                    const updated = [...formData.prerequisites];
                                    updated[idx].message = e.target.value;
                                    setFormData({ ...formData, prerequisites: updated });
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">URL de acción</Label>
                                <Input
                                  value={prereq.actionUrl}
                                  onChange={(e) => {
                                    const updated = [...formData.prerequisites];
                                    updated[idx].actionUrl = e.target.value;
                                    setFormData({ ...formData, prerequisites: updated });
                                  }}
                                  placeholder="/company/adn"
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={prereq.required}
                                  onCheckedChange={(checked) => {
                                    const updated = [...formData.prerequisites];
                                    updated[idx].required = checked;
                                    setFormData({ ...formData, prerequisites: updated });
                                  }}
                                />
                                <span className="text-sm">Obligatorio</span>
                              </div>

                              {prereq.type === 'audiences' && (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Mín. audiencias:</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={prereq.minCount || 1}
                                    onChange={(e) => {
                                      const updated = [...formData.prerequisites];
                                      updated[idx].minCount = parseInt(e.target.value) || 1;
                                      setFormData({ ...formData, prerequisites: updated });
                                    }}
                                    className="w-16 text-sm"
                                  />
                                </div>
                              )}

                              {(prereq.type === 'strategy' || prereq.type === 'branding') && (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Campos requeridos:</Label>
                                  <Input
                                    value={(prereq.fields || []).join(', ')}
                                    onChange={(e) => {
                                      const updated = [...formData.prerequisites];
                                      updated[idx].fields = e.target.value.split(',').map(f => f.trim()).filter(Boolean);
                                      setFormData({ ...formData, prerequisites: updated });
                                    }}
                                    placeholder="mision, vision, propuesta_valor"
                                    className="flex-1 text-sm"
                                  />
                                </div>
                              )}

                              {prereq.type === 'social_connected' && (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Plataformas:</Label>
                                  <Input
                                    value={(prereq.platforms || []).join(', ')}
                                    onChange={(e) => {
                                      const updated = [...formData.prerequisites];
                                      updated[idx].platforms = e.target.value.split(',').map(f => f.trim()).filter(Boolean);
                                      setFormData({ ...formData, prerequisites: updated });
                                    }}
                                    placeholder="linkedin, instagram, facebook"
                                    className="flex-1 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = formData.prerequisites.filter((_, i) => i !== idx);
                              setFormData({ ...formData, prerequisites: updated });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOOLS TAB */}
        <TabsContent value="tools" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Herramientas y Capacidades</CardTitle>
              <CardDescription>Configura las herramientas disponibles para el agente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>🔍 File Search</Label>
                    <p className="text-xs text-muted-foreground">Buscar en archivos subidos</p>
                  </div>
                  <Switch
                    checked={formData.use_file_search}
                    onCheckedChange={(checked) => setFormData({ ...formData, use_file_search: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>🌐 Web Search</Label>
                    <p className="text-xs text-muted-foreground">Buscar información en línea</p>
                  </div>
                  <Switch
                    checked={formData.use_web_search}
                    onCheckedChange={(checked) => setFormData({ ...formData, use_web_search: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>💻 Code Interpreter</Label>
                    <p className="text-xs text-muted-foreground">Ejecutar y analizar código</p>
                  </div>
                  <Switch
                    checked={formData.use_code_interpreter}
                    onCheckedChange={(checked) => setFormData({ ...formData, use_code_interpreter: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>🎤 Voice (Realtime)</Label>
                    <p className="text-xs text-muted-foreground">Interacción por voz</p>
                  </div>
                  <Switch
                    checked={formData.voice_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, voice_enabled: checked })}
                  />
                </div>
              </div>

              <div>
                <Label>Custom Functions (JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData.tools_config, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, tools_config: parsed });
                    } catch {
                      // Invalid JSON
                    }
                  }}
                  placeholder='[{"type": "function", "function": {"name": "...", "parameters": {...}}}]'
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SFIA TAB */}
        <TabsContent value="skills" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapeo de Habilidades SFIA</CardTitle>
              <CardDescription>Asigna competencias del marco SFIA al agente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Código SFIA</Label>
                  <Input
                    value={newSkill.skill_code}
                    onChange={(e) => setNewSkill({ ...newSkill, skill_code: e.target.value.toUpperCase() })}
                    placeholder="MKCA"
                  />
                </div>
                <div>
                  <Label>Nivel (1-7)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={handleAddSfiaSkill}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.sfia_skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge>{skill.skill_code}</Badge>
                      <Badge variant="outline">Nivel {skill.level}</Badge>
                      {skill.custom_description && (
                        <span className="text-sm text-muted-foreground">{skill.custom_description}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSfiaSkill(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {formData.sfia_skills.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Nivel promedio: <strong>{calculateAverageLevel()}</strong>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVANCED TAB */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>Handoffs, guardrails y otras opciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>🔄 Soporta Handoffs</Label>
                  <p className="text-xs text-muted-foreground">Puede delegar a otros agentes</p>
                </div>
                <Switch
                  checked={formData.supports_handoffs}
                  onCheckedChange={(checked) => setFormData({ ...formData, supports_handoffs: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>📊 Tracing Habilitado</Label>
                  <p className="text-xs text-muted-foreground">Registrar trazas de ejecución</p>
                </div>
                <Switch
                  checked={formData.tracing_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, tracing_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>🎓 Agente de Onboarding</Label>
                  <p className="text-xs text-muted-foreground">Se ejecuta durante el onboarding</p>
                </div>
                <Switch
                  checked={formData.is_onboarding_agent}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_onboarding_agent: checked })}
                />
              </div>

              <div>
                <Label>Configuración de Guardrails (JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData.guardrails_config, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, guardrails_config: parsed });
                    } catch {
                      // Invalid JSON
                    }
                  }}
                  placeholder='{"max_tokens": 4000, "blocked_topics": []}'
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Guardando..." : agentId ? "Actualizar Agente" : "Crear Agente"}
        </Button>
      </div>
    </form>
  );
};
