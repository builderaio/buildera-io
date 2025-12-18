import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { EraOptimizerButton } from "@/components/ui/era-optimizer-button";
import { Target, TrendingUp, RefreshCw, Sparkles, Plus, Trash2, Calendar } from "lucide-react";
import { AutoSaveField } from "./shared/AutoSaveField";

interface ADNStrategyTabProps {
  companyData: any;
  strategyData: any;
  objectives: any[];
  saveField: (field: string, value: any, table?: string) => Promise<void>;
  saveObjective: (data: any, id?: string) => Promise<void>;
  deleteObjective: (id: string) => Promise<void>;
  addNewObjective: () => void;
  generateStrategy: () => Promise<void>;
  generateObjectives: () => Promise<void>;
  isGeneratingStrategy: boolean;
  isGeneratingObjectives: boolean;
}

// Componente de objetivo simplificado
const ObjectiveItem = ({ 
  objective, 
  onSave, 
  onDelete,
  translations
}: { 
  objective: any;
  onSave: (data: any, id: string) => void;
  onDelete: (id: string) => void;
  translations: {
    objectiveTitle: string;
    objectiveDescription: string;
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
    priorityHigh: string;
    priorityMedium: string;
    priorityLow: string;
  };
}) => {
  const [localData, setLocalData] = useState({
    title: objective.title || '',
    description: objective.description || '',
    objective_type: objective.objective_type || 'short_term',
    priority: objective.priority || 1,
    target_date: objective.target_date || ''
  });
  const initialDataRef = useRef(localData);

  useEffect(() => {
    const newData = {
      title: objective.title || '',
      description: objective.description || '',
      objective_type: objective.objective_type || 'short_term',
      priority: objective.priority || 1,
      target_date: objective.target_date || ''
    };
    setLocalData(newData);
    initialDataRef.current = newData;
  }, [objective]);

  const handleFieldBlur = useCallback(() => {
    if (JSON.stringify(localData) !== JSON.stringify(initialDataRef.current)) {
      onSave(localData, objective.id);
      initialDataRef.current = localData;
    }
  }, [localData, objective.id, onSave]);

  const handleSelectChange = useCallback((field: string, value: string) => {
    const newData = { ...localData, [field]: field === 'priority' ? parseInt(value) : value };
    setLocalData(newData);
    onSave(newData, objective.id);
    initialDataRef.current = newData;
  }, [localData, objective.id, onSave]);

  return (
    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 space-y-3">
      <div className="flex items-start gap-2">
        <Input
          value={localData.title}
          onChange={(e) => setLocalData(prev => ({ ...prev, title: e.target.value }))}
          onBlur={handleFieldBlur}
          placeholder={translations.objectiveTitle}
          className="bg-transparent border-none font-semibold text-emerald-900 dark:text-emerald-100 focus:ring-1 focus:ring-emerald-500/30"
        />
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(objective.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <Textarea
        value={localData.description}
        onChange={(e) => setLocalData(prev => ({ ...prev, description: e.target.value }))}
        onBlur={handleFieldBlur}
        placeholder={translations.objectiveDescription}
        className="bg-transparent border-none min-h-[60px] resize-none text-sm focus:ring-1 focus:ring-emerald-500/30"
      />
      
      <div className="flex flex-wrap items-center gap-2">
        <Select 
          value={localData.objective_type} 
          onValueChange={(value) => handleSelectChange('objective_type', value)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs bg-transparent border-emerald-200 dark:border-emerald-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short_term">{translations.shortTerm}</SelectItem>
            <SelectItem value="medium_term">{translations.mediumTerm}</SelectItem>
            <SelectItem value="long_term">{translations.longTerm}</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={localData.priority.toString()} 
          onValueChange={(value) => handleSelectChange('priority', value)}
        >
          <SelectTrigger className="w-[100px] h-8 text-xs bg-transparent border-emerald-200 dark:border-emerald-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{translations.priorityHigh}</SelectItem>
            <SelectItem value="2">{translations.priorityMedium}</SelectItem>
            <SelectItem value="3">{translations.priorityLow}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <Input
            type="date"
            value={localData.target_date}
            onChange={(e) => setLocalData(prev => ({ ...prev, target_date: e.target.value }))}
            onBlur={handleFieldBlur}
            className="w-[130px] h-8 text-xs bg-transparent border-emerald-200 dark:border-emerald-800"
          />
        </div>
      </div>
    </div>
  );
};

export const ADNStrategyTab = ({
  companyData,
  strategyData,
  objectives,
  saveField,
  saveObjective,
  deleteObjective,
  addNewObjective,
  generateStrategy,
  generateObjectives,
  isGeneratingStrategy,
  isGeneratingObjectives
}: ADNStrategyTabProps) => {
  const { t } = useTranslation(['common', 'company']);

  return (
    <div className="space-y-6">
      {/* Estrategia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-emerald-600" />
              {t('common:adn.strategy')}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateStrategy}
              disabled={isGeneratingStrategy || !companyData?.id}
            >
              {isGeneratingStrategy ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  {t('company:strategy.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  {t('company:strategy.generateWithAI')}
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">{t('common:adn.mission')}</label>
              <EraOptimizerButton
                currentText={strategyData?.mision || ''}
                fieldType="misión"
                context={{ companyName: companyData?.name, industry: companyData?.industry_sector }}
                onOptimized={(text) => saveField('mision', text, 'company_strategy')}
                size="sm"
              />
            </div>
            <AutoSaveField
              value={strategyData?.mision || ''}
              onSave={(v) => saveField('mision', v, 'company_strategy')}
              type="textarea"
              placeholder={t('common:adn.missionPlaceholder')}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">{t('common:adn.vision')}</label>
              <EraOptimizerButton
                currentText={strategyData?.vision || ''}
                fieldType="visión"
                context={{ companyName: companyData?.name, industry: companyData?.industry_sector }}
                onOptimized={(text) => saveField('vision', text, 'company_strategy')}
                size="sm"
              />
            </div>
            <AutoSaveField
              value={strategyData?.vision || ''}
              onSave={(v) => saveField('vision', v, 'company_strategy')}
              type="textarea"
              placeholder={t('common:adn.visionPlaceholder')}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">{t('common:adn.valueProposition')}</label>
              <EraOptimizerButton
                currentText={strategyData?.propuesta_valor || ''}
                fieldType="propuesta de valor"
                context={{ companyName: companyData?.name, industry: companyData?.industry_sector }}
                onOptimized={(text) => saveField('propuesta_valor', text, 'company_strategy')}
                size="sm"
              />
            </div>
            <AutoSaveField
              value={strategyData?.propuesta_valor || ''}
              onSave={(v) => saveField('propuesta_valor', v, 'company_strategy')}
              type="textarea"
              placeholder={t('common:adn.valuePropositionPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Objetivos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {t('common:adn.objectives')}
              {objectives.length > 0 && (
                <Badge variant="secondary" className="text-xs">{objectives.length}</Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateObjectives}
                disabled={isGeneratingObjectives || !companyData?.id}
              >
                {isGeneratingObjectives ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    {t('common:generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    {t('common:generateWithAI')}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={addNewObjective}>
                <Plus className="w-4 h-4 mr-1" />
                {t('common:add')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {objectives.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('common:adn.noObjectives')}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Button variant="link" size="sm" onClick={generateObjectives} disabled={isGeneratingObjectives}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  {t('common:generateWithAI')}
                </Button>
                <span className="text-muted-foreground">{t('common:or')}</span>
                <Button variant="link" size="sm" onClick={addNewObjective}>
                  {t('common:adn.createManually')}
                </Button>
              </div>
            </div>
          ) : (
            objectives.map((objective) => (
              <ObjectiveItem
                key={objective.id}
                objective={objective}
                onSave={saveObjective}
                onDelete={deleteObjective}
                translations={{
                  objectiveTitle: t('common:adn.objectiveTitle'),
                  objectiveDescription: t('common:adn.objectiveDescription'),
                  shortTerm: t('common:adn.shortTerm'),
                  mediumTerm: t('common:adn.mediumTerm'),
                  longTerm: t('common:adn.longTerm'),
                  priorityHigh: t('common:adn.priorityHigh'),
                  priorityMedium: t('common:adn.priorityMedium'),
                  priorityLow: t('common:adn.priorityLow'),
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
