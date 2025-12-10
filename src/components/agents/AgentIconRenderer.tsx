import { icons, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentIconRendererProps {
  icon?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallback?: string;
}

// Check if the string is an emoji
const isEmoji = (str: string): boolean => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1FA00}-\u{1FAFF}]/u;
  return emojiRegex.test(str);
};

// Convert PascalCase or kebab-case to proper icon name format
const normalizeIconName = (name: string): string => {
  // Remove common prefixes/suffixes
  let normalized = name.replace(/Icon$/i, '').trim();
  
  // If already PascalCase (e.g., "Brain", "BarChart3"), return as-is
  if (/^[A-Z][a-zA-Z0-9]*$/.test(normalized)) {
    return normalized;
  }
  
  // Convert kebab-case or snake_case to PascalCase
  return normalized
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

const sizeClasses = {
  sm: "w-4 h-4 text-sm",
  md: "w-5 h-5 text-lg",
  lg: "w-6 h-6 text-xl",
  xl: "w-8 h-8 text-2xl",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

export const AgentIconRenderer = ({ 
  icon, 
  size = "md", 
  className,
  fallback = "🤖"
}: AgentIconRendererProps) => {
  if (!icon) {
    return <span className={cn(textSizeClasses[size], className)}>{fallback}</span>;
  }

  // If it's an emoji, render directly
  if (isEmoji(icon)) {
    return <span className={cn(textSizeClasses[size], className)}>{icon}</span>;
  }

  // Try to find a matching Lucide icon
  const normalizedName = normalizeIconName(icon);
  const LucideIconComponent = icons[normalizedName as keyof typeof icons] as LucideIcon | undefined;

  if (LucideIconComponent) {
    return <LucideIconComponent className={cn(sizeClasses[size], className)} />;
  }

  // Check for common aliases
  const iconAliases: Record<string, string> = {
    "strategy": "Target",
    "brain": "Brain",
    "chart": "BarChart",
    "analytics": "TrendingUp",
    "content": "FileText",
    "branding": "Palette",
    "marketing": "Megaphone",
    "social": "Share2",
    "calendar": "Calendar",
    "image": "Image",
    "video": "Video",
    "audience": "Users",
    "insight": "Lightbulb",
    "robot": "Bot",
    "assistant": "MessageSquare",
  };

  const aliasKey = icon.toLowerCase();
  if (iconAliases[aliasKey]) {
    const AliasIcon = icons[iconAliases[aliasKey]] as LucideIcon;
    if (AliasIcon) {
      return <AliasIcon className={cn(sizeClasses[size], className)} />;
    }
  }

  // Fallback to emoji or the icon string itself if it looks like text
  return <span className={cn(textSizeClasses[size], className)}>{fallback}</span>;
};

// Utility function for inline usage
export const renderAgentIcon = (icon?: string | null, fallback = "🤖"): React.ReactNode => {
  return <AgentIconRenderer icon={icon} fallback={fallback} />;
};

export default AgentIconRenderer;
