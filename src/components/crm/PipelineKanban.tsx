import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRMDeals, CreateDealInput } from '@/hooks/useCRMDeals';
import { useCRMContacts } from '@/hooks/useCRMContacts';
import { useCompanyData } from '@/hooks/useCompanyData';
import { Plus, DollarSign, Calendar, User, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PipelineKanban = () => {
  const { t } = useTranslation();
  const { primaryCompany } = useCompanyData();
  const companyId = primaryCompany?.id;
  
  const {
    pipelines,
    stages,
    deals,
    selectedPipelineId,
    setSelectedPipelineId,
    isLoading,
    createPipeline,
    createDeal,
    updateDeal,
  } = useCRMDeals(companyId);
  
  const { contacts } = useCRMContacts(companyId);
  
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);
  const [isCreatePipelineOpen, setIsCreatePipelineOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<Partial<CreateDealInput>>({});
  const [newPipelineName, setNewPipelineName] = useState('');
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  // Auto-select first pipeline
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId, setSelectedPipelineId]);

  const handleCreatePipeline = async () => {
    if (!companyId || !newPipelineName) return;
    await createPipeline.mutateAsync({
      company_id: companyId,
      name: newPipelineName,
      is_default: pipelines.length === 0,
    });
    setNewPipelineName('');
    setIsCreatePipelineOpen(false);
  };

  const handleCreateDeal = async () => {
    if (!companyId || !selectedPipelineId || !newDeal.deal_name) return;
    
    const firstStage = stages.find(s => s.stage_type === 'open' && s.position === 0) || stages[0];
    if (!firstStage) return;

    await createDeal.mutateAsync({
      company_id: companyId,
      pipeline_id: selectedPipelineId,
      stage_id: firstStage.id,
      deal_name: newDeal.deal_name,
      contact_id: newDeal.contact_id,
      amount: newDeal.amount || 0,
      probability: firstStage.default_probability,
    });
    
    setNewDeal({});
    setIsCreateDealOpen(false);
  };

  const handleDragStart = (dealId: string) => {
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedDealId) return;
    
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    await updateDeal.mutateAsync({
      id: draggedDealId,
      stage_id: stageId,
      probability: stage.default_probability,
      status: stage.stage_type === 'won' ? 'won' : stage.stage_type === 'lost' ? 'lost' : 'open',
    });
    
    setDraggedDealId(null);
  };

  const getDealsForStage = (stageId: string) => {
    return deals.filter(d => d.stage_id === stageId);
  };

  if (pipelines.length === 0 && !isLoading) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-medium mb-2">{t('crm.pipeline.noPipelines')}</h3>
        <p className="text-muted-foreground mb-4">{t('crm.pipeline.createFirst')}</p>
        <Dialog open={isCreatePipelineOpen} onOpenChange={setIsCreatePipelineOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.pipeline.create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('crm.pipeline.createNew')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('crm.pipeline.name')}</Label>
                <Input
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder={t('crm.pipeline.namePlaceholder')}
                />
              </div>
              <Button onClick={handleCreatePipeline} className="w-full" disabled={!newPipelineName}>
                {t('crm.pipeline.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Selector & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={selectedPipelineId || ''}
            onValueChange={setSelectedPipelineId}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('crm.pipeline.select')} />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDealOpen} onOpenChange={setIsCreateDealOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedPipelineId}>
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.deals.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('crm.deals.addNew')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('crm.deals.name')} *</Label>
                <Input
                  value={newDeal.deal_name || ''}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, deal_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('crm.deals.contact')}</Label>
                <Select
                  value={newDeal.contact_id || ''}
                  onValueChange={(value) => setNewDeal(prev => ({ ...prev, contact_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.deals.selectContact')} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('crm.deals.amount')}</Label>
                <Input
                  type="number"
                  value={newDeal.amount || ''}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <Button 
                onClick={handleCreateDeal} 
                className="w-full"
                disabled={!newDeal.deal_name || createDeal.isPending}
              >
                {createDeal.isPending ? t('status.saving') : t('crm.deals.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <CardTitle className="text-sm font-medium">
                      {stage.name}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getDealsForStage(stage.id).length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
                {getDealsForStage(stage.id).map((deal) => (
                  <Card
                    key={deal.id}
                    className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                  >
                    <p className="font-medium text-sm mb-2 truncate">{deal.deal_name}</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>${deal.amount?.toLocaleString() || 0}</span>
                      </div>
                      {deal.expected_close_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(deal.expected_close_date), "d MMM", { locale: es })}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                
                {getDealsForStage(stage.id).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    {t('crm.pipeline.noDeals')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
