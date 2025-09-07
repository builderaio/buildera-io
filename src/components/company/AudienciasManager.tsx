import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Brain, Target, BarChart3, Zap, Edit, Trash2, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Audience {
  id: string;
  name: string;
  description: string;
  estimated_size: number;
  confidence_score: number;
  platform_preferences: any;
  age_ranges?: any;
  gender_split?: any;
  interests?: any;
  pain_points: string[];
  motivations: string[];
  created_at: string;
  is_active: boolean;
}

interface AudienciasManagerProps {
  profile: any;
}

const AudienciasManager: React.FC<AudienciasManagerProps> = ({ profile }) => {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [analyzingAudience, setAnalyzingAudience] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state for new audience
  const [newAudience, setNewAudience] = useState({
    name: '',
    description: '',
    age_ranges: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 },
    gender_split: { male: 0, female: 0, other: 0 },
    interests: [] as string[],
    pain_points: [] as string[],
    motivations: [] as string[],
    platforms: [] as string[]
  });

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'instagram', name: 'Instagram', icon: '📸' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'twitter', name: 'X (Twitter)', icon: '🐦' },
    { id: 'youtube', name: 'YouTube', icon: '📺' }
  ];

  useEffect(() => {
    loadAudiences();
  }, [profile]);

  const loadAudiences = async () => {
    try {
      setLoading(true);
      
      // Get user's primary company
      const { data: companyData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile?.user_id)
        .eq('is_primary', true)
        .single();

      if (!companyData) {
        console.log('No primary company found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('company_audiences')
        .select('*')
        .eq('company_id', companyData.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAudiences(data || []);
    } catch (error) {
      console.error('Error loading audiences:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las audiencias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAudience = async () => {
    try {
      setIsCreating(true);

      // Get user's primary company
      const { data: companyData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile?.user_id)
        .eq('is_primary', true)
        .single();

      if (!companyData) {
        throw new Error('No se encontró la empresa principal');
      }

      const audienceData = {
        company_id: companyData.company_id,
        user_id: profile?.user_id,
        name: newAudience.name,
        description: newAudience.description,
        age_ranges: newAudience.age_ranges,
        gender_split: newAudience.gender_split,
        interests: { list: newAudience.interests },
        pain_points: newAudience.pain_points,
        motivations: newAudience.motivations,
        platform_preferences: { platforms: newAudience.platforms },
        estimated_size: 0,
        confidence_score: 0.5
      };

      const { data, error } = await supabase
        .from('company_audiences')
        .insert([audienceData])
        .select()
        .single();

      if (error) throw error;

      setAudiences(prev => [data, ...prev]);
      setNewAudience({
        name: '',
        description: '',
        age_ranges: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 },
        gender_split: { male: 0, female: 0, other: 0 },
        interests: [],
        pain_points: [],
        motivations: [],
        platforms: []
      });

      toast({
        title: "Audiencia creada",
        description: "La audiencia se ha creado exitosamente",
      });

    } catch (error) {
      console.error('Error creating audience:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la audiencia",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const analyzeAudience = async (audience: Audience) => {
    try {
      setAnalyzingAudience(audience.id);

      const { data, error } = await supabase.functions.invoke('audience-intelligence-analysis', {
        body: {
          action: 'analyze_audience',
          audienceData: audience,
          platforms: audience.platform_preferences?.platforms || []
        }
      });

      if (error) throw error;

      // Update audience with AI insights
      const updateData = {
        ai_insights: data.analysis,
        last_analysis_date: new Date().toISOString(),
        confidence_score: data.analysis.confidence_score || 0.85
      };

      const { error: updateError } = await supabase
        .from('company_audiences')
        .update(updateData)
        .eq('id', audience.id);

      if (updateError) throw updateError;

      // Reload audiences to show updated data
      loadAudiences();

      toast({
        title: "Análisis completado",
        description: "Se ha analizado la audiencia con IA",
      });

    } catch (error) {
      console.error('Error analyzing audience:', error);
      toast({
        title: "Error en análisis",
        description: "No se pudo analizar la audiencia",
        variant: "destructive",
      });
    } finally {
      setAnalyzingAudience(null);
    }
  };

  const addInterest = (interest: string) => {
    if (interest.trim() && !newAudience.interests.includes(interest.trim())) {
      setNewAudience(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }));
    }
  };

  const addPainPoint = (point: string) => {
    if (point.trim() && !newAudience.pain_points.includes(point.trim())) {
      setNewAudience(prev => ({
        ...prev,
        pain_points: [...prev.pain_points, point.trim()]
      }));
    }
  };

  const addMotivation = (motivation: string) => {
    if (motivation.trim() && !newAudience.motivations.includes(motivation.trim())) {
      setNewAudience(prev => ({
        ...prev,
        motivations: [...prev.motivations, motivation.trim()]
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Gestión de Audiencias
          </h1>
          <p className="text-muted-foreground mt-2">
            Estructura y analiza tus audiencias para campañas más efectivas
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Audiencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Audiencia</DialogTitle>
              <DialogDescription>
                Define los parámetros de tu audiencia objetivo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Audiencia</Label>
                  <Input
                    id="name"
                    value={newAudience.name}
                    onChange={(e) => setNewAudience(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Profesionales Tech 25-35"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newAudience.description}
                    onChange={(e) => setNewAudience(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe las características principales de esta audiencia..."
                  />
                </div>
              </div>

              {/* Platforms */}
              <div>
                <Label>Plataformas Objetivo</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.id}
                        checked={newAudience.platforms.includes(platform.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewAudience(prev => ({
                              ...prev,
                              platforms: [...prev.platforms, platform.id]
                            }));
                          } else {
                            setNewAudience(prev => ({
                              ...prev,
                              platforms: prev.platforms.filter(p => p !== platform.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={platform.id} className="text-sm">
                        {platform.icon} {platform.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Ranges */}
              <div>
                <Label>Distribución de Edades (%)</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {Object.entries(newAudience.age_ranges).map(([range, value]) => (
                    <div key={range}>
                      <Label className="text-xs">{range}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => setNewAudience(prev => ({
                          ...prev,
                          age_ranges: { ...prev.age_ranges, [range]: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Add Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Intereses</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      placeholder="Agregar interés..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addInterest(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-1">
                      {newAudience.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Pain Points</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      placeholder="Agregar pain point..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addPainPoint(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-1">
                      {newAudience.pain_points.map((point, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Motivaciones</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      placeholder="Agregar motivación..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addMotivation(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-1">
                      {newAudience.motivations.map((motivation, index) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {motivation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={createAudience} 
                disabled={!newAudience.name || isCreating}
                className="w-full"
              >
                {isCreating ? 'Creando...' : 'Crear Audiencia'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Audiences Grid */}
      {audiences.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay audiencias definidas</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera audiencia para comenzar a estructurar tus campañas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {audiences.map((audience) => (
            <Card key={audience.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{audience.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {audience.description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confianza IA:</span>
                    <Badge variant={audience.confidence_score > 0.7 ? "default" : "secondary"}>
                      {Math.round(audience.confidence_score * 100)}%
                    </Badge>
                  </div>

                  {/* Platform badges */}
                  {audience.platform_preferences?.platforms && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">Plataformas:</span>
                      <div className="flex flex-wrap gap-1">
                        {audience.platform_preferences.platforms.map((platformId: string) => {
                          const platform = platforms.find(p => p.id === platformId);
                          return platform ? (
                            <Badge key={platformId} variant="outline" className="text-xs">
                              {platform.icon} {platform.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pain points preview */}
                  {audience.pain_points && audience.pain_points.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">Pain Points:</span>
                      <div className="flex flex-wrap gap-1">
                        {audience.pain_points.slice(0, 2).map((point, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {point}
                          </Badge>
                        ))}
                        {audience.pain_points.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{audience.pain_points.length - 2} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => analyzeAudience(audience)}
                      disabled={analyzingAudience === audience.id}
                      className="flex-1"
                    >
                      {analyzingAudience === audience.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Analizar IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudienciasManager;