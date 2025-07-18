import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Shield, Lock, Trash2, Download, Eye, Tag, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompanyFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  description?: string;
  tags?: string[];
  is_confidential: boolean;
  is_encrypted: boolean;
  access_level: string;
  upload_date: string;
  last_accessed?: string;
}

const MisArchivos = () => {
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [accessLevel, setAccessLevel] = useState("private");
  const [isConfidential, setIsConfidential] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_files')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('company_files')
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          file_path: filePath,
          description: description || null,
          tags: tags ? tags.split(',').map(t => t.trim()) : null,
          is_confidential: isConfidential,
          is_encrypted: true,
          access_level: accessLevel
        });

      if (dbError) throw dbError;

      toast({
        title: "Archivo subido exitosamente",
        description: "El archivo ha sido procesado y cifrado de forma segura",
      });

      // Reset form and refresh files
      setSelectedFile(null);
      setDescription("");
      setTags("");
      setAccessLevel("private");
      setIsConfidential(true);
      setDialogOpen(false);
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('company-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('company_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast({
        title: "Archivo eliminado",
        description: "El archivo ha sido eliminado de forma segura",
      });

      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAccessLevelBadge = (level: string) => {
    const variants = {
      private: "destructive",
      internal: "secondary",
      restricted: "outline"
    } as const;
    
    const labels = {
      private: "Privado",
      internal: "Interno",
      restricted: "Restringido"
    };

    return (
      <Badge variant={variants[level as keyof typeof variants]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Mis Archivos</h1>
        <p className="text-lg text-muted-foreground">
          Gestione los documentos de su empresa con máxima seguridad. Todos los archivos son cifrados y almacenados de forma confidencial.
        </p>
        
        {/* Security highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Shield className="w-5 h-5 text-primary mr-3" />
            <div>
              <p className="text-sm font-medium text-foreground">Cifrado AES-256</p>
              <p className="text-xs text-muted-foreground">Máxima seguridad</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Lock className="w-5 h-5 text-primary mr-3" />
            <div>
              <p className="text-sm font-medium text-foreground">Acceso Restringido</p>
              <p className="text-xs text-muted-foreground">Solo usted puede acceder</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <AlertTriangle className="w-5 h-5 text-primary mr-3" />
            <div>
              <p className="text-sm font-medium text-foreground">Confidencialidad</p>
              <p className="text-xs text-muted-foreground">Datos nunca compartidos</p>
            </div>
          </div>
        </div>
      </header>

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
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar Archivo
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX
            </p>
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
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando archivos...</p>
              </div>
            ) : files.length === 0 ? (
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
                          {getAccessLevelBadge(file.access_level)}
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
                            {file.tags.map((tag, index) => (
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
                          onClick={() => handleDelete(file.id, file.file_path)}
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

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción del archivo..."
              />
            </div>

            <div>
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Subiendo..." : "Subir Archivo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MisArchivos;