import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { EraOptimizerButton } from "@/components/ui/era-optimizer-button";
import { Palette, RefreshCw, Sparkles } from "lucide-react";
import { AutoSaveField } from "./shared/AutoSaveField";

interface ADNBrandTabProps {
  companyData: any;
  brandingData: any;
  saveField: (field: string, value: any, table?: string) => Promise<void>;
  generateBrandIdentity: () => Promise<void>;
  isGeneratingBrand: boolean;
}

export const ADNBrandTab = ({
  companyData,
  brandingData,
  saveField,
  generateBrandIdentity,
  isGeneratingBrand
}: ADNBrandTabProps) => {
  const { t } = useTranslation(['common', 'company']);

  // Helper to render brand voice
  const renderBrandVoice = () => {
    if (!brandingData?.brand_voice) return null;
    
    const bv = brandingData.brand_voice;
    return (
      <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/30 space-y-2">
        {bv.personalidad && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/50">
              {bv.personalidad}
            </Badge>
          </div>
        )}
        {bv.descripcion && (
          <p className="text-sm text-muted-foreground">{bv.descripcion}</p>
        )}
        {bv.palabras_clave && bv.palabras_clave.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {bv.palabras_clave.map((palabra: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {palabra}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-purple-600" />
            {t('common:adn.tabs.brand')}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateBrandIdentity}
            disabled={isGeneratingBrand || !companyData?.id}
          >
            {isGeneratingBrand ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                {t('company:brand.generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                {t('company:brand.generateWithAI')}
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Paleta de Colores */}
        {(brandingData?.primary_color || brandingData?.secondary_color) && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('common:adn.colorPalette')}</label>
            <div className="flex flex-wrap gap-3">
              {brandingData.primary_color && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border shadow-sm" 
                    style={{ backgroundColor: brandingData.primary_color }}
                  />
                  <div>
                    <p className="text-xs font-medium">{t('common:adn.primary')}</p>
                    <p className="text-xs text-muted-foreground">{brandingData.primary_color}</p>
                  </div>
                </div>
              )}
              {brandingData.secondary_color && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border shadow-sm" 
                    style={{ backgroundColor: brandingData.secondary_color }}
                  />
                  <div>
                    <p className="text-xs font-medium">{t('common:adn.secondary')}</p>
                    <p className="text-xs text-muted-foreground">{brandingData.secondary_color}</p>
                  </div>
                </div>
              )}
              {brandingData.complementary_color_1 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border shadow-sm" 
                    style={{ backgroundColor: brandingData.complementary_color_1 }}
                  />
                  <div>
                    <p className="text-xs font-medium">{t('common:adn.complementary')} 1</p>
                    <p className="text-xs text-muted-foreground">{brandingData.complementary_color_1}</p>
                  </div>
                </div>
              )}
              {brandingData.complementary_color_2 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border shadow-sm" 
                    style={{ backgroundColor: brandingData.complementary_color_2 }}
                  />
                  <div>
                    <p className="text-xs font-medium">{t('common:adn.complementary')} 2</p>
                    <p className="text-xs text-muted-foreground">{brandingData.complementary_color_2}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Identidad Visual */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">{t('common:adn.visualIdentity')}</label>
            <EraOptimizerButton
              currentText={brandingData?.visual_identity || ''}
              fieldType="identidad visual"
              context={{ companyName: companyData?.name, industry: companyData?.industry_sector }}
              onOptimized={(text) => saveField('visual_identity', text, 'company_branding')}
              size="sm"
            />
          </div>
          <AutoSaveField
            value={brandingData?.visual_identity || ''}
            onSave={(v) => saveField('visual_identity', v, 'company_branding')}
            type="textarea"
            placeholder={t('common:adn.visualIdentityPlaceholder')}
          />
        </div>

        {/* Voz de Marca */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('common:adn.brandVoice')}</label>
          {brandingData?.brand_voice ? (
            renderBrandVoice()
          ) : (
            <p className="text-sm text-muted-foreground italic">{t('common:adn.noBrandVoice')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
