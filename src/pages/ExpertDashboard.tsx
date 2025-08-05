import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Star, 
  TrendingUp, 
  MessageSquare,
  Clock,
  Award,
  DollarSign,
  Target,
  Briefcase,
  CheckCircle
} from "lucide-react";

const ExpertDashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-lg font-semibold">
                {profile?.full_name?.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Bienvenido, {profile?.full_name || 'Experto'}
              </h1>
              <p className="text-muted-foreground">
                Experto en Transformación Digital | Miembro desde {new Date().getFullYear()}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
            🎯 Experto Verificado
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultas Activas</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">12</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">+3 esta semana</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">$2,450</div>
              <p className="text-xs text-green-600 dark:text-green-400">+15% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">4.9</div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Promedio de 47 reseñas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Disponibles</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">24</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Panel General</TabsTrigger>
            <TabsTrigger value="consultations">Consultas</TabsTrigger>
            <TabsTrigger value="calendar">Agenda</TabsTrigger>
            <TabsTrigger value="growth">Crecimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Consultas Pendientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Consultas Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { company: "TechCorp", topic: "Transformación Digital", urgent: true, time: "2h" },
                    { company: "StartupX", topic: "Automatización IA", urgent: false, time: "1d" },
                    { company: "InnovateNow", topic: "Estrategia Digital", urgent: false, time: "3d" }
                  ].map((consultation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{consultation.company}</h4>
                          {consultation.urgent && (
                            <Badge variant="destructive" className="text-xs">Urgente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{consultation.topic}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Hace {consultation.time}</p>
                        <Button size="sm" variant="outline">Responder</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Próximas Sesiones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Próximas Sesiones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { time: "14:00", company: "GlobalTech", type: "Estrategia IA", duration: "1h" },
                    { time: "16:30", company: "InnovateCorp", type: "Roadmap Digital", duration: "45m" },
                    { time: "Mañana 10:00", company: "FutureSoft", type: "Consulta Inicial", duration: "30m" }
                  ].map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.company}</h4>
                          <p className="text-sm text-muted-foreground">{session.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{session.time}</p>
                        <p className="text-sm text-muted-foreground">{session.duration}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Gestiona tu práctica como experto en Buildera
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-auto p-4 flex-col space-y-2">
                    <Briefcase className="h-6 w-6" />
                    <span>Nueva Consulta</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                    <Calendar className="h-6 w-6" />
                    <span>Configurar Disponibilidad</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                    <TrendingUp className="h-6 w-6" />
                    <span>Ver Análisis</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Consultas</CardTitle>
                <CardDescription>
                  Gestiona todas tus consultas y seguimientos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { client: "TechCorp", project: "Transformación Digital", status: "En progreso", lastUpdate: "Hace 2h" },
                    { client: "StartupX", project: "Automatización IA", status: "Completado", lastUpdate: "Hace 1d" },
                    { client: "InnovateNow", project: "Estrategia Digital", status: "Pendiente", lastUpdate: "Hace 3d" },
                    { client: "FutureSoft", project: "Roadmap Tecnológico", status: "En progreso", lastUpdate: "Hace 5d" }
                  ].map((consultation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{consultation.client.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{consultation.client}</h4>
                            <p className="text-sm text-muted-foreground">{consultation.project}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={
                          consultation.status === "Completado" ? "default" :
                          consultation.status === "En progreso" ? "secondary" : 
                          "outline"
                        }>
                          {consultation.status}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{consultation.lastUpdate}</p>
                          <Button size="sm" variant="outline">Ver Detalles</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Agenda</CardTitle>
                <CardDescription>
                  Configura tu disponibilidad y gestiona sesiones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Calendario Integrado</h3>
                  <p className="text-muted-foreground mb-6">
                    Sincroniza tu calendario y gestiona tu disponibilidad para consultas
                  </p>
                  <Button>Configurar Calendario</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Métricas de Crecimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Consultas Completadas</span>
                      <span className="font-medium">47/50</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Satisfacción del Cliente</span>
                      <span className="font-medium">4.9/5.0</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tasa de Retención</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Logros y Certificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "Experto Certificado en IA", achieved: true },
                    { title: "Consultor Senior", achieved: true },
                    { title: "Mentor del Año", achieved: false },
                    { title: "100 Consultas Exitosas", achieved: false }
                  ].map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${
                        achievement.achieved ? 'text-green-500' : 'text-muted-foreground'
                      }`} />
                      <span className={achievement.achieved ? 'text-foreground' : 'text-muted-foreground'}>
                        {achievement.title}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExpertDashboard;