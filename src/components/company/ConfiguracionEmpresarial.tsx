import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
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
  Camera,
  FileText,
  Shield,
  Lock,
  Tag,
  AlertTriangle
} from "lucide-react";

interface ConfiguracionEmpresarialProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const ConfiguracionEmpresarial = ({ profile }: ConfiguracionEmpresarialProps) => {
  const { toast } = useToast();
  const { uploadAvatar, uploading: uploadingAvatar } = useAvatarUpload();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [brandingData, setBrandingData] = useState<any>(null);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [fileTags, setFileTags] = useState("");
  const [accessLevel, setAccessLevel] = useState("private");
  const [isConfidential, setIsConfidential] = useState(true);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.user_id) {
      loadCompanyData();
    }
  }, [profile?.user_id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      
      // Buscar empresas del usuario
      const { data: memberships, error: membershipError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile.user_id);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        toast({
          title: "Error",
          description: "No se encontró información de empresa",
          variant: "destructive"
        });
        return;
      }

      const companyIds = memberships.map(m => m.company_id);

      // Cargar todos los datos de la empresa
      const [companyResult, strategyResult, brandingResult, objectivesResult, filesResult] = await Promise.all([
        supabase.from('companies').select('*').in('id', companyIds),
        supabase.from('company_strategy').select('*').in('company_id', companyIds),
        supabase.from('company_branding').select('*').in('company_id', companyIds),
        supabase.from('company_objectives').select('*').in('company_id', companyIds).order('priority', { ascending: true }),
        supabase.from('company_files').select('*').eq('user_id', profile.user_id).order('upload_date', { ascending: false })
      ]);

      if (companyResult.data && companyResult.data.length > 0) {
        const company = companyResult.data[0];
        setCompanyData(company);
        setLastUpdated(new Date(company.updated_at).toLocaleDateString());
      }
      
      if (strategyResult.data && strategyResult.data.length > 0) {
        setStrategyData(strategyResult.data[0]);
      }
      
      if (brandingResult.data && brandingResult.data.length > 0) {
        setBrandingData(brandingResult.data[0]);
      }
      
      if (objectivesResult.data && objectivesResult.data.length > 0) {
        setObjectives(objectivesResult.data);
      }

      if (filesResult.data) {
        setFiles(filesResult.data);
      }

    } catch (error) {
      console.error('Error loading company data:', error);
      toast({
        title: "Error",
        description: "Error al cargar la información empresarial",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (field: string, value: string, table: string = 'companies') => {
    try {
      const updateData = { [field]: value };
      
      if (table === 'companies' && companyData?.id) {
        const { error } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', companyData.id);
          
        if (error) throw error;
        
        setCompanyData(prev => ({ ...prev, [field]: value }));
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !companyData?.id) return;

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `logos/${companyData.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-files')
        .getPublicUrl(filePath);

      await saveField('logo_url', publicUrl);

      toast({
        title: "Logo actualizado",
        description: "El logo de la empresa se ha actualizado correctamente",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el logo",
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
        
        loadCompanyData();
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
        
        loadCompanyData();
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileDialogOpen(true);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('company_files')
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          file_path: filePath,
          description: fileDescription || null,
          tags: fileTags ? fileTags.split(',').map(t => t.trim()) : null,
          is_confidential: isConfidential,
          is_encrypted: true,
          access_level: accessLevel
        });

      if (dbError) throw dbError;

      toast({
        title: "Archivo subido exitosamente",
        description: "El archivo ha sido procesado y cifrado de forma segura",
      });

      setSelectedFile(null);
      setFileDescription("");
      setFileTags("");
      setAccessLevel("private");
      setIsConfidential(true);
      setFileDialogOpen(false);
      loadCompanyData();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive"
      });
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('company-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('company_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast({
        title: "Archivo eliminado",
        description: "El archivo ha sido eliminado de forma segura",
      });

      loadCompanyData();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive"
      });
    }
  };

  // Componente para campos editables
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando configuración empresarial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Configuración Empresarial</h1>
        <p className="text-lg text-muted-foreground">
          Gestiona la información completa de tu empresa, objetivos y base de conocimiento
        </p>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: {lastUpdated}
          </p>
        )}
      </header>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empresa">Información Empresarial</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
          <TabsTrigger value="base-conocimiento">Base de Conocimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo de la empresa */}
                <div className="space-y-2">
                  <Label>Logo de la Empresa</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {companyData?.logo_url ? (
                        <img 
                          src={companyData.logo_url} 
                          alt="Logo" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {uploadingAvatar ? "Subiendo..." : "Cambiar Logo"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre de la Empresa</Label>
                  <EditableField
                    field="name"
                    value={companyData?.name}
                    onSave={(value) => saveField('name', value)}
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <EditableField
                    field="description"
                    value={companyData?.description}
                    onSave={(value) => saveField('description', value)}
                    type="textarea"
                    placeholder="Descripción de tu empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sitio Web</Label>
                  <EditableField
                    field="website_url"
                    value={companyData?.website_url}
                    onSave={(value) => saveField('website_url', value)}
                    type="url"
                    placeholder="https://www.tuempresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sector Industrial</Label>
                  <EditableField
                    field="industry_sector"
                    value={companyData?.industry_sector}
                    onSave={(value) => saveField('industry_sector', value)}
                    placeholder="e.g., Tecnología, Salud, Educación"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tamaño de la Empresa</Label>
                  <EditableField
                    field="company_size"
                    value={companyData?.company_size}
                    onSave={(value) => saveField('company_size', value)}
                    placeholder="e.g., 1-10, 11-50, 51-200, 200+"
                  />
                </div>

                <div className="space-y-2">
                  <Label>País</Label>
                  <EditableField
                    field="country"
                    value={companyData?.country}
                    onSave={(value) => saveField('country', value)}
                    placeholder="País donde opera"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <EditableField
                    field="location"
                    value={companyData?.location}
                    onSave={(value) => saveField('location', value)}
                    placeholder="Ciudad, Estado"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Identidad de Marca
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <EditableField
                    field="primary_color"
                    value={companyData?.primary_color}
                    onSave={(value) => saveField('primary_color', value)}
                    type="color"
                    placeholder="#3B82F6"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color Secundario</Label>
                  <EditableField
                    field="secondary_color"
                    value={companyData?.secondary_color}
                    onSave={(value) => saveField('secondary_color', value)}
                    type="color"
                    placeholder="#EF4444"
                  />
                </div>

                {/* Mostrar datos de branding si existen */}
                {brandingData && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Análisis de Marca</h4>
                    {brandingData.visual_identity && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Identidad Visual:</strong> {brandingData.visual_identity}
                      </p>
                    )}
                    {brandingData.brand_voice && (
                      <div className="text-sm">
                        <strong>Voz de Marca:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {Object.entries(brandingData.brand_voice).map(([key, value]) => (
                            <li key={key}>{key}: {String(value)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="objetivos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Objetivos Empresariales
                </div>
                <Button
                  onClick={() => setEditing('new-objective')}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Objetivo
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editing === 'new-objective' && (
                  <NewObjectiveForm
                    onSave={(data) => saveObjective(data)}
                    onCancel={() => setEditing(null)}
                  />
                )}

                {objectives.map((objective) => (
                  <ObjectiveCard
                    key={objective.id}
                    objective={objective}
                    isEditing={editing === objective.id}
                    onEdit={() => setEditing(objective.id)}
                    onSave={(data) => saveObjective(data, objective.id)}
                    onDelete={() => deleteObjective(objective.id)}
                    onCancel={() => setEditing(null)}
                  />
                ))}

                {objectives.length === 0 && editing !== 'new-objective' && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No hay objetivos definidos aún</p>
                    <p className="text-sm">Comienza creando tu primer objetivo empresarial</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="base-conocimiento" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Subir Archivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  ref={fileUploadRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                />
                <Button 
                  onClick={() => fileUploadRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar Archivo
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX
                </p>

                {/* Security highlights */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center p-2 bg-primary/5 rounded-lg border border-primary/20">
                    <Shield className="w-4 h-4 text-primary mr-2" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Cifrado AES-256</p>
                    </div>
                  </div>
                  <div className="flex items-center p-2 bg-primary/5 rounded-lg border border-primary/20">
                    <Lock className="w-4 h-4 text-primary mr-2" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Acceso Restringido</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Files List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Archivos de la Empresa ({files.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay archivos subidos aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <FileText className="w-4 h-4 text-primary mr-2" />
                              <h4 className="font-medium text-foreground">{file.file_name}</h4>
                              {file.is_confidential && (
                                <Lock className="w-3 h-3 text-primary ml-2" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                {formatFileSize(file.file_size)}
                              </Badge>
                              <Badge variant="outline">
                                <Shield className="w-3 h-3 mr-1" />
                                Cifrado
                              </Badge>
                            </div>
                            {file.description && (
                              <p className="text-sm text-muted-foreground mb-2">{file.description}</p>
                            )}
                            {file.tags && file.tags.length > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                <Tag className="w-3 h-3 text-muted-foreground" />
                                {file.tags.map((tag: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Subido: {new Date(file.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteFile(file.id, file.file_path)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* File Upload Dialog */}
      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Archivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Breve descripción del archivo..."
              />
            </div>

            <div>
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                value={fileTags}
                onChange={(e) => setFileTags(e.target.value)}
                placeholder="Separadas por comas: ventas, reporte, Q2"
              />
            </div>

            <div>
              <Label htmlFor="access-level">Nivel de Acceso</Label>
              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privado - Solo yo</SelectItem>
                  <SelectItem value="internal">Interno - Equipo</SelectItem>
                  <SelectItem value="restricted">Restringido - Permisos especiales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confidential"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="confidential">Marcar como confidencial</Label>
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-sm text-foreground">
                El archivo será cifrado automáticamente con AES-256
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFileDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleFileUpload}>
                Subir Archivo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente para nuevo objetivo
const NewObjectiveForm = ({ onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objective_type: 'short_term',
    priority: 1,
    target_date: ''
  });

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
          <Button size="sm" onClick={() => onSave(formData)}>
            <Save className="w-3 h-3 mr-1" />
            Crear
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="w-3 h-3 mr-1" />
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente para card de objetivo
const ObjectiveCard = ({ objective, isEditing, onEdit, onSave, onDelete, onCancel }: any) => {
  const [formData, setFormData] = useState({
    title: objective.title || '',
    description: objective.description || '',
    objective_type: objective.objective_type || 'short_term',
    priority: objective.priority || 1,
    target_date: objective.target_date || ''
  });

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
            <Button size="sm" onClick={() => onSave(formData)}>
              <Save className="w-3 h-3 mr-1" />
              Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => {
                if (confirm('¿Estás seguro de eliminar este objetivo?')) {
                  onDelete();
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

  const getObjectiveTypeLabel = (type: string) => {
    const labels = {
      'short_term': 'Corto Plazo',
      'medium_term': 'Mediano Plazo',
      'long_term': 'Largo Plazo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 3: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div 
      className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors group"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-green-900 dark:text-green-100">
          {objective.title}
        </h3>
        <div className="flex gap-2">
          <Badge className={getPriorityColor(objective.priority)}>
            Prioridad {objective.priority}
          </Badge>
          <Badge variant="outline">
            {getObjectiveTypeLabel(objective.objective_type)}
          </Badge>
        </div>
      </div>
      
      {objective.description && (
        <p className="text-green-700 dark:text-green-200 text-sm mb-3">
          {objective.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-300">
        <span>Estado: {objective.status || 'Activo'}</span>
        {objective.target_date && (
          <span>Meta: {new Date(objective.target_date).toLocaleDateString()}</span>
        )}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionEmpresarial;