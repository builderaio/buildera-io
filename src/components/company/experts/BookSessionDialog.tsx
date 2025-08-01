import { useState } from 'react';
import { format, addDays, startOfToday, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Calendar as CalendarIcon, Star } from "lucide-react";
import { Expert, BookSessionData } from "@/hooks/useExperts";

interface BookSessionDialogProps {
  expert: Expert | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (sessionData: BookSessionData) => Promise<boolean>;
}

export const BookSessionDialog = ({ 
  expert, 
  isOpen, 
  onClose, 
  onBook 
}: BookSessionDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [sessionType, setSessionType] = useState<string>("consultation");
  const [topic, setTopic] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!expert) return null;

  const today = startOfToday();
  const maxDate = addDays(today, 30); // Allow booking up to 30 days ahead

  const getAvailableTimeSlots = () => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const availability = expert.availability?.find(a => a.day_of_week === dayOfWeek);
    
    if (!availability) return [];

    const slots = [];
    const [startHour, startMinute] = availability.start_time.split(':').map(Number);
    const [endHour, endMinute] = availability.end_time.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour - 1 || (hour === endHour - 1 && endMinute >= 30)) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    return slots;
  };

  const calculatePrice = () => {
    return (expert.hourly_rate * duration) / 60;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !topic.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      const scheduledAt = new Date(selectedDate);
      const [hour, minute] = selectedTime.split(':').map(Number);
      scheduledAt.setHours(hour, minute, 0, 0);

      const sessionData: BookSessionData = {
        expert_id: expert.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: duration,
        session_type: sessionType,
        topic: topic.trim(),
        description: description.trim()
      };

      const success = await onBook(sessionData);
      if (success) {
        // Reset form
        setSelectedDate(undefined);
        setSelectedTime("");
        setDuration(60);
        setSessionType("consultation");
        setTopic("");
        setDescription("");
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const timeSlots = getAvailableTimeSlots();
  const isFormValid = selectedDate && selectedTime && topic.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Sesión</DialogTitle>
          <DialogDescription>
            Programa una sesión personalizada con el experto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Expert Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={expert.profile_image_url} alt={expert.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(expert.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold">{expert.full_name}</h3>
              <p className="text-sm text-muted-foreground">{expert.specialization}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{expert.rating}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  ${expert.hourly_rate}/hora
                </Badge>
              </div>
            </div>
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label htmlFor="session-type">Tipo de Sesión</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultoría</SelectItem>
                <SelectItem value="mentoring">Mentoría</SelectItem>
                <SelectItem value="review">Revisión de Proyecto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duración</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => isBefore(date, today) || date > maxDate}
              locale={es}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <Label>Hora</Label>
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className="justify-center"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                  El experto no tiene disponibilidad en la fecha seleccionada.
                </p>
              )}
            </div>
          )}

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Tema Principal *</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="¿Sobre qué te gustaría hablar?"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proporciona más detalles sobre lo que necesitas..."
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Price Summary */}
          {isFormValid && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Total a pagar:</p>
                  <p className="text-sm text-muted-foreground">
                    {duration} minutos × ${expert.hourly_rate}/hora
                  </p>
                </div>
                <div className="text-2xl font-bold text-primary">
                  ${calculatePrice().toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              className="flex-1"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {loading ? "Agendando..." : "Agendar Sesión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};