import { BusinessModel } from '@/components/strategy/founder/steps/BusinessModelStep';
import { BusinessModelType } from '@/types/playToWin';

/**
 * Returns priority weights for the SCC based on business model.
 * Higher weight = higher sorting priority for that variable.
 */
export function getBusinessModelPriorityWeights(model: BusinessModelType | null): Record<string, number> {
  switch (model) {
    case 'b2b':
      return { authority: 2, positioning: 1.5, channel: 1, trust: 1.3, brand: 1, visibility: 1, offer: 1, audience: 1.2 };
    case 'b2c':
      return { brand: 2, visibility: 1.5, trust: 1.5, audience: 1.3, channel: 1.2, positioning: 1, offer: 1, authority: 1 };
    case 'b2b2c':
      return { channel: 2, offer: 1.5, positioning: 1, brand: 1.3, trust: 1.2, visibility: 1.2, authority: 1, audience: 1.3 };
    default:
      return { positioning: 1.2, channel: 1.2, brand: 1.2, trust: 1.2, visibility: 1.2, authority: 1, offer: 1, audience: 1 };
  }
}

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
