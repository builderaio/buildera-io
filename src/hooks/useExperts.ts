import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Expert {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialization: string;
  bio: string;
  experience_years: number;
  hourly_rate: number;
  rating: number;
  total_sessions: number;
  languages: string[];
  timezone: string;
  profile_image_url?: string;
  linkedin_url?: string;
  website_url?: string;
  is_available: boolean;
  is_verified: boolean;
  specializations?: ExpertSpecialization[];
  availability?: ExpertAvailability[];
}

export interface ExpertSpecialization {
  id: string;
  category: string;
  subcategory: string;
  skill_level: string;
  years_experience: number;
  description: string;
}

export interface ExpertAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface ExpertSession {
  id: string;
  expert_id: string;
  client_user_id: string;
  scheduled_at: string;
  duration_minutes: number;
  session_type: string;
  topic: string;
  description: string;
  status: string;
  meeting_link?: string;
  price_paid: number;
  client_rating?: number;
  client_feedback?: string;
  expert?: Expert;
}

export interface BookSessionData {
  expert_id: string;
  scheduled_at: string;
  duration_minutes: number;
  session_type: string;
  topic: string;
  description: string;
}

export const useExperts = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [userSessions, setUserSessions] = useState<ExpertSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadExperts();
    loadUserSessions();
  }, []);

  const loadExperts = async () => {
    try {
      setLoading(true);
      
      // Load experts with the new RLS policies that protect sensitive information
      const { data: expertsData, error } = await supabase
        .from('experts')
        .select(`
          *,
          specializations:expert_specializations(*),
          availability:expert_availability(*)
        `)
        .eq('is_available', true)
        .eq('is_verified', true)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error loading experts:', error);
        // If error due to RLS, try to get public data only
        const { data: publicData, error: publicError } = await supabase
          .from('experts')
          .select(`
            id,
            user_id,
            full_name,
            specialization,
            bio,
            experience_years,
            rating,
            total_sessions,
            languages,
            timezone,
            profile_image_url,
            linkedin_url,
            website_url,
            is_available,
            is_verified,
            created_at,
            specializations:expert_specializations(*),
            availability:expert_availability(*)
          `)
          .eq('is_available', true)
          .eq('is_verified', true)
          .order('rating', { ascending: false });
          
        if (publicError) throw publicError;
        
        // Set experts without sensitive data
        const expertsWithoutSensitive = (publicData || []).map(expert => ({
          ...expert,
          hourly_rate: 0,
          email: ''
        }));
        setExperts(expertsWithoutSensitive);
      } else {
        setExperts(expertsData || []);
      }
    } catch (error) {
      console.error('Error loading experts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los expertos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessionsData, error } = await supabase
        .from('expert_sessions')
        .select(`
          *,
          expert:experts(*)
        `)
        .eq('client_user_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setUserSessions(sessionsData || []);
    } catch (error) {
      console.error('Error loading user sessions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus sesiones",
        variant: "destructive"
      });
    }
  };

  const bookSession = async (sessionData: BookSessionData): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para agendar una sesión",
          variant: "destructive"
        });
        return false;
      }

      // Find the expert and calculate price
      const expert = experts.find(e => e.id === sessionData.expert_id);
      if (!expert) {
        toast({
          title: "Error",
          description: "Experto no encontrado",
          variant: "destructive"
        });
        return false;
      }

      const price = (expert.hourly_rate * sessionData.duration_minutes) / 60;

      const { error } = await supabase
        .from('expert_sessions')
        .insert({
          expert_id: sessionData.expert_id,
          client_user_id: user.id,
          scheduled_at: sessionData.scheduled_at,
          duration_minutes: sessionData.duration_minutes,
          session_type: sessionData.session_type,
          topic: sessionData.topic,
          description: sessionData.description,
          price_paid: price,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "¡Sesión agendada!",
        description: `Tu sesión con ${expert.full_name} ha sido agendada exitosamente`,
      });

      // Reload sessions
      loadUserSessions();
      return true;
    } catch (error) {
      console.error('Error booking session:', error);
      toast({
        title: "Error",
        description: "No se pudo agendar la sesión",
        variant: "destructive"
      });
      return false;
    }
  };

  const cancelSession = async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('expert_sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Sesión cancelada",
        description: "La sesión ha sido cancelada exitosamente",
      });

      // Reload sessions
      loadUserSessions();
      return true;
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la sesión",
        variant: "destructive"
      });
      return false;
    }
  };

  const rateSession = async (sessionId: string, rating: number, feedback: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('expert_sessions')
        .update({ 
          client_rating: rating,
          client_feedback: feedback,
          status: 'completed'
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Calificación enviada",
        description: "Gracias por tu feedback",
      });

      // Reload sessions
      loadUserSessions();
      return true;
    } catch (error) {
      console.error('Error rating session:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación",
        variant: "destructive"
      });
      return false;
    }
  };

  const getAvailableTimeSlots = (expert: Expert, date: Date) => {
    const dayOfWeek = date.getDay();
    const availability = expert.availability?.find(a => a.day_of_week === dayOfWeek);
    
    if (!availability) return [];

    const slots = [];
    const startTime = new Date(`${date.toISOString().split('T')[0]}T${availability.start_time}`);
    const endTime = new Date(`${date.toISOString().split('T')[0]}T${availability.end_time}`);
    
    for (let time = new Date(startTime); time < endTime; time.setHours(time.getHours() + 1)) {
      slots.push(new Date(time));
    }
    
    return slots;
  };

  return {
    experts,
    userSessions,
    loading,
    loadExperts,
    loadUserSessions,
    bookSession,
    cancelSession,
    rateSession,
    getAvailableTimeSlots
  };
};