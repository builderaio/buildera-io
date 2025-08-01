import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TutorSession {
  id: string;
  messages: TutorMessage[];
  session_type: string;
  topics_covered: string[];
  recommendations: string[];
}

export const useAITutor = () => {
  const [session, setSession] = useState<TutorSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  const startSession = async (moduleId?: string) => {
    try {
      setLoading(true);
      
      const newSession: TutorSession = {
        id: crypto.randomUUID(),
        messages: [{
          role: 'assistant',
          content: '¡Hola! Soy tu tutor de IA personalizado de Academia Buildera. ¿En qué puedo ayudarte hoy?',
          timestamp: new Date().toISOString()
        }],
        session_type: 'learning',
        topics_covered: [],
        recommendations: []
      };
      
      setSession(newSession);
    } catch (error) {
      console.error('Error starting tutor session:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la sesión con el tutor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, moduleId?: string) => {
    if (!session) return;

    try {
      setIsTyping(true);
      
      // Add user message
      const userMessage: TutorMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };

      const updatedSession = {
        ...session,
        messages: [...session.messages, userMessage]
      };
      
      setSession(updatedSession);

      // Call AI tutor function
      const { data, error } = await supabase.functions.invoke('ai-learning-tutor', {
        body: {
          message: content,
          conversation_history: updatedSession.messages,
          module_id: moduleId,
          session_type: session.session_type
        }
      });

      if (error) throw error;

      // Add AI response
      const aiMessage: TutorMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, aiMessage],
        topics_covered: data.topics_covered || prev.topics_covered,
        recommendations: data.recommendations || prev.recommendations
      } : null);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      // Save session to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('ai_tutor_sessions')
        .insert({
          user_id: user.id,
          messages: session.messages as any,
          session_type: session.session_type,
          topics_covered: session.topics_covered,
          recommendations: session.recommendations,
          ended_at: new Date().toISOString()
        });

      if (error) throw error;

      setSession(null);
      
      toast({
        title: "Sesión guardada",
        description: "Tu sesión de aprendizaje ha sido guardada"
      });

    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la sesión",
        variant: "destructive"
      });
    }
  };

  return {
    session,
    loading,
    isTyping,
    startSession,
    sendMessage,
    endSession
  };
};