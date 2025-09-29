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
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Database, 
  Globe, 
  Mic,
  Eye,
  Brain,
  Save,
  Play,
  Settings,
  Plus,
  ArrowLeft,
  Mail,
  Calendar,
  MessageCircle,
  Image,
  Volume2
} from 'lucide-react';

// Node configuration component
const NodeConfigDialog = ({ node, onSave, onClose }: { node: Node, onSave: (config: any) => void, onClose: () => void }) => {
  const [config, setConfig] = useState(node.data.config || {});
  const { toast } = useToast();

  const handleSave = () => {
    onSave({ ...node.data, config });
    toast({ title: "Node Configuration Saved", description: `${node.data.label} has been configured successfully.` });
    onClose();
  };

  const renderConfigFields = () => {
    switch (node.data.type) {
      case 'user_message':
        return (
          <div className="space-y-4">
            <div>
              <Label>Message Pattern</Label>
              <Input
                placeholder="Enter message pattern or keywords"
                value={config.pattern || ''}
                onChange={(e) => setConfig({ ...config, pattern: e.target.value })}
              />
            </div>
            <div>
              <Label>Response Template</Label>
              <Textarea
                placeholder="Enter response template"
                value={config.response || ''}
                onChange={(e) => setConfig({ ...config, response: e.target.value })}
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://your-webhook-url.com"
                value={config.url || ''}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
              />
            </div>
            <div>
              <Label>HTTP Method</Label>
              <Select value={config.method || 'POST'} onValueChange={(value) => setConfig({ ...config, method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'llm_chat':
        return (
          <div className="space-y-4">
            <div>
              <Label>AI Model</Label>
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
              <Label>System Prompt</Label>
              <Textarea
                placeholder="Enter system prompt for AI"
                value={config.systemPrompt || ''}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              />
            </div>
            <div>
              <Label>Temperature</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        );

      case 'send_message':
        return (
          <div className="space-y-4">
            <div>
              <Label>Message Content</Label>
              <Textarea
                placeholder="Enter message content (supports variables like {user_name})"
                value={config.content || ''}
                onChange={(e) => setConfig({ ...config, content: e.target.value })}
              />
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={config.channel || 'chat'} onValueChange={(value) => setConfig({ ...config, channel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'api_call':
        return (
          <div className="space-y-4">
            <div>
              <Label>API Endpoint</Label>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={config.endpoint || ''}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              />
            </div>
            <div>
              <Label>Headers (JSON)</Label>
              <Textarea
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                value={config.headers || ''}
                onChange={(e) => setConfig({ ...config, headers: e.target.value })}
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label>Condition</Label>
              <Input
                placeholder="e.g., user_age > 18"
                value={config.condition || ''}
                onChange={(e) => setConfig({ ...config, condition: e.target.value })}
              />
            </div>
            <div>
              <Label>True Path Message</Label>
              <Input
                placeholder="Message when condition is true"
                value={config.trueMessage || ''}
                onChange={(e) => setConfig({ ...config, trueMessage: e.target.value })}
              />
            </div>
            <div>
              <Label>False Path Message</Label>
              <Input
                placeholder="Message when condition is false"
                value={config.falseMessage || ''}
                onChange={(e) => setConfig({ ...config, falseMessage: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label>Configuration</Label>
              <Textarea
                placeholder="Enter node configuration as JSON"
                value={JSON.stringify(config, null, 2)}
                onChange={(e) => {
                  try {
                    setConfig(JSON.parse(e.target.value));
                  } catch {}
                }}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Configure {node.data.label}</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        {renderConfigFields()}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </div>
    </DialogContent>
  );
};

// Enhanced node components with functionality
const nodeTypes = {
  trigger: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-green-400 to-green-600 text-white border min-w-[120px]">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && (
        <div className="text-xs opacity-80 mt-1">
          {data.config.pattern ? `Pattern: ${data.config.pattern.substring(0, 20)}...` : 'Configured ✓'}
        </div>
      )}
    </div>
  ),
  ai: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 text-white border min-w-[120px]">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && (
        <div className="text-xs opacity-80 mt-1">
          {data.config.model ? `Model: ${data.config.model}` : 'Configured ✓'}
        </div>
      )}
    </div>
  ),
  action: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white border min-w-[120px]">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && (
        <div className="text-xs opacity-80 mt-1">
          {data.config.endpoint ? 'API Ready' : data.config.content ? 'Message Ready' : 'Configured ✓'}
        </div>
      )}
    </div>
  ),
  condition: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white border min-w-[120px]">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && (
        <div className="text-xs opacity-80 mt-1">
          {data.config.condition ? `If: ${data.config.condition.substring(0, 15)}...` : 'Configured ✓'}
        </div>
      )}
    </div>
  ),
  integration: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-teal-400 to-teal-600 text-white border min-w-[120px]">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.config && (
        <div className="text-xs opacity-80 mt-1">
          Configured ✓
        </div>
      )}
    </div>
  ),
};

const nodeCategories = [
  {
    title: "Triggers",
    icon: <Zap className="w-5 h-5" />,
    nodes: [
      { type: "trigger", label: "User Message", data: { type: "user_message" } },
      { type: "trigger", label: "Webhook", data: { type: "webhook" } },
      { type: "trigger", label: "Schedule", data: { type: "schedule" } },
      { type: "trigger", label: "Voice Input", data: { type: "voice_input" } },
    ]
  },
  {
    title: "AI Processing",
    icon: <Brain className="w-5 h-5" />,
    nodes: [
      { type: "ai", label: "LLM Chat", data: { type: "llm_chat" } },
      { type: "ai", label: "Text Analysis", data: { type: "text_analysis" } },
      { type: "ai", label: "Image Recognition", data: { type: "image_recognition" } },
      { type: "ai", label: "Voice Synthesis", data: { type: "voice_synthesis" } },
    ]
  },
  {
    title: "Actions",
    icon: <Bot className="w-5 h-5" />,
    nodes: [
      { type: "action", label: "Send Message", data: { type: "send_message" } },
      { type: "action", label: "API Call", data: { type: "api_call" } },
      { type: "action", label: "Database Query", data: { type: "database_query" } },
      { type: "action", label: "Email Send", data: { type: "email_send" } },
    ]
  },
  {
    title: "Logic",
    icon: <MessageSquare className="w-5 h-5" />,
    nodes: [
      { type: "condition", label: "If/Else", data: { type: "condition" } },
      { type: "condition", label: "Switch", data: { type: "switch" } },
      { type: "condition", label: "Loop", data: { type: "loop" } },
      { type: "condition", label: "Delay", data: { type: "delay" } },
    ]
  },
  {
    title: "Integrations",
    icon: <Globe className="w-5 h-5" />,
    nodes: [
      { type: "integration", label: "CRM Connect", data: { type: "crm_connect" } },
      { type: "integration", label: "Slack Bot", data: { type: "slack_bot" } },
      { type: "integration", label: "WhatsApp", data: { type: "whatsapp" } },
      { type: "integration", label: "Zapier", data: { type: "zapier" } },
    ]
  }
];

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { label: 'Start Conversation', type: 'user_message' },
  },
];

const initialEdges: Edge[] = [];

const AgentFlowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          strokeWidth: 2,
          stroke: '#8b5cf6',
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
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

      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (reactFlowInstance && reactFlowWrapper.current) {
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
      }
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, data: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.setData('application/data', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle node click to open configuration
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setConfigDialogOpen(true);
  }, []);

  // Save node configuration
  const saveNodeConfig = useCallback((updatedData: any) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: updatedData }
            : node
        )
      );
    }
  }, [selectedNode, setNodes]);

  // Execute individual node functionality
  const executeNode = async (node: Node): Promise<any> => {
    const { type, config } = node.data;
    
    try {
      switch (type) {
        case 'user_message':
          return { message: config?.response || 'User message triggered', pattern: config?.pattern };

        case 'webhook':
          if (config?.url) {
            const response = await fetch(config.url, {
              method: config.method || 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nodeId: node.id, timestamp: new Date().toISOString() })
            });
            return { status: response.ok ? 'success' : 'failed', url: config.url };
          }
          break;

        case 'llm_chat':
          // Simulate AI response
          return {
            response: `AI Response from ${config?.model || 'GPT-4'}: This is a simulated response to demonstrate the flow. System prompt: ${config?.systemPrompt || 'Default'}`,
            model: config?.model,
            temperature: config?.temperature
          };

        case 'send_message':
          return {
            sent: true,
            content: config?.content || 'Default message',
            channel: config?.channel || 'chat'
          };

        case 'api_call':
          if (config?.endpoint) {
            try {
              const headers = config.headers ? JSON.parse(config.headers) : {};
              const response = await fetch(config.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ nodeId: node.id, timestamp: new Date().toISOString() })
              });
              return { success: response.ok, endpoint: config.endpoint, status: response.status };
            } catch (error: any) {
              return { success: false, error: error.message };
            }
          }
          break;

        case 'condition':
          // Simulate condition evaluation
          const conditionResult = Math.random() > 0.5; // Random for demo
          return {
            conditionMet: conditionResult,
            message: conditionResult ? config?.trueMessage : config?.falseMessage,
            condition: config?.condition
          };

        default:
          return { message: `${node.data.label} executed successfully`, type };
      }
    } catch (error: any) {
      return { error: error.message, type };
    }
    
    return { message: `${node.data.label} executed`, type };
  };

  const saveFlow = () => {
    const flowData = {
      nodes,
      edges,
      updated_at: new Date().toISOString()
    };
    console.log('Saving flow:', flowData);
    
    // TODO: Implement actual save to Supabase
    toast({
      title: "Flow Saved",
      description: "Flow saved successfully! (Demo mode - not actually saved yet)"
    });
  };

  const testFlow = async () => {
    if (nodes.length === 0) {
      toast({
        title: "No nodes to test",
        description: "Please add some nodes to test the flow",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Testing Flow",
      description: "Executing nodes in sequence...",
    });

    // Find the start node (trigger type)
    const startNode = nodes.find(node => node.type === 'trigger');
    if (!startNode) {
      toast({
        title: "No trigger found",
        description: "Please add a trigger node to start the flow",
        variant: "destructive"
      });
      return;
    }

    // Execute the flow starting from trigger
    let currentNode = startNode;
    let executionResults = [];
    let visited = new Set();
    
    while (currentNode && !visited.has(currentNode.id)) {
      visited.add(currentNode.id);
      
      const result = await executeNode(currentNode);
      executionResults.push({
        nodeId: currentNode.id,
        label: currentNode.data.label,
        result
      });

      // Find next connected node
      const outgoingEdge = edges.find(edge => edge.source === currentNode.id);
      if (outgoingEdge) {
        currentNode = nodes.find(node => node.id === outgoingEdge.target);
      } else {
        break;
      }

      // Small delay for demo purposes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Flow execution results:', executionResults);
    
    toast({
      title: "Flow Test Completed",
      description: `Executed ${executionResults.length} nodes successfully. Check console for details.`,
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/whitelabel/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Agent Flow Builder</h1>
              <p className="text-sm text-muted-foreground">
                {id ? 'Editing existing agent' : 'Creating new agent'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={testFlow}>
              <Play className="w-4 h-4 mr-2" />
              Test Flow
            </Button>
            <Button onClick={saveFlow}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Node Library</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag nodes onto the canvas and click them to configure
              </p>
            </div>

            {nodeCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {category.nodes.map((node, nodeIndex) => (
                    <div
                      key={nodeIndex}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-background hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors"
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type, node.label, node.data)}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        node.type === 'trigger' ? 'bg-green-500' :
                        node.type === 'ai' ? 'bg-purple-500' :
                        node.type === 'action' ? 'bg-blue-500' :
                        node.type === 'condition' ? 'bg-orange-500' :
                        'bg-teal-500'
                      }`} />
                      <span className="text-sm">{node.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
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
          >
            <Background />
            <Controls />
            <MiniMap 
              className="!bg-background !border !border-border"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'trigger': return '#10b981';
                  case 'ai': return '#8b5cf6';
                  case 'action': return '#3b82f6';
                  case 'condition': return '#f59e0b';
                  case 'integration': return '#14b8a6';
                  default: return '#6b7280';
                }
              }}
            />
            <Panel position="top-right" className="bg-background border rounded-lg p-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Flow Stats</div>
                <div className="text-xs text-muted-foreground">
                  Nodes: {nodes.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Connections: {edges.length}
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Dialog */}
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
  );
};

const AgentFlowBuilderWrapper = () => (
  <ReactFlowProvider>
    <AgentFlowBuilder />
  </ReactFlowProvider>
);

export default AgentFlowBuilderWrapper;