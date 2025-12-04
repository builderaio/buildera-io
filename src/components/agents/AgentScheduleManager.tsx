import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Settings2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Repeat
} from "lucide-react";
import { ScheduleConfig } from "@/hooks/useAgentConfiguration";

interface AgentScheduleManagerProps {
  agentName: string;
  isRecurringCapable: boolean;
  currentSchedule: ScheduleConfig | null;
  isActive: boolean;
  nextExecutionAt: string | null;
  lastExecutionAt: string | null;
  lastExecutionStatus: string | null;
  totalExecutions: number;
  onUpdateSchedule: (schedule: ScheduleConfig | null, isActive: boolean) => Promise<boolean>;
  saving?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export const AgentScheduleManager = ({
  agentName,
  isRecurringCapable,
  currentSchedule,
  isActive,
  nextExecutionAt,
  lastExecutionAt,
  lastExecutionStatus,
  totalExecutions,
  onUpdateSchedule,
  saving = false
}: AgentScheduleManagerProps) => {
  const { t } = useTranslation(['common']);
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(currentSchedule || {
    frequency: 'daily',
    time: '09:00',
    days: [1, 3, 5], // Mon, Wed, Fri
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [scheduleEnabled, setScheduleEnabled] = useState(!!currentSchedule);

  const handleSave = async () => {
    const schedule = scheduleEnabled ? scheduleConfig : null;
    const success = await onUpdateSchedule(schedule, scheduleEnabled);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleToggleActive = async () => {
    if (currentSchedule) {
      await onUpdateSchedule(currentSchedule, !isActive);
    }
  };

  const handleDayToggle = (day: number) => {
    const currentDays = scheduleConfig.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    setScheduleConfig({ ...scheduleConfig, days: newDays });
  };

  if (!isRecurringCapable) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            Este agente no soporta ejecución programada
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (!currentSchedule) return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    if (!isActive) return <Pause className="w-4 h-4 text-amber-500" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  };

  const formatNextExecution = () => {
    if (!nextExecutionAt) return 'No programada';
    const date = new Date(nextExecutionAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Pendiente';
    if (diff < 3600000) return `En ${Math.round(diff / 60000)} min`;
    if (diff < 86400000) return `En ${Math.round(diff / 3600000)} horas`;
    return date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              Ejecución Programada
            </CardTitle>
            <CardDescription>
              Configura la ejecución automática de {agentName}
            </CardDescription>
          </div>
          {currentSchedule && !isEditing && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {isActive ? 'Activo' : 'Pausado'}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={saving}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Summary */}
        {!isEditing && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon()}
                <span className="text-xs text-muted-foreground">Estado</span>
              </div>
              <p className="font-medium">
                {!currentSchedule ? 'Sin programar' : isActive ? 'Activo' : 'Pausado'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Próxima</span>
              </div>
              <p className="font-medium text-sm">{formatNextExecution()}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Play className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="font-medium">{totalExecutions} ejecuciones</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Última</span>
              </div>
              <p className="font-medium text-sm">
                {lastExecutionAt 
                  ? new Date(lastExecutionAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })
                  : 'Nunca'
                }
              </p>
            </div>
          </div>
        )}

        {/* Current Schedule Display */}
        {currentSchedule && !isEditing && (
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Programación Actual</h4>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Settings2 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">
                {currentSchedule.frequency === 'daily' && 'Diario'}
                {currentSchedule.frequency === 'weekly' && 'Semanal'}
                {currentSchedule.frequency === 'monthly' && 'Mensual'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Clock className="w-3 h-3 mr-1" />
                {currentSchedule.time}
              </Badge>
              {currentSchedule.frequency === 'weekly' && currentSchedule.days && (
                <Badge variant="outline" className="text-sm">
                  {currentSchedule.days.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Schedule Editor */}
        {(isEditing || !currentSchedule) && (
          <div className="space-y-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <Label>Habilitar ejecución automática</Label>
              <Switch
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
              />
            </div>

            {scheduleEnabled && (
              <>
                <div className="space-y-2">
                  <Label>Frecuencia</Label>
                  <Select
                    value={scheduleConfig.frequency}
                    onValueChange={(v: 'daily' | 'weekly' | 'monthly') => 
                      setScheduleConfig({ ...scheduleConfig, frequency: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduleConfig.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Días de la semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.value} className="flex items-center gap-1">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={(scheduleConfig.days || []).includes(day.value)}
                            onCheckedChange={() => handleDayToggle(day.value)}
                          />
                          <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scheduleConfig.frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Día del mes</Label>
                    <Select
                      value={String(scheduleConfig.dayOfMonth || 1)}
                      onValueChange={(v) => 
                        setScheduleConfig({ ...scheduleConfig, dayOfMonth: parseInt(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            Día {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Hora de ejecución</Label>
                  <Select
                    value={scheduleConfig.time}
                    onValueChange={(v) => setScheduleConfig({ ...scheduleConfig, time: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Programación'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* No Schedule CTA */}
        {!currentSchedule && !isEditing && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsEditing(true)}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Configurar Ejecución Automática
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentScheduleManager;
