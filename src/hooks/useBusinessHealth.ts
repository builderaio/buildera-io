import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessHealthKPI {
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface ObjectiveProgress {
  id: string;
  title: string;
  description: string;
  progress: number;
  trend: 'improving' | 'stable' | 'declining';
  targetDate: string | null;
  objectiveType: string;
}

export interface BusinessHealthData {
  kpis: {
    efficiency: BusinessHealthKPI;
    reach: BusinessHealthKPI;
    engagement: BusinessHealthKPI;
    conversions: BusinessHealthKPI;
  };
  objectives: ObjectiveProgress[];
  overallScore: number;
  lastUpdated: string | null;
}

const initialKPI: BusinessHealthKPI = {
  label: '',
  value: 0,
  previousValue: 0,
  unit: '',
  trend: 'stable',
  trendPercentage: 0,
};

const initialData: BusinessHealthData = {
  kpis: {
    efficiency: { ...initialKPI, label: 'Eficiencia Operativa', unit: '%' },
    reach: { ...initialKPI, label: 'Alcance Digital', unit: '' },
    engagement: { ...initialKPI, label: 'Engagement', unit: '%' },
    conversions: { ...initialKPI, label: 'Conversiones', unit: '' },
  },
  objectives: [],
  overallScore: 0,
  lastUpdated: null,
};

export const useBusinessHealth = (companyId?: string) => {
  const [data, setData] = useState<BusinessHealthData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'stable'; percentage: number } => {
    if (previous === 0) return { trend: 'stable', percentage: 0 };
    const diff = ((current - previous) / previous) * 100;
    if (Math.abs(diff) < 1) return { trend: 'stable', percentage: 0 };
    return {
      trend: diff > 0 ? 'up' : 'down',
      percentage: Math.abs(Math.round(diff)),
    };
  };

  const loadData = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get latest and previous snapshots
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [latestSnapshot, previousSnapshot, objectivesData, progressData] = await Promise.all([
        supabase
          .from('business_health_snapshots')
          .select('*')
          .eq('company_id', companyId)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('business_health_snapshots')
          .select('*')
          .eq('company_id', companyId)
          .lte('snapshot_date', thirtyDaysAgo)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('company_objectives')
          .select('*')
          .eq('company_id', companyId)
          .order('priority'),
        supabase
          .from('company_objective_progress')
          .select('*')
          .eq('company_id', companyId),
      ]);

      const latest = latestSnapshot.data;
      const previous = previousSnapshot.data;

      // Calculate KPIs
      const efficiencyTrend = calculateTrend(
        latest?.efficiency_score || 0,
        previous?.efficiency_score || 0
      );
      const reachTrend = calculateTrend(
        latest?.digital_reach || 0,
        previous?.digital_reach || 0
      );
      const engagementTrend = calculateTrend(
        latest?.engagement_rate || 0,
        previous?.engagement_rate || 0
      );
      const conversionsTrend = calculateTrend(
        latest?.estimated_conversions || 0,
        previous?.estimated_conversions || 0
      );

      // Map objectives with progress
      const progressMap = new Map(
        (progressData.data || []).map((p) => [p.objective_id, p])
      );

      const objectives: ObjectiveProgress[] = (objectivesData.data || []).map((obj) => {
        const progress = progressMap.get(obj.id);
        return {
          id: obj.id,
          title: obj.title || 'Sin título',
          description: obj.description || '',
          progress: progress?.progress_percentage || 0,
          trend: (progress?.trend as 'improving' | 'stable' | 'declining') || 'stable',
          targetDate: obj.target_date,
          objectiveType: obj.objective_type || 'short_term',
        };
      });

      // Calculate overall score (weighted average of KPIs)
      const overallScore = Math.round(
        (latest?.efficiency_score || 0) * 0.3 +
        Math.min((latest?.engagement_rate || 0) * 10, 100) * 0.3 +
        Math.min((latest?.digital_reach || 0) / 100, 100) * 0.2 +
        Math.min((latest?.estimated_conversions || 0), 100) * 0.2
      );

      setData({
        kpis: {
          efficiency: {
            label: 'Eficiencia Operativa',
            value: latest?.efficiency_score || 0,
            previousValue: previous?.efficiency_score || 0,
            unit: '%',
            trend: efficiencyTrend.trend,
            trendPercentage: efficiencyTrend.percentage,
          },
          reach: {
            label: 'Alcance Digital',
            value: latest?.digital_reach || 0,
            previousValue: previous?.digital_reach || 0,
            unit: '',
            trend: reachTrend.trend,
            trendPercentage: reachTrend.percentage,
          },
          engagement: {
            label: 'Engagement',
            value: latest?.engagement_rate || 0,
            previousValue: previous?.engagement_rate || 0,
            unit: '%',
            trend: engagementTrend.trend,
            trendPercentage: engagementTrend.percentage,
          },
          conversions: {
            label: 'Conversiones',
            value: latest?.estimated_conversions || 0,
            previousValue: previous?.estimated_conversions || 0,
            unit: '',
            trend: conversionsTrend.trend,
            trendPercentage: conversionsTrend.percentage,
          },
        },
        objectives,
        overallScore,
        lastUpdated: latest?.created_at || null,
      });
    } catch (err) {
      console.error('Error loading business health:', err);
      setError('Error al cargar datos de salud del negocio');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return useMemo(() => ({
    ...data,
    loading,
    error,
    refresh: loadData,
  }), [data, loading, error, loadData]);
};
