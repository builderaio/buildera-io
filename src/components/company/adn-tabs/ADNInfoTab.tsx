import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { EraOptimizerButton } from "@/components/ui/era-optimizer-button";
import { Building2, Target, Users, MapPin, Globe, RefreshCw } from "lucide-react";
import { AutoSaveField } from "./shared/AutoSaveField";

interface ADNInfoTabProps {
  companyData: any;
  setCompanyData: (data: any) => void;
  saveField: (field: string, value: any, table?: string) => Promise<void>;
  isEnrichingData: boolean;
  enrichCompanyData: () => Promise<void>;
}

export const ADNInfoTab = ({ 
  companyData, 
  setCompanyData,
  saveField, 
  isEnrichingData, 
  enrichCompanyData 
}: ADNInfoTabProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'company']);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyData?.id) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyData.id}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);
      
      await saveField('logo_url', publicUrl);
      toast({ title: "✓", description: t('common:adn.logoUpdated'), duration: 1500 });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({ title: t('common:error'), description: t('common:adn.couldNotUploadLogo'), variant: "destructive" });
    }
  }, [companyData?.id, saveField, toast, t]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            {t('common:adn.tabs.info')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={enrichCompanyData}
            disabled={isEnrichingData || !companyData?.website_url}
            title={!companyData?.website_url ? t('common:adn.addWebsiteFirst') : ''}
          >
            {isEnrichingData ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                {t('company:enrich.enriching')}
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-1" />
                {t('company:enrich.enrichData')}
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Upload */}
        <div className="flex items-start gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30">
              {companyData?.logo_url ? (
                <img 
                  src={companyData.logo_url} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground/40" />
              )}
            </div>
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <span className="text-white text-xs">{t('common:adn.change')}</span>
            </label>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('common:adn.companyLogo')}</label>
            <p className="text-xs text-muted-foreground/70">{t('common:adn.clickToChangeLogo')}</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3" /> {t('common:adn.name')}
            </label>
            <AutoSaveField
              value={companyData?.name || ''}
              onSave={(v) => saveField('name', v)}
              placeholder={t('common:adn.companyNamePlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              <Target className="w-3 h-3" /> {t('common:adn.sector')}
            </label>
            <AutoSaveField
              value={companyData?.industry_sector || ''}
              onSave={(v) => saveField('industry_sector', v)}
              placeholder={t('common:adn.sectorPlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              <Users className="w-3 h-3" /> {t('common:adn.size')}
            </label>
            <AutoSaveField
              value={companyData?.company_size || ''}
              onSave={(v) => saveField('company_size', v)}
              placeholder={t('common:adn.sizePlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" /> {t('common:adn.country')}
            </label>
            <AutoSaveField
              value={companyData?.country || ''}
              onSave={(v) => saveField('country', v)}
              placeholder={t('common:adn.countryPlaceholder')}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
            <Globe className="w-3 h-3" /> {t('common:adn.website')}
          </label>
          <AutoSaveField
            value={companyData?.website_url || ''}
            onSave={(v) => saveField('website_url', v)}
            placeholder="https://..."
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">{t('common:adn.description')}</label>
            <EraOptimizerButton
              currentText={companyData?.description || ''}
              fieldType="descripción de empresa"
              context={{ 
                companyName: companyData?.name, 
                industry: companyData?.industry_sector,
                website: companyData?.website_url 
              }}
              onOptimized={(text) => saveField('description', text)}
              size="sm"
            />
          </div>
          <AutoSaveField
            value={companyData?.description || ''}
            onSave={(v) => saveField('description', v)}
            type="textarea"
            placeholder={t('common:adn.descriptionPlaceholder')}
          />
        </div>
      </CardContent>
    </Card>
  );
};
