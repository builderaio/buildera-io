import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, MapPin, Building2, Target, TrendingUp, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CompetitorData {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  sitio_web: string;
  motivo: string;
}

interface CompetitorAnalysis {
  competidores_locales: CompetitorData[];
  competidores_regionales: CompetitorData[];
  referentes: CompetitorData[];
}

interface CompetitorAnalysisResultsProps {
  analysis: CompetitorAnalysis;
  onAddCompetitor: (competitor: CompetitorData) => void;
}

const CompetitorCard = ({ 
  competitor, 
  onAdd,
  addLabel
}: { 
  competitor: CompetitorData; 
  onAdd: () => void;
  addLabel: string;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="pt-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold text-foreground">{competitor.nombre}</h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {competitor.ubicacion}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground line-clamp-2">
        {competitor.descripcion}
      </p>
      
      <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-md p-2">
        <Target className="h-3 w-3 text-primary shrink-0" />
        <span className="text-muted-foreground">{competitor.motivo}</span>
      </div>
      
      {competitor.sitio_web && (
        <a 
          href={competitor.sitio_web} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Globe className="h-3 w-3" />
          {competitor.sitio_web.replace(/https?:\/\//, '').replace(/\/$/, '')}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </CardContent>
  </Card>
);

const CompetitorSection = ({
  title,
  icon: Icon,
  competitors,
  badgeVariant,
  onAddCompetitor,
  addLabel,
}: {
  title: string;
  icon: React.ElementType;
  competitors: CompetitorData[];
  badgeVariant: 'default' | 'secondary' | 'outline';
  onAddCompetitor: (competitor: CompetitorData) => void;
  addLabel: string;
}) => {
  if (!competitors || competitors.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{title}</h3>
        <Badge variant={badgeVariant}>{competitors.length}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {competitors.map((competitor, index) => (
          <CompetitorCard 
            key={`${competitor.nombre}-${index}`}
            competitor={competitor}
            onAdd={() => onAddCompetitor(competitor)}
            addLabel={addLabel}
          />
        ))}
      </div>
    </div>
  );
};

export const CompetitorAnalysisResults = ({ 
  analysis, 
  onAddCompetitor 
}: CompetitorAnalysisResultsProps) => {
  const { t } = useTranslation(['company']);

  const totalCompetitors = 
    (analysis.competidores_locales?.length || 0) +
    (analysis.competidores_regionales?.length || 0) +
    (analysis.referentes?.length || 0);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t('company:competitors.analysis.title')}
          <Badge variant="secondary">{totalCompetitors} {t('company:competitors.analysis.found')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <CompetitorSection
          title={t('company:competitors.analysis.localCompetitors')}
          icon={MapPin}
          competitors={analysis.competidores_locales}
          badgeVariant="default"
          onAddCompetitor={onAddCompetitor}
          addLabel={t('company:competitors.analysis.addButton')}
        />
        
        <CompetitorSection
          title={t('company:competitors.analysis.regionalCompetitors')}
          icon={Globe}
          competitors={analysis.competidores_regionales}
          badgeVariant="secondary"
          onAddCompetitor={onAddCompetitor}
          addLabel={t('company:competitors.analysis.addButton')}
        />
        
        <CompetitorSection
          title={t('company:competitors.analysis.marketReferences')}
          icon={Building2}
          competitors={analysis.referentes}
          badgeVariant="outline"
          onAddCompetitor={onAddCompetitor}
          addLabel={t('company:competitors.analysis.addButton')}
        />
      </CardContent>
    </Card>
  );
};
