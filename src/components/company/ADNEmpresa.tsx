import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import BaseConocimiento from "./BaseConocimiento";
import { EraOptimizerButton } from "@/components/ui/era-optimizer-button";
import { 
  Building2, 
  Target, 
  Palette, 
  Globe, 
  TrendingUp, 
  RefreshCw,
  Calendar,
  Users,
  MapPin,
  Plus,
  Trash2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

// Componente de campo auto-guardable
const AutoSaveField = ({ 
  value, 
  onSave, 
  type = "text",
  placeholder = "",
  className = ""
}: { 
  value: string; 
  onSave: (value: string) => void; 
  type?: "text" | "textarea";
  placeholder?: string;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const initialValueRef = useRef(value);

  useEffect(() => {
    setLocalValue(value || '');
    initialValueRef.current = value;
  }, [value]);

  const handleBlur = useCallback(async () => {
    if (localValue !== initialValueRef.current) {
      setIsSaving(true);
      await onSave(localValue);
      initialValueRef.current = localValue;
      setIsSaving(false);
    }
  }, [localValue, onSave]);

  const baseClassName = `bg-transparent border-none focus:ring-1 focus:ring-primary/30 hover:bg-muted/30 transition-colors ${className}`;

  if (type === "textarea") {
    return (
      <div className="relative">
        <Textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${baseClassName} min-h-[80px] resize-none`}
        />
        {isSaving && <span className="absolute right-2 top-2 text-xs text-muted-foreground">Guardando...</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={baseClassName}
      />
      {isSaving && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Guardando...</span>}
    </div>
  );
};

// Componente de objetivo simplificado con auto-guardado
const ObjectiveItem = ({ 
  objective, 
  onSave, 
  onDelete 
}: { 
  objective: any;
  onSave: (data: any, id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [localData, setLocalData] = useState({
    title: objective.title || '',
    description: objective.description || '',
    objective_type: objective.objective_type || 'short_term',
    priority: objective.priority || 1,
    target_date: objective.target_date || ''
  });
  const initialDataRef = useRef(localData);

  useEffect(() => {
    const newData = {
      title: objective.title || '',
      description: objective.description || '',
      objective_type: objective.objective_type || 'short_term',
      priority: objective.priority || 1,
      target_date: objective.target_date || ''
    };
    setLocalData(newData);
    initialDataRef.current = newData;
  }, [objective]);

  const handleFieldBlur = useCallback(() => {
    if (JSON.stringify(localData) !== JSON.stringify(initialDataRef.current)) {
      onSave(localData, objective.id);
      initialDataRef.current = localData;
    }
  }, [localData, objective.id, onSave]);

  const handleSelectChange = useCallback((field: string, value: string) => {
    const newData = { ...localData, [field]: field === 'priority' ? parseInt(value) : value };
    setLocalData(newData);
    // Auto-guardar inmediatamente para selects
    onSave(newData, objective.id);
    initialDataRef.current = newData;
  }, [localData, objective.id, onSave]);

  return (
    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 space-y-3">
      <div className="flex items-start gap-2">
        <Input
          value={localData.title}
          onChange={(e) => setLocalData(prev => ({ ...prev, title: e.target.value }))}
          onBlur={handleFieldBlur}
          placeholder="Título del objetivo"
          className="bg-transparent border-none font-semibold text-emerald-900 dark:text-emerald-100 focus:ring-1 focus:ring-emerald-500/30"
        />
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(objective.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <Textarea
        value={localData.description}
        onChange={(e) => setLocalData(prev => ({ ...prev, description: e.target.value }))}
        onBlur={handleFieldBlur}
        placeholder="Descripción del objetivo"
        className="bg-transparent border-none min-h-[60px] resize-none text-sm focus:ring-1 focus:ring-emerald-500/30"
      />
      
      <div className="flex flex-wrap items-center gap-2">
        <Select 
          value={localData.objective_type} 
          onValueChange={(value) => handleSelectChange('objective_type', value)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs bg-transparent border-emerald-200 dark:border-emerald-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short_term">Corto plazo</SelectItem>
            <SelectItem value="medium_term">Mediano plazo</SelectItem>
            <SelectItem value="long_term">Largo plazo</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={localData.priority.toString()} 
          onValueChange={(value) => handleSelectChange('priority', value)}
        >
          <SelectTrigger className="w-[100px] h-8 text-xs bg-transparent border-emerald-200 dark:border-emerald-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Alta</SelectItem>
            <SelectItem value="2">Media</SelectItem>
            <SelectItem value="3">Baja</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <Input
            type="date"
            value={localData.target_date}
            onChange={(e) => setLocalData(prev => ({ ...prev, target_date: e.target.value }))}
            onBlur={handleFieldBlur}
            className="w-[130px] h-8 text-xs bg-transparent border-emerald-200 dark:border-emerald-800"
          />
        </div>
      </div>
    </div>
  );
};

const ADNEmpresa = ({ profile }: ADNEmpresaProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['marketing', 'company']);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [brandingData, setBrandingData] = useState<any>(null);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isEnrichingData, setIsEnrichingData] = useState(false);
  const [isGeneratingBrand, setIsGeneratingBrand] = useState(false);
  const [isGeneratingObjectives, setIsGeneratingObjectives] = useState(false);
  const loadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }
    
    if (loadedUserIdRef.current === profile.user_id && companyData) {
      return;
    }
    
    loadedUserIdRef.current = profile.user_id;
    loadData();
  }, [profile?.user_id, companyData]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Obtener empresa primaria
      let companyId: string | null = null;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('primary_company_id')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      companyId = profileData?.primary_company_id || null;
      
      if (!companyId) {
        const { data: member } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', profile.user_id)
          .eq('is_primary', true)
          .maybeSingle();
        companyId = member?.company_id || null;
      }
      
      if (!companyId) {
        const { data: firstMember } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', profile.user_id)
          .limit(1)
          .maybeSingle();
        companyId = firstMember?.company_id || null;
      }
      
      if (!companyId) {
        setLoading(false);
        return;
      }

      // Cargar datos en paralelo
      const [companyRes, strategyRes, brandingRes, objectivesRes] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
        supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_objectives').select('*').eq('company_id', companyId).order('priority')
      ]);

      setCompanyData(companyRes.data || null);
      setObjectives(objectivesRes.data || []);

      // Auto-crear registro de estrategia si no existe
      if (!strategyRes.data && companyId) {
        const { data: newStrategy } = await supabase
          .from('company_strategy')
          .insert({ company_id: companyId })
          .select()
          .single();
        setStrategyData(newStrategy);
      } else {
        setStrategyData(strategyRes.data);
      }

      // Auto-crear registro de branding si no existe
      if (!brandingRes.data && companyId) {
        const { data: newBranding } = await supabase
          .from('company_branding')
          .insert({ company_id: companyId })
          .select()
          .single();
        setBrandingData(newBranding);
      } else {
        setBrandingData(brandingRes.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: "Error", description: "Error al cargar datos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveField = useCallback(async (field: string, value: any, table: string = 'companies') => {
    try {
      const updateData: any = { [field]: value };
      
      if (table === 'companies' && companyData?.id) {
        const { error } = await supabase.from('companies').update(updateData).eq('id', companyData.id);
        if (error) throw error;
        setCompanyData((prev: any) => ({ ...prev, [field]: value }));
      } else if (table === 'company_strategy' && strategyData?.id) {
        const { error } = await supabase.from('company_strategy').update(updateData).eq('id', strategyData.id);
        if (error) throw error;
        setStrategyData((prev: any) => ({ ...prev, [field]: value }));
      } else if (table === 'company_branding' && brandingData?.id) {
        const { error } = await supabase.from('company_branding').update(updateData).eq('id', brandingData.id);
        if (error) throw error;
        setBrandingData((prev: any) => ({ ...prev, [field]: value }));
      }
      
      toast({ title: "✓", description: "Guardado", duration: 1500 });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    }
  }, [companyData?.id, strategyData?.id, brandingData?.id, toast]);

  const saveObjective = useCallback(async (data: any, objectiveId?: string) => {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ubhzzppmkhxbuiajfswa.supabase.co'}/functions/v1/manage-company-objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({
          action: objectiveId ? 'update' : 'create',
          objectiveData: data,
          objectiveId,
          companyId: companyData?.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        if (objectiveId) {
          setObjectives(prev => prev.map(obj => obj.id === objectiveId ? { ...obj, ...data } : obj));
        } else {
          setObjectives(prev => [...prev, { id: result.data?.id || result.objectiveId, ...data }]);
        }
        toast({ title: "✓", description: "Objetivo guardado", duration: 1500 });
      }
    } catch (error) {
      console.error('Error saving objective:', error);
      toast({ title: "Error", description: "No se pudo guardar el objetivo", variant: "destructive" });
    }
  }, [companyData?.id, toast]);

  const deleteObjective = useCallback(async (objectiveId: string) => {
    if (!confirm('¿Eliminar este objetivo?')) return;
    
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ubhzzppmkhxbuiajfswa.supabase.co'}/functions/v1/manage-company-objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({ action: 'delete', objectiveId, companyId: companyData?.id })
      });

      const result = await response.json();
      if (result.success) {
        setObjectives(prev => prev.filter(obj => obj.id !== objectiveId));
        toast({ title: "✓", description: "Objetivo eliminado", duration: 1500 });
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    }
  }, [companyData?.id, toast]);

  const addNewObjective = useCallback(() => {
    const tempId = `temp-${Date.now()}`;
    const newObj = {
      id: tempId,
      title: '',
      description: '',
      objective_type: 'short_term',
      priority: 1,
      target_date: '',
      isNew: true
    };
    setObjectives(prev => [...prev, newObj]);
  }, []);

  const generateStrategy = useCallback(async () => {
    if (!companyData?.id) return;
    
    setIsGeneratingStrategy(true);
    try {
      const { data, error } = await supabase.functions.invoke('company-strategy', {
        body: { companyId: companyData.id }
      });
      
      if (error) throw error;
      
      if (data?.data_stored) {
        setStrategyData((prev: any) => ({
          ...prev,
          mision: data.data_stored.mision || prev?.mision,
          vision: data.data_stored.vision || prev?.vision,
          propuesta_valor: data.data_stored.propuesta_valor || prev?.propuesta_valor
        }));
      }
      
      toast({
        title: t('company:strategy.generated', 'Estrategia generada'),
        description: t('company:strategy.generatedDesc', 'Tu misión, visión y propuesta de valor han sido creados con IA')
      });
    } catch (error: any) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la estrategia",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  }, [companyData?.id, toast, t]);

  const enrichCompanyData = useCallback(async () => {
    if (!companyData?.id) return;
    
    setIsEnrichingData(true);
    try {
      const { data, error } = await supabase.functions.invoke('company-info-extractor', {
        body: { companyId: companyData.id }
      });
      
      if (error) throw error;
      
      // Reload company data
      await loadData();
      
      toast({
        title: t('company:enrich.success', 'Datos enriquecidos'),
        description: t('company:enrich.successDesc', 'La información de tu empresa ha sido actualizada desde tu sitio web')
      });
    } catch (error: any) {
      console.error('Error enriching data:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enriquecer los datos",
        variant: "destructive"
      });
    } finally {
      setIsEnrichingData(false);
    }
  }, [companyData?.id, toast, t]);

  const generateBrandIdentity = useCallback(async () => {
    if (!companyData?.id) return;
    
    setIsGeneratingBrand(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-identity', {
        body: { companyId: companyData.id }
      });
      
      if (error) throw error;
      
      // Reload branding data
      const { data: newBranding } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', companyData.id)
        .maybeSingle();
      
      if (newBranding) {
        setBrandingData(newBranding);
      }
      
      toast({
        title: t('company:brand.generated', 'Identidad generada'),
        description: t('company:brand.generatedDesc', 'Tu identidad de marca ha sido creada con IA')
      });
    } catch (error: any) {
      console.error('Error generating brand identity:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la identidad de marca",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingBrand(false);
    }
  }, [companyData?.id, toast, t]);

  const generateObjectives = useCallback(async () => {
    if (!companyData?.id) return;
    
    setIsGeneratingObjectives(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-objectives', {
        body: { companyId: companyData.id, language: 'es' }
      });
      
      if (error) throw error;
      
      if (data?.objectives) {
        setObjectives(prev => [...prev, ...data.objectives]);
      }
      
      toast({
        title: t('company:objectives.generated', 'Objetivos generados'),
        description: t('company:objectives.generatedDesc', `Se han creado ${data?.count || 0} objetivos con IA`)
      });
    } catch (error: any) {
      console.error('Error generating objectives:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron generar los objetivos",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingObjectives(false);
    }
  }, [companyData?.id, toast, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Building2 className="w-12 h-12 mb-4 text-muted-foreground/40" />
        <p className="text-muted-foreground">No hay información de empresa</p>
        <p className="text-sm text-muted-foreground/60">Completa el onboarding primero</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">ADN Empresarial</h1>
        <p className="text-sm text-muted-foreground">
          Edita directamente cualquier campo. Los cambios se guardan automáticamente.
        </p>
      </div>

      {/* Información Básica */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Información Básica
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={enrichCompanyData}
              disabled={isEnrichingData || !companyData?.website_url}
              title={!companyData?.website_url ? 'Agrega un sitio web primero' : ''}
            >
              {isEnrichingData ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  {t('company:enrich.enriching', 'Enriqueciendo...')}
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-1" />
                  {t('company:enrich.enrichData', 'Enriquecer datos')}
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div className="flex items-start gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30">
                {companyData?.logo_url ? (
                  <img 
                    src={companyData.logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !companyData?.id) return;
                    
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${companyData.id}/logo.${fileExt}`;
                      
                      const { error: uploadError } = await supabase.storage
                        .from('company-logos')
                        .upload(fileName, file, { upsert: true });
                      
                      if (uploadError) throw uploadError;
                      
                      const { data: { publicUrl } } = supabase.storage
                        .from('company-logos')
                        .getPublicUrl(fileName);
                      
                      await saveField('logo_url', publicUrl);
                      toast({ title: "✓", description: "Logo actualizado", duration: 1500 });
                    } catch (error: any) {
                      console.error('Error uploading logo:', error);
                      toast({ title: "Error", description: "No se pudo subir el logo", variant: "destructive" });
                    }
                  }}
                />
                <span className="text-white text-xs">Cambiar</span>
              </label>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Logo de la empresa</label>
              <p className="text-xs text-muted-foreground/70">Haz clic en la imagen para cambiar el logo</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Building2 className="w-3 h-3" /> Nombre
              </label>
              <AutoSaveField
                value={companyData?.name || ''}
                onSave={(v) => saveField('name', v)}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Target className="w-3 h-3" /> Sector
              </label>
              <AutoSaveField
                value={companyData?.industry_sector || ''}
                onSave={(v) => saveField('industry_sector', v)}
                placeholder="Ej. Tecnología, Salud..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Users className="w-3 h-3" /> Tamaño
              </label>
              <AutoSaveField
                value={companyData?.company_size || ''}
                onSave={(v) => saveField('company_size', v)}
                placeholder="Ej. 1-10 empleados"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" /> País
              </label>
              <AutoSaveField
                value={companyData?.country || ''}
                onSave={(v) => saveField('country', v)}
                placeholder="País"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3" /> Sitio Web
            </label>
            <AutoSaveField
              value={companyData?.website_url || ''}
              onSave={(v) => saveField('website_url', v)}
              placeholder="https://..."
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Descripción</label>
              <EraOptimizerButton
                currentText={companyData?.description || ''}
                fieldType="descripción de empresa"
                context={{ 
                  companyName: companyData?.name, 
                  industry: companyData?.industry_sector,
                  website: companyData?.website_url 
                }}
                onOptimized={(text) => saveField('description', text)}
                size="sm"
              />
            </div>
            <AutoSaveField
              value={companyData?.description || ''}
              onSave={(v) => saveField('description', v)}
              type="textarea"
              placeholder="Describe brevemente tu empresa..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Estrategia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-emerald-600" />
              Estrategia
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateStrategy}
              disabled={isGeneratingStrategy || !companyData?.id}
            >
              {isGeneratingStrategy ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  {t('company:strategy.generating', 'Generando...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  {t('company:strategy.generateWithAI', 'Generar con IA')}
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Misión</label>
              <EraOptimizerButton
                currentText={strategyData?.mision || ''}
                fieldType="misión"
                context={{ companyName: companyData?.name, industry: companyData?.industry_sector }}
                onOptimized={(text) => saveField('mision', text, 'company_strategy')}
                size="sm"
              />
            </div>
            <AutoSaveField
              value={strategyData?.mision || ''}
              onSave={(v) => saveField('mision', v, 'company_strategy')}
              type="textarea"
              placeholder="Define el propósito fundamental de tu empresa..."
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Visión</label>
              <EraOptimizerButton
                currentText={strategyData?.vision || ''}
                fieldType="visión"
                context={{ companyName: companyData?.name, industry: companyData?.industry_sector }}
                onOptimized={(text) => saveField('vision', text, 'company_strategy')}
                size="sm"
              />
            </div>
            <AutoSaveField
              value={strategyData?.vision || ''}
              onSave={(v) => saveField('vision', v, 'company_strategy')}
              type="textarea"
              placeholder="¿Cómo visualizas tu empresa en el futuro?"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Propuesta de Valor</label>
              <EraOptimizerButton
                currentText={strategyData?.propuesta_valor || ''}
                fieldType="propuesta de valor"
                context={{ companyName: companyData?.name, industry: companyData?.industry_sector }}
                onOptimized={(text) => saveField('propuesta_valor', text, 'company_strategy')}
                size="sm"
              />
            </div>
            <AutoSaveField
              value={strategyData?.propuesta_valor || ''}
              onSave={(v) => saveField('propuesta_valor', v, 'company_strategy')}
              type="textarea"
              placeholder="¿Qué valor único ofreces a tus clientes?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Objetivos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Objetivos
              {objectives.length > 0 && (
                <Badge variant="secondary" className="text-xs">{objectives.length}</Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateObjectives}
                disabled={isGeneratingObjectives || !companyData?.id}
              >
                {isGeneratingObjectives ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Generar con IA
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={addNewObjective}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {objectives.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay objetivos definidos</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Button variant="link" size="sm" onClick={generateObjectives} disabled={isGeneratingObjectives}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generar con IA
                </Button>
                <span className="text-muted-foreground">o</span>
                <Button variant="link" size="sm" onClick={addNewObjective}>
                  Crear manualmente
                </Button>
              </div>
            </div>
          ) : (
            objectives.map((objective) => (
              <ObjectiveItem
                key={objective.id}
                objective={objective}
                onSave={saveObjective}
                onDelete={deleteObjective}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-purple-600" />
              Identidad de Marca
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateBrandIdentity}
              disabled={isGeneratingBrand || !companyData?.id}
            >
              {isGeneratingBrand ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  {t('company:brand.generating', 'Generando...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  {t('company:brand.generateWithAI', 'Generar con IA')}
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Identidad Visual</label>
              <EraOptimizerButton
                currentText={brandingData?.visual_identity || ''}
                fieldType="identidad visual"
                context={{ companyName: companyData?.name, industry: companyData?.industry_sector }}
                onOptimized={(text) => saveField('visual_identity', text, 'company_branding')}
                size="sm"
              />
            </div>
            <AutoSaveField
              value={brandingData?.visual_identity || ''}
              onSave={(v) => saveField('visual_identity', v, 'company_branding')}
              type="textarea"
              placeholder="Describe el estilo visual de tu marca (tipografía, estética, elementos gráficos)..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Voz de Marca</label>
            {brandingData?.brand_voice && typeof brandingData.brand_voice === 'object' ? (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                {brandingData.brand_voice.personalidad && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Personalidad:</span>
                    <p className="text-sm mt-0.5">{brandingData.brand_voice.personalidad}</p>
                  </div>
                )}
                {brandingData.brand_voice.descripcion && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Descripción:</span>
                    <p className="text-sm mt-0.5">{brandingData.brand_voice.descripcion}</p>
                  </div>
                )}
                {brandingData.brand_voice.palabras_clave && Array.isArray(brandingData.brand_voice.palabras_clave) && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Palabras clave:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {brandingData.brand_voice.palabras_clave.map((palabra: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{palabra}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <AutoSaveField
                value={brandingData?.brand_voice || ''}
                onSave={(v) => saveField('brand_voice', v, 'company_branding')}
                type="textarea"
                placeholder="Describe el tono y estilo de comunicación de tu marca (formal, cercano, técnico, inspirador)..."
              />
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Color Primario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandingData?.primary_color || '#3c46b2'}
                  onChange={(e) => saveField('primary_color', e.target.value, 'company_branding')}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">{brandingData?.primary_color || '#3c46b2'}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Color Secundario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandingData?.secondary_color || '#f15438'}
                  onChange={(e) => saveField('secondary_color', e.target.value, 'company_branding')}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">{brandingData?.secondary_color || '#f15438'}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Complementario 1</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandingData?.complementary_color_1 || '#ffffff'}
                  onChange={(e) => saveField('complementary_color_1', e.target.value, 'company_branding')}
                  className="w-8 h-8 rounded cursor-pointer border"
                />
                <span className="text-xs text-muted-foreground">{brandingData?.complementary_color_1 || '#ffffff'}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Complementario 2</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandingData?.complementary_color_2 || '#000000'}
                  onChange={(e) => saveField('complementary_color_2', e.target.value, 'company_branding')}
                  className="w-8 h-8 rounded cursor-pointer border"
                />
                <span className="text-xs text-muted-foreground">{brandingData?.complementary_color_2 || '#000000'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base de Conocimiento */}
      <BaseConocimiento />
    </div>
  );
};

export default ADNEmpresa;
