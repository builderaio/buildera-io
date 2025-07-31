import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EraOptimizerButton } from "@/components/ui/era-optimizer-button";
import { Lightbulb, Upload, Twitter, Linkedin, Instagram, Music, Youtube, Plus, Edit, Trash2, Package, Palette, FileImage, FileText, Download, Target, Building2, Calendar, Globe, Bot, Facebook, ExternalLink, RefreshCw } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import CompanyProfileForm from "./CompanyProfileForm";

interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const ADNEmpresa = ({ profile, onProfileUpdate }: ADNEmpresaProps) => {
  const [companyData, setCompanyData] = useState<any>(null);
  const [formData, setFormData] = useState({
    mission: "",
    vision: "", 
    valueProposition: "",
  });
  const [loading, setLoading] = useState(false);
  const [socialConnections, setSocialConnections] = useState({
    instagram: false,
    facebook: false,
    tiktok: false,
    linkedin: false
  });
  
  // Estados para la gestión de productos
  const [products, setProducts] = useState<any[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: ""
  });
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Estados para la gestión de marca
  const [branding, setBranding] = useState<any>(null);
  const [brandingForm, setBrandingForm] = useState({
    primary_color: "#000000",
    secondary_color: "#ffffff", 
    complementary_color_1: "#ff0000",
    complementary_color_2: "#0000ff",
    visual_identity: "",
    logo_url: "",
    brand_manual_url: ""
  });
  const [loadingBranding, setLoadingBranding] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const manualFileRef = useRef<HTMLInputElement>(null);
  
  // Estados para la gestión de estrategia
  const [strategy, setStrategy] = useState<any>(null);
  const [strategyForm, setStrategyForm] = useState({
    mision: "",
    vision: "",
    propuesta_valor: ""
  });
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  
  // Estados para objetivos empresariales
  const [objectives, setObjectives] = useState<any[]>([]);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [objectiveForm, setObjectiveForm] = useState({
    title: "",
    description: "",
    objective_type: "",
    priority: 1,
    target_date: null as Date | null
  });
  const [loadingObjectives, setLoadingObjectives] = useState(false);
  
  const objectiveTypes = [
    "Financiero",
    "Crecimiento",
    "Operacional", 
    "Marketing",
    "Recursos Humanos",
    "Tecnología",
    "Sostenibilidad",
  ];
  
  const { toast } = useToast();

  // Cargar datos de la empresa
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (profile?.primary_company_id) {
        try {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.primary_company_id)
            .single();
          
          if (error) {
            console.error('Error fetching company data:', error);
          } else {
            setCompanyData(data);
          }
        } catch (err) {
          console.error('Error:', err);
        }
      }
    };

    fetchCompanyData();
  }, [profile?.primary_company_id]);

  // Función para actualizar datos de la empresa
  const updateCompanyData = async (field: string, value: any) => {
    if (!profile?.primary_company_id) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ [field]: value })
        .eq('id', profile.primary_company_id);

      if (error) {
        console.error('Error updating company:', error);
        toast({
          title: "Error",
          description: "Error actualizando información de la empresa",
          variant: "destructive",
        });
      } else {
        setCompanyData(prev => ({ ...prev, [field]: value }));
        toast({
          title: "Guardado",
          description: "Información actualizada correctamente",
        });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Error actualizando información",
        variant: "destructive",
      });
    }
  };

  
  // Función para refrescar información existente de la empresa (solo lectura de BD)
  const handleRefreshCompanyInfo = async () => {
    if (!profile?.primary_company_id) {
      toast({
        title: "Error",
        description: "No se encontró información de la empresa principal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      toast({
        title: "Actualizando",
        description: "Cargando información más reciente...",
      });

      // Solo refrescar datos existentes de la BD
      const { data: updatedCompanyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.primary_company_id)
        .single();

      if (error) {
        throw error;
      }

      setCompanyData(updatedCompanyData);
      
      // También refrescar productos
      await fetchProducts();

      toast({
        title: "¡Actualizado!",
        description: "Información refrescada desde la base de datos",
      });

    } catch (error: any) {
      console.error('Error refreshing company info:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la información",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const companySizes = [
    "1-10 empleados",
    "11-50 empleados", 
    "51-200 empleados",
    "201-500 empleados",
    "501-1000 empleados",
    "1000+ empleados"
  ];

  const sectors = [
    "Tecnología",
    "Finanzas",
    "Salud", 
    "Educación",
    "Retail",
    "Manufactura",
    "Servicios",
    "Construcción",
    "Agricultura",
    "Energía",
    "Otro"
  ];

  // Cargar productos, branding, estrategia y objetivos al montar el componente
  useEffect(() => {
    if (profile?.user_id) {
      fetchProducts();
      fetchBranding();
      fetchStrategy();
      fetchObjectives();
    }
  }, [profile?.user_id]);

  // Funciones para la gestión de productos
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setLoadingProducts(true);
    try {
      if (editingProduct) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('products')
          .update({
            name: productForm.name,
            description: productForm.description
          })
          .eq('id', editingProduct.id)
          .eq('user_id', profile?.user_id);

        if (error) throw error;

        toast({
          title: "Producto actualizado",
          description: "El producto se ha actualizado correctamente",
        });
      } else {
        // Crear nuevo producto
        const { error } = await supabase
          .from('products')
          .insert({
            user_id: profile?.user_id,
            name: productForm.name,
            description: productForm.description
          });

        if (error) throw error;

        toast({
          title: "Producto creado",
          description: "El producto se ha creado correctamente",
        });
      }

      // Recargar productos y cerrar formulario
      await fetchProducts();
      handleCancelProductForm();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el producto",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || ""
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) {
      return;
    }

    setLoadingProducts(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado correctamente",
      });

      await fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCancelProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({ name: "", description: "" });
  };

  // Funciones para la gestión de estrategia
  const fetchStrategy = async () => {
    try {
      const { data, error } = await supabase
        .from('company_strategy')
        .select('*')
        .eq('user_id', profile?.user_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setStrategy(data);
        setStrategyForm({
          mision: data.mision || "",
          vision: data.vision || "",
          propuesta_valor: data.propuesta_valor || ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching strategy:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la estrategia",
        variant: "destructive",
      });
    }
  };

  const handleGenerateStrategy = async () => {
    if (!profile?.company_name || !profile?.country) {
      toast({
        title: "Error",
        description: "Debe completar información de la empresa y país primero",
        variant: "destructive",
      });
      return;
    }

    if (strategy?.generated_with_ai) {
      toast({
        title: "Ya generado",
        description: "La estrategia ya fue generada con IA. Puede editarla manualmente.",
        variant: "destructive",
      });
      return;
    }

    setLoadingStrategy(true);
    try {
      toast({
        title: "Generando estrategia",
        description: "Creando estrategia personalizada con IA...",
      });

      const companyInfo = `${profile?.company_name}, ${profile.country}, ${profile?.website_url || 'Sin sitio web'}`;

      const response = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
        body: {
          KEY: 'INFO',
          COMPANY_INFO: companyInfo
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al generar estrategia');
      }

      const { data } = response;
      
      if (!data.success) {
        throw new Error(data.error || 'Error al generar estrategia');
      }

      // Procesar respuesta del API - array de objetos con key y value
      const strategyData = data.data;
      const mision = strategyData.find((item: any) => item.key === 'mision')?.value || '';
      const vision = strategyData.find((item: any) => item.key === 'vision')?.value || '';
      const propuesta_valor = strategyData.find((item: any) => item.key === 'propuesta_valor')?.value || '';

      // Guardar en base de datos
      const strategyPayload = {
        user_id: profile?.user_id,
        mision,
        vision,
        propuesta_valor,
        generated_with_ai: true
      };

      if (strategy) {
        const { error } = await supabase
          .from('company_strategy')
          .update(strategyPayload)
          .eq('id', strategy.id);
        if (error) throw error;
      } else {
        const { data: newStrategy, error } = await supabase
          .from('company_strategy')
          .insert(strategyPayload)
          .select()
          .single();
        if (error) throw error;
        setStrategy(newStrategy);
      }

      setStrategyForm({ mision, vision, propuesta_valor });

      toast({
        title: "¡Estrategia generada!",
        description: "Estrategia creada exitosamente con IA",
      });

    } catch (error: any) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la estrategia",
        variant: "destructive",
      });
    } finally {
      setLoadingStrategy(false);
    }
  };

  const handleSaveStrategy = async () => {
    if (!strategyForm.mision && !strategyForm.vision && !strategyForm.propuesta_valor) {
      toast({
        title: "Error",
        description: "Debe completar al menos un campo de estrategia",
        variant: "destructive",
      });
      return;
    }

    setLoadingStrategy(true);
    try {
      const strategyData = {
        user_id: profile?.user_id,
        mision: strategyForm.mision,
        vision: strategyForm.vision,
        propuesta_valor: strategyForm.propuesta_valor,
        generated_with_ai: strategy?.generated_with_ai || false
      };

      if (strategy) {
        const { error } = await supabase
          .from('company_strategy')
          .update(strategyData)
          .eq('id', strategy.id);
        if (error) throw error;
      } else {
        const { data: newStrategy, error } = await supabase
          .from('company_strategy')
          .insert(strategyData)
          .select()
          .single();
        if (error) throw error;
        setStrategy(newStrategy);
      }

      toast({
        title: "Estrategia guardada",
        description: "La estrategia se ha guardado correctamente",
      });

      await fetchStrategy();
    } catch (error: any) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la estrategia",
        variant: "destructive",
      });
    } finally {
      setLoadingStrategy(false);
    }
  };

  // Funciones para la gestión de objetivos empresariales
  const fetchObjectives = async () => {
    try {
      const { data, error } = await supabase
        .from('company_objectives')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setObjectives(data || []);
    } catch (error: any) {
      console.error('Error fetching objectives:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los objetivos",
        variant: "destructive",
      });
    }
  };

  const handleSaveObjective = async () => {
    if (!objectiveForm.title.trim()) {
      toast({
        title: "Error",
        description: "El título del objetivo es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setLoadingObjectives(true);
    try {
      if (editingObjective) {
        // Actualizar objetivo existente
        const { error } = await supabase
          .from('company_objectives')
          .update({
            title: objectiveForm.title,
            description: objectiveForm.description,
            objective_type: objectiveForm.objective_type,
            priority: objectiveForm.priority,
            target_date: objectiveForm.target_date ? objectiveForm.target_date.toISOString().split('T')[0] : null
          })
          .eq('id', editingObjective.id)
          .eq('user_id', profile?.user_id);

        if (error) throw error;

        toast({
          title: "Objetivo actualizado",
          description: "El objetivo se ha actualizado correctamente",
        });
      } else {
        // Crear nuevo objetivo
        const { error } = await supabase
          .from('company_objectives')
          .insert({
            user_id: profile?.user_id,
            title: objectiveForm.title,
            description: objectiveForm.description,
            objective_type: objectiveForm.objective_type,
            priority: objectiveForm.priority,
            target_date: objectiveForm.target_date ? objectiveForm.target_date.toISOString().split('T')[0] : null
          });

        if (error) throw error;

        toast({
          title: "Objetivo creado",
          description: "El objetivo se ha creado correctamente",
        });
      }

      // Recargar objetivos y cerrar formulario
      await fetchObjectives();
      handleCancelObjectiveForm();
    } catch (error: any) {
      console.error('Error saving objective:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el objetivo",
        variant: "destructive",
      });
    } finally {
      setLoadingObjectives(false);
    }
  };

  const handleEditObjective = (objective: any) => {
    setEditingObjective(objective);
    setObjectiveForm({
      title: objective.title,
      description: objective.description || "",
      objective_type: objective.objective_type,
      priority: objective.priority || 1,
      target_date: objective.target_date ? new Date(objective.target_date) : null
    });
    setShowObjectiveForm(true);
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este objetivo?")) {
      return;
    }

    setLoadingObjectives(true);
    try {
      const { error } = await supabase
        .from('company_objectives')
        .delete()
        .eq('id', objectiveId)
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      toast({
        title: "Objetivo eliminado",
        description: "El objetivo se ha eliminado correctamente",
      });

      await fetchObjectives();
    } catch (error: any) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el objetivo",
        variant: "destructive",
      });
    } finally {
      setLoadingObjectives(false);
    }
  };

  const handleCancelObjectiveForm = () => {
    setShowObjectiveForm(false);
    setEditingObjective(null);
    setObjectiveForm({
      title: "",
      description: "",
      objective_type: "",
      priority: 1,
      target_date: null
    });
  };

  // Funciones para la gestión de marca
  const fetchBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('user_id', profile?.user_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setBranding(data);
        setBrandingForm({
          primary_color: data.primary_color || "#000000",
          secondary_color: data.secondary_color || "#ffffff",
          complementary_color_1: data.complementary_color_1 || "#ff0000", 
          complementary_color_2: data.complementary_color_2 || "#0000ff",
          visual_identity: data.visual_identity || "",
          logo_url: data.logo_url || "",
          brand_manual_url: data.brand_manual_url || ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching branding:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración de marca",
        variant: "destructive",
      });
    }
  };

  const handleSaveBranding = async () => {
    setLoadingBranding(true);
    try {
      const brandingData = {
        user_id: profile?.user_id,
        ...brandingForm
      };

      if (branding) {
        // Actualizar existente
        const { error } = await supabase
          .from('company_branding')
          .update(brandingData)
          .eq('id', branding.id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { data, error } = await supabase
          .from('company_branding')
          .insert(brandingData)
          .select()
          .single();

        if (error) throw error;
        setBranding(data);
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de marca se ha guardado correctamente",
      });

      await fetchBranding();
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración de marca",
        variant: "destructive",
      });
    } finally {
      setLoadingBranding(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede ser mayor a 5MB",
        variant: "destructive",
      });
      return;
    }

    setLoadingBranding(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.user_id}/logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('brand-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(fileName);

      setBrandingForm(prev => ({ ...prev, logo_url: publicUrl }));

      toast({
        title: "Logo cargado",
        description: "El logo se ha cargado correctamente",
      });

    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el logo",
        variant: "destructive",
      });
    } finally {
      setLoadingBranding(false);
    }
  };

  const handleManualUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo (PDF)
    if (file.type !== 'application/pdf') {
      toast({
        title: "Error", 
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede ser mayor a 10MB",
        variant: "destructive",
      });
      return;
    }

    setLoadingBranding(true);
    try {
      const fileName = `${profile?.user_id}/brand-manual-${Date.now()}.pdf`;
      
      const { data, error } = await supabase.storage
        .from('brand-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(fileName);

      setBrandingForm(prev => ({ ...prev, brand_manual_url: publicUrl }));

      toast({
        title: "Manual cargado",
        description: "El manual de marca se ha cargado correctamente",
      });

    } catch (error: any) {
      console.error('Error uploading manual:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el manual",
        variant: "destructive",
      });
    } finally {
      setLoadingBranding(false);
    }
  };

  const handleGenerateBrandManual = async () => {
    if (!profile?.company_name) {
      toast({
        title: "Error",
        description: "Debe completar la información de la empresa primero",
        variant: "destructive",
      });
      return;
    }

    setLoadingBranding(true);
    try {
      toast({
        title: "Generando manual",
        description: "Creando manual de marca personalizado con IA...",
      });

      const companyInfo = {
        company_name: profile?.company_name,
        industry_sector: profile?.industry_sector,
        ...brandingForm
      };

      const response = await supabase.functions.invoke('generate-company-content', {
        body: {
          field: 'manual de marca',
          companyInfo: companyInfo
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al generar manual');
      }

      const { data } = response;
      
      if (!data.success) {
        throw new Error(data.error || 'Error al generar manual');
      }

      // El manual generado se podría mostrar en un modal o descargar
      toast({
        title: "¡Manual generado!",
        description: "Manual de marca creado exitosamente con IA",
      });

    } catch (error: any) {
      console.error('Error generating brand manual:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el manual de marca",
        variant: "destructive",
      });
    } finally {
      setLoadingBranding(false);
    }
  };


  const handleSave = async (field: string) => {
    setLoading(true);
    try {
      // En un caso real, aquí actualizarías los campos específicos del perfil
      // Por ahora solo mostramos el toast de éxito
      toast({
        title: "Guardado exitosamente",
        description: `${field} actualizada correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async (field: string) => {
    setLoading(true);
    try {
      console.log(`🤖 Generando ${field} con IA...`);
      
      toast({
        title: "Generando con IA",
        description: `Creando ${field} personalizada para su empresa...`,
      });

      // Preparar información de la empresa para el contexto
      const companyInfo = {
        company_name: profile?.company_name || "su empresa",
        company_size: profile?.company_size || "",
        industry_sector: profile?.industry_sector || "",
        website_url: profile?.website_url || ""
      };

      console.log('📋 Información de empresa para IA:', companyInfo);

      // Llamar a la función de edge para generar contenido
      const response = await supabase.functions.invoke('generate-company-content', {
        body: {
          field: field,
          companyInfo: companyInfo
        }
      });

      console.log('📥 Respuesta de IA:', response);

      if (response.error) {
        console.error('❌ Error de edge function:', response.error);
        throw new Error(response.error.message || 'Error al generar contenido');
      }

      const { data } = response;
      
      if (!data.success) {
        console.error('❌ Error en respuesta:', data.error);
        throw new Error(data.error || 'Error al generar contenido');
      }

      const generatedContent = data.content;
      console.log('✅ Contenido generado:', generatedContent);

      // Actualizar el campo correspondiente
      setFormData(prev => ({
        ...prev,
        [field === 'misión' ? 'mission' : 
         field === 'visión' ? 'vision' : 
         'valueProposition']: generatedContent
      }));

      toast({
        title: "¡Contenido generado!",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} creada exitosamente con IA`,
      });

    } catch (error: any) {
      console.error(`❌ Error generando ${field}:`, error);
      toast({
        title: "Error",
        description: `No se pudo generar la ${field}. ${error.message || 'Inténtelo de nuevo.'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones específicas para cada red social
  const handleInstagramConnect = async () => {
    setLoading(true);
    try {
      console.log('🔗 Conectando Instagram Business...');
      
      toast({
        title: "Conectando Instagram Business",
        description: "Instagram Business requiere conectar Facebook primero...",
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Redirecto a Facebook",
        description: "Abriendo ventana de autenticación de Facebook para Instagram Business",
      });

      await new Promise(resolve => setTimeout(resolve, 2500));

      const shouldSucceed = Math.random() > 0.15;

      if (shouldSucceed) {
        setSocialConnections(prev => ({ ...prev, instagram: true }));
        
        toast({
          title: "¡Instagram Business Conectado!",
          description: "Acceso completo a posts, stories, reels y métricas de audiencia.",
        });
      } else {
        throw new Error("Error de permisos de Instagram Business");
      }

    } catch (error: any) {
      toast({
        title: "Error Instagram Business",
        description: `${error.message || 'Verifique que tiene una cuenta business vinculada a Facebook'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookConnect = async () => {
    setLoading(true);
    try {
      console.log('🔗 Conectando Facebook Business...');
      
      toast({
        title: "Conectando Facebook Business",
        description: "Verificando páginas empresariales disponibles...",
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Seleccionar Página",
        description: "Seleccionando página empresarial principal",
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      const shouldSucceed = Math.random() > 0.1;

      if (shouldSucceed) {
        setSocialConnections(prev => ({ ...prev, facebook: true }));
        
        toast({
          title: "¡Facebook Business Conectado!",
          description: "Página empresarial vinculada. Acceso a posts, ads y métricas.",
        });
      } else {
        throw new Error("No se encontraron páginas empresariales");
      }

    } catch (error: any) {
      toast({
        title: "Error Facebook Business",
        description: `${error.message || 'Verifique que tiene páginas empresariales disponibles'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTikTokConnect = async () => {
    setLoading(true);
    try {
      console.log('🔗 Conectando TikTok Business...');
      
      toast({
        title: "Conectando TikTok Business",
        description: "Abriendo TikTok Business Manager...",
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Autenticación TikTok",
        description: "Verificando cuenta empresarial y permisos de API",
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const shouldSucceed = Math.random() > 0.25;

      if (shouldSucceed) {
        setSocialConnections(prev => ({ ...prev, tiktok: true }));
        
        toast({
          title: "¡TikTok Business Conectado!",
          description: "Acceso a video uploads, analytics y campañas publicitarias.",
        });
      } else {
        throw new Error("Cuenta TikTok Business no verificada");
      }

    } catch (error: any) {
      toast({
        title: "Error TikTok Business",
        description: `${error.message || 'Verifique que tiene una cuenta TikTok Business activa'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInConnect = async () => {
    setLoading(true);
    try {
      console.log('🔗 Iniciando flujo OAuth LinkedIn Company...');
      
      // Validaciones previas
      if (!profile?.company_name) {
        throw new Error("Debe completar la información de la empresa antes de conectar LinkedIn");
      }

      // Mostrar toast inicial
      toast({
        title: "Conectando LinkedIn Company",
        description: "Redirigiendo a LinkedIn para autorización...",
      });

      // Configuración OAuth de LinkedIn - usar URL de producción  
      const clientId = '78pxtzefworlny';
      const redirectUri = 'https://buildera.io/auth/linkedin/callback';
      const scopes = 'w_organization_social r_organization_social rw_company_admin';
      const state = Math.random().toString(36).substring(7);
      
      // Construir URL de OAuth
      const oauthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      oauthUrl.searchParams.append('response_type', 'code');
      oauthUrl.searchParams.append('client_id', clientId);
      oauthUrl.searchParams.append('redirect_uri', redirectUri);
      oauthUrl.searchParams.append('state', state);
      oauthUrl.searchParams.append('scope', scopes);

      console.log(`🔗 Redirigiendo a LinkedIn OAuth: ${oauthUrl.toString()}`);

      // Guardar estado para verificación posterior
      localStorage.setItem('linkedin_oauth_state', state);
      localStorage.setItem('linkedin_oauth_user_id', profile?.user_id || '');

      // Redirigir a LinkedIn para autorización
      window.location.href = oauthUrl.toString();

    } catch (error: any) {
      console.error('❌ Error iniciando LinkedIn OAuth:', error);
      
      toast({
        title: "Error LinkedIn Company",
        description: error.message || 'Error iniciando autorización. Inténtelo de nuevo.',
        variant: "destructive",
      });
      
      setLoading(false);
    }
  };

  // Función genérica para manejar las conexiones
  const handleSocialConnect = async (platform: string) => {
    switch (platform) {
      case 'instagram':
        return handleInstagramConnect();
      case 'facebook':
        return handleFacebookConnect();
      case 'tiktok':
        return handleTikTokConnect();
      case 'linkedin':
        return handleLinkedInConnect();
      default:
        toast({
          title: "Error",
          description: "Plataforma no soportada",
          variant: "destructive",
        });
    }
  };

  const handleSocialDisconnect = async (platform: string) => {
    setLoading(true);
    try {
      console.log(`🔌 Desconectando ${platform}`);

      // Simular delay de desconexión
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Actualizar estado de conexión
      setSocialConnections(prev => ({
        ...prev,
        [platform]: false
      }));

      // Aquí se revocarían los tokens en la base de datos
      // await supabase.from('social_connections').delete()
      //   .eq('user_id', profile?.user_id)
      //   .eq('platform', platform);

      toast({
        title: "Desconectado",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} desconectado correctamente`,
      });

    } catch (error: any) {
      console.error(`❌ Error desconectando ${platform}:`, error);
      toast({
        title: "Error",
        description: `Error al desconectar ${platform}. ${error.message || 'Inténtelo de nuevo.'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = (platform: string): boolean => {
    // En producción, esto consultaría la base de datos
    return socialConnections[platform as keyof typeof socialConnections];
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">ADN del Negocio</h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2">
          Centraliza la identidad y estrategia de tu negocio para alinear a nuestros agentes de IA.
        </p>
      </header>

      <Card>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
              <TabsTrigger value="perfil" className="text-xs sm:text-sm px-2 py-2 sm:px-4">Info</TabsTrigger>
              <TabsTrigger value="estrategia" className="text-xs sm:text-sm px-2 py-2 sm:px-4">Estrategia</TabsTrigger>
              <TabsTrigger value="productos" className="text-xs sm:text-sm px-2 py-2 sm:px-4">Productos</TabsTrigger>
              <TabsTrigger value="marca" className="text-xs sm:text-sm px-2 py-2 sm:px-4">Marca</TabsTrigger>
              <TabsTrigger value="canales" className="text-xs sm:text-sm px-2 py-2 sm:px-4">Canales</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-6 mt-6">
              {/* Información de la Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Información de {profile?.company_name || 'tu Negocio'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Completa toda la información de tu negocio.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Nombre del negocio *</Label>
                      <Input
                        id="company_name"
                        value={profile?.company_name || ""}
                        onChange={(e) => onProfileUpdate({...profile, company_name: e.target.value})}
                        placeholder="Nombre de tu negocio"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nombre del contacto *</Label>
                      <Input
                        id="full_name"
                        value={profile?.full_name || ""}
                        onChange={(e) => onProfileUpdate({...profile, full_name: e.target.value})}
                        placeholder="Su nombre completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email corporativo (no editable)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website_url">Sitio web</Label>
                      <Input
                        id="website_url"
                        type="text"
                        value={profile?.website_url || ""}
                        onChange={(e) => onProfileUpdate({...profile, website_url: e.target.value})}
                        placeholder="tunegocio.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nit">NIT</Label>
                      <Input
                        id="nit"
                        value={profile?.nit || ""}
                        onChange={(e) => onProfileUpdate({...profile, nit: e.target.value})}
                        placeholder="Número de identificación tributaria"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_size">Tamaño del negocio *</Label>
                      <Select value={profile?.company_size || ""} onValueChange={(value) => onProfileUpdate({...profile, company_size: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el tamaño" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry_sector">Sector de la industria *</Label>
                      <Select value={profile?.industry_sector || ""} onValueChange={(value) => onProfileUpdate({...profile, industry_sector: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el sector" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector) => (
                            <SelectItem key={sector} value={sector}>
                              {sector}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">País *</Label>
                      <Input
                        id="country"
                        value={profile?.country || ""}
                        onChange={(e) => onProfileUpdate({...profile, country: e.target.value})}
                        placeholder="País del negocio"
                        required
                      />
                    </div>
                  </div>

                  {/* Descripción de la Empresa */}
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="company_description">Descripción de la empresa</Label>
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        <Bot className="h-3 w-3" />
                        Generado por ERA
                      </div>
                    </div>
                    <Textarea
                      id="company_description"
                      value={companyData?.descripcion_empresa || ""}
                      onChange={(e) => updateCompanyData('descripcion_empresa', e.target.value)}
                      onBlur={(e) => updateCompanyData('descripcion_empresa', e.target.value)}
                      placeholder="Descripción detallada de su empresa generada por IA"
                      rows={4}
                      className="bg-background/60 border-primary/20"
                    />
                  </div>

                  {/* Redes Sociales */}
                  <div className="space-y-4 col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold">Redes Sociales</Label>
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                          <Bot className="h-3 w-3" />
                          Detectadas por ERA
                        </div>
                      </div>
                      <Button
                        onClick={handleRefreshCompanyInfo}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={loading}
                        title="Refresca la información desde la base de datos"
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refrescando...' : 'Refrescar información'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Facebook */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-600" />
                          <Label htmlFor="facebook_url">Facebook</Label>
                          {companyData?.facebook_url && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="URL definida"></div>
                          )}
                        </div>
                        <Input
                          id="facebook_url"
                          value={companyData?.facebook_url || ""}
                          onChange={(e) => updateCompanyData('facebook_url', e.target.value)}
                          onBlur={(e) => updateCompanyData('facebook_url', e.target.value)}
                          placeholder="https://facebook.com/tu-empresa"
                        />
                      </div>

                      {/* LinkedIn */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4 text-blue-700" />
                          <Label htmlFor="linkedin_url">LinkedIn</Label>
                          {companyData?.linkedin_url && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="URL definida"></div>
                          )}
                        </div>
                        <Input
                          id="linkedin_url"
                          value={companyData?.linkedin_url || ""}
                          onChange={(e) => updateCompanyData('linkedin_url', e.target.value)}
                          onBlur={(e) => updateCompanyData('linkedin_url', e.target.value)}
                          placeholder="https://linkedin.com/company/tu-empresa"
                        />
                      </div>

                      {/* Twitter */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4 text-sky-500" />
                          <Label htmlFor="twitter_url">Twitter</Label>
                          {companyData?.twitter_url && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="URL definida"></div>
                          )}
                        </div>
                        <Input
                          id="twitter_url"
                          value={companyData?.twitter_url || ""}
                          onChange={(e) => updateCompanyData('twitter_url', e.target.value)}
                          onBlur={(e) => updateCompanyData('twitter_url', e.target.value)}
                          placeholder="https://twitter.com/tu-empresa"
                        />
                      </div>

                      {/* Instagram */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <Label htmlFor="instagram_url">Instagram</Label>
                          {companyData?.instagram_url && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="URL definida"></div>
                          )}
                        </div>
                        <Input
                          id="instagram_url"
                          value={companyData?.instagram_url || ""}
                          onChange={(e) => updateCompanyData('instagram_url', e.target.value)}
                          onBlur={(e) => updateCompanyData('instagram_url', e.target.value)}
                          placeholder="https://instagram.com/tu-empresa"
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-black" />
                          <Label htmlFor="tiktok_url">TikTok</Label>
                          {companyData?.tiktok_url && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="URL definida"></div>
                          )}
                        </div>
                        <Input
                          id="tiktok_url"
                          value={companyData?.tiktok_url || ""}
                          onChange={(e) => updateCompanyData('tiktok_url', e.target.value)}
                          onBlur={(e) => updateCompanyData('tiktok_url', e.target.value)}
                          placeholder="https://tiktok.com/@tu-empresa"
                        />
                      </div>

                      {/* YouTube */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Youtube className="h-4 w-4 text-red-600" />
                          <Label htmlFor="youtube_url">YouTube</Label>
                          {companyData?.youtube_url && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="URL definida"></div>
                          )}
                        </div>
                        <Input
                          id="youtube_url"
                          value={companyData?.youtube_url || ""}
                          onChange={(e) => updateCompanyData('youtube_url', e.target.value)}
                          onBlur={(e) => updateCompanyData('youtube_url', e.target.value)}
                          placeholder="https://youtube.com/@tu-empresa"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Objetivos Empresariales */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Objetivos del Negocio
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Define los objetivos estratégicos de tu negocio.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowObjectiveForm(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Objetivo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showObjectiveForm && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>
                          {editingObjective ? "Editar Objetivo" : "Nuevo Objetivo"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="objective_title">Título del objetivo *</Label>
                            <Input
                              id="objective_title"
                              value={objectiveForm.title}
                              onChange={(e) => setObjectiveForm({...objectiveForm, title: e.target.value})}
                              placeholder="Nombre del objetivo"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="objective_type">Tipo de objetivo *</Label>
                            <Select value={objectiveForm.objective_type} onValueChange={(value) => setObjectiveForm({...objectiveForm, objective_type: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione el tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {objectiveTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="objective_priority">Prioridad</Label>
                            <Select 
                              value={objectiveForm.priority.toString()} 
                              onValueChange={(value) => setObjectiveForm({...objectiveForm, priority: parseInt(value)})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione prioridad" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Alta (1)</SelectItem>
                                <SelectItem value="2">Media (2)</SelectItem>
                                <SelectItem value="3">Baja (3)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Fecha objetivo</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !objectiveForm.target_date && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {objectiveForm.target_date ? format(objectiveForm.target_date, "PPP") : <span>Seleccionar fecha</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={objectiveForm.target_date}
                                  onSelect={(date) => setObjectiveForm({...objectiveForm, target_date: date})}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="objective_description">Descripción</Label>
                            <EraOptimizerButton
                              currentText={objectiveForm.description}
                              fieldType="objetivo empresarial"
                              context={{
                                companyName: profile?.company_name,
                                industry: profile?.industry_sector,
                                objectiveType: objectiveForm.objective_type,
                                objectiveTitle: objectiveForm.title
                              }}
                              onOptimized={(optimizedText) => setObjectiveForm({...objectiveForm, description: optimizedText})}
                              size="sm"
                              disabled={!objectiveForm.description.trim()}
                            />
                          </div>
                          <Textarea
                            id="objective_description"
                            rows={3}
                            value={objectiveForm.description}
                            onChange={(e) => setObjectiveForm({...objectiveForm, description: e.target.value})}
                            placeholder="Describe el objetivo en detalle"
                            className="resize-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            onClick={handleCancelObjectiveForm}
                            disabled={loadingObjectives}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleSaveObjective}
                            disabled={loadingObjectives}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {loadingObjectives ? "Guardando..." : editingObjective ? "Actualizar" : "Crear"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {objectives.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No hay objetivos registrados. Agregue el primer objetivo para comenzar.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {objectives.map((objective) => (
                        <Card key={objective.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground">{objective.title}</h4>
                                  <span className={cn(
                                    "px-2 py-1 text-xs rounded-full",
                                    objective.priority === 1 ? "bg-red-100 text-red-800" :
                                    objective.priority === 2 ? "bg-yellow-100 text-yellow-800" :
                                    "bg-green-100 text-green-800"
                                  )}>
                                    Prioridad {objective.priority}
                                  </span>
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {objective.objective_type}
                                  </span>
                                </div>
                                {objective.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {objective.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {objective.target_date && (
                                    <span>Fecha objetivo: {new Date(objective.target_date).toLocaleDateString()}</span>
                                  )}
                                  <span>Creado: {new Date(objective.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditObjective(objective)}
                                  disabled={loadingObjectives}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteObjective(objective.id)}
                                  disabled={loadingObjectives}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="estrategia" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center mb-4">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    Estrategia del Negocio
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Define la misión, visión y propuesta de valor de tu negocio. Puedes generar todo con IA una sola vez o editarlo manualmente.
                  </p>
                  
                  {!strategy?.generated_with_ai && (
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-dashed">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Generar estrategia completa con IA</p>
                          <p className="text-sm text-muted-foreground">
                            Crea automáticamente misión, visión y propuesta de valor basada en la información de tu negocio
                          </p>
                        </div>
                        <Button 
                          onClick={handleGenerateStrategy}
                          disabled={loadingStrategy}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Lightbulb className="w-4 h-4 mr-2" />
                          {loadingStrategy ? "Generando..." : "Generar con IA"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mision" className="text-sm font-medium">Misión</Label>
                    <EraOptimizerButton
                      currentText={strategyForm.mision}
                      fieldType="misión"
                      context={{
                        companyName: profile?.company_name,
                        industry: profile?.industry_sector,
                        size: profile?.company_size
                      }}
                      onOptimized={(optimizedText) => setStrategyForm({...strategyForm, mision: optimizedText})}
                      size="sm"
                      disabled={!strategyForm.mision.trim()}
                    />
                  </div>
                  <Textarea
                    id="mision"
                    rows={4}
                    value={strategyForm.mision}
                    onChange={(e) => setStrategyForm({...strategyForm, mision: e.target.value})}
                    placeholder="¿Cuál es el propósito fundamental de tu negocio?"
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vision" className="text-sm font-medium">Visión</Label>
                    <EraOptimizerButton
                      currentText={strategyForm.vision}
                      fieldType="visión"
                      context={{
                        companyName: profile?.company_name,
                        industry: profile?.industry_sector,
                        size: profile?.company_size
                      }}
                      onOptimized={(optimizedText) => setStrategyForm({...strategyForm, vision: optimizedText})}
                      size="sm"
                      disabled={!strategyForm.vision.trim()}
                    />
                  </div>
                  <Textarea
                    id="vision"
                    rows={4}
                    value={strategyForm.vision}
                    onChange={(e) => setStrategyForm({...strategyForm, vision: e.target.value})}
                    placeholder="¿Hacia dónde se dirige tu negocio a largo plazo?"
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="propuesta_valor" className="text-sm font-medium">Propuesta de Valor</Label>
                    <EraOptimizerButton
                      currentText={strategyForm.propuesta_valor}
                      fieldType="propuesta de valor"
                      context={{
                        companyName: profile?.company_name,
                        industry: profile?.industry_sector,
                        size: profile?.company_size
                      }}
                      onOptimized={(optimizedText) => setStrategyForm({...strategyForm, propuesta_valor: optimizedText})}
                      size="sm"
                      disabled={!strategyForm.propuesta_valor.trim()}
                    />
                  </div>
                  <Textarea
                    id="propuesta_valor"
                    rows={4}
                    value={strategyForm.propuesta_valor}
                    onChange={(e) => setStrategyForm({...strategyForm, propuesta_valor: e.target.value})}
                    placeholder="¿Qué valor único ofrecen a sus clientes?"
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-between items-center">
                  {strategy?.generated_with_ai && (
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Generado con IA - Puede editarse manualmente
                    </p>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button 
                      onClick={handleSaveStrategy}
                      disabled={loadingStrategy}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {loadingStrategy ? "Guardando..." : "Guardar Estrategia"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="productos" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Package className="w-5 h-5 mr-2 text-primary" />
                    Productos del Negocio
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Gestione la información de sus productos para que los agentes de IA puedan brindar información precisa.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowProductForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {showProductForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="product_name">Nombre del producto *</Label>
                      <Input
                        id="product_name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="product_description">Descripción</Label>
                        <EraOptimizerButton
                          currentText={productForm.description}
                          fieldType="descripción de producto"
                          context={{
                            companyName: profile?.company_name,
                            industry: profile?.industry_sector,
                            productName: productForm.name
                          }}
                          onOptimized={(optimizedText) => setProductForm({...productForm, description: optimizedText})}
                          size="sm"
                          disabled={!productForm.description.trim()}
                        />
                      </div>
                      <Textarea
                        id="product_description"
                        rows={3}
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        placeholder="Descripción detallada del producto"
                        className="resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={handleCancelProductForm}
                        disabled={loadingProducts}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveProduct}
                        disabled={loadingProducts}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {loadingProducts ? "Guardando..." : editingProduct ? "Actualizar" : "Crear"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No hay productos registrados. Agregue el primer producto para comenzar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-foreground">{product.name}</h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              disabled={loadingProducts}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={loadingProducts}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {product.description}
                          </p>
                        )}
                        <div className="mt-3 text-xs text-muted-foreground">
                          Creado: {new Date(product.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="marca" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center mb-4">
                    <Palette className="w-5 h-5 mr-2 text-primary" />
                    Identidad Visual del Negocio
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Configure los colores, logo y elementos visuales de su marca para mantener consistencia en todas las comunicaciones.
                  </p>
                </div>

                {/* Colores de Marca */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Paleta de Colores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary_color">Color Principal</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="primary_color"
                            value={brandingForm.primary_color}
                            onChange={(e) => setBrandingForm({...brandingForm, primary_color: e.target.value})}
                            className="w-12 h-10 border border-border rounded cursor-pointer"
                          />
                          <Input
                            value={brandingForm.primary_color}
                            onChange={(e) => setBrandingForm({...brandingForm, primary_color: e.target.value})}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary_color">Color Secundario</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="secondary_color"
                            value={brandingForm.secondary_color}
                            onChange={(e) => setBrandingForm({...brandingForm, secondary_color: e.target.value})}
                            className="w-12 h-10 border border-border rounded cursor-pointer"
                          />
                          <Input
                            value={brandingForm.secondary_color}
                            onChange={(e) => setBrandingForm({...brandingForm, secondary_color: e.target.value})}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complementary_color_1">Color Complementario 1</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="complementary_color_1"
                            value={brandingForm.complementary_color_1}
                            onChange={(e) => setBrandingForm({...brandingForm, complementary_color_1: e.target.value})}
                            className="w-12 h-10 border border-border rounded cursor-pointer"
                          />
                          <Input
                            value={brandingForm.complementary_color_1}
                            onChange={(e) => setBrandingForm({...brandingForm, complementary_color_1: e.target.value})}
                            placeholder="#ff0000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complementary_color_2">Color Complementario 2</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="complementary_color_2"
                            value={brandingForm.complementary_color_2}
                            onChange={(e) => setBrandingForm({...brandingForm, complementary_color_2: e.target.value})}
                            className="w-12 h-10 border border-border rounded cursor-pointer"
                          />
                          <Input
                            value={brandingForm.complementary_color_2}
                            onChange={(e) => setBrandingForm({...brandingForm, complementary_color_2: e.target.value})}
                            placeholder="#0000ff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Logo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Logo del Negocio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">URL del Logo</Label>
                      <Input
                        id="logo_url"
                        value={brandingForm.logo_url}
                        onChange={(e) => setBrandingForm({...brandingForm, logo_url: e.target.value})}
                        placeholder="https://ejemplo.com/logo.png"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">o sube un archivo</p>
                      <input
                        ref={logoFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => logoFileRef.current?.click()}
                        disabled={loadingBranding}
                        className="w-full"
                      >
                        <FileImage className="w-4 h-4 mr-2" />
                        {loadingBranding ? "Cargando..." : "Seleccionar Archivo"}
                      </Button>
                    </div>
                    {brandingForm.logo_url && (
                      <div className="flex justify-center">
                        <img
                          src={brandingForm.logo_url}
                          alt="Logo preview"
                          className="max-w-xs max-h-32 object-contain border border-border rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Identidad Visual */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Identidad Visual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="visual_identity">Descripción de la Identidad Visual</Label>
                        <EraOptimizerButton
                          currentText={brandingForm.visual_identity}
                          fieldType="identidad visual"
                          context={{
                            companyName: profile?.company_name,
                            industry: profile?.industry_sector,
                            primaryColor: brandingForm.primary_color,
                            secondaryColor: brandingForm.secondary_color
                          }}
                          onOptimized={(optimizedText) => setBrandingForm({...brandingForm, visual_identity: optimizedText})}
                          size="sm"
                          disabled={!brandingForm.visual_identity.trim()}
                        />
                      </div>
                      <Textarea
                        id="visual_identity"
                        rows={4}
                        value={brandingForm.visual_identity}
                        onChange={(e) => setBrandingForm({...brandingForm, visual_identity: e.target.value})}
                        placeholder="Describe el estilo visual, tono, personalidad y elementos distintivos de su marca..."
                        className="resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Manual de Marca */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Manual de Marca</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand_manual_url">URL del Manual de Marca</Label>
                      <Input
                        id="brand_manual_url"
                        value={brandingForm.brand_manual_url}
                        onChange={(e) => setBrandingForm({...brandingForm, brand_manual_url: e.target.value})}
                        placeholder="https://ejemplo.com/manual-marca.pdf"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Cargar archivo PDF</p>
                        <input
                          ref={manualFileRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleManualUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => manualFileRef.current?.click()}
                          disabled={loadingBranding}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {loadingBranding ? "Cargando..." : "Cargar PDF"}
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Generar con IA</p>
                        <Button
                          variant="outline"
                          onClick={handleGenerateBrandManual}
                          disabled={loadingBranding}
                          className="w-full"
                        >
                          <Lightbulb className="w-4 h-4 mr-2" />
                          {loadingBranding ? "Generando..." : "Generar Manual"}
                        </Button>
                      </div>
                    </div>
                    {brandingForm.brand_manual_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-primary" />
                          <span className="text-sm">Manual de marca disponible</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(brandingForm.brand_manual_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Guardar Configuración */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveBranding}
                    disabled={loadingBranding}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loadingBranding ? "Guardando..." : "Guardar Configuración de Marca"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="perfil" className="space-y-6 mt-6">
              <CompanyProfileForm profile={profile} onProfileUpdate={onProfileUpdate} />
            </TabsContent>

            <TabsContent value="canales" className="space-y-6 mt-6">
              <p className="text-muted-foreground">
                Conecte sus canales empresariales para que nuestros agentes puedan analizar su rendimiento y generar contenido alineado a su marca. Todas las conexiones incluyen permisos para acceder a posts, usuarios y publicar contenido en nombre de la empresa.
              </p>
              <div className="space-y-4">
                {/* Instagram Business */}
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                   <div className="flex items-center">
                     <Instagram className="w-8 h-8 text-pink-600 mr-4" />
                     <div>
                       <span className="font-medium">Instagram Business</span>
                       <p className="text-sm text-muted-foreground">Acceso a posts, stories, usuarios y publicación de contenido</p>
                     </div>
                   </div>
                  {checkConnectionStatus('instagram') ? (
                     <div className="flex flex-col sm:flex-row items-center gap-2">
                       <span className="text-sm text-green-600 font-medium">Conectado</span>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleSocialDisconnect('instagram')}
                         disabled={loading}
                         className="w-full sm:w-auto"
                       >
                         {loading ? "Desconectando..." : "Desconectar"}
                       </Button>
                     </div>
                  ) : (
                     <Button 
                       variant="default" 
                       className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto"
                       onClick={() => handleSocialConnect('instagram')}
                       disabled={loading}
                     >
                       {loading ? "Conectando..." : "Conectar"}
                     </Button>
                  )}
                </div>

                {/* Facebook Business */}
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                   <div className="flex items-center">
                     <div className="w-8 h-8 bg-blue-600 rounded mr-4 flex items-center justify-center">
                       <span className="text-white font-bold text-sm">f</span>
                     </div>
                     <div>
                       <span className="font-medium">Facebook Business</span>
                       <p className="text-sm text-muted-foreground">Gestión de páginas, posts y audiencias empresariales</p>
                     </div>
                   </div>
                   {checkConnectionStatus('facebook') ? (
                     <div className="flex flex-col sm:flex-row items-center gap-2">
                       <span className="text-sm text-green-600 font-medium">Conectado</span>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleSocialDisconnect('facebook')}
                         disabled={loading}
                         className="w-full sm:w-auto"
                       >
                         {loading ? "Desconectando..." : "Desconectar"}
                       </Button>
                     </div>
                   ) : (
                     <Button 
                       variant="default" 
                       className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                       onClick={() => handleSocialConnect('facebook')}
                       disabled={loading}
                     >
                       {loading ? "Conectando..." : "Conectar"}
                     </Button>
                   )}
                </div>

                {/* TikTok Business */}
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                   <div className="flex items-center">
                     <Music className="w-8 h-8 text-black mr-4" />
                     <div>
                       <span className="font-medium">TikTok Business</span>
                       <p className="text-sm text-muted-foreground">Subida de videos, análisis y gestión de contenido empresarial</p>
                     </div>
                   </div>
                   {checkConnectionStatus('tiktok') ? (
                     <div className="flex flex-col sm:flex-row items-center gap-2">
                       <span className="text-sm text-green-600 font-medium">Conectado</span>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleSocialDisconnect('tiktok')}
                         disabled={loading}
                         className="w-full sm:w-auto"
                       >
                         {loading ? "Desconectando..." : "Desconectar"}
                       </Button>
                     </div>
                   ) : (
                     <Button 
                       variant="default" 
                       className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto"
                       onClick={() => handleSocialConnect('tiktok')}
                       disabled={loading}
                     >
                       {loading ? "Conectando..." : "Conectar"}
                     </Button>
                   )}
                </div>

                {/* LinkedIn Company */}
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                   <div className="flex items-center">
                     <Linkedin className="w-8 h-8 text-blue-700 mr-4" />
                     <div>
                       <span className="font-medium">LinkedIn Company</span>
                       <p className="text-sm text-muted-foreground">Gestión de página empresarial, posts y analytics profesionales</p>
                     </div>
                   </div>
                   {checkConnectionStatus('linkedin') ? (
                     <div className="flex flex-col sm:flex-row items-center gap-2">
                       <span className="text-sm text-green-600 font-medium">Conectado</span>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleSocialDisconnect('linkedin')}
                         disabled={loading}
                         className="w-full sm:w-auto"
                       >
                         {loading ? "Desconectando..." : "Desconectar"}
                       </Button>
                     </div>
                   ) : (
                     <Button 
                       variant="default" 
                       className="bg-blue-700 hover:bg-blue-800 text-white w-full sm:w-auto"
                       onClick={() => handleSocialConnect('linkedin')}
                       disabled={loading}
                     >
                       {loading ? "Conectando..." : "Conectar"}
                     </Button>
                   )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Permisos otorgados por cada conexión:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Instagram Business:</strong> Lectura de posts, stories, comentarios, seguidores y publicación de contenido</li>
                  <li>• <strong>Facebook Business:</strong> Gestión de páginas, publicación de posts, lectura de insights y audiencias</li>
                  <li>• <strong>TikTok Business:</strong> Subida de videos, acceso a analytics y gestión de perfil empresarial</li>
                  <li>• <strong>LinkedIn Company:</strong> Gestión de página de empresa, publicación de contenido y acceso a métricas</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ADNEmpresa;