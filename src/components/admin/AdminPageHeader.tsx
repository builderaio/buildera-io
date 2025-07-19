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
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(backPath)}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            )}
            
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground truncate">
                    {title}
                  </h1>
                  {badge && (
                    <Badge variant={badge.variant || "secondary"}>
                      {badge.text}
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminPageHeader;