import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration_hours: number;
  estimated_duration_minutes: number;
  learning_objectives: string[];
  points_reward: number;
  prerequisites: string[];
  is_active: boolean;
  created_at: string;
}

export interface UserProgress {
  id: string;
  module_id: string;
  progress_percentage: number;
  current_lesson: number;
  total_lessons: number;
  time_spent_minutes: number;
  quiz_attempts: number;
  best_quiz_score: number;
  status: string;
  completed_at: string | null;
  module: LearningModule;
}

export interface UserGamification {
  level: number;
  total_points: number;
  experience_points: number;
  achievements_unlocked: string[];
  achievements: any;
  current_streak: number;
  longest_streak: number;
}

export interface LearningBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  level: number;
  badge_image_url: string;
  verification_code?: string;
  earned_at?: string;
}

export const useAcademyData = () => {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [gamification, setGamification] = useState<UserGamification | null>(null);
  const [badges, setBadges] = useState<LearningBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAcademyData();
  }, []);

  const loadAcademyData = async () => {
    try {
      setLoading(true);
      
      // Get user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load learning modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (modulesError) throw modulesError;
      
      const formattedModules = modulesData?.map(module => ({
        ...module,
        estimated_duration_hours: Math.round(module.estimated_duration_minutes / 60)
      })) || [];
      
      setModules(formattedModules);

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_learning_progress')
        .select(`
          *,
          module:learning_modules(*)
        `)
        .eq('user_id', user.id);

      if (progressError) throw progressError;
      
      const formattedProgress = progressData?.map(p => ({
        ...p,
        module: {
          ...p.module,
          estimated_duration_hours: Math.round(p.module.estimated_duration_minutes / 60)
        }
      })) || [];
      
      setUserProgress(formattedProgress);

      // Load user gamification
      const { data: gamificationData, error: gamificationError } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (gamificationError) throw gamificationError;
      
      const formattedGamification = gamificationData ? {
        level: gamificationData.level,
        total_points: gamificationData.total_points,
        experience_points: gamificationData.experience_points,
        achievements: gamificationData.achievements,
        achievements_unlocked: Array.isArray(gamificationData.achievements) ? gamificationData.achievements.map(String) : [],
        current_streak: 0,
        longest_streak: gamificationData.longest_streak || 0
      } : null;
      
      setGamification(formattedGamification);

      // Load user badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:learning_badges(*)
        `)
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;
      
      const formattedBadges = badgesData?.map(ub => ({
        ...ub.badge,
        verification_code: ub.verification_code,
        earned_at: ub.earned_at
      })) || [];
      
      setBadges(formattedBadges);

    } catch (error) {
      console.error('Error loading academy data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la academia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startModule = async (moduleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          progress_percentage: 0,
          current_lesson: 1,
          status: 'in_progress',
          last_interaction: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "¡Módulo iniciado!",
        description: "Has comenzado un nuevo módulo de aprendizaje"
      });

      loadAcademyData(); // Refresh data
    } catch (error) {
      console.error('Error starting module:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el módulo",
        variant: "destructive"
      });
    }
  };

  return {
    modules,
    userProgress,
    gamification,
    badges,
    loading,
    loadAcademyData,
    startModule
  };
};