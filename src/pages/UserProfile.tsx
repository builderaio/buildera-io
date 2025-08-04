import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building2,
  Camera,
  Save,
  X,
  Edit,
  Linkedin,
  ArrowLeft,
  Trash2,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';

interface UserProfileData {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  user_type: 'company' | 'developer' | 'expert';
  avatar_url?: string;
  position?: string;
  functional_area?: string;
  phone?: string;
  linkedin_profile?: string;
  bio?: string;
  location?: string;
  linked_providers: string[];
}

const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileData>>({});
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, deleteAvatar, uploading } = useAvatarUpload();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(profileData);
      setFormData(profileData);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', profile.user_id);

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setProfile({ ...profile, ...formData });
      setEditing(false);

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;

    const newAvatarUrl = await uploadAvatar(file, profile.user_id);
    if (newAvatarUrl) {
      setProfile({ ...profile, avatar_url: newAvatarUrl });
      setFormData({ ...formData, avatar_url: newAvatarUrl });
    }
  };

  const handleAvatarDelete = async () => {
    if (!profile) return;

    await deleteAvatar(profile.user_id, profile.avatar_url);
    setProfile({ ...profile, avatar_url: undefined });
    setFormData({ ...formData, avatar_url: undefined });
  };

  const getUserTypeColor = (userType: string) => {
    const colors = {
      company: "bg-blue-100 text-blue-800",
      developer: "bg-green-100 text-green-800",
      expert: "bg-purple-100 text-purple-800"
    };
    return colors[userType as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se pudo cargar el perfil</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-background border-b mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
              <p className="text-muted-foreground mt-2">Información personal y profesional</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {editing ? (
                <>
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
                </>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => setEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block">
                  <Avatar className="w-32 h-32 mx-auto">
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    <AvatarFallback className="text-2xl">
                      {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {editing && (
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full w-8 h-8 p-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                      
                      {profile.avatar_url && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full w-8 h-8 p-0"
                          onClick={handleAvatarDelete}
                          disabled={uploading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleAvatarUpload(file);
                    }
                  }}
                />

                <div className="mt-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.full_name || 'Sin nombre'}
                  </h2>
                  <p className="text-gray-600">{profile.email}</p>
                  
                  <div className="mt-2 flex justify-center">
                    <Badge className={getUserTypeColor(profile.user_type)}>
                      {profile.user_type === 'company' ? 'Empresa' :
                       profile.user_type === 'developer' ? 'Desarrollador' : 'Experto'}
                    </Badge>
                  </div>

                  {profile.position && (
                    <p className="text-sm text-gray-600 mt-2 flex items-center justify-center">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {profile.position}
                    </p>
                  )}

                  {profile.location && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center justify-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {profile.location}
                    </p>
                  )}
                </div>

                {/* Conexiones */}
                {profile.linked_providers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Conexiones activas:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {profile.linked_providers.map((provider, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details Cards - Ahora con Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Información Personal
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Seguridad
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6 mt-6">
                {/* Información Personal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Nombre completo</Label>
                        {editing ? (
                          <Input
                            id="full_name"
                            value={formData.full_name || ''}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{profile.full_name || 'No especificado'}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <p className="mt-1 text-sm text-gray-600 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {profile.email}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        {editing ? (
                          <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+34 600 000 000"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {profile.phone || 'No especificado'}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="location">Ubicación</Label>
                        {editing ? (
                          <Input
                            id="location"
                            value={formData.location || ''}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Madrid, España"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {profile.location || 'No especificado'}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="bio">Biografía</Label>
                      {editing ? (
                        <Textarea
                          id="bio"
                          value={formData.bio || ''}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Cuéntanos un poco sobre ti..."
                          rows={3}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.bio || 'No hay biografía disponible'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Información Profesional */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Información Profesional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="position">Cargo/Puesto</Label>
                        {editing ? (
                          <Input
                            id="position"
                            value={formData.position || ''}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            placeholder="Ej: CEO, Desarrollador Senior..."
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{profile.position || 'No especificado'}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="functional_area">Área Funcional</Label>
                        {editing ? (
                          <Input
                            id="functional_area"
                            value={formData.functional_area || ''}
                            onChange={(e) => setFormData({ ...formData, functional_area: e.target.value })}
                            placeholder="Ej: Tecnología, Marketing, Ventas..."
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{profile.functional_area || 'No especificado'}</p>
                        )}
                      </div>

                      {/* Company information is now stored in the companies table */}
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="linkedin_profile">Perfil de LinkedIn</Label>
                      {editing ? (
                        <Input
                          id="linkedin_profile"
                          value={formData.linkedin_profile || ''}
                          onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
                          placeholder="https://linkedin.com/in/tu-perfil"
                        />
                      ) : profile.linkedin_profile ? (
                        <a 
                          href={profile.linkedin_profile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-blue-600 hover:underline flex items-center"
                        >
                          <Linkedin className="w-3 h-3 mr-1" />
                          Ver perfil de LinkedIn
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">No especificado</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6 mt-6">
                <ChangePasswordForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;