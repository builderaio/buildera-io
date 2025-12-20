import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useJourneyDefinitions, JourneyStatus, JourneyTriggerType } from '@/hooks/useJourneyDefinitions';
import { useJourneyEnrollments } from '@/hooks/useJourneyEnrollments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  MoreVertical, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  Edit, 
  Users,
  Zap,
  Clock,
  Target,
  Search
} from 'lucide-react';

interface JourneyListProps {
  onEditJourney?: (journeyId: string) => void;
}

const triggerTypeLabels: Record<JourneyTriggerType, string> = {
  lifecycle_change: 'Cambio de etapa',
  manual: 'Manual',
  tag_added: 'Tag añadido',
  deal_created: 'Deal creado',
  deal_stage_changed: 'Deal movido',
  form_submit: 'Formulario',
  inbound_email: 'Email entrante',
  ai_triggered: 'IA activado',
  contact_created: 'Contacto creado',
  activity_completed: 'Actividad completada',
};

const statusColors: Record<JourneyStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/20 text-green-600',
  paused: 'bg-yellow-500/20 text-yellow-600',
  archived: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<JourneyStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  archived: 'Archivado',
};

export function JourneyList({ onEditJourney }: JourneyListProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newJourneyData, setNewJourneyData] = useState({
    name: '',
    description: '',
    trigger_type: 'manual' as JourneyTriggerType,
  });

  const { 
    journeys, 
    isLoading, 
    createJourney, 
    deleteJourney,
    activateJourney,
    pauseJourney,
    cloneJourney,
    isCreating,
  } = useJourneyDefinitions();

  const { useJourneyStats } = useJourneyEnrollments();

  const filteredJourneys = journeys.filter(j => 
    j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateJourney = async () => {
    try {
      const journey = await createJourney(newJourneyData);
      toast({ title: 'Journey creado', description: 'Ahora puedes añadir pasos al journey' });
      setIsCreateDialogOpen(false);
      setNewJourneyData({ name: '', description: '', trigger_type: 'manual' });
      if (onEditJourney) {
        onEditJourney(journey.id);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el journey', variant: 'destructive' });
    }
  };

  const handleActivate = async (journeyId: string) => {
    try {
      await activateJourney(journeyId);
      toast({ title: 'Journey activado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo activar', variant: 'destructive' });
    }
  };

  const handlePause = async (journeyId: string) => {
    try {
      await pauseJourney(journeyId);
      toast({ title: 'Journey pausado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo pausar', variant: 'destructive' });
    }
  };

  const handleClone = async (journeyId: string) => {
    try {
      await cloneJourney(journeyId);
      toast({ title: 'Journey clonado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo clonar', variant: 'destructive' });
    }
  };

  const handleDelete = async (journeyId: string) => {
    try {
      await deleteJourney(journeyId);
      toast({ title: 'Journey eliminado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Customer Journeys</h2>
          <p className="text-muted-foreground">
            Automatiza las comunicaciones con tus contactos
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Journey
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar journeys..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Journey Grid */}
      {filteredJourneys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay journeys</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crea tu primer journey para automatizar las comunicaciones con tus contactos
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Journey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJourneys.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              onEdit={() => onEditJourney?.(journey.id)}
              onActivate={() => handleActivate(journey.id)}
              onPause={() => handlePause(journey.id)}
              onClone={() => handleClone(journey.id)}
              onDelete={() => handleDelete(journey.id)}
              useJourneyStats={useJourneyStats}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo Journey</DialogTitle>
            <DialogDescription>
              Define las características básicas del journey. Podrás añadir pasos después.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Ej: Welcome Series"
                value={newJourneyData.name}
                onChange={(e) => setNewJourneyData(d => ({ ...d, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe el objetivo de este journey..."
                value={newJourneyData.description}
                onChange={(e) => setNewJourneyData(d => ({ ...d, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger</Label>
              <Select
                value={newJourneyData.trigger_type}
                onValueChange={(v) => setNewJourneyData(d => ({ ...d, trigger_type: v as JourneyTriggerType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateJourney} 
              disabled={!newJourneyData.name || isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear Journey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface JourneyCardProps {
  journey: any;
  onEdit: () => void;
  onActivate: () => void;
  onPause: () => void;
  onClone: () => void;
  onDelete: () => void;
  useJourneyStats: (journeyId: string | undefined) => any;
}

function JourneyCard({ 
  journey, 
  onEdit, 
  onActivate, 
  onPause, 
  onClone, 
  onDelete,
  useJourneyStats,
}: JourneyCardProps) {
  const { data: stats } = useJourneyStats(journey.id);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{journey.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {journey.description || 'Sin descripción'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {journey.status === 'active' ? (
                <DropdownMenuItem onClick={onPause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onActivate}>
                  <Play className="h-4 w-4 mr-2" />
                  Activar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onClone}>
                <Copy className="h-4 w-4 mr-2" />
                Clonar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status and Trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={statusColors[journey.status as JourneyStatus]}>
              {statusLabels[journey.status as JourneyStatus]}
            </Badge>
            <Badge variant="outline">
              <Zap className="h-3 w-3 mr-1" />
              {triggerTypeLabels[journey.trigger_type as JourneyTriggerType]}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center justify-center text-muted-foreground mb-1">
                <Users className="h-3 w-3 mr-1" />
              </div>
              <div className="text-lg font-semibold">{stats?.active || 0}</div>
              <div className="text-xs text-muted-foreground">Activos</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center justify-center text-muted-foreground mb-1">
                <Target className="h-3 w-3 mr-1" />
              </div>
              <div className="text-lg font-semibold">{stats?.completed || 0}</div>
              <div className="text-xs text-muted-foreground">Completados</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center justify-center text-muted-foreground mb-1">
                <Clock className="h-3 w-3 mr-1" />
              </div>
              <div className="text-lg font-semibold">
                {journey.conversion_rate?.toFixed(0) || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Conversión</div>
            </div>
          </div>

          {/* Edit Button */}
          <Button variant="outline" className="w-full" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Journey
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
