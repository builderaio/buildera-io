import { 
  FaLinkedin, 
  FaInstagram, 
  FaFacebook, 
  FaTiktok, 
  FaXTwitter, 
  FaYoutube
} from 'react-icons/fa6';

export interface SocialPlatform {
  id: string;
  name: string; // Nombre completo para mostrar al usuario
  internalName: string; // Nombre interno para lógica de la aplicación
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  officialColor: string; // Color oficial de la marca
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    internalName: 'linkedin',
    icon: FaLinkedin,
    color: 'text-[#0077B5]',
    bgColor: 'bg-[#0077B5]',
    officialColor: '#0077B5'
  },
  instagram: {
    id: 'instagram', 
    name: 'Instagram',
    internalName: 'instagram',
    icon: FaInstagram,
    color: 'text-[#E4405F]',
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    officialColor: '#E4405F'
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook', 
    internalName: 'facebook',
    icon: FaFacebook,
    color: 'text-[#1877F2]',
    bgColor: 'bg-[#1877F2]',
    officialColor: '#1877F2'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    internalName: 'tiktok',
    icon: FaTiktok,
    color: 'text-black dark:text-white',
    bgColor: 'bg-black',
    officialColor: '#000000'
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    internalName: 'twitter',
    icon: FaXTwitter,
    color: 'text-[#000000]',
    bgColor: 'bg-black',
    officialColor: '#000000'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    internalName: 'youtube', 
    icon: FaYoutube,
    color: 'text-[#FF0000]',
    bgColor: 'bg-[#FF0000]',
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
export const getPlatformIcon = (id: string): React.ComponentType<any> => {
  const platform = getPlatform(id);
  return platform?.icon || FaTiktok; // Fallback
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