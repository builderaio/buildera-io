import { useState, useEffect } from "react";
import { 
  Sparkles, Target, Zap, BookOpen, Store, Brain, 
  ArrowRight, Trophy, Rocket, Clock, CheckCircle2, 
  AlertTriangle, Building2, Bot, Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlatformAgents } from "@/hooks/usePlatformAgents";
import { useCompanyCredits } from "@/hooks/useCompanyCredits";

interface MandoCentralProps {
  profile: any;
  onNavigate?: (view: string) => void;
}

interface AgentUsageStat {
  agentId: string;
  agentName: string;
  usageCount: number;
}

const MandoCentral = ({ profile, onNavigate }: MandoCentralProps) => {
  const { t } = useTranslation(['common', 'company']);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [agentUsageStats, setAgentUsageStats] = useState<AgentUsageStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { agents, enabledAgents } = usePlatformAgents(companyId || undefined);
  const { totalCredits, usedCredits, availableCredits, usageHistory } = useCompanyCredits(companyId || undefined, profile?.user_id);

  useEffect(() => {
    if (profile?.user_id) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [profile?.user_id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('created_by', profile.user_id)
        .maybeSingle();
      
      setCompanyId(company?.id || null);

      if (company?.id) {
        const { data: usageLogs } = await supabase
          .from('agent_usage_log')
          .select('agent_id, created_at, status, output_summary, credits_consumed')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false });

        const agentCounts: Record<string, number> = {};
        usageLogs?.forEach(log => {
          if (log.agent_id) {
            agentCounts[log.agent_id] = (agentCounts[log.agent_id] || 0) + 1;
          }
        });

        const agentIds = Object.keys(agentCounts);
        if (agentIds.length > 0) {
          const { data: agentData } = await supabase
            .from('platform_agents')
            .select('id, name')
            .in('id', agentIds);

          const stats: AgentUsageStat[] = agentIds.map(id => ({
            agentId: id,
            agentName: agentData?.find(a => a.id === id)?.name || 'Agente',
            usageCount: agentCounts[id]
          })).sort((a, b) => b.usageCount - a.usageCount);

          setAgentUsageStats(stats.slice(0, 5));
        }

        setRecentActivity(usageLogs?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      navigate(`/company-dashboard?view=${view}`);
    }
  };

  const creditUsagePercent = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 md:p-12 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Centro de Agentes IA
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            ¡Bienvenido, {profile?.full_name?.split(' ')[0] || "Usuario"}! 🚀
          </h1>
          <p className="text-lg text-white/90 max-w-3xl">
            Tu centro de comando para gestionar tus agentes IA
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">Agentes Activos</span>
              </div>
              <p className="text-2xl font-bold text-white">{enabledAgents.length}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/80">Créditos</span>
              </div>
              <p className="text-2xl font-bold text-white">{availableCredits} cr</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">Ejecuciones</span>
              </div>
              <p className="text-2xl font-bold text-white">{usageHistory.length}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">Disponibles</span>
              </div>
              <p className="text-2xl font-bold text-white">{agents.length - enabledAgents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credits Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Uso de Créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{availableCredits}</p>
              <p className="text-sm text-muted-foreground">créditos disponibles</p>
            </div>
            <Progress value={creditUsagePercent} className="h-2" />
            <Button variant="outline" className="w-full" onClick={() => handleNavigate('configuracion')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Obtener más créditos
            </Button>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Agentes Más Usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentUsageStats.length > 0 ? (
              <div className="space-y-3">
                {agentUsageStats.map((stat, index) => (
                  <div key={stat.agentId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{stat.agentName}</p>
                    </div>
                    <Badge variant="secondary">{stat.usageCount}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Aún no has ejecutado ningún agente</p>
                <Button className="mt-4" onClick={() => handleNavigate('marketplace')}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Explorar Agentes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    {activity.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.output_summary || activity.status}</p>
                      <p className="text-xs text-muted-foreground">{activity.credits_consumed} cr</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No hay actividad reciente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => handleNavigate('marketing-hub')}>
              <Sparkles className="w-6 h-6 text-purple-500" />
              <span className="text-sm">Crear Contenido</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => handleNavigate('adn-empresa')}>
              <Building2 className="w-6 h-6 text-blue-500" />
              <span className="text-sm">ADN Empresa</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => handleNavigate('inteligencia-competitiva')}>
              <Brain className="w-6 h-6 text-emerald-500" />
              <span className="text-sm">Inteligencia</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => handleNavigate('academia-buildera')}>
              <BookOpen className="w-6 h-6 text-amber-500" />
              <span className="text-sm">Academia</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      {agents.length > enabledAgents.length && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Descubre más agentes</h3>
                  <p className="text-sm text-muted-foreground">
                    {agents.length - enabledAgents.length} agentes disponibles
                  </p>
                </div>
              </div>
              <Button onClick={() => handleNavigate('marketplace')}>
                Explorar Marketplace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MandoCentral;
