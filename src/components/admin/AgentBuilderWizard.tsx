import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Save, Bot, Zap, Code, Shield, Database, AlertCircle, Link2, FlaskConical, CheckCircle2, Loader2 } from "lucide-react";
import { PayloadTemplateEditor } from "./PayloadTemplateEditor";
import { N8NConfigEditor, N8NConfig } from "./N8NConfigEditor";
import { OutputMappingsEditor, OutputMapping } from "./OutputMappingsEditor";
import { AgentSandbox } from "./AgentSandbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper to generate internal_code from name
const generateInternalCode = (name: string): string => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "_"); // Replace spaces with underscores
};

interface AgentBuilderWizardProps {
  agentId: string | null;
  onSave: () => void;
  onCancel: () => void;
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
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeIsUnique, setCodeIsUnique] = useState<boolean | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Basic info
    internal_code: "",
    name: "",
    description: "",
    icon: "🤖",
    category: "general",
    
    // Agent type
    agent_type: "dynamic" as "static" | "dynamic" | "hybrid" | "n8n",
    execution_type: "openai_response" as string,
    edge_function_name: "",
    
    // N8N Config
    n8n_config: {
      webhook_url: "",
      http_method: "POST" as "GET" | "POST",
      requires_auth: true,
      timeout_ms: 300000,
      input_schema: {},
      output_mappings: [] as OutputMapping[],
    } as N8NConfig,
    
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
    
    // Function
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
      type: 'strategy' | 'audiences' | 'branding' | 'social_connected' | 'social_data';
      required: boolean;
      fields?: string[];
      minCount?: number;
      minPosts?: number;
      platforms?: string[];
      message: string;
      actionUrl: string;
      alternativeAction?: {
        type: 'scrape' | 'connect' | 'generate';
        label: string;
      };
    }>,
  });

  // Check if internal_code is unique
  const checkCodeUniqueness = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setCodeIsUnique(null);
      return;
    }
    
    setCheckingCode(true);
    try {
      const { data, error } = await supabase
        .from("platform_agents")
        .select("id")
        .eq("internal_code", code)
        .neq("id", agentId || "00000000-0000-0000-0000-000000000000")
        .limit(1);
      
      if (error) throw error;
      setCodeIsUnique(data.length === 0);
    } catch (error) {
      console.error("Error checking code uniqueness:", error);
      setCodeIsUnique(null);
    } finally {
      setCheckingCode(false);
    }
  }, [agentId]);

  // Auto-generate internal_code when name changes (only for new agents)
  const handleNameChange = async (newName: string) => {
    setFormData(prev => {
      const updates: any = { name: newName };
      
      // Only auto-generate for new agents (no agentId)
      if (!agentId && newName.length > 2) {
        const generatedCode = generateInternalCode(newName);
        updates.internal_code = generatedCode;
        // Debounce the uniqueness check
        setTimeout(() => checkCodeUniqueness(generatedCode), 300);
      }
      
      return { ...prev, ...updates };
    });
  };

  // Check uniqueness when internal_code changes manually
  useEffect(() => {
    if (formData.internal_code && !agentId) {
      const timer = setTimeout(() => {
        checkCodeUniqueness(formData.internal_code);
      }, 500);
      return () => clearTimeout(timer);
    } else if (agentId) {
      setCodeIsUnique(true); // Existing agent, assume code is valid
    }
  }, [formData.internal_code, agentId, checkCodeUniqueness]);

  // Handle agent type change - reset irrelevant fields
  const handleAgentTypeChange = (newType: "static" | "dynamic" | "hybrid" | "n8n") => {
    const updates: Partial<typeof formData> = { agent_type: newType };
    
    // If changing to static or n8n, clear OpenAI SDK specific fields
    if (newType === 'static' || newType === 'n8n') {
      updates.use_file_search = false;
      updates.use_web_search = false;
      updates.use_code_interpreter = false;
      updates.voice_enabled = false;
      updates.supports_handoffs = false;
      updates.guardrails_config = {};
      updates.tools_config = [];
    }
    
    // If changing to static from n8n, clear n8n config
    if (newType === 'static') {
      updates.n8n_config = {
        webhook_url: "",
        http_method: "POST",
        requires_auth: true,
        timeout_ms: 300000,
        input_schema: {},
        output_mappings: [],
      };
    }
    
    // If changing to n8n from static, clear edge function
    if (newType === 'n8n') {
      updates.edge_function_name = '';
    }
    
    // If changing to dynamic, clear edge function and n8n config
    if (newType === 'dynamic') {
      updates.edge_function_name = '';
      updates.n8n_config = {
        webhook_url: "",
        http_method: "POST",
        requires_auth: true,
        timeout_ms: 300000,
        input_schema: {},
        output_mappings: [],
      };
      updates.payload_template = {};
      updates.context_requirements = { needsStrategy: false, needsAudiences: false, needsBranding: false };
    }
    
    // Reset to valid tab if current tab becomes hidden
    if (newType === 'dynamic' && (activeTab === 'payload' || activeTab === 'n8n')) {
      setActiveTab('basic');
    }
    if ((newType === 'static' || newType === 'n8n') && activeTab === 'tools') {
      setActiveTab('basic');
    }
    if (newType !== 'n8n' && activeTab === 'n8n') {
      setActiveTab('basic');
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

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
        n8n_config: (data.n8n_config as any) || {
          webhook_url: "",
          http_method: "POST",
          requires_auth: true,
          timeout_ms: 300000,
          input_schema: {},
          output_mappings: [],
        },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate internal_code uniqueness for new agents
    if (!agentId && codeIsUnique === false) {
      toast({
        title: "Código duplicado",
        description: "El código interno ya existe. Por favor modifícalo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.internal_code) {
      toast({
        title: "Código requerido",
        description: "El código interno es obligatorio.",
        variant: "destructive",
      });
      return;
    }
    
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
        execution_type: formData.agent_type === 'static' ? 'edge_function' : 
                        formData.agent_type === 'n8n' ? 'n8n_workflow' : formData.execution_type,
        edge_function_name: formData.agent_type === 'static' ? formData.edge_function_name : null,
        n8n_config: formData.agent_type === 'n8n' ? formData.n8n_config : null,
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
        <TabsList className="flex w-full flex-wrap gap-1">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Ejecución
          </TabsTrigger>
          {/* N8N Tab - Only for n8n type */}
          {formData.agent_type === 'n8n' && (
            <TabsTrigger value="n8n" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              N8N
            </TabsTrigger>
          )}
          {/* Payload Tab - Not for pure dynamic (they use Instructions instead) */}
          {formData.agent_type !== 'dynamic' && (
            <TabsTrigger value="payload" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Payload
            </TabsTrigger>
          )}
          <TabsTrigger value="prerequisites" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Prereq.
          </TabsTrigger>
          {/* Tools Tab - Only for dynamic/hybrid (OpenAI SDK) */}
          {(formData.agent_type === 'dynamic' || formData.agent_type === 'hybrid') && (
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Herramientas
            </TabsTrigger>
          )}
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Avanzado
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="flex items-center gap-2 text-purple-500">
            <FlaskConical className="h-4 w-4" />
            Sandbox
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
                  <Label htmlFor="name">Nombre del Agente *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Estratega de Marketing"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">El código interno se genera automáticamente</p>
                </div>
                <div>
                  <Label htmlFor="internal_code" className="flex items-center gap-2">
                    Código Interno
                    {checkingCode && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    {!checkingCode && codeIsUnique === true && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                    {!checkingCode && codeIsUnique === false && (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    )}
                  </Label>
                  <Input
                    id="internal_code"
                    value={formData.internal_code}
                    onChange={(e) => setFormData({ ...formData, internal_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                    placeholder="ESTRATEGA_DE_MARKETING"
                    className={codeIsUnique === false ? "border-destructive" : ""}
                    readOnly={!!agentId}
                  />
                  {codeIsUnique === false && (
                    <p className="text-xs text-destructive mt-1">Este código ya existe. Modifícalo manualmente.</p>
                  )}
                  {codeIsUnique === true && (
                    <p className="text-xs text-green-600 mt-1">✓ Código disponible</p>
                  )}
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
                <div className="grid grid-cols-4 gap-4 mt-2">
                  {[
                    { value: 'static', label: 'Estático', desc: 'Ejecuta Edge Function', icon: '⚡' },
                    { value: 'dynamic', label: 'Dinámico', desc: 'OpenAI Agents SDK', icon: '🧠' },
                    { value: 'hybrid', label: 'Híbrido', desc: 'Ambos métodos', icon: '🔄' },
                    { value: 'n8n', label: 'N8N Workflow', desc: 'Webhook n8n.io', icon: '🔗' },
                  ].map((type) => (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-all ${formData.agent_type === type.value ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => handleAgentTypeChange(type.value as any)}
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

        {/* N8N TAB - Only visible when agent_type is n8n */}
        {formData.agent_type === 'n8n' && (
          <TabsContent value="n8n" className="space-y-4 mt-4">
            <N8NConfigEditor
              config={formData.n8n_config}
              onChange={(config) => setFormData({ ...formData, n8n_config: config })}
            />
            
            <OutputMappingsEditor
              mappings={formData.n8n_config.output_mappings || []}
              onChange={(mappings) => setFormData({
                ...formData,
                n8n_config: { ...formData.n8n_config, output_mappings: mappings }
              })}
            />
          </TabsContent>
        )}

        {/* PAYLOAD TAB - Only for static, hybrid, n8n */}
        {formData.agent_type !== 'dynamic' && (
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
        )}

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
                {!formData.prerequisites.find(p => p.type === 'social_data') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      prerequisites: [...formData.prerequisites, {
                        type: 'social_data',
                        required: true,
                        minPosts: 5,
                        platforms: [],
                        message: 'Necesitas publicaciones importadas para este análisis',
                        actionUrl: '/company/dashboard?tab=configuracion',
                        alternativeAction: { type: 'scrape', label: 'Importar datos' }
                      }]
                    })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Datos Sociales
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
                                {prereq.type === 'social_data' && '📊 Datos Sociales'}
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

                              {prereq.type === 'social_data' && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Mín. posts:</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={prereq.minPosts || 5}
                                      onChange={(e) => {
                                        const updated = [...formData.prerequisites];
                                        updated[idx].minPosts = parseInt(e.target.value) || 5;
                                        setFormData({ ...formData, prerequisites: updated });
                                      }}
                                      className="w-16 text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Acción alternativa:</Label>
                                    <Select
                                      value={prereq.alternativeAction?.type || 'scrape'}
                                      onValueChange={(value) => {
                                        const updated = [...formData.prerequisites];
                                        updated[idx].alternativeAction = {
                                          type: value as 'scrape' | 'connect' | 'generate',
                                          label: prereq.alternativeAction?.label || 'Importar datos'
                                        };
                                        setFormData({ ...formData, prerequisites: updated });
                                      }}
                                    >
                                      <SelectTrigger className="w-24 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="scrape">Scrape</SelectItem>
                                        <SelectItem value="connect">Conectar</SelectItem>
                                        <SelectItem value="generate">Generar</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </>
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

        {/* TOOLS TAB - Only for dynamic/hybrid */}
        {(formData.agent_type === 'dynamic' || formData.agent_type === 'hybrid') && (
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
        )}

        {/* ADVANCED TAB */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                {formData.agent_type === 'static' || formData.agent_type === 'n8n' 
                  ? 'Tracing y configuración de onboarding' 
                  : 'Handoffs, guardrails y otras opciones'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Handoffs - Only for dynamic/hybrid */}
              {(formData.agent_type === 'dynamic' || formData.agent_type === 'hybrid') && (
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
              )}

              {/* Tracing - All types */}
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

              {/* Onboarding Agent - All types */}
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

              {/* Guardrails - Only for dynamic/hybrid */}
              {(formData.agent_type === 'dynamic' || formData.agent_type === 'hybrid') && (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SANDBOX TAB */}
        <TabsContent value="sandbox" className="mt-4">
          <AgentSandbox 
            agentConfig={{
              name: formData.name,
              agent_type: formData.agent_type,
              edge_function_name: formData.edge_function_name,
              n8n_config: formData.n8n_config,
              payload_template: JSON.stringify(formData.payload_template),
              context_requirements: {
                needs_strategy: formData.context_requirements?.needsStrategy,
                needs_audiences: formData.context_requirements?.needsAudiences,
                needs_branding: formData.context_requirements?.needsBranding,
              }
            }}
          />
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
