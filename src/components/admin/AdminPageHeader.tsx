import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  showBackButton?: boolean;
  backPath?: string;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  showBackButton = false,
  backPath = "/admin/dashboard",
  actions,
  onRefresh,
  refreshing = false,
  badge
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-card border-b sticky top-0 z-40">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(backPath)}
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0 px-2 sm:px-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Volver</span>
              </Button>
            )}
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {Icon && (
                <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {title}
                  </h1>
                  {badge && (
                    <Badge variant={badge.variant || "secondary"} className="text-xs">
                      {badge.text}
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={refreshing}
                className="gap-1 sm:gap-2 px-2 sm:px-3"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-xs sm:text-sm">Actualizar</span>
              </Button>
            )}
            <div className="flex items-center gap-1 sm:gap-2">
              {actions}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminPageHeader;