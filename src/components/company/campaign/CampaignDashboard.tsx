import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useCampaignDrafts } from '@/hooks/useCampaignDrafts';
import { DraftCampaignsList } from './DraftCampaignsList';
import { CampaignWizard } from './CampaignWizard';

interface CampaignDashboardProps {
  onStartNewCampaign?: () => void;
}

export const CampaignDashboard = ({ onStartNewCampaign }: CampaignDashboardProps) => {
  const { t } = useTranslation('campaigns');
  const [showWizard, setShowWizard] = useState(false);
  const [resumingDraft, setResumingDraft] = useState(null);
  
  const { 
    drafts, 
    loading, 
    deleteDraft,
    loadDraft,
    setCurrentDraft
  } = useCampaignDrafts();

  const handleStartNewCampaign = () => {
    setResumingDraft(null);
    setCurrentDraft(null);
    setShowWizard(true);
    onStartNewCampaign?.();
  };

  const handleResumeDraft = async (draft: any) => {
    const draftData = await loadDraft(draft.id);
    if (draftData) {
      setResumingDraft(draftData);
      setShowWizard(true);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (window.confirm(t('dashboard.confirmDelete'))) {
      await deleteDraft(draftId);
    }
  };

  if (showWizard) {
    return (
      <div>
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowWizard(false)}
            className="mb-4"
          >
            ← {t('dashboard.backToCampaigns')}
          </Button>
        </div>
        <CampaignWizard 
          initialData={resumingDraft?.draft_data}
          initialStep={resumingDraft?.current_step}
          draftId={resumingDraft?.id}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        
        <Button 
          onClick={handleStartNewCampaign}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('dashboard.newCampaign')}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.inProgress')}</p>
                <p className="text-2xl font-bold">{drafts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.completed')}</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.performance')}</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.avgROI')}</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft Campaigns List */}
      <DraftCampaignsList
        drafts={drafts}
        onResume={handleResumeDraft}
        onDelete={handleDeleteDraft}
        loading={loading}
        onStartNewCampaign={handleStartNewCampaign}
      />
    </div>
  );
};