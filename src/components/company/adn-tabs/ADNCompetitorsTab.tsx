import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCompanyCompetitors, CompanyCompetitor } from '@/hooks/useCompanyCompetitors';
import { Users, Plus, Trash2, Globe, Loader2, Sparkles, Search, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompetitorAnalysisResults } from './CompetitorAnalysisResults';
import { CompetitorAnalysisModal } from './CompetitorAnalysisModal';

interface ADNCompetitorsTabProps {
  companyId: string;
}

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

const PRIORITY_KEYS = ['high', 'medium', 'low'] as const;
const PRIORITY_VALUES = [1, 2, 3];

export const ADNCompetitorsTab = ({ companyId }: ADNCompetitorsTabProps) => {
  const { t } = useTranslation(['company']);
  const { toast } = useToast();
  const { competitors, loading, saving, addCompetitor, updateCompetitor, deleteCompetitor, refetch } = useCompanyCompetitors(companyId);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<CompetitorAnalysis | null>(null);
  
  // Single competitor analysis state
  const [analyzingCompetitorId, setAnalyzingCompetitorId] = useState<string | null>(null);
  const [singleCompetitorData, setSingleCompetitorData] = useState<any | null>(null);
  const [singleCompetitorModalOpen, setSingleCompetitorModalOpen] = useState(false);
  const [singleCompetitorName, setSingleCompetitorName] = useState('');

  const handleAdd = async () => {
    try {
      await addCompetitor({ competitor_name: t('company:competitors.newCompetitor') });
      toast({ title: t('company:competitors.added') });
    } catch {
      toast({ title: t('company:email.save_error'), variant: 'destructive' });
    }
  };

  const handleUpdate = async (id: string, updates: Partial<CompanyCompetitor>) => {
    try {
      await updateCompetitor(id, updates);
    } catch {
      toast({ title: t('company:email.save_error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompetitor(id);
      toast({ title: t('company:competitors.deleted') });
    } catch {
      toast({ title: t('company:email.save_error'), variant: 'destructive' });
    }
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-competitors', {
        body: { companyId }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysisResults(data.analysis);
        toast({ 
          title: t('company:competitors.analysisComplete'),
          description: t('company:competitors.analysisCompleteDesc')
        });
      }
    } catch (error) {
      console.error('Error analyzing competitors:', error);
      toast({ 
        title: t('company:competitors.analysisError'),
        description: t('company:competitors.analysisErrorDesc'),
        variant: 'destructive' 
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddFromAnalysis = async (competitor: CompetitorData) => {
    try {
      await addCompetitor({
        competitor_name: competitor.nombre,
        website_url: competitor.sitio_web,
        notes: `${competitor.descripcion}\n\nUbicación: ${competitor.ubicacion}\nMotivo: ${competitor.motivo}`,
        is_direct_competitor: true,
        priority_level: 2,
      });
      toast({ 
        title: t('company:competitors.addedFromAnalysis'),
        description: t('company:competitors.addedFromAnalysisDesc', { name: competitor.nombre })
      });
    } catch {
      toast({ title: t('company:email.save_error'), variant: 'destructive' });
    }
  };

  const handleAnalyzeSingleCompetitor = async (competitor: CompanyCompetitor, forceReanalyze = false) => {
    if (!competitor.website_url) {
      toast({ 
        title: t('company:competitors.urlRequired'),
        description: t('company:competitors.urlRequiredDesc'),
        variant: 'destructive' 
      });
      return;
    }

    // If we have cached analysis and not forcing re-analyze, show cached data
    if (!forceReanalyze && competitor.ai_analysis) {
      setSingleCompetitorData(competitor.ai_analysis);
      setSingleCompetitorName(competitor.competitor_name);
      setSingleCompetitorModalOpen(true);
      return;
    }

    setAnalyzingCompetitorId(competitor.id);
    setSingleCompetitorName(competitor.competitor_name);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-single-competitor', {
        body: { websiteUrl: competitor.website_url }
      });

      if (error) throw error;

      if (data?.success && data?.competitor) {
        setSingleCompetitorData(data.competitor);
        setSingleCompetitorModalOpen(true);
        
        // Save the full analysis to the database
        const enrichedData: Partial<CompanyCompetitor> = {
          ai_analysis: data.competitor,
          last_analyzed_at: new Date().toISOString(),
        };
        
        // Also update social URLs if found
        if (data.competitor.social_networks?.linkedin) {
          enrichedData.linkedin_url = data.competitor.social_networks.linkedin;
        }
        if (data.competitor.social_networks?.instagram) {
          enrichedData.instagram_url = data.competitor.social_networks.instagram;
        }
        if (data.competitor.social_networks?.facebook) {
          enrichedData.facebook_url = data.competitor.social_networks.facebook;
        }
        if (data.competitor.social_networks?.twitter) {
          enrichedData.twitter_url = data.competitor.social_networks.twitter;
        }
        if (data.competitor.social_networks?.tiktok) {
          enrichedData.tiktok_url = data.competitor.social_networks.tiktok;
        }
        
        await updateCompetitor(competitor.id, enrichedData);
        
        toast({ 
          title: t('company:competitors.singleAnalysisComplete'),
          description: t('company:competitors.singleAnalysisCompleteDesc', { name: data.competitor.name || competitor.competitor_name })
        });
      } else {
        throw new Error('No se pudo obtener información del competidor');
      }
    } catch (error) {
      console.error('Error analyzing single competitor:', error);
      toast({ 
        title: t('company:competitors.singleAnalysisError'),
        description: t('company:competitors.singleAnalysisErrorDesc'),
        variant: 'destructive' 
      });
    } finally {
      setAnalyzingCompetitorId(null);
    }
  };

  const handleViewOrAnalyze = (competitor: CompanyCompetitor) => {
    // If has cached analysis, show it; otherwise analyze
    handleAnalyzeSingleCompetitor(competitor, false);
  };

  const handleReanalyze = (competitor: CompanyCompetitor) => {
    handleAnalyzeSingleCompetitor(competitor, true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('company:competitors.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('company:competitors.desc')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAnalyzeWithAI} 
            disabled={analyzing}
            variant="outline"
            className="gap-2"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {analyzing ? t('company:competitors.analyzing') : t('company:competitors.generateWithAI')}
          </Button>
          <Button onClick={handleAdd} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            {t('company:competitors.add')}
          </Button>
        </div>
      </div>

      {/* AI Analysis Results */}
      {analysisResults && (
        <CompetitorAnalysisResults 
          analysis={analysisResults}
          onAddCompetitor={handleAddFromAnalysis}
        />
      )}

      {/* Manual Competitors List */}
      {competitors.length === 0 && !analysisResults ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <div className="space-y-3">
              <Users className="h-12 w-12 mx-auto opacity-50" />
              <p>{t('company:competitors.empty')}</p>
              <p className="text-sm">
                {t('company:competitors.useAIHint')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : competitors.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            {t('company:competitors.myCompetitors')} ({competitors.length})
          </h4>
          {competitors.map(competitor => (
            <Card key={competitor.id}>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={competitor.competitor_name}
                      onChange={(e) => handleUpdate(competitor.id, { competitor_name: e.target.value })}
                      className="font-semibold text-lg border-none px-0 focus-visible:ring-0"
                      placeholder={t('company:competitors.name')}
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">{t('company:competitors.direct')}</Label>
                        <Switch
                          checked={competitor.is_direct_competitor}
                          onCheckedChange={(v) => handleUpdate(competitor.id, { is_direct_competitor: v })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">{t('company:competitors.priority')}</Label>
                        <Select
                          value={String(competitor.priority_level)}
                          onValueChange={(v) => handleUpdate(competitor.id, { priority_level: parseInt(v) })}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_KEYS.map((key, idx) => (
                              <SelectItem key={PRIORITY_VALUES[idx]} value={String(PRIORITY_VALUES[idx])}>{t(`company:competitors.priority${key.charAt(0).toUpperCase() + key.slice(1)}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* View/Analyze Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewOrAnalyze(competitor)}
                            disabled={analyzingCompetitorId === competitor.id || !competitor.website_url}
                          >
                            {analyzingCompetitorId === competitor.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : competitor.ai_analysis ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <Search className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {!competitor.website_url 
                            ? t('company:competitors.addWebsiteToAnalyze')
                            : competitor.ai_analysis
                              ? t('company:competitors.viewSavedAnalysis')
                              : t('company:competitors.analyzeWithAI')
                          }
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {/* Re-analyze Button (only if already analyzed) */}
                    {competitor.ai_analysis && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleReanalyze(competitor)}
                              disabled={analyzingCompetitorId === competitor.id || !competitor.website_url}
                            >
                              <RefreshCw className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('company:competitors.reanalyze')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(competitor.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('company:competitors.website')}
                    </Label>
                    <Input
                      value={competitor.website_url || ''}
                      onChange={(e) => handleUpdate(competitor.id, { website_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company:competitors.instagram')}</Label>
                    <Input
                      value={competitor.instagram_url || ''}
                      onChange={(e) => handleUpdate(competitor.id, { instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company:competitors.linkedin')}</Label>
                    <Input
                      value={competitor.linkedin_url || ''}
                      onChange={(e) => handleUpdate(competitor.id, { linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company:competitors.facebook')}</Label>
                    <Input
                      value={competitor.facebook_url || ''}
                      onChange={(e) => handleUpdate(competitor.id, { facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('company:competitors.notes')}</Label>
                  <Textarea
                    value={competitor.notes || ''}
                    onChange={(e) => handleUpdate(competitor.id, { notes: e.target.value })}
                    placeholder={t('company:competitors.notes_placeholder')}
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={competitor.monitor_pricing}
                      onCheckedChange={(v) => handleUpdate(competitor.id, { monitor_pricing: v })}
                    />
                    <Label className="text-sm">{t('company:competitors.monitor_pricing')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={competitor.monitor_content}
                      onCheckedChange={(v) => handleUpdate(competitor.id, { monitor_content: v })}
                    />
                    <Label className="text-sm">{t('company:competitors.monitor_content')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={competitor.monitor_campaigns}
                      onCheckedChange={(v) => handleUpdate(competitor.id, { monitor_campaigns: v })}
                    />
                    <Label className="text-sm">{t('company:competitors.monitor_campaigns')}</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Single Competitor Analysis Modal */}
      <CompetitorAnalysisModal
        open={singleCompetitorModalOpen}
        onOpenChange={setSingleCompetitorModalOpen}
        competitorData={singleCompetitorData}
        competitorName={singleCompetitorName}
      />
    </div>
  );
};
