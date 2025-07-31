import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetrics {
  id: string;
  period_start: string;
  period_end: string;
  total_agents: number;
  active_agents: number;
  agent_missions_completed: number;
  agent_hours_saved: number;
  total_social_connections: number;
  total_posts: number;
  total_engagement: number;
  reach_growth_percent: number;
  total_files: number;
  knowledge_base_size_mb: number;
  estimated_cost_savings: number;
  roi_percentage: number;
  tasks_automated: number;
  efficiency_score: number;
  metadata: any;
  last_calculated_at: string;
}

interface DashboardAlert {
  id: string;
  alert_type: string;
  title: string;
  description: string;
  priority: string;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
  metadata?: any;
  updated_at?: string;
  user_id?: string;
}

export const useDashboardMetrics = (userId?: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    if (!userId) return;

    try {
      // Obtener métricas más recientes
      const { data: metricsData, error: metricsError } = await supabase
        .from('company_dashboard_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (metricsError && metricsError.code !== 'PGRST116') {
        throw metricsError;
      }

      setMetrics(metricsData);

      // Obtener alertas activas
      const { data: alertsData, error: alertsError } = await supabase
        .from('dashboard_alerts')
        .select('*')
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gte.now()')
        .order('created_at', { ascending: false });

      if (alertsError) {
        throw alertsError;
      }

      setAlerts(alertsData || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas del dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async () => {
    if (!userId || calculating) return;

    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-dashboard-metrics');

      if (error) {
        throw error;
      }

      await fetchMetrics(); // Recargar datos después del cálculo
      
      toast({
        title: "Métricas Actualizadas",
        description: "Se han recalculado las métricas de tu dashboard",
      });
    } catch (error: any) {
      console.error('Error calculating metrics:', error);
      toast({
        title: "Error",
        description: "No se pudieron calcular las métricas",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error: any) {
      console.error('Error dismissing alert:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [userId]);

  // Auto-calcular métricas si no existen o son muy antiguas (más de 24 horas)
  useEffect(() => {
    if (!loading && userId && (!metrics || isDataOld(metrics.last_calculated_at))) {
      calculateMetrics();
    }
  }, [loading, userId, metrics]);

  const isDataOld = (lastCalculated: string) => {
    const last = new Date(lastCalculated);
    const now = new Date();
    const hoursDiff = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24;
  };

  return {
    metrics,
    alerts,
    loading,
    calculating,
    calculateMetrics,
    markAlertAsRead,
    dismissAlert,
    refreshData: fetchMetrics
  };
};