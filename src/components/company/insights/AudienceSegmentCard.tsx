import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { Users, Target, TrendingUp } from "lucide-react";

interface AudienceSegmentProps {
  nombre: string;
  porcentaje: number;
  descripcion: string;
  demografia?: {
    edad_promedio?: string;
    genero_predominante?: string;
    ubicacion_principal?: string;
  };
  psicografia?: {
    intereses_clave?: string[];
    valores?: string[];
    estilo_vida?: string;
  };
  comportamiento_social?: {
    plataformas_activas?: string[];
    tipo_contenido_preferido?: string[];
  };
  potencial_conversion?: number;
  canales_preferidos?: string[];
}

export const AudienceSegmentCard = ({ 
  nombre,
  porcentaje,
  descripcion,
  demografia,
  psicografia,
  comportamiento_social,
  potencial_conversion,
  canales_preferidos
}: AudienceSegmentProps) => {
  const { t } = useTranslation('marketing');
  return (
    <Card className="p-4 space-y-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <h4 className="font-semibold text-foreground">{nombre}</h4>
          </div>
          <Badge className="bg-primary/10 text-primary">
            {porcentaje}% {t('audienceSegment.ofYourAudience')}
          </Badge>
        </div>
        
        <Progress value={porcentaje} className="h-2" />
        
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </div>

      {/* Demografía */}
      {demografia && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            {t('audienceSegment.demographics')}
          </h5>
          <div className="flex flex-wrap gap-2">
            {demografia.edad_promedio && (
              <Badge variant="outline" className="text-xs">
                {demografia.edad_promedio} {t('audienceSegment.years')}
              </Badge>
            )}
            {demografia.genero_predominante && (
              <Badge variant="outline" className="text-xs">
                {demografia.genero_predominante}
              </Badge>
            )}
            {demografia.ubicacion_principal && (
              <Badge variant="outline" className="text-xs">
                📍 {demografia.ubicacion_principal}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Psicografía */}
      {psicografia && psicografia.intereses_clave && psicografia.intereses_clave.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-foreground">{t('audienceSegment.interests')}</h5>
          <div className="flex flex-wrap gap-1">
            {psicografia.intereses_clave.map((interes, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {interes}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Comportamiento Social */}
      {comportamiento_social && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-foreground">{t('audienceSegment.activePlatforms')}</h5>
          <div className="flex flex-wrap gap-1">
            {comportamiento_social.plataformas_activas?.map((plataforma, idx) => (
              <Badge key={idx} className="text-xs bg-accent/50 text-accent-foreground">
                {plataforma}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Potencial de Conversión */}
      {potencial_conversion !== undefined && (
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-medium text-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {t('audienceSegment.conversionPotential')}
            </h5>
            <span className="text-sm font-bold text-primary">
              {potencial_conversion}/10
            </span>
          </div>
          <Progress value={potencial_conversion * 10} className="h-2" />
        </div>
      )}
    </Card>
  );
};
