import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Filter, Calendar, Clock, Star, Award } from "lucide-react";
import { useExperts } from "@/hooks/useExperts";
import { ExpertCard } from "./experts/ExpertCard";
import { BookSessionDialog } from "./experts/BookSessionDialog";

const Expertos = () => {
  const { experts, userSessions, loading, bookSession, cancelSession, rateSession } = useExperts();
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // If no experts are available, don't render the section
  if (!loading && experts.length === 0) {
    return null;
  }

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.bio.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || 
                           expert.specializations?.some(spec => spec.category === filterCategory);
    
    return matchesSearch && matchesCategory;
  });

  const handleBookSession = (expertId: string) => {
    setSelectedExpert(expertId);
    setShowBookDialog(true);
  };

  const handleCloseBookDialog = () => {
    setShowBookDialog(false);
    setSelectedExpert(null);
  };

  const selectedExpertData = experts.find(e => e.id === selectedExpert);

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Expertos Buildera</h1>
          <div className="animate-pulse bg-muted h-6 w-96 mx-auto rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Expertos Buildera</h1>
        <p className="text-lg text-muted-foreground">
          Conecta con expertos verificados en IA, automatización y estrategia empresarial
        </p>
      </div>

      <Tabs defaultValue="experts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="experts" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Expertos Disponibles
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Mis Sesiones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="experts" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, especialidad o experiencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="automation">Automatización</SelectItem>
                <SelectItem value="ai">Inteligencia Artificial</SelectItem>
                <SelectItem value="business">Estrategia Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{experts.length}</div>
                <div className="text-sm text-muted-foreground">Expertos Disponibles</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {experts.length > 0 ? (experts.reduce((avg, expert) => avg + expert.rating, 0) / experts.length).toFixed(1) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Calificación Promedio</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {experts.reduce((total, expert) => total + expert.total_sessions, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Sesiones Completadas</div>
              </CardContent>
            </Card>
          </div>

          {/* Experts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                onBookSession={handleBookSession}
              />
            ))}
          </div>

          {filteredExperts.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No se encontraron expertos</h3>
              <p className="text-muted-foreground">
                Intenta ajustar tus filtros de búsqueda
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-primary">Mis Sesiones</h2>
            <Badge variant="outline">{userSessions.length} sesiones</Badge>
          </div>

          {userSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No tienes sesiones agendadas</h3>
              <p className="text-muted-foreground mb-4">
                Agenda tu primera sesión con un experto
              </p>
              <Button onClick={() => setShowBookDialog(true)}>
                Explorar Expertos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{session.topic}</h3>
                          <Badge className={getSessionStatusColor(session.status)}>
                            {session.status === 'scheduled' && 'Programada'}
                            {session.status === 'confirmed' && 'Confirmada'}
                            {session.status === 'completed' && 'Completada'}
                            {session.status === 'cancelled' && 'Cancelada'}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{session.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatSessionDate(session.scheduled_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.duration_minutes} minutos
                          </div>
                        </div>

                        {session.expert && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Con:</span>
                            <span className="font-medium">{session.expert.full_name}</span>
                            <Badge variant="outline">{session.expert.specialization}</Badge>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-primary mb-2">
                          ${session.price_paid}
                        </div>
                        {session.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelSession(session.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                        {session.status === 'completed' && !session.client_rating && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Implement rating dialog
                              console.log('Rate session:', session.id);
                            }}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Calificar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BookSessionDialog
        expert={selectedExpertData || null}
        isOpen={showBookDialog}
        onClose={handleCloseBookDialog}
        onBook={bookSession}
      />
    </div>
  );
};

export default Expertos;