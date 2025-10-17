import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useTranslation } from "react-i18next";
import BaseConocimiento from "./BaseConocimiento";
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
  Plus,
  Trash2,
  X,
  Upload,
  FileText,
  Camera
} from "lucide-react";

interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const ADNEmpresa = ({ profile }: ADNEmpresaProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['marketing']);
  const { uploadAvatar, uploading } = useAvatarUpload();
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [brandingData, setBrandingData] = useState<any>(null);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    console.log('🔍 ADNEmpresa useEffect triggered', { 
      hasProfile: !!profile, 
      userId: profile?.user_id,
      loadedUserId: loadedUserIdRef.current,
      isLoading: isLoadingRef.current 
    });
    
    // Esperar a que profile esté disponible
    if (!profile?.user_id) {
      console.log('⏸️ Waiting for profile with user_id...');
      setLoading(false);
      return;
    }
    
    // Si ya estamos cargando este usuario, no hacer nada
    if (isLoadingRef.current && loadedUserIdRef.current === profile.user_id) {
      console.log('⏭️ Already loading for this user:', profile.user_id);
      return;
    }
    
    // Si ya cargamos para este usuario y tenemos datos, no recargar
    if (loadedUserIdRef.current === profile.user_id && companyData) {
      console.log('✅ Data already loaded for user:', profile.user_id);
      return;
    }
    
    console.log('🚀 Starting data load for user:', profile.user_id);
    loadedUserIdRef.current = profile.user_id;
    loadOnboardingData();
  }, [profile?.user_id, companyData]);

  const loadOnboardingData = async () => {
    try {
      isLoadingRef.current = true;
      setLoading(true);
      console.log('🎯 Cargando datos de onboarding...', { userId: profile?.user_id });
      
      // Paso 1: Obtener la empresa primaria del usuario
      let primaryCompanyId: string | null = null;
      
      // Intentar obtener desde profiles.primary_company_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('primary_company_id')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      primaryCompanyId = profileData?.primary_company_id || null;
      
      // Si no existe, buscar en company_members con is_primary = true
      if (!primaryCompanyId) {
        const { data: primaryMember } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', profile.user_id)
          .eq('is_primary', true)
          .maybeSingle();
        
        primaryCompanyId = primaryMember?.company_id || null;
      }
      
      // Si aún no existe, tomar el primer membership
      if (!primaryCompanyId) {
        const { data: firstMember } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', profile.user_id)
          .limit(1)
          .maybeSingle();
        
        primaryCompanyId = firstMember?.company_id || null;
      }
      
      if (!primaryCompanyId) {
        console.error('❌ No se encontró empresa para el usuario:', profile.user_id);
        setLoading(false);
        loadedUserIdRef.current = null; // Permitir reintentos
        isLoadingRef.current = false;
        toast({
          title: "Aviso",
          description: "No se encontró información de empresa. Completa el onboarding primero.",
          variant: "default"
        });
        return;
      }
      
      console.log('✅ Empresa seleccionada:', primaryCompanyId);

      // Paso 2: Cargar datos de la empresa específica con .maybeSingle()
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', primaryCompanyId)
        .maybeSingle();

      if (companyError) {
        console.error('❌ Error al cargar empresa:', companyError);
      } else {
        console.log('📊 Empresa:', !!company?.id);
        setCompanyData(company || null);
        if (company) {
          setLastUpdated(new Date(company.updated_at).toLocaleDateString());
        }
      }

      // Cargar estrategia empresarial
      const { data: strategy, error: strategyError } = await supabase
        .from('company_strategy')
        .select('*')
        .eq('company_id', primaryCompanyId)
        .maybeSingle();

      if (strategyError) {
        console.error('❌ Error al cargar estrategia:', strategyError);
      } else {
        console.log('🎯 Estrategia:', !!strategy?.id);
        setStrategyData(strategy || null);
      }

      // Cargar branding
      const { data: branding, error: brandingError } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', primaryCompanyId)
        .maybeSingle();

      if (brandingError) {
        console.error('❌ Error al cargar branding:', brandingError);
      } else {
        console.log('🎨 Branding:', !!branding?.id);
        setBrandingData(branding || null);
      }

      // Cargar objetivos
      const { data: objectives, error: objectivesError } = await supabase
        .from('company_objectives')
        .select('*')
        .eq('company_id', primaryCompanyId)
        .order('priority', { ascending: true });

      if (objectivesError) {
        console.error('❌ Error al cargar objetivos:', objectivesError);
      } else {
        console.log('📈 Objetivos:', objectives?.length || 0);
        setObjectives(objectives || []);
      }
      
      console.log('✅ Resumen carga:', {
        company: !!company?.id,
        strategy: !!strategy?.id,
        branding: !!branding?.id,
        objectives: objectives?.length || 0
      });

    } catch (error) {
      console.error('❌ Error loading onboarding data:', error);
      loadedUserIdRef.current = null;
      isLoadingRef.current = false;
      toast({
        title: "Error",
        description: "Error al cargar la información empresarial",
        variant: "destructive"
      });
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      console.log('🏁 Loading finished. Final state:', {
        companyData: !!companyData,
        strategyData: !!strategyData,
        brandingData: !!brandingData,
        objectivesCount: objectives.length
      });
    }
  };

  const saveField = async (field: string, value: any, table: string = 'companies', recordId?: string) => {
    try {
      const updateData: any = { [field]: value };

      // Parse JSON for known JSON fields if a string is provided
      if (typeof value === 'string' && ['publico_objetivo','visual_synthesis','brand_voice','full_brand_data','color_justifications'].includes(field)) {
        try { updateData[field] = JSON.parse(value); } catch { /* keep as string */ }
      }
      
      if (table === 'companies' && companyData?.id) {
        const { error } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', companyData.id);
        if (error) throw error;
        setCompanyData((prev: any) => ({ ...prev, [field]: updateData[field] }));
      } else if (table === 'company_strategy') {
        const id = recordId || strategyData?.id;
        let error = null as any;
        if (id) {
          ({ error } = await supabase.from('company_strategy').update(updateData).eq('id', id));
        } else if (companyData?.id) {
          ({ error } = await supabase.from('company_strategy').update(updateData).eq('company_id', companyData.id));
        }
        if (error) throw error;
        setStrategyData((prev: any) => ({ ...prev, [field]: updateData[field] }));
      } else if (table === 'company_branding') {
        const id = recordId || brandingData?.id;
        let error = null as any;
        if (id) {
          ({ error } = await supabase.from('company_branding').update(updateData).eq('id', id));
        } else if (companyData?.id) {
          ({ error } = await supabase.from('company_branding').update(updateData).eq('company_id', companyData.id));
        }
        if (error) throw error;
        setBrandingData((prev: any) => ({ ...prev, [field]: updateData[field] }));
      }
      
      toast({ 
        title: t('marketing:adnEmpresa.fieldUpdated'), 
        description: t('marketing:adnEmpresa.updateSuccess') 
      });
      setEditing(null);
    } catch (error) {
      console.error('Error saving field:', error);
      toast({ 
        title: "Error", 
        description: t('marketing:adnEmpresa.updateError'), 
        variant: "destructive" 
      });
    }
  };

  const saveObjective = async (objectiveData: any, objectiveId?: string) => {
    try {
      const action = objectiveId ? 'update' : 'create';
      
      const response = await fetch('https://ubhzzppmkhxbuiajfswa.supabase.co/functions/v1/manage-company-objectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action,
          objectiveData,
          objectiveId,
          companyId: companyData?.id
        })
      });

      if (!response.ok) throw new Error('Error en la operación');

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: objectiveId ? "Objetivo actualizado" : "Objetivo creado",
          description: "Los cambios se han guardado correctamente",
        });
        
        // Recargar objetivos
        loadOnboardingData();
        setEditing(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving objective:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el objetivo",
        variant: "destructive"
      });
    }
  };

  const deleteObjective = async (objectiveId: string) => {
    try {
      const response = await fetch('https://ubhzzppmkhxbuiajfswa.supabase.co/functions/v1/manage-company-objectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'delete',
          objectiveId,
          companyId: companyData?.id
        })
      });

      if (!response.ok) throw new Error('Error eliminando objetivo');

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Objetivo eliminado",
          description: "El objetivo se ha eliminado correctamente",
        });
        
        // Recargar objetivos
        loadOnboardingData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el objetivo",
        variant: "destructive"
      });
    }
  };

  // Componentes auxiliares
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
            title={t('marketing:adnEmpresa.saveChanges')}
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
            title={t('marketing:adnEmpresa.cancelEdit')}
          >
            ✕
          </Button>
        </div>
      );
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="group flex items-center gap-2 p-2 rounded border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20 cursor-text transition-all animate-fade-in"
              onClick={() => setEditing(field)}
            >
              <span className={`flex-1 ${!value ? 'text-muted-foreground italic' : ''}`}>
                {value || placeholder}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(field);
                }}
              >
                <Edit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('marketing:adnEmpresa.clickToEdit')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const EditableObjectiveCard = ({ objective, onSave, onDelete, editing, setEditing }: any) => {
    const [formData, setFormData] = useState({
      title: objective.title || '',
      description: objective.description || '',
      objective_type: objective.objective_type || 'short_term',
      priority: objective.priority || 1,
      target_date: objective.target_date || ''
    });

    const isEditing = editing === objective.id;

    const handleSave = () => {
      onSave(formData, objective.id);
    };

    if (isEditing) {
      return (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título del objetivo"
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descripción</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del objetivo"
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select 
                  value={formData.objective_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, objective_type: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_term">Corto plazo</SelectItem>
                    <SelectItem value="medium_term">Mediano plazo</SelectItem>
                    <SelectItem value="long_term">Largo plazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Prioridad</label>
                <Select 
                  value={formData.priority.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Alta (1)</SelectItem>
                    <SelectItem value="2">Media (2)</SelectItem>
                    <SelectItem value="3">Baja (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Fecha objetivo (opcional)</label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="w-3 h-3 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar este objetivo?')) {
                    onDelete(objective.id);
                  }
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors group"
        onClick={() => setEditing(objective.id)}
      >
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
            <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
    );
  };

  const NewObjectiveForm = ({ companyId, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      objective_type: 'short_term',
      priority: 1,
      target_date: ''
    });

    const handleSubmit = () => {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa título y descripción",
          variant: "destructive"
        });
        return;
      }
      onSave(formData);
    };

    return (
      <Card className="border-dashed border-2 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle className="text-lg text-green-800 dark:text-green-200">
            Nuevo Objetivo Estratégico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Aumentar ventas en un 25%"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Descripción *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe cómo planeas lograr este objetivo..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Plazo</label>
              <Select 
                value={formData.objective_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, objective_type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">Corto plazo (3-6 meses)</SelectItem>
                  <SelectItem value="medium_term">Mediano plazo (6-12 meses)</SelectItem>
                  <SelectItem value="long_term">Largo plazo (1+ años)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Prioridad</label>
              <Select 
                value={formData.priority.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Alta (1)</SelectItem>
                  <SelectItem value="2">Media (2)</SelectItem>
                  <SelectItem value="3">Baja (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Fecha objetivo (opcional)</label>
            <Input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Objetivo
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando información empresarial...</p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              User ID: {profile?.user_id ? '✓' : '✗'} | 
              Loading: {isLoadingRef.current ? '✓' : '✗'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Mostrar mensaje si no hay profile después de cargar
  if (!profile?.user_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">No se pudo cargar el perfil de usuario</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar página
            </Button>
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
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-foreground">ADN Empresarial</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔄 Manual reload triggered');
                loadedUserIdRef.current = null;
                isLoadingRef.current = false;
                setCompanyData(null);
                setStrategyData(null);
                setBrandingData(null);
                setObjectives([]);
                loadOnboardingData();
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </Button>
          </div>
          
          {/* Debug info - solo visible en development */}
          {import.meta.env.DEV && (
            <div className="text-xs text-left bg-slate-100 dark:bg-slate-900 p-3 rounded max-w-xl mx-auto font-mono">
              <div className="font-bold mb-1">🐛 Debug Info:</div>
              <div>Profile User ID: {profile?.user_id || 'null'}</div>
              <div>Company Data: {companyData ? `✓ (${companyData.name})` : '✗'}</div>
              <div>Strategy Data: {strategyData ? '✓' : '✗'}</div>
              <div>Branding Data: {brandingData ? '✓' : '✗'}</div>
              <div>Objectives: {objectives.length}</div>
              <div>Loading: {loading ? '✓' : '✗'}</div>
              <div>Loaded User: {loadedUserIdRef.current || 'null'}</div>
            </div>
          )}
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Información de tu empresa. Haz clic en cualquier campo para editarlo.
          </p>
          
          {/* Banner de campos editables con diseño más visible */}
          <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-xl mx-auto animate-fade-in shadow-sm">
            <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('marketing:adnEmpresa.editableFields')}
            </span>
          </div>
          
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Última actualización: {lastUpdated}
            </p>
          )}
        </div>

        {/* Información Básica de la Empresa */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              Información Empresarial
              {companyData?.name && (
                <Badge variant="secondary" className="ml-auto">Completado</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!companyData?.name && !companyData?.industry_sector && !companyData?.company_size ? (
              <div className="p-6 text-center bg-muted/20 rounded-lg border border-dashed">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2 font-medium">
                  No hay información de empresa registrada
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Completa el onboarding o haz clic en los campos para agregar información
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    Nombre de la Empresa
                  </div>
                  <EditableField
                    field="name"
                    value={companyData?.name || ''}
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
                  value={companyData?.industry_sector || ''}
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
                  value={companyData?.company_size || ''}
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
                  value={companyData?.country || ''}
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
                  value={companyData?.website_url || ''}
                  onSave={(value) => saveField('website_url', value)}
                  type="url"
                  placeholder="https://tu-empresa.com"
                />
              </div>

              {/* Logo empresarial */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Camera className="w-4 h-4" />
                  Logo de la Empresa
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/20">
                    {companyData?.logo_url ? (
                      <img 
                        src={companyData.logo_url} 
                        alt="Logo empresa" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && profile?.user_id) {
                          const logoUrl = await uploadAvatar(file, profile.user_id);
                          if (logoUrl) {
                            await saveField('logo_url', logoUrl);
                          }
                        }
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button variant="outline" size="sm" disabled={uploading} asChild>
                        <span className="cursor-pointer">
                          {uploading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Subir Logo
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formato PNG, JPG. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>
            
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Eye className="w-4 h-4" />
                Descripción del Negocio
              </div>
              <EditableField
                field="description"
                value={companyData?.description || ''}
                onSave={(value) => saveField('description', value)}
                type="textarea"
                placeholder="Describe tu empresa, qué hace y a quién sirve..."
              />
            </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Estrategia Empresarial */}
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
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">Misión</h3>
              <EditableField
                field="mision"
                value={strategyData?.mision || ''}
                onSave={(value) => saveField('mision', value, 'company_strategy', strategyData?.id)}
                type="textarea"
                placeholder="Define la misión de tu empresa"
              />
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">Visión</h3>
              <EditableField
                field="vision"
                value={strategyData?.vision || ''}
                onSave={(value) => saveField('vision', value, 'company_strategy', strategyData?.id)}
                type="textarea"
                placeholder="Define la visión de tu empresa"
              />
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">Propuesta de Valor</h3>
              <EditableField
                field="propuesta_valor"
                value={strategyData?.propuesta_valor || ''}
                onSave={(value) => saveField('propuesta_valor', value, 'company_strategy', strategyData?.id)}
                type="textarea"
                placeholder="Describe tu propuesta de valor"
              />
            </div>
            
            {strategyData?.publico_objetivo && (
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

        {/* Objetivos de Crecimiento */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              Objetivos de Crecimiento
              <Badge variant="secondary" className="ml-auto">{objectives.length} objetivos</Badge>
              <Button
                size="sm"
                onClick={() => setEditing('new-objective')}
                className="ml-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Objetivo
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {objectives.map((objective, index) => (
                <EditableObjectiveCard
                  key={objective.id}
                  objective={objective}
                  onSave={saveObjective}
                  onDelete={deleteObjective}
                  editing={editing}
                  setEditing={setEditing}
                />
              ))}
            </div>
            
            {/* Formulario para nuevo objetivo */}
            {editing === 'new-objective' && (
              <NewObjectiveForm
                companyId={companyData?.id}
                onSave={saveObjective}
                onCancel={() => setEditing(null)}
              />
            )}
          </CardContent>
        </Card>

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
                          <EditableField
                            field="primary_color"
                            value={brandingData.primary_color}
                            onSave={(value) => saveField('primary_color', value, 'company_branding', brandingData.id)}
                            placeholder="#HEX o hsl(...)"
                          />
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
                          <EditableField
                            field="secondary_color"
                            value={brandingData.secondary_color}
                            onSave={(value) => saveField('secondary_color', value, 'company_branding', brandingData.id)}
                            placeholder="#HEX o hsl(...)"
                          />
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
                          <EditableField
                            field="complementary_color_1"
                            value={brandingData.complementary_color_1}
                            onSave={(value) => saveField('complementary_color_1', value, 'company_branding', brandingData.id)}
                            placeholder="#HEX o hsl(...)"
                          />
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
                          <EditableField
                            field="complementary_color_2"
                            value={brandingData.complementary_color_2}
                            onSave={(value) => saveField('complementary_color_2', value, 'company_branding', brandingData.id)}
                            placeholder="#HEX o hsl(...)"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {brandingData.visual_identity && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">Identidad Visual</h3>
                  <EditableField
                    field="visual_identity"
                    value={brandingData.visual_identity}
                    onSave={(value) => saveField('visual_identity', value, 'company_branding', brandingData.id)}
                    type="textarea"
                    placeholder="Describe la identidad visual de tu marca (estilo, tipografía, elementos visuales...)"
                  />
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
                                <EditableField
                                  field="brand_voice_descripcion"
                                  value={brandVoice.descripcion}
                                  onSave={(value) => {
                                    const updatedVoice = { ...brandVoice, descripcion: value };
                                    saveField('brand_voice', JSON.stringify(updatedVoice), 'company_branding', brandingData.id);
                                  }}
                                  type="textarea"
                                  placeholder="Describe cómo se comunica tu marca..."
                                />
                              </div>
                            )}
                            
                            {/* Personalidad */}
                            {brandVoice.personalidad && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-orange-900 dark:text-orange-100 text-sm uppercase tracking-wide">
                                  Personalidad
                                </h4>
                                <EditableField
                                  field="brand_voice_personalidad"
                                  value={brandVoice.personalidad}
                                  onSave={(value) => {
                                    const updatedVoice = { ...brandVoice, personalidad: value };
                                    saveField('brand_voice', JSON.stringify(updatedVoice), 'company_branding', brandingData.id);
                                  }}
                                  placeholder="Ej: Profesional, amigable, innovadora..."
                                />
                              </div>
                            )}
                            
                            {/* Palabras Clave */}
                            {brandVoice.palabras_clave && (
                              <div className="space-y-3">
                                <h4 className="font-medium text-orange-900 dark:text-orange-100 text-sm uppercase tracking-wide">
                                  Palabras Clave
                                </h4>
                                {editing === 'brand_voice_palabras_clave' ? (
                                  <div className="space-y-2">
                                    <EditableField
                                      field="brand_voice_palabras_clave"
                                      value={Array.isArray(brandVoice.palabras_clave) ? brandVoice.palabras_clave.join(', ') : ''}
                                      onSave={(value) => {
                                        const palabrasArray = value.split(',').map(p => p.trim()).filter(p => p);
                                        const updatedVoice = { ...brandVoice, palabras_clave: palabrasArray };
                                        saveField('brand_voice', JSON.stringify(updatedVoice), 'company_branding', brandingData.id);
                                      }}
                                      type="textarea"
                                      placeholder="Ingresa palabras separadas por comas: innovación, tecnología, futuro..."
                                    />
                                  </div>
                                ) : (
                                  <div className="group relative">
                                    <div className="flex flex-wrap gap-2">
                                      {Array.isArray(brandVoice.palabras_clave) && brandVoice.palabras_clave.map((palabra, index) => (
                                        <Badge 
                                          key={index} 
                                          variant="outline" 
                                          className="bg-white/80 dark:bg-background/80 border-orange-300 dark:border-orange-600 text-orange-800 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200"
                                        >
                                          #{palabra}
                                        </Badge>
                                      ))}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute -top-2 -right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => setEditing('brand_voice_palabras_clave')}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
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

        {/* Base de Conocimiento */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              Base de Conocimiento
              <Badge variant="secondary" className="ml-auto">Mis Archivos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BaseConocimiento />
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