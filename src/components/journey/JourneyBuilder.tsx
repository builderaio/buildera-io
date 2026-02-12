import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useJourneyBuilder, JourneyStep, JourneyStepType, CreateStepInput } from '@/hooks/useJourneyBuilder';
import { useJourneyDefinitions } from '@/hooks/useJourneyDefinitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Clock,
  GitBranch,
  Brain,
  UserCog,
  Tag,
  Webhook,
  LogOut,
  Plus,
  Save,
  Play,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface JourneyBuilderProps {
  journeyId: string;
  onBack?: () => void;
}

const stepTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  send_email: { icon: Mail, label: 'Enviar Email', color: 'bg-blue-500' },
  delay: { icon: Clock, label: 'Esperar', color: 'bg-yellow-500' },
  condition: { icon: GitBranch, label: 'Condición', color: 'bg-purple-500' },
  ai_decision: { icon: Brain, label: 'Decisión IA', color: 'bg-pink-500' },
  update_contact: { icon: UserCog, label: 'Actualizar Contacto', color: 'bg-green-500' },
  create_activity: { icon: UserCog, label: 'Crear Actividad', color: 'bg-indigo-500' },
  move_deal_stage: { icon: GitBranch, label: 'Mover Deal', color: 'bg-orange-500' },
  add_tag: { icon: Tag, label: 'Añadir Tag', color: 'bg-teal-500' },
  remove_tag: { icon: Tag, label: 'Quitar Tag', color: 'bg-red-400' },
  webhook: { icon: Webhook, label: 'Webhook', color: 'bg-gray-500' },
  enroll_in_journey: { icon: Play, label: 'Inscribir en Journey', color: 'bg-cyan-500' },
  exit: { icon: LogOut, label: 'Salir', color: 'bg-red-500' },
  social_reply: { icon: Mail, label: 'Responder Social', color: 'bg-pink-400' },
  social_dm: { icon: Mail, label: 'Enviar DM', color: 'bg-violet-500' },
  create_post: { icon: Play, label: 'Crear Post', color: 'bg-emerald-500' },
};

// Custom Node Component
function StepNode({ data, selected }: NodeProps) {
  const config = stepTypeConfig[data.stepType as JourneyStepType];
  const Icon = config?.icon || Mail;
  const isCondition = data.stepType === 'condition' || data.stepType === 'ai_decision';

  return (
    <div 
      className={`
        min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all
        ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      
      <div className={`${config?.color} px-3 py-2 rounded-t-md flex items-center gap-2`}>
        <Icon className="h-4 w-4 text-white" />
        <span className="text-sm font-medium text-white">{config?.label}</span>
      </div>
      
      <div className="p-3">
        <div className="font-medium text-sm">{data.label}</div>
        {data.description && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {data.description}
          </div>
        )}
      </div>

      {isCondition ? (
        <>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="true"
            className="!bg-green-500 !left-1/4"
            style={{ left: '25%' }}
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="false"
            className="!bg-red-500 !left-3/4"
            style={{ left: '75%' }}
          />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!bg-primary" />
      )}
    </div>
  );
}

const nodeTypes = {
  stepNode: StepNode,
};

export function JourneyBuilder({ journeyId, onBack }: JourneyBuilderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepType, setNewStepType] = useState<JourneyStepType>('send_email');

  const { useJourneyById, activateJourney, updateJourney } = useJourneyDefinitions();
  const { data: journey } = useJourneyById(journeyId);
  
  const {
    steps,
    isLoading,
    createStep,
    updateStep,
    deleteStep,
    connectSteps,
    validateJourney,
    isCreating,
    isUpdating,
  } = useJourneyBuilder(journeyId);

  // Convert steps to React Flow nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const flowNodes: Node[] = steps.map((step, index) => ({
      id: step.id,
      type: 'stepNode',
      position: { x: step.position_x || 250, y: step.position_y || index * 150 },
      data: {
        label: step.name,
        description: step.description,
        stepType: step.step_type,
        step: step,
      },
    }));

    const flowEdges: Edge[] = [];
    
    steps.forEach(step => {
      if (step.next_step_id) {
        flowEdges.push({
          id: `${step.id}-${step.next_step_id}`,
          source: step.id,
          target: step.next_step_id,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: 'hsl(var(--primary))' },
        });
      }
      if (step.condition_true_step_id) {
        flowEdges.push({
          id: `${step.id}-true-${step.condition_true_step_id}`,
          source: step.id,
          sourceHandle: 'true',
          target: step.condition_true_step_id,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#22c55e' },
          label: 'Sí',
        });
      }
      if (step.condition_false_step_id) {
        flowEdges.push({
          id: `${step.id}-false-${step.condition_false_step_id}`,
          source: step.id,
          sourceHandle: 'false',
          target: step.condition_false_step_id,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#ef4444' },
          label: 'No',
        });
      }
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [steps]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when steps change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    try {
      let connectionType: 'next' | 'condition_true' | 'condition_false' = 'next';
      
      if (connection.sourceHandle === 'true') {
        connectionType = 'condition_true';
      } else if (connection.sourceHandle === 'false') {
        connectionType = 'condition_false';
      }

      await connectSteps({
        sourceId: connection.source,
        targetId: connection.target,
        connectionType,
      });

      setEdges((eds) => addEdge({
        ...connection,
        markerEnd: { type: MarkerType.ArrowClosed },
      }, eds));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo conectar los pasos', variant: 'destructive' });
    }
  }, [connectSteps, setEdges, toast]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const step = steps.find(s => s.id === node.id);
    if (step) {
      setSelectedStep(step);
    }
  }, [steps]);

  const handleAddStep = async () => {
    try {
      const position = steps.length;
      await createStep({
        journey_id: journeyId,
        name: `Nuevo paso ${position + 1}`,
        step_type: newStepType,
        position: position,
        position_y: position * 150,
      });
      setIsAddingStep(false);
      toast({ title: 'Paso añadido' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el paso', variant: 'destructive' });
    }
  };

  const handleUpdateStep = async (updates: Partial<JourneyStep>) => {
    if (!selectedStep) return;
    
    try {
      await updateStep({ id: selectedStep.id, ...updates });
      setSelectedStep(null);
      toast({ title: 'Paso actualizado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const handleDeleteStep = async () => {
    if (!selectedStep) return;
    
    try {
      await deleteStep(selectedStep.id);
      setSelectedStep(null);
      toast({ title: 'Paso eliminado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const handleActivate = async () => {
    const validation = validateJourney();
    
    if (!validation.valid) {
      toast({
        title: 'No se puede activar',
        description: validation.errors.join('\n'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await activateJourney(journeyId);
      toast({ title: 'Journey activado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo activar', variant: 'destructive' });
    }
  };

  const validation = validateJourney();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold">{journey?.name || 'Journey Builder'}</h2>
            <p className="text-sm text-muted-foreground">
              {steps.length} pasos configurados
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Validation Status */}
          {validation.valid ? (
            <Badge className="bg-green-500/20 text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Válido
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {validation.errors.length} errores
            </Badge>
          )}
          
          <Button variant="outline" onClick={() => setIsAddingStep(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Paso
          </Button>
          
          <Button 
            onClick={handleActivate}
            disabled={journey?.status === 'active' || !validation.valid}
          >
            <Play className="h-4 w-4 mr-2" />
            {journey?.status === 'active' ? 'Activo' : 'Activar'}
          </Button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/30"
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      {/* Add Step Dialog */}
      <Sheet open={isAddingStep} onOpenChange={setIsAddingStep}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Añadir nuevo paso</SheetTitle>
            <SheetDescription>
              Selecciona el tipo de paso que quieres añadir
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stepTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant={newStepType === type ? 'default' : 'outline'}
                    className="justify-start h-auto py-3"
                    onClick={() => setNewStepType(type as JourneyStepType)}
                  >
                    <div className={`${config.color} p-1.5 rounded mr-2`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">{config.label}</span>
                  </Button>
                );
              })}
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddStep}
              disabled={isCreating}
            >
              {isCreating ? 'Añadiendo...' : 'Añadir Paso'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Step Sheet */}
      <Sheet open={!!selectedStep} onOpenChange={() => setSelectedStep(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configurar paso</SheetTitle>
            <SheetDescription>
              {selectedStep && stepTypeConfig[selectedStep.step_type]?.label}
            </SheetDescription>
          </SheetHeader>
          
          {selectedStep && (
            <StepConfigForm
              step={selectedStep}
              onSave={handleUpdateStep}
              onDelete={handleDeleteStep}
              isUpdating={isUpdating}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface StepConfigFormProps {
  step: JourneyStep;
  onSave: (updates: Partial<JourneyStep>) => void;
  onDelete: () => void;
  isUpdating: boolean;
}

function StepConfigForm({ step, onSave, onDelete, isUpdating }: StepConfigFormProps) {
  const [formData, setFormData] = useState({
    name: step.name,
    description: step.description || '',
    email_subject: step.email_subject || '',
    email_content: step.email_content || '',
    delay_value: step.delay_value || 1,
    delay_unit: step.delay_unit || 'hours',
    ai_prompt: step.ai_prompt || '',
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del paso</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
        />
      </div>

      {/* Email specific fields */}
      {step.step_type === 'send_email' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email_subject">Asunto del email</Label>
            <Input
              id="email_subject"
              placeholder="Usa {{first_name}} para personalizar"
              value={formData.email_subject}
              onChange={(e) => setFormData(d => ({ ...d, email_subject: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_content">Contenido del email</Label>
            <Textarea
              id="email_content"
              className="min-h-[200px]"
              placeholder="<p>Hola {{first_name}},</p>..."
              value={formData.email_content}
              onChange={(e) => setFormData(d => ({ ...d, email_content: e.target.value }))}
            />
          </div>
        </>
      )}

      {/* Delay specific fields */}
      {step.step_type === 'delay' && (
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="delay_value">Tiempo</Label>
            <Input
              id="delay_value"
              type="number"
              min="1"
              value={formData.delay_value}
              onChange={(e) => setFormData(d => ({ ...d, delay_value: parseInt(e.target.value) }))}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="delay_unit">Unidad</Label>
            <Select
              value={formData.delay_unit}
              onValueChange={(v) => setFormData(d => ({ ...d, delay_unit: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutos</SelectItem>
                <SelectItem value="hours">Horas</SelectItem>
                <SelectItem value="days">Días</SelectItem>
                <SelectItem value="weeks">Semanas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* AI Decision specific fields */}
      {step.step_type === 'ai_decision' && (
        <div className="space-y-2">
          <Label htmlFor="ai_prompt">Prompt para la IA</Label>
          <Textarea
            id="ai_prompt"
            className="min-h-[150px]"
            placeholder="Analiza el contacto {{first_name}} con email {{email}} y decide..."
            value={formData.ai_prompt}
            onChange={(e) => setFormData(d => ({ ...d, ai_prompt: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            La IA elegirá entre las opciones configuradas basándose en este prompt.
          </p>
        </div>
      )}

      {/* Stats */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="font-medium">{step.total_executions}</div>
              <div className="text-muted-foreground text-xs">Ejecuciones</div>
            </div>
            <div>
              <div className="font-medium text-green-600">{step.successful_executions}</div>
              <div className="text-muted-foreground text-xs">Exitosas</div>
            </div>
            <div>
              <div className="font-medium text-red-600">{step.failed_executions}</div>
              <div className="text-muted-foreground text-xs">Fallidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 pt-4">
        <Button 
          variant="destructive" 
          onClick={onDelete}
          className="flex-1"
        >
          Eliminar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isUpdating}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
