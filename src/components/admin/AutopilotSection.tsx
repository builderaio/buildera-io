import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, BookOpen, Building2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AutopilotStats {
  activeCompanies: number;
  decisionsLast24h: number;
  totalLessons: number;
  activeDepartments: number;
  recentDecisions: Array<{
    id: string;
    decision_type: string;
    priority: string;
    action_taken: boolean;
    created_at: string;
  }>;
  lastExecution: string | null;
}

const AutopilotSection = () => {
  const [stats, setStats] = useState<AutopilotStats>({
    activeCompanies: 0,
    decisionsLast24h: 0,
    totalLessons: 0,
    activeDepartments: 0,
    recentDecisions: [],
    lastExecution: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutopilotStats();
  }, []);

  const loadAutopilotStats = async () => {
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [deptResult, decisionsCountResult, lessonsResult, recentDecisionsResult, lastExecResult] = await Promise.all([
        supabase.from('company_department_config' as any).select('company_id', { count: 'exact', head: true }).eq('autopilot_enabled', true),
        supabase.from('autopilot_decisions').select('id', { count: 'exact', head: true }).gte('created_at', last24h),
        supabase.from('autopilot_memory').select('id', { count: 'exact', head: true }),
        supabase.from('autopilot_decisions').select('id, decision_type, priority, action_taken, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('autopilot_execution_log').select('created_at').order('created_at', { ascending: false }).limit(1),
      ]);

      const { count: activeDepts } = await supabase.from('company_department_config' as any).select('id', { count: 'exact', head: true }).eq('is_active', true);

      setStats({
        activeCompanies: deptResult.count || 0,
        decisionsLast24h: decisionsCountResult.count || 0,
        totalLessons: lessonsResult.count || 0,
        activeDepartments: activeDepts || 0,
        recentDecisions: recentDecisionsResult.data || [],
        lastExecution: lastExecResult.data?.[0]?.created_at || null,
      });
    } catch (error) {
      console.error('Error loading autopilot stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Enterprise Autopilot</h3>
        {stats.lastExecution && (
          <Badge variant="outline" className="ml-auto text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Último ciclo: {new Date(stats.lastExecution).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Empresas Activas</p>
                <p className="text-xl font-bold">{stats.activeCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Decisiones 24h</p>
                <p className="text-xl font-bold">{stats.decisionsLast24h}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <BookOpen className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lecciones</p>
                <p className="text-xl font-bold">{stats.totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Brain className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dptos. Activos</p>
                <p className="text-xl font-bold">{stats.activeDepartments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.recentDecisions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Últimas Decisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentDecisions.map(decision => (
                <div key={decision.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={decision.priority === 'high' ? 'destructive' : decision.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                      {decision.priority}
                    </Badge>
                    <span className="font-medium">{decision.decision_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={decision.action_taken ? 'default' : 'outline'} className="text-xs">
                      {decision.action_taken ? 'Ejecutada' : 'Pendiente'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(decision.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutopilotSection;
