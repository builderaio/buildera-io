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
  Code, 
  GitBranch, 
  Star, 
  TrendingUp, 
  Package,
  Zap,
  Terminal,
  Award,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  Github,
  Database,
  Bot
} from "lucide-react";

const DeveloperDashboard = () => {
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
                {profile?.full_name?.charAt(0) || 'D'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Hola, {profile?.full_name || 'Developer'}
              </h1>
              <p className="text-muted-foreground">
                Desarrollador IA | Construye el futuro con Buildera
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
            ⚡ Developer Pro
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <Code className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">8</div>
              <p className="text-xs text-green-600 dark:text-green-400">+2 esta semana</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">APIs Creadas</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">23</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">15 en producción</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">$3,200</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">+22% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commits</CardTitle>
              <GitBranch className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">147</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="apis">APIs & Agents</TabsTrigger>
            <TabsTrigger value="learning">Aprendizaje</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Proyectos Recientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    Proyectos Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "ChatBot Inteligente", status: "En desarrollo", progress: 75, tech: "Python, OpenAI" },
                    { name: "API de Análisis", status: "Testing", progress: 90, tech: "Node.js, TensorFlow" },
                    { name: "Dashboard BI", status: "Completado", progress: 100, tech: "React, D3.js" }
                  ].map((project, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge variant={project.status === "Completado" ? "default" : "secondary"}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{project.tech}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progreso</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Herramientas y APIs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Herramientas de Desarrollo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <Bot className="h-6 w-6 mx-auto text-primary mb-1" />
                      <p className="text-sm font-medium">AI SDK</p>
                      <p className="text-xs text-muted-foreground">Versión 2.1</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <Database className="h-6 w-6 mx-auto text-primary mb-1" />
                      <p className="text-sm font-medium">Vector DB</p>
                      <p className="text-xs text-muted-foreground">Conectado</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <Terminal className="h-6 w-6 mx-auto text-primary mb-1" />
                      <p className="text-sm font-medium">CLI Tools</p>
                      <p className="text-xs text-muted-foreground">Actualizado</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <Github className="h-6 w-6 mx-auto text-primary mb-1" />
                      <p className="text-sm font-medium">GitHub</p>
                      <p className="text-xs text-muted-foreground">Sincronizado</p>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    Explorar Herramientas
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Crea, desarrolla y despliega soluciones IA en Buildera
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button className="h-auto p-4 flex-col space-y-2">
                    <Code className="h-6 w-6" />
                    <span>Nuevo Proyecto</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex-col space-y-2"
                    onClick={() => window.location.href = '/marketplace/agents'}
                  >
                    <Bot className="h-6 w-6" />
                    <span>Marketplace de Agentes</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                    <Zap className="h-6 w-6" />
                    <span>Deplogar API</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                    <TrendingUp className="h-6 w-6" />
                    <span>Ver Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis Proyectos</CardTitle>
                <CardDescription>
                  Gestiona y monitorea todos tus proyectos de desarrollo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      name: "E-commerce AI Assistant", 
                      description: "Asistente IA para recomendaciones de productos",
                      status: "En desarrollo", 
                      lastCommit: "Hace 2h",
                      collaborators: 3,
                      tech: ["Python", "FastAPI", "OpenAI"]
                    },
                    { 
                      name: "Sentiment Analysis API", 
                      description: "API para análisis de sentimientos en tiempo real",
                      status: "En producción", 
                      lastCommit: "Hace 1d",
                      collaborators: 1,
                      tech: ["Node.js", "TensorFlow", "Docker"]
                    },
                    { 
                      name: "Document Processor", 
                      description: "Procesamiento automático de documentos con IA",
                      status: "Testing", 
                      lastCommit: "Hace 3h",
                      collaborators: 2,
                      tech: ["Python", "LangChain", "PostgreSQL"]
                    }
                  ].map((project, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{project.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {project.tech.map((tech, techIndex) => (
                              <Badge key={techIndex} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant={project.status === "En producción" ? "default" : "secondary"}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {project.collaborators}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {project.lastCommit}
                          </span>
                        </div>
                        <Button size="sm" variant="outline">Ver Proyecto</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    APIs en Producción
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Customer Service Bot", calls: "15.2K", uptime: "99.9%", status: "Activa" },
                    { name: "Image Recognition API", calls: "8.7K", uptime: "99.5%", status: "Activa" },
                    { name: "Text Analytics API", calls: "23.1K", uptime: "98.9%", status: "Mantenimiento" }
                  ].map((api, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{api.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {api.calls} llamadas • {api.uptime} uptime
                        </p>
                      </div>
                      <Badge variant={api.status === "Activa" ? "default" : "secondary"}>
                        {api.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Agents Desarrollados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Sales Assistant", deployments: 12, revenue: "$450" },
                    { name: "Data Analyzer", deployments: 8, revenue: "$320" },
                    { name: "Content Creator", deployments: 15, revenue: "$680" }
                  ].map((agent, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{agent.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {agent.deployments} despliegues • {agent.revenue} ingresos
                        </p>
                      </div>
                      <Button size="sm" variant="outline">Editar</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Marketplace de Desarrolladores</CardTitle>
                <CardDescription>
                  Monetiza tus creaciones vendiendo APIs y Agents a empresas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Publica tus Soluciones</h3>
                  <p className="text-muted-foreground mb-6">
                    Convierte tu código en ingresos pasivos vendiendo en el marketplace
                  </p>
                  <Button>Explorar Marketplace</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Progreso de Aprendizaje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Machine Learning Avanzado</span>
                      <span className="font-medium">80%</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>API Design Patterns</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Vector Databases</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Certificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "Buildera AI Developer", earned: true, date: "2024" },
                    { title: "API Security Expert", earned: true, date: "2024" },
                    { title: "ML Engineer Certified", earned: false, date: "En progreso" },
                    { title: "Cloud Architecture", earned: false, date: "Próximamente" }
                  ].map((cert, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${
                        cert.earned ? 'text-green-500' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <span className={cert.earned ? 'text-foreground' : 'text-muted-foreground'}>
                          {cert.title}
                        </span>
                        <p className="text-xs text-muted-foreground">{cert.date}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recursos de Aprendizaje</CardTitle>
                <CardDescription>
                  Mantente actualizado con las últimas tecnologías y mejores prácticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <Code className="h-8 w-8 mx-auto text-primary mb-2" />
                    <h4 className="font-medium mb-1">Tutoriales</h4>
                    <p className="text-sm text-muted-foreground">Guías paso a paso</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                    <h4 className="font-medium mb-1">Comunidad</h4>
                    <p className="text-sm text-muted-foreground">Foro de desarrolladores</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <Star className="h-8 w-8 mx-auto text-primary mb-2" />
                    <h4 className="font-medium mb-1">Workshops</h4>
                    <p className="text-sm text-muted-foreground">Eventos en vivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeveloperDashboard;