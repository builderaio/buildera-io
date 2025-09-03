import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Target, 
  Palette, 
  Globe, 
  CheckCircle, 
  TrendingUp, 
  Edit, 
  RefreshCw,
  ArrowRight,
  Eye,
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  Save,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Music
} from "lucide-react";

interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const ADNEmpresa = ({ profile }: ADNEmpresaProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [brandingData, setBrandingData] = useState<any>(null);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);
  const [socialMediaData, setSocialMediaData] = useState<any>({
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    youtube_url: '',
    tiktok_url: ''
  });

  useEffect(() => {
    console.log('🔍 ADNEmpresa useEffect triggered with profile:', profile);
    if (profile?.user_id) {
      console.log('✅ profile.user_id found:', profile.user_id);
      loadOnboardingData();
    } else {
      console.log('❌ No user_id in profile:', profile);
    }
  }, [profile?.user_id]);

  const loadOnboardingData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting loadOnboardingData with profile:', profile);
      
      // Buscar TODAS las empresas del usuario para encontrar datos de onboarding
      console.log('📋 Querying all companies for user_id:', profile.user_id);
      const { data: memberships, error: membershipError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile.user_id);

      console.log('📋 company_members query result:', { memberships, membershipError });

      if (membershipError) {
        console.error('❌ Error querying company_members:', membershipError);
        toast({
          title: "Error",
          description: `Error consultando membresías: ${membershipError.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!memberships || memberships.length === 0) {
        console.log('❌ No se encontraron empresas para el usuario');
        toast({
          title: "Error",
          description: "No se encontró información de empresa",
          variant: "destructive"
        });
        return;
      }

      const companyIds = memberships.map(m => m.company_id);
      console.log('🏢 Found company_ids:', companyIds);

      // Buscar datos en todas las empresas del usuario
      const [companyResult, strategyResult, brandingResult, objectivesResult] = await Promise.all([
        // Información básica de empresas
        supabase
          .from('companies')
          .select('*')
          .in('id', companyIds),
        
        // Estrategia empresarial
        supabase
          .from('company_strategy')
          .select('*')
          .in('company_id', companyIds),
        
        // Branding
        supabase
          .from('company_branding')
          .select('*')
          .in('company_id', companyIds),
        
        // Objetivos
        supabase
          .from('company_objectives')
          .select('*')
          .in('company_id', companyIds)
          .order('priority', { ascending: true })
      ]);

      console.log('📊 Query results:', {
        companies: companyResult.data?.length || 0,
        strategies: strategyResult.data?.length || 0,
        branding: brandingResult.data?.length || 0,
        objectives: objectivesResult.data?.length || 0
      });

      // Establecer datos - tomar los primeros resultados encontrados
      if (companyResult.data && companyResult.data.length > 0) {
        const company = companyResult.data[0];
        setCompanyData(company); // Tomar la primera empresa
        setLastUpdated(new Date(company.updated_at).toLocaleDateString());
        
        // Cargar datos de redes sociales
        setSocialMediaData({
          facebook_url: company.facebook_url || '',
          twitter_url: company.twitter_url || '',
          instagram_url: company.instagram_url || '',
          linkedin_url: company.linkedin_url || '',
          youtube_url: company.youtube_url || '',
          tiktok_url: company.tiktok_url || ''
        });
      }
      
      if (strategyResult.data && strategyResult.data.length > 0) {
        setStrategyData(strategyResult.data[0]); // Tomar la primera estrategia encontrada
      }
      
      if (brandingResult.data && brandingResult.data.length > 0) {
        setBrandingData(brandingResult.data[0]); // Tomar el primer branding encontrado
      }
      
      if (objectivesResult.data && objectivesResult.data.length > 0) {
        setObjectives(objectivesResult.data); // Todos los objetivos
      }

    } catch (error) {
      console.error('Error loading onboarding data:', error);
      toast({
        title: "Error",
        description: "Error al cargar la información empresarial",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (field: string, value: string, table: string = 'companies', recordId?: string) => {
    try {
      const updateData = { [field]: value };
      
      if (table === 'companies' && companyData?.id) {
        const { error } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', companyData.id);
          
        if (error) throw error;
        
        setCompanyData(prev => ({ ...prev, [field]: value }));
        
        // Actualizar datos de redes sociales si es necesario
        if (field.includes('_url')) {
          setSocialMediaData(prev => ({ ...prev, [field]: value }));
        }
      }
      
      toast({
        title: "Campo actualizado",
        description: "Los cambios se han guardado correctamente",
      });
      
      setEditing(null);
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el campo",
        variant: "destructive"
      });
    }
  };

  const EditableField = ({ 
    field, 
    value, 
    onSave, 
    type = "text", 
    placeholder = "" 
  }: { 
    field: string; 
    value: string; 
    onSave: (value: string) => void; 
    type?: string;
    placeholder?: string;
  }) => {
    const [tempValue, setTempValue] = useState(value || '');
    const isEditing = editing === field;
    
    useEffect(() => {
      setTempValue(value || '');
    }, [value]);
    
    if (isEditing) {
      return (
        <div className="flex gap-2 items-center">
          {type === "textarea" ? (
            <Textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className="min-h-[60px]"
            />
          ) : (
            <Input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
            />
          )}
          <Button
            size="sm"
            onClick={() => {
              onSave(tempValue);
              setEditing(null);
            }}
          >
            <Save className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTempValue(value || '');
              setEditing(null);
            }}
          >
            ✕
          </Button>
        </div>
      );
    }
    
    return (
      <div 
        className="group flex items-center gap-2 cursor-pointer hover:bg-muted/20 p-1 rounded transition-colors"
        onClick={() => setEditing(field)}
      >
        <span className={`flex-1 ${!value ? 'text-muted-foreground italic' : ''}`}>
          {value || placeholder}
        </span>
        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando información empresarial...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">ADN Empresarial</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Información de tu empresa. Haz clic en cualquier campo para editarlo.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Campos editables - Clic para modificar</span>
          </div>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Última actualización: {lastUpdated}
            </p>
          )}
        </div>

        {/* Información Básica de la Empresa */}
        {companyData && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                Información Empresarial
                <Badge variant="secondary" className="ml-auto">Completado</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    Nombre de la Empresa
                  </div>
                  <EditableField
                    field="name"
                    value={companyData.name}
                    onSave={(value) => saveField('name', value)}
                    placeholder="Nombre de tu empresa"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="w-4 h-4" />
                    Sector Industrial
                  </div>
                  <EditableField
                    field="industry_sector"
                    value={companyData.industry_sector}
                    onSave={(value) => saveField('industry_sector', value)}
                    placeholder="Ej. Tecnología, Salud, Educación..."
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Tamaño de Empresa
                  </div>
                  <EditableField
                    field="company_size"
                    value={companyData.company_size}
                    onSave={(value) => saveField('company_size', value)}
                    placeholder="Ej. 1-10 empleados, 11-50, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    País
                  </div>
                  <EditableField
                    field="country"
                    value={companyData.country}
                    onSave={(value) => saveField('country', value)}
                    placeholder="País donde opera tu empresa"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    Sitio Web
                  </div>
                  <EditableField
                    field="website_url"
                    value={companyData.website_url}
                    onSave={(value) => saveField('website_url', value)}
                    type="url"
                    placeholder="https://tu-empresa.com"
                  />
                </div>
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  Descripción del Negocio
                </div>
                <EditableField
                  field="description"
                  value={companyData.description}
                  onSave={(value) => saveField('description', value)}
                  type="textarea"
                  placeholder="Describe tu empresa, qué hace y a quién sirve..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estrategia Empresarial */}
        {strategyData && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                Estrategia Empresarial
                <Badge variant="secondary" className="ml-auto">Completado</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {strategyData.mision && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">Misión</h3>
                  <p className="text-base leading-relaxed bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    {strategyData.mision}
                  </p>
                </div>
              )}
              
              {strategyData.vision && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">Visión</h3>
                  <p className="text-base leading-relaxed bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    {strategyData.vision}
                  </p>
                </div>
              )}
              
              {strategyData.propuesta_valor && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">Propuesta de Valor</h3>
                  <p className="text-base leading-relaxed bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    {strategyData.propuesta_valor}
                  </p>
                </div>
              )}
              
              {strategyData.publico_objetivo && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">Público Objetivo</h3>
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {JSON.stringify(strategyData.publico_objetivo, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Objetivos de Crecimiento */}
        {objectives.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                Objetivos de Crecimiento
                <Badge variant="secondary" className="ml-auto">{objectives.length} objetivos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objectives.map((objective, index) => (
                  <div key={index} className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        {objective.title}
                      </h3>
                      <div className="flex gap-2">
                        <Badge 
                          variant={objective.priority === 1 ? "default" : "outline"}
                          className="text-xs"
                        >
                          Prioridad {objective.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {objective.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="secondary">
                        {objective.objective_type === 'short_term' ? 'Corto plazo' : 
                         objective.objective_type === 'medium_term' ? 'Mediano plazo' : 'Largo plazo'}
                      </Badge>
                      
                      {objective.target_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(objective.target_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Identidad de Marca */}
        {brandingData && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Palette className="w-6 h-6 text-orange-600" />
                </div>
                Identidad de Marca
                <Badge variant="secondary" className="ml-auto">Completado</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(brandingData.primary_color || brandingData.secondary_color) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">Paleta de Colores</h3>
                  <div className="flex flex-wrap gap-4">
                    {brandingData.primary_color && (
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-md" 
                          style={{ backgroundColor: brandingData.primary_color }}
                        />
                        <div>
                          <p className="font-medium">Color Principal</p>
                          <p className="text-sm text-muted-foreground">{brandingData.primary_color}</p>
                        </div>
                      </div>
                    )}
                    
                    {brandingData.secondary_color && (
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-md" 
                          style={{ backgroundColor: brandingData.secondary_color }}
                        />
                        <div>
                          <p className="font-medium">Color Secundario</p>
                          <p className="text-sm text-muted-foreground">{brandingData.secondary_color}</p>
                        </div>
                      </div>
                    )}
                    
                    {brandingData.complementary_color_1 && (
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-md" 
                          style={{ backgroundColor: brandingData.complementary_color_1 }}
                        />
                        <div>
                          <p className="font-medium">Complementario 1</p>
                          <p className="text-sm text-muted-foreground">{brandingData.complementary_color_1}</p>
                        </div>
                      </div>
                    )}
                    
                    {brandingData.complementary_color_2 && (
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-md" 
                          style={{ backgroundColor: brandingData.complementary_color_2 }}
                        />
                        <div>
                          <p className="font-medium">Complementario 2</p>
                          <p className="text-sm text-muted-foreground">{brandingData.complementary_color_2}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {brandingData.visual_identity && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">Identidad Visual</h3>
                  <p className="text-base leading-relaxed bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
                    {brandingData.visual_identity}
                  </p>
                </div>
              )}
              
              {brandingData.brand_voice && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Voz de Marca
                  </h3>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 p-6 rounded-xl border border-orange-200 dark:border-orange-800/30">
                    {(() => {
                      try {
                        const brandVoice = typeof brandingData.brand_voice === 'string' 
                          ? JSON.parse(brandingData.brand_voice) 
                          : brandingData.brand_voice;
                        
                        return (
                          <div className="space-y-6">
                            {/* Descripción */}
                            {brandVoice.descripcion && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-orange-900 dark:text-orange-100 text-sm uppercase tracking-wide">
                                  Descripción
                                </h4>
                                <p className="text-base leading-relaxed text-foreground bg-background/60 p-4 rounded-lg border border-orange-200/50 dark:border-orange-700/30">
                                  {brandVoice.descripcion}
                                </p>
                              </div>
                            )}
                            
                            {/* Personalidad */}
                            {brandVoice.personalidad && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-orange-900 dark:text-orange-100 text-sm uppercase tracking-wide">
                                  Personalidad
                                </h4>
                                <div className="inline-flex items-center px-4 py-2 bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 rounded-full font-medium">
                                  {brandVoice.personalidad}
                                </div>
                              </div>
                            )}
                            
                            {/* Palabras Clave */}
                            {brandVoice.palabras_clave && Array.isArray(brandVoice.palabras_clave) && brandVoice.palabras_clave.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-medium text-orange-900 dark:text-orange-100 text-sm uppercase tracking-wide">
                                  Palabras Clave
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {brandVoice.palabras_clave.map((palabra, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="outline" 
                                      className="bg-white/80 dark:bg-background/80 border-orange-300 dark:border-orange-600 text-orange-800 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200"
                                    >
                                      #{palabra}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } catch (error) {
                        console.error('Error parsing brand voice:', error);
                        return (
                          <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                            <p className="font-medium mb-2">Error al mostrar la voz de marca</p>
                            <pre className="whitespace-pre-wrap text-xs">
                              {typeof brandingData.brand_voice === 'string' ? brandingData.brand_voice : JSON.stringify(brandingData.brand_voice, null, 2)}
                            </pre>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Redes Sociales */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              Redes Sociales
              <Badge variant="secondary" className="ml-auto">Editable</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </div>
                <EditableField
                  field="facebook_url"
                  value={socialMediaData.facebook_url}
                  onSave={(value) => saveField('facebook_url', value)}
                  type="url"
                  placeholder="https://facebook.com/tu-empresa"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </div>
                <EditableField
                  field="instagram_url"
                  value={socialMediaData.instagram_url}
                  onSave={(value) => saveField('instagram_url', value)}
                  type="url"
                  placeholder="https://instagram.com/tu-empresa"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </div>
                <EditableField
                  field="linkedin_url"
                  value={socialMediaData.linkedin_url}
                  onSave={(value) => saveField('linkedin_url', value)}
                  type="url"
                  placeholder="https://linkedin.com/company/tu-empresa"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Twitter className="w-4 h-4" />
                  Twitter / X
                </div>
                <EditableField
                  field="twitter_url"
                  value={socialMediaData.twitter_url}
                  onSave={(value) => saveField('twitter_url', value)}
                  type="url"
                  placeholder="https://twitter.com/tu-empresa"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </div>
                <EditableField
                  field="youtube_url"
                  value={socialMediaData.youtube_url}
                  onSave={(value) => saveField('youtube_url', value)}
                  type="url"
                  placeholder="https://youtube.com/@tu-empresa"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Music className="w-4 h-4" />
                  TikTok
                </div>
                <EditableField
                  field="tiktok_url"
                  value={socialMediaData.tiktok_url}
                  onSave={(value) => saveField('tiktok_url', value)}
                  type="url"
                  placeholder="https://tiktok.com/@tu-empresa"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mensaje si no hay datos */}
        {!loading && !companyData && !strategyData && !brandingData && objectives.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">No hay información empresarial</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Parece que aún no has completado el onboarding inicial. Ejecuta el proceso para configurar tu empresa.
              </p>
              <Button onClick={() => window.location.href = '/company-dashboard?view=onboarding'} size="lg">
                <ArrowRight className="w-4 h-4 mr-2" />
                Comenzar Onboarding
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default ADNEmpresa;