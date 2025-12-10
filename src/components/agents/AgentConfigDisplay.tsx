import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Calendar, Hash, ToggleLeft, List, FileText } from "lucide-react";

interface AgentConfigDisplayProps {
  configuration: Record<string, any>;
  inputSchema?: Record<string, any>;
  onEdit?: () => void;
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case 'number':
    case 'integer':
      return <Hash className="w-4 h-4 text-muted-foreground" />;
    case 'boolean':
      return <ToggleLeft className="w-4 h-4 text-muted-foreground" />;
    case 'array':
      return <List className="w-4 h-4 text-muted-foreground" />;
    case 'string':
    default:
      return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
};

const formatValue = (value: any, type?: string): string => {
  if (value === null || value === undefined) return '—';
  
  if (type === 'boolean' || typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Ninguno';
    return value.join(', ');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Handle common string values with translations
  const translations: Record<string, string> = {
    'week': 'Semanal',
    'month': 'Mensual',
    'day': 'Diario',
    'daily': 'Diario',
    'weekly': 'Semanal',
    'monthly': 'Mensual',
    'low': 'Bajo',
    'medium': 'Medio',
    'high': 'Alto',
    'all': 'Todos',
    'instagram': 'Instagram',
    'linkedin': 'LinkedIn',
    'facebook': 'Facebook',
    'tiktok': 'TikTok',
    'twitter': 'Twitter/X'
  };
  
  const lowerValue = String(value).toLowerCase();
  return translations[lowerValue] || String(value);
};

export const AgentConfigDisplay = ({ 
  configuration, 
  inputSchema,
  onEdit 
}: AgentConfigDisplayProps) => {
  const { t } = useTranslation(['common']);

  if (!configuration || Object.keys(configuration).length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('common:noConfiguration', 'Sin configuración')}</p>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="mt-2">
              {t('common:configure', 'Configurar')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const properties = inputSchema?.properties || {};
  
  // Filter out internal/metadata fields
  const displayableConfig = Object.entries(configuration).filter(([key]) => 
    !key.startsWith('_') && key !== 'recurring_capable'
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t('common:currentConfig', 'Configuración actual')}
          </span>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              {t('common:edit', 'Editar')}
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {displayableConfig.map(([key, value]) => {
            const fieldSchema = properties[key] || {};
            const label = fieldSchema.title || fieldSchema.label || formatKeyToLabel(key);
            const type = fieldSchema.type;
            const description = fieldSchema.description;
            
            return (
              <div 
                key={key} 
                className="flex items-start justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-start gap-2">
                  {getFieldIcon(type)}
                  <div>
                    <span className="text-sm font-medium">{label}</span>
                    {description && (
                      <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {value.length === 0 ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        value.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {formatValue(item)}
                          </Badge>
                        ))
                      )}
                    </div>
                  ) : typeof value === 'boolean' ? (
                    <Badge variant={value ? "default" : "secondary"}>
                      {value ? 'Sí' : 'No'}
                    </Badge>
                  ) : (
                    <span className="text-sm font-medium">{formatValue(value, type)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper to convert snake_case or camelCase to readable label
function formatKeyToLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
