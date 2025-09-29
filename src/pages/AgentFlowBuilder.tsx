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
  ArrowLeft
} from 'lucide-react';

// Node types for the flow builder
const nodeTypes = {
  trigger: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-green-400 to-green-600 text-white border">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
    </div>
  ),
  ai: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 text-white border">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
    </div>
  ),
  action: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white border">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
    </div>
  ),
  condition: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white border">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
    </div>
  ),
  integration: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-gradient-to-r from-teal-400 to-teal-600 text-white border">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
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
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode: Node = {
          id: `${nodes.length + 1}`,
          type,
          position,
          data: { label, ...nodeData },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, nodes.length, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, data: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.setData('application/data', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  const saveFlow = () => {
    const flowData = {
      nodes,
      edges,
    };
    console.log('Saving flow:', flowData);
    // Here you would save to Supabase
  };

  const testFlow = () => {
    console.log('Testing flow with current configuration');
    // Here you would test the flow
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
                Drag nodes onto the canvas to build your agent flow
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
    </div>
  );
};

const AgentFlowBuilderWrapper = () => (
  <ReactFlowProvider>
    <AgentFlowBuilder />
  </ReactFlowProvider>
);

export default AgentFlowBuilderWrapper;