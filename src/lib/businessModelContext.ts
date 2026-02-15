import { BusinessModel } from '@/components/strategy/founder/steps/BusinessModelStep';

/**
 * Returns i18n key suffixes and contextual hints based on business model.
 * This keeps module components clean and model-aware without hardcoding.
 */
export function getBusinessModelContext(model: BusinessModel | null) {
  const m = model || 'mixed';

  const contexts: Record<BusinessModel, {
    // Module 1
    problemFocus: string;
    problemPlaceholderKey: string;
    transformationFocus: string;
    // Module 2
    icpLabel: string;
    icpWhoPlaceholderKey: string;
    icpProblemPlaceholderKey: string;
    maturityOptions: { value: string; labelKey: string; descKey: string }[];
    showDecisionMaker: boolean;
    decisionMakerLabel: string;
    // Module 3
    advantageFocusKey: string;
    advantagePlaceholderKey: string;
    moatEmphasis: string[];
  }> = {
    b2b: {
      problemFocus: 'journey.sdna.bm.b2b.problemFocus',
      problemPlaceholderKey: 'journey.sdna.bm.b2b.problemPlaceholder',
      transformationFocus: 'journey.sdna.bm.b2b.transformationFocus',
      icpLabel: 'journey.sdna.bm.b2b.icpLabel',
      icpWhoPlaceholderKey: 'journey.sdna.bm.b2b.icpWhoPlaceholder',
      icpProblemPlaceholderKey: 'journey.sdna.bm.b2b.icpProblemPlaceholder',
      maturityOptions: [
        { value: 'early', labelKey: 'journey.sdna.maturityEarly', descKey: 'journey.sdna.bm.b2b.maturityEarlyDesc' },
        { value: 'growing', labelKey: 'journey.sdna.maturityGrowing', descKey: 'journey.sdna.bm.b2b.maturityGrowingDesc' },
        { value: 'established', labelKey: 'journey.sdna.maturityEstablished', descKey: 'journey.sdna.bm.b2b.maturityEstablishedDesc' },
      ],
      showDecisionMaker: true,
      decisionMakerLabel: 'journey.sdna.bm.b2b.decisionMakerLabel',
      advantageFocusKey: 'journey.sdna.bm.b2b.advantageFocus',
      advantagePlaceholderKey: 'journey.sdna.bm.b2b.advantagePlaceholder',
      moatEmphasis: ['differentiation', 'focus'],
    },
    b2c: {
      problemFocus: 'journey.sdna.bm.b2c.problemFocus',
      problemPlaceholderKey: 'journey.sdna.bm.b2c.problemPlaceholder',
      transformationFocus: 'journey.sdna.bm.b2c.transformationFocus',
      icpLabel: 'journey.sdna.bm.b2c.icpLabel',
      icpWhoPlaceholderKey: 'journey.sdna.bm.b2c.icpWhoPlaceholder',
      icpProblemPlaceholderKey: 'journey.sdna.bm.b2c.icpProblemPlaceholder',
      maturityOptions: [
        { value: 'early', labelKey: 'journey.sdna.maturityEarly', descKey: 'journey.sdna.bm.b2c.maturityEarlyDesc' },
        { value: 'growing', labelKey: 'journey.sdna.maturityGrowing', descKey: 'journey.sdna.bm.b2c.maturityGrowingDesc' },
        { value: 'established', labelKey: 'journey.sdna.maturityEstablished', descKey: 'journey.sdna.bm.b2c.maturityEstablishedDesc' },
      ],
      showDecisionMaker: false,
      decisionMakerLabel: '',
      advantageFocusKey: 'journey.sdna.bm.b2c.advantageFocus',
      advantagePlaceholderKey: 'journey.sdna.bm.b2c.advantagePlaceholder',
      moatEmphasis: ['differentiation', 'cost'],
    },
    b2b2c: {
      problemFocus: 'journey.sdna.bm.b2b2c.problemFocus',
      problemPlaceholderKey: 'journey.sdna.bm.b2b2c.problemPlaceholder',
      transformationFocus: 'journey.sdna.bm.b2b2c.transformationFocus',
      icpLabel: 'journey.sdna.bm.b2b2c.icpLabel',
      icpWhoPlaceholderKey: 'journey.sdna.bm.b2b2c.icpWhoPlaceholder',
      icpProblemPlaceholderKey: 'journey.sdna.bm.b2b2c.icpProblemPlaceholder',
      maturityOptions: [
        { value: 'early', labelKey: 'journey.sdna.maturityEarly', descKey: 'journey.sdna.bm.b2b2c.maturityEarlyDesc' },
        { value: 'growing', labelKey: 'journey.sdna.maturityGrowing', descKey: 'journey.sdna.bm.b2b2c.maturityGrowingDesc' },
        { value: 'established', labelKey: 'journey.sdna.maturityEstablished', descKey: 'journey.sdna.bm.b2b2c.maturityEstablishedDesc' },
      ],
      showDecisionMaker: true,
      decisionMakerLabel: 'journey.sdna.bm.b2b2c.decisionMakerLabel',
      advantageFocusKey: 'journey.sdna.bm.b2b2c.advantageFocus',
      advantagePlaceholderKey: 'journey.sdna.bm.b2b2c.advantagePlaceholder',
      moatEmphasis: ['network_effects', 'differentiation'],
    },
    mixed: {
      problemFocus: 'journey.sdna.bm.mixed.problemFocus',
      problemPlaceholderKey: 'journey.sdna.bm.mixed.problemPlaceholder',
      transformationFocus: 'journey.sdna.bm.mixed.transformationFocus',
      icpLabel: 'journey.sdna.bm.mixed.icpLabel',
      icpWhoPlaceholderKey: 'journey.sdna.bm.mixed.icpWhoPlaceholder',
      icpProblemPlaceholderKey: 'journey.sdna.bm.mixed.icpProblemPlaceholder',
      maturityOptions: [
        { value: 'early', labelKey: 'journey.sdna.maturityEarly', descKey: 'journey.sdna.maturityEarlyDesc' },
        { value: 'growing', labelKey: 'journey.sdna.maturityGrowing', descKey: 'journey.sdna.maturityGrowingDesc' },
        { value: 'established', labelKey: 'journey.sdna.maturityEstablished', descKey: 'journey.sdna.maturityEstablishedDesc' },
      ],
      showDecisionMaker: true,
      decisionMakerLabel: 'journey.sdna.decisionMaker',
      advantageFocusKey: 'journey.sdna.bm.mixed.advantageFocus',
      advantagePlaceholderKey: 'journey.sdna.advantagePlaceholder',
      moatEmphasis: ['differentiation', 'focus', 'cost', 'network_effects'],
    },
  };

  return contexts[m];
}
