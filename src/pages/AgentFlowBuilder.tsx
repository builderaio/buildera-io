import React, { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Panel,
  ReactFlowProvider,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Globe, 
  Brain,
  Save,
  Play,
  Settings,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

// Node configuration component
const NodeConfigDialog = ({ node, onSave, onClose }: { node: Node, onSave: (config: any) => void, onClose: () => void }) => {
  const [config, setConfig] = useState(node.data.config || {});
  const { toast } = useToast();

  const handleSave = () => {
    onSave({ ...node.data, config });
    toast({ 
      title: "✅ Nodo Configurado", 
      description: `${node.data.label} ha sido configurado correctamente.` 
    });
    onClose();
  };

  const renderConfigFields = () => {
    switch (node.data.type) {
      case 'user_message':
        return (
          <div className="space-y-4">
            <div>
              <Label>Patrón del Mensaje</Label>
              <Input
                placeholder="Ejemplo: 'hola', 'ayuda', 'precio'"
                value={config.pattern || ''}
                onChange={(e) => setConfig({ ...config, pattern: e.target.value })}
              />
            </div>
            <div>
              <Label>Respuesta</Label>
              <Textarea
                placeholder="Hola! ¿En qué puedo ayudarte?"
                value={config.response || ''}
                onChange={(e) => setConfig({ ...config, response: e.target.value })}
              />
            </div>
          </div>
        );

      case 'llm_chat':
        return (
          <div className="space-y-4">
            <div>
              <Label>Modelo de IA</Label>
              <Select value={config.model || 'gpt-4'} onValueChange={(value) => setConfig({ ...config, model: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prompt del Sistema</Label>
              <Textarea
                placeholder="Eres un asistente útil que..."
                value={config.systemPrompt || ''}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              />
            </div>
          </div>
        );

      case 'send_message':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mensaje</Label>
              <Textarea
                placeholder="Tu mensaje aquí (puedes usar {variables})"
                value={config.content || ''}
                onChange={(e) => setConfig({ ...config, content: e.target.value })}
              />
            </div>
            <div>
              <Label>Canal</Label>
              <Select value={config.channel || 'chat'} onValueChange={(value) => setConfig({ ...config, channel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label>Condición</Label>
              <Input
                placeholder="user_age > 18"
                value={config.condition || ''}
                onChange={(e) => setConfig({ ...config, condition: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label>Configuración JSON</Label>
            <Textarea
              placeholder="{}"
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  setConfig(JSON.parse(e.target.value));
                } catch {}
              }}
            />
          </div>
        );
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Configurar {node.data.label}</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        {renderConfigFields()}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </div>
    </DialogContent>
  );
};

// Simple node components
const nodeTypes = {
  trigger: ({ data }: { data: any }) => (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-green-400 to-green-600 text-white border-2 border-green-300 min-w-[140px] cursor-pointer hover:shadow-xl transition-all">
      <div className="flex items-center gap-2 justify-center">
        <Zap className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="text-xs opacity-80 mt-1 text-center">✓ Configurado</div>
      )}
    </div>
  ),
  ai: ({ data }: { data: any }) => (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 text-white border-2 border-purple-300 min-w-[140px] cursor-pointer hover:shadow-xl transition-all">
      <div className="flex items-center gap-2 justify-center">
        <Brain className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="text-xs opacity-80 mt-1 text-center">✓ Configurado</div>
      )}
    </div>
  ),
  action: ({ data }: { data: any }) => (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white border-2 border-blue-300 min-w-[140px] cursor-pointer hover:shadow-xl transition-all">
      <div className="flex items-center gap-2 justify-center">
        <Bot className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="text-xs opacity-80 mt-1 text-center">✓ Configurado</div>
      )}
    </div>
  ),
  condition: ({ data }: { data: any }) => (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white border-2 border-orange-300 min-w-[140px] cursor-pointer hover:shadow-xl transition-all">
      <div className="flex items-center gap-2 justify-center">
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="text-xs opacity-80 mt-1 text-center">✓ Configurado</div>
      )}
    </div>
  ),
  integration: ({ data }: { data: any }) => (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-teal-400 to-teal-600 text-white border-2 border-teal-300 min-w-[140px] cursor-pointer hover:shadow-xl transition-all">
      <div className="flex items-center gap-2 justify-center">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="text-xs opacity-80 mt-1 text-center">✓ Configurado</div>
      )}
    </div>
  ),
};

const nodeCategories = [
  {
    title: "🚀 Disparadores",
    color: "from-green-400 to-green-600",
    nodes: [
      { type: "trigger", label: "Mensaje Usuario", data: { type: "user_message" }, description: "Inicia cuando el usuario envía un mensaje" },
      { type: "trigger", label: "Webhook", data: { type: "webhook" }, description: "Recibe datos externos" },
      { type: "trigger", label: "Horario", data: { type: "schedule" }, description: "Ejecuta en horarios específicos" },
    ]
  },
  {
    title: "🧠 Inteligencia Artificial",
    color: "from-purple-400 to-purple-600",
    nodes: [
      { type: "ai", label: "Chat IA", data: { type: "llm_chat" }, description: "Conversa con IA avanzada" },
      { type: "ai", label: "Análisis Texto", data: { type: "text_analysis" }, description: "Analiza sentimientos y categorías" },
      { type: "ai", label: "Generador Texto", data: { type: "text_generator" }, description: "Crea contenido automáticamente" },
    ]
  },
  {
    title: "⚡ Acciones",
    color: "from-blue-400 to-blue-600",
    nodes: [
      { type: "action", label: "Enviar Mensaje", data: { type: "send_message" }, description: "Responde al usuario" },
      { type: "action", label: "Llamada API", data: { type: "api_call" }, description: "Conecta con servicios externos" },
      { type: "action", label: "Guardar Datos", data: { type: "database_save" }, description: "Almacena información" },
    ]
  },
  {
    title: "🔀 Lógica",
    color: "from-orange-400 to-orange-600",
    nodes: [
      { type: "condition", label: "Si/Entonces", data: { type: "condition" }, description: "Toma decisiones lógicas" },
      { type: "condition", label: "Filtro", data: { type: "filter" }, description: "Filtra información" },
      { type: "condition", label: "Espera", data: { type: "delay" }, description: "Pausa la ejecución" },
    ]
  }
];

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'trigger',
    position: { x: 250, y: 100 },
    data: { label: 'Inicio', type: 'user_message', config: { pattern: 'hola', response: '¡Hola! ¿En qué puedo ayudarte?' } },
  },
];

const initialEdges: Edge[] = [];

const AgentFlowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 3, stroke: '#8b5cf6' },
        animated: true,
      };
      setEdges((eds) => addEdge(edge, eds));
      toast({ title: "✅ Conexión creada", description: "Nodos conectados exitosamente" });
    },
    [setEdges, toast]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      const nodeData = JSON.parse(event.dataTransfer.getData('application/data') || '{}');

      if (!type || !reactFlowInstance || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label, ...nodeData },
      };

      setNodes((nds) => nds.concat(newNode));
      toast({ title: "✨ Nodo añadido", description: `${label} agregado al flujo` });
    },
    [reactFlowInstance, setNodes, toast]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, data: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.setData('application/data', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setConfigDialogOpen(true);
  }, []);

  const saveNodeConfig = useCallback((updatedData: any) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id ? { ...node, data: updatedData } : node
        )
      );
    }
  }, [selectedNode, setNodes]);

  const saveFlow = () => {
    toast({ 
      title: "💾 Flujo Guardado", 
      description: `Flujo con ${nodes.length} nodos y ${edges.length} conexiones guardado` 
    });
  };

  const testFlow = () => {
    toast({ 
      title: "🧪 Probando Flujo", 
      description: "Simulación del flujo iniciada" 
    });
  };

  // Tutorial overlay
  const TutorialOverlay = () => (
    showTutorial && (
      <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
        <Card className="max-w-lg mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              ¡Bienvenido al Constructor de Flujos!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">Arrastra componentes</p>
                  <p className="text-muted-foreground">Desde la barra lateral al lienzo</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Conecta nodos</p>
                  <p className="text-muted-foreground">Arrastra desde un círculo a otro</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Configura cada nodo</p>
                  <p className="text-muted-foreground">Haz clic en cualquier nodo</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowTutorial(false)} className="w-full">
              ¡Entendido, empezar!
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  );

  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-background relative">
        <TutorialOverlay />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/whitelabel/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Constructor de Flujos</h1>
            <Badge variant="secondary">Agent: {id}</Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowTutorial(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Ayuda
            </Button>
            <Button variant="outline" onClick={testFlow} disabled={nodes.length <= 1}>
              <Play className="w-4 h-4 mr-2" />
              Probar
            </Button>
            <Button onClick={saveFlow} disabled={nodes.length <= 1}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <div className="w-80 bg-card/30 backdrop-blur-sm border-r overflow-y-auto">
            <div className="p-4">
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Cómo construir tu agente:
                </h3>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div>• Arrastra componentes al lienzo</div>
                  <div>• Conecta arrastrando entre círculos</div>
                  <div>• Haz clic para configurar</div>
                </div>
              </div>

              {nodeCategories.map((category, index) => (
                <div key={index} className="mb-6">
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    {category.title}
                  </h3>
                  
                  <div className="space-y-2">
                    {category.nodes.map((node, nodeIndex) => (
                      <Card
                        key={nodeIndex}
                        className="cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-primary/30 hover:scale-105"
                        draggable
                        onDragStart={(event) => onDragStart(event, node.type, node.label, node.data)}
                      >
                        <CardContent className="p-3">
                          <div className="text-sm font-medium mb-1">{node.label}</div>
                          <div className="text-xs text-muted-foreground">{node.description}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative" ref={reactFlowWrapper}>
            {nodes.length <= 1 && !showTutorial && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="text-center bg-card/80 backdrop-blur-sm p-8 rounded-xl shadow-xl border-2 border-dashed border-muted-foreground/30">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Construye tu Agente</h3>
                  <p className="text-muted-foreground mb-4">
                    Arrastra componentes para crear flujos inteligentes
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>👈</span>
                    <span>Empieza arrastrando un componente</span>
                  </div>
                </div>
              </div>
            )}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
              proOptions={{ hideAttribution: true }}
            >
              <Controls />
              <MiniMap className="!bg-card/80 !border-2" />
              <Background gap={16} className="opacity-30" />
              
              <Panel position="top-right" className="bg-card/80 backdrop-blur-sm p-4 rounded-lg shadow-lg border">
                <div className="text-sm space-y-2">
                  <div className="font-medium">Estado del Flujo</div>
                  <div className="text-xs text-muted-foreground">
                    📦 Nodos: {nodes.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    🔗 Conexiones: {edges.length}
                  </div>
                  {nodes.length > 1 && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✅ Flujo activo
                    </div>
                  )}
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {/* Configuration Dialog */}
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          {selectedNode && (
            <NodeConfigDialog
              node={selectedNode}
              onSave={saveNodeConfig}
              onClose={() => setConfigDialogOpen(false)}
            />
          )}
        </Dialog>
      </div>
    </ReactFlowProvider>
  );
};

export default AgentFlowBuilder;