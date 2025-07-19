import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAvatarUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    try {
      setUploading(true);

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo no debe superar los 5MB');
      }

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(data.path);

      // Actualizar perfil del usuario
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil se ha actualizado correctamente",
      });

      return publicUrl;

    } catch (error: any) {
      console.error('Error subiendo avatar:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async (userId: string, avatarUrl?: string) => {
    try {
      setUploading(true);

      if (avatarUrl) {
        // Extraer path del archivo de la URL
        const path = avatarUrl.split('/').slice(-2).join('/');
        
        // Eliminar archivo de storage
        const { error } = await supabase.storage
          .from('user-avatars')
          .remove([path]);

        if (error) {
          console.error('Error eliminando archivo:', error);
        }
      }

      // Actualizar perfil removiendo avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Avatar eliminado",
        description: "Tu foto de perfil se ha eliminado correctamente",
      });

    } catch (error: any) {
      console.error('Error eliminando avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    uploading
  };
};