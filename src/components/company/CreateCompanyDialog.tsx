import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyManagement } from '@/hooks/useCompanyManagement';
import { useToast } from '@/hooks/use-toast';
import { Building } from 'lucide-react';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCompanyDialog = ({ open, onOpenChange }: CreateCompanyDialogProps) => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    industry_sector: '',
    company_size: ''
  });
  const [loading, setLoading] = useState(false);
  const { createCompany } = useCompanyManagement();
  const { toast } = useToast();

  const companySizeKeys = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;
  const sectorKeys = ['technology', 'finance', 'health', 'education', 'retail', 'manufacturing', 'services', 'construction', 'agriculture', 'energy', 'other'] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: t('error'),
        description: t('createCompany.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await createCompany(formData);
      
      if (result.success) {
        toast({
          title: t('createCompany.created'),
          description: t('createCompany.createdDesc'),
        });
        
        setFormData({
          name: '',
          description: '',
          website_url: '',
          industry_sector: '',
          company_size: ''
        });
        
        onOpenChange(false);
      } else {
        throw new Error(result.error?.message || t('messages.somethingWrong'));
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('messages.somethingWrong'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {t('createCompany.title')}
          </DialogTitle>
          <DialogDescription>
            {t('createCompany.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">
              {t('createCompany.companyName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-name"
              placeholder={t('createCompany.companyNamePlaceholder')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-description">{t('createCompany.companyDescription')}</Label>
            <Textarea
              id="company-description"
              placeholder={t('createCompany.companyDescriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-website">{t('createCompany.website')}</Label>
            <Input
              id="company-website"
              type="url"
              placeholder={t('createCompany.websitePlaceholder')}
              value={formData.website_url}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-sector">{t('createCompany.sector')}</Label>
              <Select 
                value={formData.industry_sector} 
                onValueChange={(value) => handleInputChange('industry_sector', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('createCompany.sectorPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {sectorKeys.map((key) => (
                    <SelectItem key={key} value={t(`sectors.${key}`)}>
                      {t(`sectors.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-size">{t('createCompany.size')}</Label>
              <Select 
                value={formData.company_size} 
                onValueChange={(value) => handleInputChange('company_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('createCompany.sizePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {companySizeKeys.map((key) => (
                    <SelectItem key={key} value={t(`companySizes.${key}`)}>
                      {t(`companySizes.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('createCompany.creating') : t('createCompany.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};