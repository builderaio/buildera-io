import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Target, 
  MapPin, 
  Briefcase, 
  Heart, 
  DollarSign,
  Loader2,
  CheckCircle,
  TrendingUp,
  Brain
} from 'lucide-react';

interface TargetAudienceProps {
  campaignData: any;
  onComplete: (data: any) => void;
  onDataChange?: (data: any) => void;
  loading: boolean;
  companyData?: any;
}

export const TargetAudience = ({ campaignData, onComplete, onDataChange, loading, companyData }: TargetAudienceProps) => {
  const [existingAudiences, setExistingAudiences] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState(campaignData.audiences || []);
  const [loadingAudiences, setLoadingAudiences] = useState(true);
  const { toast } = useToast();

  // Set up auto-save function for when user navigates away
  useEffect(() => {
    const saveCurrentData = () => {
      if (selectedAudiences.length > 0 && onDataChange) {
        const buyerPersonas = selectedAudiences.map(audience => ({
          id: audience.id,
          nombre_ficticio: audience.name,
          descripcion: audience.description,
          demograficos: {
            edad: audience.age_ranges ? Object.keys(audience.age_ranges)[0] : '',
            ubicacion: audience.geographic_locations ? Object.keys(audience.geographic_locations)[0] : '',
            plataforma_preferida: audience.platform_preferences ? Object.keys(audience.platform_preferences)[0] : ''
          },
          intereses: audience.interests || [],
          comportamientos: audience.behaviors || []
        }));

        const audienceData = {
          selected_audiences: selectedAudiences,
          buyer_personas: buyerPersonas,
          audience_count: selectedAudiences.length
        };

        onDataChange(audienceData);
      }
    };

    // Set global save function
    (window as any).savePendingCampaignData = saveCurrentData;

    // Cleanup on unmount
    return () => {
      saveCurrentData();
      delete (window as any).savePendingCampaignData;
    };
  }, [selectedAudiences, onDataChange]);

  // Load existing audiences
  useEffect(() => {
    const loadAudiences = async () => {
      if (!companyData?.id) return;

      try {
        const { data, error } = await supabase
          .from('company_audiences')
          .select('*')
          .eq('company_id', companyData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setExistingAudiences(data || []);
      } catch (error) {
        console.error('Error loading audiences:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las audiencias",
          variant: "destructive"
        });
      } finally {
        setLoadingAudiences(false);
      }
    };

    loadAudiences();
  }, [companyData?.id]);

  const toggleAudienceSelection = (audience) => {
    setSelectedAudiences(prev => {
      const isSelected = prev.some(a => a.id === audience.id);
      if (isSelected) {
        return prev.filter(a => a.id !== audience.id);
      } else {
        return [...prev, audience];
      }
    });
  };

  const handleComplete = () => {
    if (selectedAudiences.length === 0) {
      toast({
        title: "Selecciona audiencias",
        description: "Debes seleccionar al menos una audiencia para la campaña",
        variant: "destructive"
      });
      return;
    }

    // Convert selected audiences to buyer_personas format for compatibility with strategy step
    const buyerPersonas = selectedAudiences.map(audience => ({
      id: audience.id,
      nombre_ficticio: audience.name,
      descripcion: audience.description,
      demograficos: {
        edad: audience.age_ranges ? Object.keys(audience.age_ranges)[0] : '',
        ubicacion: audience.geographic_locations ? Object.keys(audience.geographic_locations)[0] : '',
        plataforma_preferida: audience.platform_preferences ? Object.keys(audience.platform_preferences)[0] : ''
      },
      intereses: audience.interests || [],
      comportamientos: audience.behaviors || []
    }));

    const audienceData = {
      selected_audiences: selectedAudiences,
      buyer_personas: buyerPersonas,
      audience_count: selectedAudiences.length
    };

    onComplete(audienceData);
  };

  const canProceed = selectedAudiences.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-green-800">
            <Users className="h-6 w-6" />
            Selecciona las Audiencias para tu Campaña
          </CardTitle>
          <p className="text-green-600">
            Elige las audiencias creadas para tu empresa que participarán en esta campaña
          </p>
        </CardHeader>
      </Card>

      {/* Existing Audiences Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Audiencias Disponibles
          </CardTitle>
          <p className="text-muted-foreground">
            Selecciona las audiencias que quieres incluir en esta campaña
          </p>
        </CardHeader>
        <CardContent>
          {loadingAudiences ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Cargando audiencias...</span>
            </div>
          ) : existingAudiences.length > 0 ? (
            <div className="space-y-4">
              {existingAudiences.map((audience) => {
                const isSelected = selectedAudiences.some(a => a.id === audience.id);
                
                return (
                  <div
                    key={audience.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleAudienceSelection(audience)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{audience.name}</h3>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        
                        {audience.description && (
                          <p className="text-muted-foreground text-sm mb-3">{audience.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {audience.age_ranges && Object.keys(audience.age_ranges).length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Rango de Edad</h5>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(audience.age_ranges).map(([range, percentage]) => (
                                  <Badge key={range} variant="outline" className="text-xs">
                                    {range}: {percentage as string}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {audience.geographic_locations && Object.keys(audience.geographic_locations).length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Ubicaciones</h5>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(audience.geographic_locations).slice(0, 3).map(([location, percentage]) => (
                                  <Badge key={location} variant="secondary" className="text-xs">
                                    {location}: {percentage as string}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {audience.platform_preferences && Object.keys(audience.platform_preferences).length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Plataformas Preferidas</h5>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(audience.platform_preferences).slice(0, 3).map(([platform, percentage]) => (
                                  <Badge key={platform} variant="default" className="text-xs">
                                    {platform}: {percentage as string}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {selectedAudiences.length > 0 && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">
                    Audiencias Seleccionadas: {selectedAudiences.length}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAudiences.map(audience => (
                      <Badge key={audience.id} className="bg-primary/20 text-primary">
                        {audience.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No hay audiencias creadas para esta empresa</p>
              <p className="text-sm">Primero crea audiencias desde el Manager de Audiencias</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!canProceed || loading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8"
          size="lg"
        >
          {loading ? 'Guardando...' : 'Continuar con Estrategia de Marketing'}
        </Button>
      </div>
    </div>
  );
};