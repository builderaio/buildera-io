import { 
  Linkedin, 
  Instagram, 
  Facebook, 
  Music, 
  Twitter, 
  Youtube,
  type LucideIcon 
} from 'lucide-react';

export interface SocialPlatform {
  id: string;
  name: string; // Nombre completo para mostrar al usuario
  internalName: string; // Nombre interno para lógica de la aplicación
  icon: LucideIcon;
  color: string;
  bgColor: string;
  officialColor: string; // Color oficial de la marca
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    internalName: 'linkedin',
    icon: Linkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-700',
    officialColor: '#0077B5'
  },
  instagram: {
    id: 'instagram', 
    name: 'Instagram',
    internalName: 'instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    officialColor: '#E4405F'
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook', 
    internalName: 'facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    officialColor: '#1877F2'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    internalName: 'tiktok', // Internamente puede seguir siendo 'tt' si es necesario
    icon: Music, // Lucide no tiene ícono oficial de TikTok, usamos Music como representativo
    color: 'text-black dark:text-white',
    bgColor: 'bg-black',
    officialColor: '#000000'
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    internalName: 'twitter',
    icon: Twitter,
    color: 'text-gray-900',
    bgColor: 'bg-gray-900',
    officialColor: '#1DA1F2'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    internalName: 'youtube', 
    icon: Youtube,
    color: 'text-red-600',
    bgColor: 'bg-red-600',
    officialColor: '#FF0000'
  }
};

// Función para obtener plataforma por ID interno o externo
export const getPlatform = (id: string): SocialPlatform | undefined => {
  // Mapear nombres internos alternativos
  const platformMap: Record<string, string> = {
    'tt': 'tiktok', // TT -> TikTok
    'ig': 'instagram', // IG -> Instagram  
    'fb': 'facebook', // FB -> Facebook
    'li': 'linkedin', // LI -> LinkedIn
    'yt': 'youtube' // YT -> YouTube
  };
  
  const normalizedId = id.toLowerCase();
  const mappedId = platformMap[normalizedId] || normalizedId;
  return SOCIAL_PLATFORMS[mappedId];
};

// Función para obtener el nombre para mostrar
export const getPlatformDisplayName = (id: string): string => {
  const platform = getPlatform(id);
  return platform?.name || id;
};

// Función para obtener el ícono
export const getPlatformIcon = (id: string): LucideIcon => {
  const platform = getPlatform(id);
  return platform?.icon || Music; // Fallback
};

// Función para obtener el color
export const getPlatformColor = (id: string): string => {
  const platform = getPlatform(id);
  return platform?.officialColor || '#000000';
};

// Obtener todas las plataformas como array
export const getAllPlatforms = (): SocialPlatform[] => {
  return Object.values(SOCIAL_PLATFORMS);
};