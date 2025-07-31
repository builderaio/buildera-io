import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EraOptimizerButton } from "@/components/ui/era-optimizer-button";
import { 
  Lightbulb, Upload, Twitter, Linkedin, Instagram, Music, Youtube, Plus, Edit, Trash2, 
  Package, Palette, FileImage, FileText, Download, Target, Building2, Calendar, Globe, 
  Bot, Facebook, ExternalLink, RefreshCw, Save, Flag
} from "lucide-react";
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
  const { toast } = useToast();
  
  // Estados para gestión de redes sociales
  const [socialConnections, setSocialConnections] = useState({
    facebook: false,
    instagram: false,
    twitter: false,
    youtube: false,
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
  const [loadingObjectives, setLoadingObjectives] = useState(false);

  // Estados para gestión de datos de la empresa
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Estados para branding
  const [brandingForm, setBrandingForm] = useState({
    primary_color: "",
    secondary_color: "",
    complementary_color_1: "",
    complementary_color_2: "",
    visual_identity: ""
  });
  const [loadingBranding, setLoadingBranding] = useState(false);
  
  // Estados para controlar el uso de ERA en branding
  const [brandingEraUsage, setBrandingEraUsage] = useState({
    generatedWithAI: false,
    visualIdentityOptimized: false
  });

  // Estados para estrategia
  const [strategyForm, setStrategyForm] = useState({
    vision: "",
    mission: "",
    propuesta_valor: ""
  });
  
  // Estados para controlar el uso de ERA en estrategia
  const [strategyEraUsage, setStrategyEraUsage] = useState({
    generatedWithAI: false,
    visionOptimized: false,
    missionOptimized: false,
    propuestaValorOptimized: false
  });
  const [loadingStrategy, setLoadingStrategy] = useState(false);

  // Estados para objetivos
  const [objectives, setObjectives] = useState<any[]>([]);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [objectiveForm, setObjectiveForm] = useState({
    title: "",
    description: "",
    objective_type: "short_term" as "short_term" | "medium_term" | "long_term",
    target_date: "",
    priority: 1,
    status: "active" as "active" | "completed" | "paused"
  });

  const companySizes = [
    "1-10 empleados",
    "11-50 empleados", 
    "51-200 empleados",
    "201-500 empleados",
    "500+ empleados"
  ];

  const sectors = [
    "Tecnología",
    "Servicios Financieros",
    "Salud",
    "Educación",
    "Retail",
    "Manufactura",
    "Construcción",
    "Transporte",
    "Turismo",
    "Alimentos y Bebidas",
    "Textil",
    "Agricultura",
    "Energía",
    "Otro"
  ];

  // Función para actualizar datos de la empresa
  const updateCompanyData = (field: string, value: any) => {
    setCompanyData((prev: any) => prev ? { ...prev, [field]: value } : null);
  };

  // Cargar datos de la empresa al montar el componente
  useEffect(() => {
    if (profile?.user_id) {
      fetchCompanyData();
      fetchProducts();
      fetchBranding();
      fetchStrategy();
      fetchObjectives();
    }
  }, [profile?.user_id]);

  // Función para obtener datos de la empresa
  const fetchCompanyData = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (companies && companies.length > 0) {
        setCompanyData(companies[0]);
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
    }
  };

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
        description: "El nombre del producto es requerido",
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
            description: productForm.description || null
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
            name: productForm.name,
            description: productForm.description || null,
            user_id: profile?.user_id
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

  const handleDeleteEraProduct = async (productIndex: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este producto detectado por ERA?")) {
      return;
    }

    try {
      // Para productos de ERA, los eliminamos modificando los webhook_data
      const updatedWebhookData = [...(companyData?.webhook_data || [])];
      if (updatedWebhookData[0]?.response) {
        // Remover las entradas del producto específico
        updatedWebhookData[0].response = updatedWebhookData[0].response.filter(
          item => !item.key.includes(`producto_servicio_${productIndex}_`)
        );
      }

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('companies')
        .update({ webhook_data: updatedWebhookData })
        .eq('id', companyData?.id);

      if (error) throw error;

      // Actualizar el estado local
      setCompanyData(prev => prev ? { ...prev, webhook_data: updatedWebhookData } : prev);

      toast({
        title: "Producto eliminado",
        description: "El producto detectado por ERA se ha eliminado correctamente",
      });

    } catch (error: any) {
      console.error('Error deleting ERA product:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const handleCancelProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: ""
    });
  };

  // Funciones para branding
  const fetchBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('user_id', profile?.user_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBrandingForm({
          primary_color: data.primary_color || "",
          secondary_color: data.secondary_color || "",
          complementary_color_1: data.complementary_color_1 || "",
          complementary_color_2: data.complementary_color_2 || "",
          visual_identity: data.visual_identity || ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching branding:', error);
    }
  };

  // Funciones para estrategia
  const fetchStrategy = async () => {
    console.log('=== DEBUG: Iniciando fetchStrategy ===');
    console.log('profile?.user_id:', profile?.user_id);
    
    if (!profile?.user_id) {
      console.log('No hay user_id, saliendo de fetchStrategy');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_strategy')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('Strategy data from DB:', data);
      console.log('Strategy error:', error);

      if (error) throw error;

      if (data && data.length > 0) {
        const strategy = data[0];
        console.log('Setting strategy form with:', strategy);
        
        // Función para normalizar saltos de línea al mostrar
        const normalizeForDisplay = (text: string | null): string => {
          if (!text) return "";
          return text.replace(/\\n/g, '\n'); // Convertir \n literales a saltos reales
        };
        
        setStrategyForm({
          vision: normalizeForDisplay(strategy.vision),
          mission: normalizeForDisplay(strategy.mision),
          propuesta_valor: normalizeForDisplay(strategy.propuesta_valor)
        });

        // Actualizar estado de ERA basado en los datos de la base de datos
        setStrategyEraUsage({
          generatedWithAI: strategy.generated_with_ai || false,
          visionOptimized: strategy.generated_with_ai || false,
          missionOptimized: strategy.generated_with_ai || false,
          propuestaValorOptimized: strategy.generated_with_ai || false
        });
      } else {
        console.log('No strategy found, setting empty form');
        setStrategyForm({
          vision: "",
          mission: "",
          propuesta_valor: ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching strategy:', error);
    }
  };

  // Funciones para objetivos
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
    }
  };

  const handleSaveObjective = async () => {
    if (!objectiveForm.title.trim()) {
      toast({
        title: "Error",
        description: "El título del objetivo es requerido",
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
            description: objectiveForm.description || null,
            objective_type: objectiveForm.objective_type,
            target_date: objectiveForm.target_date || null,
            priority: objectiveForm.priority,
            status: objectiveForm.status
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
            title: objectiveForm.title,
            description: objectiveForm.description || null,
            objective_type: objectiveForm.objective_type,
            target_date: objectiveForm.target_date || null,
            priority: objectiveForm.priority,
            status: objectiveForm.status,
            user_id: profile?.user_id
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
      target_date: objective.target_date || "",
      priority: objective.priority || 1,
      status: objective.status
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
      objective_type: "short_term",
      target_date: "",
      priority: 1,
      status: "active"
    });
  };

  // Función auxiliar para guardar estrategia en la base de datos
  const saveStrategyToDatabase = async (strategyData: any, generatedWithAI: boolean = false) => {
    console.log('💾 saveStrategyToDatabase llamada con:', { strategyData, generatedWithAI, userId: profile?.user_id });
    
    if (!profile?.user_id) {
      console.error('❌ No hay user_id disponible');
      throw new Error("No se pudo identificar el usuario");
    }

    // Función para normalizar saltos de línea
    const normalizeLineBreaks = (text: string | null | undefined): string | null => {
      if (!text) return null;
      return text
        .replace(/\\n/g, '\n') // Convertir \n literales a saltos de línea reales
        .replace(/\r\n/g, '\n') // Normalizar saltos de línea de Windows
        .replace(/\r/g, '\n') // Normalizar saltos de línea de Mac
        .trim(); // Eliminar espacios al inicio y final
    };

    const { data: existingStrategy, error: selectError } = await supabase
      .from('company_strategy')
      .select('id')
      .eq('user_id', profile.user_id)
      .limit(1);

    if (selectError) {
      console.error('Error al buscar estrategia existente:', selectError);
      throw selectError;
    }

    if (existingStrategy && existingStrategy.length > 0) {
      console.log('🔄 Actualizando estrategia existente:', existingStrategy[0].id);
      // Actualizar estrategia existente
      const { error } = await supabase
        .from('company_strategy')
        .update({
          vision: normalizeLineBreaks(strategyData.vision),
          mision: normalizeLineBreaks(strategyData.mission),
          propuesta_valor: normalizeLineBreaks(strategyData.propuesta_valor),
          generated_with_ai: generatedWithAI,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStrategy[0].id);

      console.log('🔄 Resultado de actualización:', { error });
      if (error) throw error;
    } else {
      console.log('➕ Creando nueva estrategia...');
      // Crear nueva estrategia
      const { data: insertData, error } = await supabase
        .from('company_strategy')
        .insert({
          vision: normalizeLineBreaks(strategyData.vision),
          mision: normalizeLineBreaks(strategyData.mission),
          propuesta_valor: normalizeLineBreaks(strategyData.propuesta_valor),
          user_id: profile.user_id,
          generated_with_ai: generatedWithAI
        });

      console.log('➕ Resultado de inserción:', { insertData, error });
      if (error) throw error;
    }
  };

  // Función para guardar estrategia
  const handleSaveStrategy = async () => {
    console.log('=== DEBUG: Iniciando handleSaveStrategy ===');
    console.log('strategyForm:', strategyForm);
    console.log('profile?.user_id:', profile?.user_id);
    
    if (!profile?.user_id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario. Intenta recargar la página.",
        variant: "destructive",
      });
      return;
    }

    setLoadingStrategy(true);
    try {
      await saveStrategyToDatabase(strategyForm, false);

      toast({
        title: "Estrategia guardada",
        description: "Los fundamentos estratégicos se han guardado correctamente",
      });

      // Recargar los datos para verificar que se guardaron
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

  // Función para generar estrategia con IA
  const handleGenerateStrategy = async () => {
    if (!companyData?.name && !profile?.company_name) {
      toast({
        title: "Error",
        description: "Se requiere el nombre de la empresa para generar la estrategia",
        variant: "destructive",
      });
      return;
    }

    setLoadingStrategy(true);
    try {
      const companyInfo = `Empresa ${companyData?.name || profile?.company_name}, Sitio web: ${companyData?.website_url || profile?.website_url || 'No disponible'}, País: ${profile?.country || 'No especificado'}, Descripción: ${companyData?.descripcion_empresa || 'No disponible'}`;

      console.log('🚀 Llamando al webhook con:', {
        KEY: 'STRATEGY',
        COMPANY_INFO: companyInfo
      });

      const { data, error } = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
        body: {
          KEY: 'STRATEGY',
          COMPANY_INFO: companyInfo,
          ADDITIONAL_INFO: ''
        }
      });

      console.log('📥 Respuesta del supabase.functions.invoke:', { data, error });

      if (error) {
        console.error('❌ Error en la llamada a supabase:', error);
        throw error;
      }

      console.log('🔍 Respuesta completa del webhook:', data);

      // La respuesta de n8n tiene estructura: [{ "response": [...] }]
      // Necesitamos acceder a data.data[0].response
      const webhookData = data?.data;
      console.log('📋 Webhook data completa:', webhookData);
      console.log('📋 Tipo de webhookData:', typeof webhookData, Array.isArray(webhookData));
      
      // Extraer el array real de los datos anidados
      let responseData = null;
      if (webhookData && Array.isArray(webhookData) && webhookData.length > 0 && webhookData[0].response) {
        responseData = webhookData[0].response;
      }
      
      console.log('📋 Datos de estrategia extraídos:', responseData);
      console.log('📋 Tipo de responseData:', typeof responseData, Array.isArray(responseData));

      if (responseData && Array.isArray(responseData)) {
        const strategyData = {
          mission: '',
          vision: '',
          propuesta_valor: ''
        };

        responseData.forEach((item: any) => {
          if (item.key === 'mision') {
            strategyData.mission = item.value;
          } else if (item.key === 'vision') {
            strategyData.vision = item.value;
          } else if (item.key === 'propuesta_valor') {
            strategyData.propuesta_valor = item.value;
          }
        });

        setStrategyForm(strategyData);

        // Guardar automáticamente en la base de datos
        await saveStrategyToDatabase(strategyData, true);

        // Marcar que se generó con IA
        setStrategyEraUsage({
          generatedWithAI: true,
          visionOptimized: true,
          missionOptimized: true,
          propuestaValorOptimized: true
        });

        toast({
          title: "Estrategia generada y guardada",
          description: "Los fundamentos estratégicos han sido generados con IA y guardados en la base de datos",
        });
      } else {
        console.log('❌ No se recibieron datos válidos para la estrategia:', responseData);
        toast({
          title: "Error en los datos",
          description: "No se recibieron datos válidos del servicio de IA. Intenta nuevamente.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la estrategia con IA",
        variant: "destructive",
      });
    } finally {
      setLoadingStrategy(false);
    }
  };

  // Funciones para optimizar campos individuales con ERA
  const optimizeFieldWithEra = async (fieldName: 'vision' | 'mission' | 'propuesta_valor', fieldType: string) => {
    if (!strategyForm[fieldName].trim()) {
      toast({
        title: "Campo vacío",
        description: "Primero ingresa contenido en el campo para poder optimizarlo",
        variant: "destructive",
      });
      return;
    }

    setLoadingStrategy(true);
    try {
      const { data, error } = await supabase.functions.invoke('era-content-optimizer', {
        body: {
          currentText: strategyForm[fieldName],
          fieldType: fieldType,
          context: {
            company: companyData?.name || profile?.company_name,
            industry: companyData?.industry_sector || profile?.industry_sector
          }
        }
      });

      if (error) throw error;

      if (data?.optimizedText) {
        // Actualizar el campo con el texto optimizado
        const updatedForm = { ...strategyForm, [fieldName]: data.optimizedText };
        setStrategyForm(updatedForm);

        // Marcar que este campo fue optimizado
        setStrategyEraUsage(prev => ({
          ...prev,
          [`${fieldName}Optimized`]: true
        }));

        // Guardar automáticamente
        await saveStrategyToDatabase(updatedForm, false);

        toast({
          title: "Campo optimizado",
          description: `El campo ${fieldType} ha sido optimizado con ERA`,
        });
      }
    } catch (error: any) {
      console.error('Error optimizing field:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo optimizar el campo",
        variant: "destructive",
      });
    } finally {
      setLoadingStrategy(false);
    }
  };

  // Funciones para branding
  const saveBrandingToDatabase = async (brandingData: any, generatedWithAI: boolean = false) => {
    console.log('💾 saveBrandingToDatabase llamada con:', { brandingData, generatedWithAI, userId: profile?.user_id });
    
    if (!profile?.user_id) {
      console.error('❌ No user_id available for saving branding');
      return;
    }

    const normalizeLineBreaks = (text: string) => {
      if (!text) return text;
      return text.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
    };

    const normalizedData = {
      primary_color: brandingData.primary_color?.trim() || '',
      secondary_color: brandingData.secondary_color?.trim() || '',
      complementary_color_1: brandingData.complementary_color_1?.trim() || '',
      complementary_color_2: brandingData.complementary_color_2?.trim() || '',
      visual_identity: normalizeLineBreaks(brandingData.visual_identity) || ''
    };

    try {
      // Verificar si ya existe un registro de branding
      const { data: existing } = await supabase
        .from('company_branding')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      let result;
      if (existing) {
        console.log('📝 Actualizando branding existente...');
        result = await supabase
          .from('company_branding')
          .update(normalizedData)
          .eq('user_id', profile.user_id);
      } else {
        console.log('➕ Creando nuevo branding...');
        result = await supabase
          .from('company_branding')
          .insert([{
            user_id: profile.user_id,
            ...normalizedData
          }]);
      }

      console.log('💾 Resultado de guardado:', { insertData: result.data, error: result.error });

      if (result.error) {
        console.error('❌ Error guardando branding:', result.error);
        throw new Error(`Error al guardar: ${result.error.message}`);
      }

      console.log('✅ Branding guardado exitosamente');
    } catch (error: any) {
      console.error('❌ Error en saveBrandingToDatabase:', error);
      throw error;
    }
  };

  const handleGenerateBranding = async () => {
    console.log('🚀 Iniciando generación de branding con IA...');
    setLoadingBranding(true);

    if (!profile?.user_id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive",
      });
      setLoadingBranding(false);
      return;
    }

    try {
      // Crear la información de la empresa
      const companyInfo = `Empresa ${profile?.company_name || 'Sin nombre'}, Sitio web: ${profile?.website_url || 'No especificado'}, País: ${profile?.country || 'No especificado'}, Descripción: ${companyData?.description || 'No se encontró información específica sobre la descripción, misión o visión de la empresa en su sitio web.'}`;
      
      // Crear la información adicional con redes sociales
      const socialNetworks = [];
      if (companyData?.facebook_url) socialNetworks.push(`Facebook: ${companyData.facebook_url}`);
      if (companyData?.instagram_url) socialNetworks.push(`Instagram: ${companyData.instagram_url}`);
      if (companyData?.twitter_url) socialNetworks.push(`Twitter: ${companyData.twitter_url}`);
      if (companyData?.linkedin_url) socialNetworks.push(`LinkedIn: ${companyData.linkedin_url}`);
      if (companyData?.youtube_url) socialNetworks.push(`YouTube: ${companyData.youtube_url}`);
      if (companyData?.tiktok_url) socialNetworks.push(`TikTok: ${companyData.tiktok_url}`);
      
      const additionalInfo = socialNetworks.length > 0 
        ? `Redes Sociales: ${socialNetworks.join(', ')}`
        : 'Redes Sociales: No especificadas';

      const brandWebhookData = {
        KEY: "BRAND",
        COMPANY_INFO: companyInfo,
        ADDITIONAL_INFO: additionalInfo
      };

      console.log('🚀 Llamando al webhook con:', brandWebhookData);

      const { data: response, error } = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
        body: brandWebhookData
      });

      console.log('📥 Respuesta del supabase.functions.invoke:', { data: response, error });

      if (error) {
        console.error('❌ Error en la función:', error);
        throw new Error(`Error en la función: ${error.message}`);
      }

      if (!response?.success || !response?.data) {
        console.error('❌ Respuesta inválida:', response);
        throw new Error('No se recibió una respuesta válida del servicio');
      }

      console.log('🔍 Respuesta completa del webhook:', response);
      console.log('📋 Webhook data completa:', response.data);

      const brandData = response.data;
      console.log('📋 Tipo de brandData:', typeof brandData, Array.isArray(brandData));

      // Procesar la respuesta del webhook
      if (Array.isArray(brandData) && brandData.length > 0) {
        // Verificar si tiene la estructura con "response"
        const responseData = brandData[0]?.response || brandData;
        console.log('📋 Datos de branding extraídos:', responseData);
        console.log('📋 Tipo de responseData:', typeof responseData, Array.isArray(responseData));

        // Verificar que responseData sea un array válido
        if (Array.isArray(responseData) && responseData.length > 0) {
          const brandingData = {
            primary_color: '',
            secondary_color: '',
            complementary_color_1: '',
            complementary_color_2: '',
            visual_identity: ''
          };

          responseData.forEach((item: any) => {
            console.log('🔍 Procesando item:', item);
            if (item.key === 'color_principal') {
              brandingData.primary_color = item.value;
            } else if (item.key === 'color_secundario') {
              brandingData.secondary_color = item.value;
            } else if (item.key === 'color_complementario1') {
              brandingData.complementary_color_1 = item.value;
            } else if (item.key === 'color_complementario2') {
              brandingData.complementary_color_2 = item.value;
            } else if (item.key === 'identidad_visual') {
              brandingData.visual_identity = item.value;
            }
          });

          setBrandingForm(brandingData);

          // Guardar automáticamente en la base de datos
          await saveBrandingToDatabase(brandingData, true);

          // Marcar que se generó con IA
          setBrandingEraUsage({
            generatedWithAI: true,
            visualIdentityOptimized: true
          });

          toast({
            title: "Branding generado y guardado",
            description: "La identidad de marca ha sido generada con IA y guardada en la base de datos",
          });
        } else {
          console.log('❌ responseData no es un array válido:', responseData);
          toast({
            title: "Error en el formato de datos",
            description: "Los datos recibidos no tienen el formato esperado",
            variant: "destructive",
          });
        }
      } else {
        console.log('❌ No se recibieron datos válidos para el branding:', brandData);
        toast({
          title: "Error en los datos",
          description: "No se recibieron datos válidos del servicio de IA. Intenta nuevamente.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error generating branding:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el branding con IA",
        variant: "destructive",
      });
    } finally {
      setLoadingBranding(false);
    }
  };

  const handleSaveBranding = async () => {
    setLoadingBranding(true);
    try {
      await saveBrandingToDatabase(brandingForm);
      toast({
        title: "Branding guardado",
        description: "La información de marca se ha guardado correctamente",
      });
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el branding",
        variant: "destructive",
      });
    } finally {
      setLoadingBranding(false);
    }
  };

  const optimizeBrandingFieldWithEra = async () => {
    if (!brandingForm.visual_identity.trim()) {
      toast({
        title: "Campo vacío",
        description: "Primero ingresa contenido en el campo para poder optimizarlo",
        variant: "destructive",
      });
      return;
    }

    setLoadingBranding(true);
    try {
      const { data, error } = await supabase.functions.invoke('era-content-optimizer', {
        body: {
          currentText: brandingForm.visual_identity,
          fieldType: 'identidad visual',
          context: {
            company: companyData?.name || profile?.company_name,
            industry: companyData?.industry_sector || profile?.industry_sector
          }
        }
      });

      if (error) throw error;

      if (data?.optimizedText) {
        setBrandingForm({...brandingForm, visual_identity: data.optimizedText});
        setBrandingEraUsage({...brandingEraUsage, visualIdentityOptimized: true});
        
        // Guardar automáticamente
        await saveBrandingToDatabase({...brandingForm, visual_identity: data.optimizedText});
        
        toast({
          title: "Campo optimizado",
          description: "La identidad visual ha sido optimizada y guardada",
        });
      }
    } catch (error: any) {
      console.error('Error optimizing branding field:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo optimizar el campo",
        variant: "destructive",
      });
    } finally {
      setLoadingBranding(false);
    }
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
              {/* SECCIÓN 1: INFORMACIÓN GENERAL DE LA EMPRESA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Building2 className="w-5 h-5 mr-2 text-primary" />
                    Información General del Negocio
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Datos básicos, legales y de contacto de tu empresa
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Datos Básicos */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Información Básica
                    </h4>
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
                        <Label htmlFor="email">Email corporativo</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || ""}
                          disabled
                          className="bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website_url">Sitio web</Label>
                        <Input
                          id="website_url"
                          type="text"
                          value={profile?.website_url || ""}
                          onChange={(e) => onProfileUpdate({...profile, website_url: e.target.value})}
                          placeholder="https://tunegocio.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descripción Generada por IA */}
                  {companyData?.descripcion_empresa && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Descripción del Negocio</h4>
                          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            <Bot className="h-3 w-3" />
                            Generado por ERA
                          </div>
                        </div>
                        <Textarea
                          value={companyData?.descripcion_empresa || ""}
                          onChange={(e) => updateCompanyData('descripcion_empresa', e.target.value)}
                          placeholder="Descripción detallada de su empresa generada por IA"
                          rows={4}
                          className="bg-background/60 border-primary/20"
                        />
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Información Legal y Empresarial */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Información Legal y Empresarial
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nit">NIT / Registro Fiscal</Label>
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
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Seleccione el tamaño" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {companySizes.map((size) => (
                              <SelectItem key={size} value={size} className="hover:bg-accent focus:bg-accent">
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry_sector">Sector de la industria *</Label>
                        <Select value={profile?.industry_sector || ""} onValueChange={(value) => onProfileUpdate({...profile, industry_sector: value})}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Seleccione el sector" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {sectors.map((sector) => (
                              <SelectItem key={sector} value={sector} className="hover:bg-accent focus:bg-accent">
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
                  </div>
                </CardContent>
              </Card>

              {/* SECCIÓN 2: PRESENCIA DIGITAL Y REDES SOCIALES */}
              {companyData?.descripcion_empresa && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Globe className="w-5 h-5 mr-2 text-primary" />
                      Presencia Digital
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs ml-2">
                        <Bot className="h-3 w-3" />
                        Detectadas por ERA
                      </div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Enlaces y perfiles en redes sociales de tu empresa
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Facebook */}
                      <div className="space-y-2">
                        <Label htmlFor="facebook_url" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">f</span>
                          </div>
                          Facebook
                        </Label>
                        <Input
                          id="facebook_url"
                          value={companyData?.facebook_url || ""}
                          onChange={(e) => updateCompanyData('facebook_url', e.target.value)}
                          placeholder="https://facebook.com/tu-empresa"
                          className="bg-background/60"
                        />
                      </div>

                      {/* Instagram */}
                      <div className="space-y-2">
                        <Label htmlFor="instagram_url" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">ig</span>
                          </div>
                          Instagram
                        </Label>
                        <Input
                          id="instagram_url"
                          value={companyData?.instagram_url || ""}
                          onChange={(e) => updateCompanyData('instagram_url', e.target.value)}
                          placeholder="https://instagram.com/tu-empresa"
                          className="bg-background/60"
                        />
                      </div>

                      {/* YouTube */}
                      <div className="space-y-2">
                        <Label htmlFor="youtube_url" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-red-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">▶</span>
                          </div>
                          YouTube
                        </Label>
                        <Input
                          id="youtube_url"
                          value={companyData?.youtube_url || ""}
                          onChange={(e) => updateCompanyData('youtube_url', e.target.value)}
                          placeholder="https://youtube.com/@tu-empresa"
                          className="bg-background/60"
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-2">
                        <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-black flex items-center justify-center">
                            <span className="text-white text-xs font-bold">tt</span>
                          </div>
                          TikTok
                        </Label>
                        <Input
                          id="tiktok_url"
                          value={companyData?.tiktok_url || ""}
                          onChange={(e) => updateCompanyData('tiktok_url', e.target.value)}
                          placeholder="https://tiktok.com/@tu-empresa"
                          className="bg-background/60"
                        />
                      </div>

                      {/* LinkedIn */}
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-blue-700 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">in</span>
                          </div>
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin_url"
                          value={companyData?.linkedin_url || ""}
                          onChange={(e) => updateCompanyData('linkedin_url', e.target.value)}
                          placeholder="https://linkedin.com/company/tu-empresa"
                          className="bg-background/60"
                        />
                      </div>

                      {/* Twitter/X */}
                      <div className="space-y-2">
                        <Label htmlFor="twitter_url" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-black flex items-center justify-center">
                            <span className="text-white text-xs font-bold">X</span>
                          </div>
                          Twitter / X
                        </Label>
                        <Input
                          id="twitter_url"
                          value={companyData?.twitter_url || ""}
                          onChange={(e) => updateCompanyData('twitter_url', e.target.value)}
                          placeholder="https://x.com/tu-empresa"
                          className="bg-background/60"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* BOTÓN DE ACCIÓN */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    toast({
                      title: "Cambios guardados",
                      description: "La información de la empresa ha sido actualizada correctamente",
                    });
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar cambios
                </Button>
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

              {/* Productos detectados por ERA */}
              {companyData?.webhook_data && companyData.webhook_data.length > 0 && (() => {
                const webhookResponse = companyData.webhook_data[0]?.response || [];
                const productos = [];
                
                // Buscar productos en la respuesta del webhook
                for (let i = 1; i <= 10; i++) {
                  const nombre = webhookResponse.find(item => item.key === `producto_servicio_${i}_nombre`)?.value;
                  const descripcion = webhookResponse.find(item => item.key === `producto_servicio_${i}_descripcion`)?.value;
                  
                  if (nombre && nombre !== "No tiene") {
                    productos.push({ 
                      id: `era_${i}`, 
                      name: nombre, 
                      description: descripcion, 
                      index: i,
                      isEraProduct: true,
                      created_at: companyData.webhook_processed_at || new Date().toISOString()
                    });
                  }
                }
                
                return productos.length > 0 ? (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        Productos detectados por ERA
                        <div className="flex items-center gap-1 px-2 py-1 bg-secondary/50 text-secondary-foreground rounded-full text-xs">
                          Detectados automáticamente
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {productos.map((product) => (
                          <Card key={product.id} className="hover:shadow-md transition-shadow border-primary/20">
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
                                    onClick={() => handleDeleteEraProduct(product.index)}
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
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-primary">
                                  <Bot className="h-3 w-3" />
                                  Detectado por IA
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(product.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              {/* Formulario de producto */}
              {showProductForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
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

              {products.length === 0 && (!companyData?.webhook_data || companyData.webhook_data.length === 0) ? (
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

            {/* Las demás pestañas (Estrategia, Marca, Canales) mantienen su estructura original */}
            <TabsContent value="estrategia" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    Estrategia Empresarial
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Define los fundamentos y objetivos estratégicos de tu negocio para que los agentes de IA puedan alinear sus acciones.
                  </p>
                </div>
              </div>

              {/* Fundamentos Estratégicos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <Flag className="w-5 h-5 mr-2 text-primary" />
                      Fundamentos Estratégicos
                      {strategyEraUsage.generatedWithAI && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs ml-3">
                          <Bot className="h-3 w-3" />
                          Generado por ERA
                        </div>
                      )}
                    </CardTitle>
                    <Button 
                      onClick={handleGenerateStrategy}
                      disabled={loadingStrategy || strategyEraUsage.generatedWithAI}
                      variant="outline"
                      size="sm"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      {loadingStrategy ? "Generando..." : "Generar con IA"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define la misión, visión y propuesta de valor de tu empresa
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Misión */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="mission">Misión</Label>
                          {strategyEraUsage.missionOptimized && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              <Bot className="h-3 w-3" />
                              Generado por ERA
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => optimizeFieldWithEra('mission', 'misión empresarial')}
                          disabled={loadingStrategy || strategyEraUsage.missionOptimized || !strategyForm.mission.trim()}
                          size="sm"
                          variant="outline"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          Optimizar con ERA
                        </Button>
                      </div>
                      <Textarea
                        id="mission"
                        rows={3}
                        value={strategyForm.mission}
                        onChange={(e) => setStrategyForm({...strategyForm, mission: e.target.value})}
                        placeholder="¿Cuál es el propósito fundamental de tu empresa? ¿Por qué existe?"
                        className="resize-none"
                      />
                    </div>

                    {/* Visión */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="vision">Visión</Label>
                          {strategyEraUsage.visionOptimized && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              <Bot className="h-3 w-3" />
                              Generado por ERA
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => optimizeFieldWithEra('vision', 'visión empresarial')}
                          disabled={loadingStrategy || strategyEraUsage.visionOptimized || !strategyForm.vision.trim()}
                          size="sm"
                          variant="outline"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          Optimizar con ERA
                        </Button>
                      </div>
                      <Textarea
                        id="vision"
                        rows={3}
                        value={strategyForm.vision}
                        onChange={(e) => setStrategyForm({...strategyForm, vision: e.target.value})}
                        placeholder="¿Qué aspira ser tu empresa en el futuro? ¿Cuál es su meta a largo plazo?"
                        className="resize-none"
                      />
                    </div>

                    {/* Propuesta de Valor */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="propuesta_valor">Propuesta de Valor</Label>
                          {strategyEraUsage.propuestaValorOptimized && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              <Bot className="h-3 w-3" />
                              Generado por ERA
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => optimizeFieldWithEra('propuesta_valor', 'propuesta de valor')}
                          disabled={loadingStrategy || strategyEraUsage.propuestaValorOptimized || !strategyForm.propuesta_valor.trim()}
                          size="sm"
                          variant="outline"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          Optimizar con ERA
                        </Button>
                      </div>
                      <Textarea
                        id="propuesta_valor"
                        rows={4}
                        value={strategyForm.propuesta_valor}
                        onChange={(e) => setStrategyForm({...strategyForm, propuesta_valor: e.target.value})}
                        placeholder="¿Qué valor único ofreces a tus clientes? ¿Qué te diferencia de la competencia?"
                        className="resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveStrategy}
                      disabled={loadingStrategy}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loadingStrategy ? "Guardando..." : "Guardar Fundamentos"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Objetivos Estratégicos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <Target className="w-5 h-5 mr-2 text-primary" />
                      Objetivos Estratégicos
                    </CardTitle>
                    <Button 
                      onClick={() => setShowObjectiveForm(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Objetivo
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define los objetivos específicos y medibles para alcanzar tu visión
                  </p>
                </CardHeader>
                <CardContent>

                  <div className="space-y-4">
                {objectives.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-medium text-foreground mb-2">No hay objetivos definidos</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Comienza definiendo los objetivos estratégicos de tu negocio.
                      </p>
                      <Button 
                        onClick={() => setShowObjectiveForm(true)}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Crear primer objetivo
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {['short_term', 'medium_term', 'long_term'].map((term) => {
                      const termObjectives = objectives.filter(obj => obj.objective_type === term);
                      const termLabels = {
                        short_term: 'Corto Plazo (1-6 meses)',
                        medium_term: 'Mediano Plazo (6 meses - 2 años)',
                        long_term: 'Largo Plazo (2+ años)'
                      };
                      
                      if (termObjectives.length === 0) return null;
                      
                      return (
                        <Card key={term}>
                          <CardHeader>
                            <CardTitle className="text-base">{termLabels[term as keyof typeof termLabels]}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {termObjectives.map((objective) => (
                                <div key={objective.id} className="flex items-start justify-between p-4 border rounded-lg">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-foreground">{objective.title}</h4>
                                    {objective.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{objective.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      {objective.target_date && (
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(objective.target_date).toLocaleDateString()}
                                        </div>
                                      )}
                                      <Badge 
                                        variant={objective.status === 'active' ? 'default' : 
                                                objective.status === 'completed' ? 'secondary' : 'outline'}
                                        className="text-xs"
                                      >
                                        {objective.status === 'active' ? 'Activo' : 
                                         objective.status === 'completed' ? 'Completado' : 'Pausado'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 ml-4">
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
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                  </div>
                </CardContent>
              </Card>

              {/* Formulario de objetivo */}
              {showObjectiveForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingObjective ? "Editar Objetivo" : "Nuevo Objetivo Estratégico"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="objective_type">Tipo de objetivo *</Label>
                        <Select 
                          value={objectiveForm.objective_type}
                          onValueChange={(value) => setObjectiveForm({...objectiveForm, objective_type: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el plazo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short_term">Corto Plazo (1-6 meses)</SelectItem>
                            <SelectItem value="medium_term">Mediano Plazo (6 meses - 2 años)</SelectItem>
                            <SelectItem value="long_term">Largo Plazo (2+ años)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="objective_status">Estado</Label>
                        <Select 
                          value={objectiveForm.status}
                          onValueChange={(value) => setObjectiveForm({...objectiveForm, status: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                            <SelectItem value="paused">Pausado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="objective_title">Título del objetivo *</Label>
                      <Input
                        id="objective_title"
                        value={objectiveForm.title}
                        onChange={(e) => setObjectiveForm({...objectiveForm, title: e.target.value})}
                        placeholder="Ej: Aumentar ventas en un 25%"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="objective_description">Descripción detallada</Label>
                        <EraOptimizerButton
                          currentText={objectiveForm.description}
                          fieldType="objetivo estratégico"
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
                        placeholder="Describe el objetivo y cómo planeas alcanzarlo"
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="objective_target_date">Fecha objetivo</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {objectiveForm.target_date 
                              ? new Date(objectiveForm.target_date).toLocaleDateString()
                              : "Seleccionar fecha"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={objectiveForm.target_date ? new Date(objectiveForm.target_date) : undefined}
                            onSelect={(date) => setObjectiveForm({
                              ...objectiveForm, 
                              target_date: date ? date.toISOString().split('T')[0] : ""
                            })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowObjectiveForm(false);
                          setEditingObjective(null);
                          setObjectiveForm({
                            objective_type: 'short_term',
                            title: '',
                            description: '',
                            target_date: '',
                            priority: 1,
                            status: 'active'
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveObjective}
                        disabled={loadingObjectives || !objectiveForm.title.trim()}
                      >
                        {loadingObjectives ? "Guardando..." : editingObjective ? "Actualizar" : "Crear Objetivo"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="marca" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-primary" />
                    Identidad de Marca
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Define los colores y la identidad visual de tu marca para que los agentes de IA puedan crear contenido coherente.
                  </p>
                </div>
              </div>

              {/* Paleta de Colores e Identidad Visual */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <Palette className="w-5 h-5 mr-2 text-primary" />
                      Paleta de Colores e Identidad Visual
                      {brandingEraUsage.generatedWithAI && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs ml-3">
                          <Bot className="h-3 w-3" />
                          Generado por ERA
                        </div>
                      )}
                    </CardTitle>
                    <Button 
                      onClick={handleGenerateBranding}
                      disabled={loadingBranding || brandingEraUsage.generatedWithAI}
                      variant="outline"
                      size="sm"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      {loadingBranding ? "Generando..." : "Generar con IA"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define los colores principales y la identidad visual de tu marca
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Paleta de Colores */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Paleta de Colores
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary_color">Color Principal</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary_color"
                            type="color"
                            value={brandingForm.primary_color}
                            onChange={(e) => setBrandingForm({...brandingForm, primary_color: e.target.value})}
                            className="w-16 h-10 p-1 border rounded"
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
                          <Input
                            id="secondary_color"
                            type="color"
                            value={brandingForm.secondary_color}
                            onChange={(e) => setBrandingForm({...brandingForm, secondary_color: e.target.value})}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={brandingForm.secondary_color}
                            onChange={(e) => setBrandingForm({...brandingForm, secondary_color: e.target.value})}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complementary_color_1">Color Complementario 1</Label>
                        <div className="flex gap-2">
                          <Input
                            id="complementary_color_1"
                            type="color"
                            value={brandingForm.complementary_color_1}
                            onChange={(e) => setBrandingForm({...brandingForm, complementary_color_1: e.target.value})}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={brandingForm.complementary_color_1}
                            onChange={(e) => setBrandingForm({...brandingForm, complementary_color_1: e.target.value})}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complementary_color_2">Color Complementario 2</Label>
                        <div className="flex gap-2">
                          <Input
                            id="complementary_color_2"
                            type="color"
                            value={brandingForm.complementary_color_2}
                            onChange={(e) => setBrandingForm({...brandingForm, complementary_color_2: e.target.value})}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={brandingForm.complementary_color_2}
                            onChange={(e) => setBrandingForm({...brandingForm, complementary_color_2: e.target.value})}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Identidad Visual */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Identidad Visual
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="visual_identity">Descripción de Identidad Visual</Label>
                          {brandingEraUsage.visualIdentityOptimized && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              <Bot className="h-3 w-3" />
                              Generado por ERA
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={optimizeBrandingFieldWithEra}
                          disabled={loadingBranding || brandingEraUsage.visualIdentityOptimized || !brandingForm.visual_identity.trim()}
                          size="sm"
                          variant="outline"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          Optimizar con ERA
                        </Button>
                      </div>
                      <Textarea
                        id="visual_identity"
                        rows={6}
                        value={brandingForm.visual_identity}
                        onChange={(e) => setBrandingForm({...brandingForm, visual_identity: e.target.value})}
                        placeholder="Describe el estilo visual de tu marca: tipografías, tono comunicacional, valores, personalidad de marca..."
                        className="resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveBranding}
                      disabled={loadingBranding}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loadingBranding ? "Guardando..." : "Guardar Identidad"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="canales" className="space-y-6 mt-6">
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  La funcionalidad de canales está en desarrollo.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ADNEmpresa;