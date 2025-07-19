import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Target, 
  Plus,
  Save,
  Edit,
  X,
  Search,
  FileText,
  Calendar,
  Flag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Declare global google types
declare global {
  interface Window {
    google: any;
  }
}

interface CompanyProfile {
  id: string;
  user_id: string;
  company_name?: string;
  nit?: string;
  business_objectives?: string;
  headquarters_address?: string;
  headquarters_lat?: number;
  headquarters_lng?: number;
  headquarters_city?: string;
  headquarters_country?: string;
  industry?: string;
  website_url?: string;
  company_size?: string;
}

interface CompanyObjective {
  id: string;
  objective_type: 'short_term' | 'medium_term' | 'long_term';
  title: string;
  description?: string;
  target_date?: string;
  priority: number;
  status: 'active' | 'completed' | 'paused';
}

interface CompanyProfileFormProps {
  profile: CompanyProfile;
  onProfileUpdate: (updatedProfile: CompanyProfile) => void;
}

const CompanyProfileForm = ({ profile, onProfileUpdate }: CompanyProfileFormProps) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>(profile);
  const [objectives, setObjectives] = useState<CompanyObjective[]>([]);
  const [newObjective, setNewObjective] = useState({
    title: '',
    description: '',
    objective_type: 'short_term' as const,
    target_date: '',
    priority: 1
  });
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      try {
        // Try to get API key from Supabase Edge Function
        const response = await supabase.functions.invoke('get-google-maps-key');
        
        let apiKey = '';
        
        if (response.error || !response.data?.apiKey) {
          // If edge function fails, show a message but don't prevent the form from working
          console.warn('Google Maps API key not available:', response.error);
          toast({
            title: "Google Maps no disponible",
            description: "Puedes usar el formulario de ubicación manualmente",
          });
          return;
        } else {
          apiKey = response.data.apiKey;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setMapLoaded(true);
        };
        
        script.onerror = () => {
          toast({
            title: "Error cargando Google Maps",
            description: "Puedes introducir la dirección manualmente",
            variant: "destructive",
          });
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        toast({
          title: "Google Maps no disponible",
          description: "Puedes introducir la dirección manualmente",
        });
      }
    };

    loadGoogleMaps();
  }, [toast]);

  // Initialize map when loaded
  useEffect(() => {
    if (mapLoaded && mapRef.current && editing) {
      initializeMap();
    }
  }, [mapLoaded, editing]);

  useEffect(() => {
    loadObjectives();
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultLat = formData.headquarters_lat || 4.7110; // Bogotá default
    const defaultLng = formData.headquarters_lng || -74.0721;

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: formData.headquarters_lat ? 15 : 6,
      mapTypeControl: false,
      streetViewControl: false,
    });

    mapInstanceRef.current = map;

    // Add marker if coordinates exist
    if (formData.headquarters_lat && formData.headquarters_lng) {
      addMarker(defaultLat, defaultLng);
    }

    // Add click listener to place marker
    map.addListener('click', (event: any) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        addMarker(lat, lng);
        updateLocationData(lat, lng);
      }
    });
  };

  const addMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new marker
    markerRef.current = new (window as any).google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      title: 'Oficinas Centrales',
      icon: {
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#DC2626">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        scaledSize: new (window as any).google.maps.Size(30, 30),
      }
    });
  };

  const updateLocationData = async (lat: number, lng: number) => {
    const geocoder = new (window as any).google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      
      if (response.results[0]) {
        const result = response.results[0];
        const addressComponents = result.address_components;
        
        let city = '';
        let country = '';
        
        for (const component of addressComponents) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        }

        setFormData({
          ...formData,
          headquarters_lat: lat,
          headquarters_lng: lng,
          headquarters_address: result.formatted_address,
          headquarters_city: city,
          headquarters_country: country
        });
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const searchLocation = async () => {
    if (!searchAddress || !window.google) return;

    const geocoder = new (window as any).google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ address: searchAddress });
      
      if (response.results[0]) {
        const result = response.results[0];
        const location = result.geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        // Center map on location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(15);
        }

        addMarker(lat, lng);
        updateLocationData(lat, lng);
        setSearchAddress('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo encontrar la dirección",
        variant: "destructive",
      });
    }
  };

  const loadObjectives = async () => {
    try {
      const { data: objectivesData, error } = await supabase
        .from('company_objectives')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObjectives((objectivesData || []) as CompanyObjective[]);
    } catch (error) {
      console.error('Error loading objectives:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', profile.user_id);

      if (error) throw error;

      onProfileUpdate({ ...profile, ...formData });
      setEditing(false);

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveObjective = async () => {
    try {
      const { error } = await supabase
        .from('company_objectives')
        .insert([{
          ...newObjective,
          user_id: profile.user_id,
          target_date: newObjective.target_date || null
        }]);

      if (error) throw error;

      setNewObjective({
        title: '',
        description: '',
        objective_type: 'short_term',
        target_date: '',
        priority: 1
      });
      setShowObjectiveForm(false);
      loadObjectives();

      toast({
        title: "Objetivo añadido",
        description: "El objetivo empresarial se ha guardado correctamente",
      });
    } catch (error) {
      console.error('Error saving objective:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el objetivo",
        variant: "destructive",
      });
    }
  };

  const getObjectiveTypeLabel = (type: string) => {
    const labels = {
      short_term: 'Corto Plazo',
      medium_term: 'Mediano Plazo',
      long_term: 'Largo Plazo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getObjectiveTypeColor = (type: string) => {
    const colors = {
      short_term: 'bg-green-100 text-green-800',
      medium_term: 'bg-yellow-100 text-yellow-800',
      long_term: 'bg-blue-100 text-blue-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Información Específica de la Empresa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Información Específica
            </CardTitle>
            {editing ? (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setEditing(false);
                    setFormData(profile);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                onClick={() => setEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nit">NIT / Identificación Tributaria</Label>
              {editing ? (
                <Input
                  id="nit"
                  value={formData.nit || ''}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  placeholder="Ej: 900.123.456-7"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <FileText className="w-3 h-3 mr-1" />
                  {profile.nit || 'No especificado'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="business_objectives">Objetivos Empresariales</Label>
              {editing ? (
                <Textarea
                  id="business_objectives"
                  value={formData.business_objectives || ''}
                  onChange={(e) => setFormData({ ...formData, business_objectives: e.target.value })}
                  placeholder="Describe los principales objetivos de tu empresa..."
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">
                  {profile.business_objectives || 'No especificado'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ubicación de Oficinas Centrales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Oficinas Centrales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing && (
            <div className="space-y-4">
              {/* Formulario manual de dirección */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="headquarters_address">Dirección</Label>
                  <Input
                    id="headquarters_address"
                    value={formData.headquarters_address || ''}
                    onChange={(e) => setFormData({ ...formData, headquarters_address: e.target.value })}
                    placeholder="Calle 123 #45-67"
                  />
                </div>
                
                <div>
                  <Label htmlFor="headquarters_city">Ciudad</Label>
                  <Input
                    id="headquarters_city"
                    value={formData.headquarters_city || ''}
                    onChange={(e) => setFormData({ ...formData, headquarters_city: e.target.value })}
                    placeholder="Bogotá"
                  />
                </div>
                
                <div>
                  <Label htmlFor="headquarters_country">País</Label>
                  <Input
                    id="headquarters_country"
                    value={formData.headquarters_country || ''}
                    onChange={(e) => setFormData({ ...formData, headquarters_country: e.target.value })}
                    placeholder="Colombia"
                  />
                </div>
              </div>

              {/* Google Maps solo si está disponible */}
              {mapLoaded && (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar dirección..."
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchLocation();
                        }
                      }}
                    />
                    <Button onClick={searchLocation} variant="outline">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div 
                    ref={mapRef} 
                    className="w-full h-64 border rounded-lg"
                    style={{ minHeight: '300px' }}
                  />
                  
                  <p className="text-xs text-gray-500">
                    Haz clic en el mapa para marcar la ubicación de tus oficinas centrales
                  </p>
                </>
              )}
            </div>
          )}

          {!editing && (profile.headquarters_address || formData.headquarters_address) && (
            <div className="space-y-2">
              <div>
                <Label>Dirección</Label>
                <p className="text-sm text-gray-900">{formData.headquarters_address || profile.headquarters_address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {(profile.headquarters_city || formData.headquarters_city) && (
                  <div>
                    <Label>Ciudad</Label>
                    <p className="text-sm text-gray-900">{formData.headquarters_city || profile.headquarters_city}</p>
                  </div>
                )}
                
                {(profile.headquarters_country || formData.headquarters_country) && (
                  <div>
                    <Label>País</Label>
                    <p className="text-sm text-gray-900">{formData.headquarters_country || profile.headquarters_country}</p>
                  </div>
                )}
              </div>

              {/* Mapa de solo lectura */}
              {(profile.headquarters_lat && profile.headquarters_lng) && (
                <div className="mt-4">
                  <Label>Ubicación en el Mapa</Label>
                  <div className="w-full h-48 border rounded-lg bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500 text-center">
                      📍 Oficinas ubicadas en:<br/>
                      Lat: {profile.headquarters_lat.toFixed(6)}<br/>
                      Lng: {profile.headquarters_lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!editing && !(profile.headquarters_address || formData.headquarters_address) && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay información de oficinas centrales</p>
              <p className="text-sm text-gray-400">Haz clic en "Editar" para agregar la ubicación</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objetivos Empresariales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Objetivos Empresariales
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => setShowObjectiveForm(!showObjectiveForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Objetivo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showObjectiveForm && (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="objective_title">Título del Objetivo</Label>
                    <Input
                      id="objective_title"
                      value={newObjective.title}
                      onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                      placeholder="Ej: Aumentar ventas un 20%"
                    />
                  </div>

                  <div>
                    <Label htmlFor="objective_type">Plazo</Label>
                    <select
                      id="objective_type"
                      value={newObjective.objective_type}
                      onChange={(e) => setNewObjective({ ...newObjective, objective_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="short_term">Corto Plazo (0-1 año)</option>
                      <option value="medium_term">Mediano Plazo (1-3 años)</option>
                      <option value="long_term">Largo Plazo (3+ años)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="target_date">Fecha Objetivo</Label>
                    <Input
                      id="target_date"
                      type="date"
                      value={newObjective.target_date}
                      onChange={(e) => setNewObjective({ ...newObjective, target_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridad (1-5)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="5"
                      value={newObjective.priority}
                      onChange={(e) => setNewObjective({ ...newObjective, priority: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="objective_description">Descripción</Label>
                  <Textarea
                    id="objective_description"
                    value={newObjective.description}
                    onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                    placeholder="Describe el objetivo y cómo planeas alcanzarlo..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveObjective} disabled={!newObjective.title}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Objetivo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowObjectiveForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {objectives.map((objective) => (
              <div key={objective.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{objective.title}</h4>
                      <Badge className={getObjectiveTypeColor(objective.objective_type)}>
                        {getObjectiveTypeLabel(objective.objective_type)}
                      </Badge>
                      <Badge variant="outline">
                        <Flag className="w-3 h-3 mr-1" />
                        Prioridad {objective.priority}
                      </Badge>
                    </div>
                    
                    {objective.description && (
                      <p className="text-sm text-gray-600 mb-2">{objective.description}</p>
                    )}
                    
                    {objective.target_date && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Fecha objetivo: {new Date(objective.target_date).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {objectives.length === 0 && !showObjectiveForm && (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay objetivos empresariales definidos</p>
                <p className="text-sm text-gray-400">Añade objetivos para seguir el progreso de tu empresa</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyProfileForm;