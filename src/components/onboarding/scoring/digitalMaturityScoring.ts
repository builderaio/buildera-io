/**
 * Digital Maturity Scoring Engine
 * Deterministic, auditable scoring for digital presence evaluation.
 * Each criterion contributes a fixed number of points documented in the breakdown.
 */

export interface ScoreCriterion {
  key: string;
  /** i18n key for display */
  labelKey: string;
  /** Max points this criterion can contribute */
  maxPoints: number;
  /** Actual points awarded */
  points: number;
  /** Whether the criterion was met */
  met: boolean;
}

export interface ScoreBreakdown {
  score: number;
  criteria: ScoreCriterion[];
}

export interface DigitalMaturityScores {
  visibility: ScoreBreakdown;
  trust: ScoreBreakdown;
  positioning: ScoreBreakdown;
}

function len(val: any): number {
  if (Array.isArray(val)) return val.length;
  return 0;
}

export function computeDigitalMaturityScores(results: any): DigitalMaturityScores {
  const basic = results?.basic_info || {};
  const digital = results?.digital_presence || {};
  const identity = basic.identity || {};
  const seo = basic.seo || {};
  const products = basic.products || {};
  const contact = basic.contact || {};
  const audience = basic.audience || {};

  // ═══════════════════════════════════════════════════
  // VISIBILITY SCORE (0-100)
  // Measures SEO completeness, indexed presence, social accessibility
  // ═══════════════════════════════════════════════════
  const visCriteria: ScoreCriterion[] = [];

  const hasUrl = !!identity.url;
  visCriteria.push({ key: 'website_url', labelKey: 'scoring.vis.websiteUrl', maxPoints: 15, points: hasUrl ? 15 : 0, met: hasUrl });

  const hasTitle = !!seo.title;
  visCriteria.push({ key: 'seo_title', labelKey: 'scoring.vis.seoTitle', maxPoints: 12, points: hasTitle ? 12 : 0, met: hasTitle });

  const hasDesc = !!seo.description;
  visCriteria.push({ key: 'seo_description', labelKey: 'scoring.vis.seoDescription', maxPoints: 12, points: hasDesc ? 12 : 0, met: hasDesc });

  const keywords = seo.keyword || seo.keywords || [];
  const kwCount = len(keywords);
  const kwPoints = kwCount >= 5 ? 12 : kwCount >= 2 ? 8 : kwCount >= 1 ? 4 : 0;
  visCriteria.push({ key: 'seo_keywords', labelKey: 'scoring.vis.seoKeywords', maxPoints: 12, points: kwPoints, met: kwCount > 0 });

  const socialLinks = contact.social_links || [];
  const socialCount = len(socialLinks);
  const socialPts = Math.min(20, socialCount * 5);
  visCriteria.push({ key: 'social_channels', labelKey: 'scoring.vis.socialChannels', maxPoints: 20, points: socialPts, met: socialCount > 0 });

  const working = digital.what_is_working || [];
  const workingCount = len(working);
  const workingPts = Math.min(17, workingCount * 4);
  visCriteria.push({ key: 'working_elements', labelKey: 'scoring.vis.workingElements', maxPoints: 17, points: workingPts, met: workingCount > 0 });

  const hasFootprint = !!digital.digital_footprint_summary;
  visCriteria.push({ key: 'digital_footprint', labelKey: 'scoring.vis.digitalFootprint', maxPoints: 7, points: hasFootprint ? 7 : 0, met: hasFootprint });

  const hasCompetitive = !!digital.competitive_positioning;
  visCriteria.push({ key: 'competitive_presence', labelKey: 'scoring.vis.competitivePresence', maxPoints: 5, points: hasCompetitive ? 5 : 0, met: hasCompetitive });

  const visScore = Math.min(100, visCriteria.reduce((s, c) => s + c.points, 0));

  // ═══════════════════════════════════════════════════
  // TRUST SCORE (0-100)
  // Measures trust signals: legal info, testimonials, contact, brand completeness
  // ═══════════════════════════════════════════════════
  const trustCriteria: ScoreCriterion[] = [];

  const hasName = !!identity.company_name;
  trustCriteria.push({ key: 'company_name', labelKey: 'scoring.trust.companyName', maxPoints: 8, points: hasName ? 8 : 0, met: hasName });

  const hasLogo = !!identity.logo;
  trustCriteria.push({ key: 'logo', labelKey: 'scoring.trust.logo', maxPoints: 12, points: hasLogo ? 12 : 0, met: hasLogo });

  const hasSlogan = !!identity.slogan;
  trustCriteria.push({ key: 'slogan', labelKey: 'scoring.trust.slogan', maxPoints: 5, points: hasSlogan ? 5 : 0, met: hasSlogan });

  const emailCount = len(contact.email);
  trustCriteria.push({ key: 'email', labelKey: 'scoring.trust.email', maxPoints: 10, points: emailCount > 0 ? 10 : 0, met: emailCount > 0 });

  const phoneCount = len(contact.phone);
  trustCriteria.push({ key: 'phone', labelKey: 'scoring.trust.phone', maxPoints: 10, points: phoneCount > 0 ? 10 : 0, met: phoneCount > 0 });

  const addressCount = len(contact.address);
  trustCriteria.push({ key: 'address', labelKey: 'scoring.trust.address', maxPoints: 10, points: addressCount > 0 ? 10 : 0, met: addressCount > 0 });

  const trustSocialPts = socialCount >= 3 ? 15 : socialCount > 0 ? 8 : 0;
  trustCriteria.push({ key: 'social_trust', labelKey: 'scoring.trust.socialPresence', maxPoints: 15, points: trustSocialPts, met: socialCount > 0 });

  const risksCount = len(digital.key_risks);
  const riskPts = risksCount === 0 ? 15 : risksCount <= 2 ? 8 : 0;
  trustCriteria.push({ key: 'low_risks', labelKey: 'scoring.trust.lowRisks', maxPoints: 15, points: riskPts, met: risksCount <= 2 });

  const hasFounding = !!identity.founding_date;
  trustCriteria.push({ key: 'founding_date', labelKey: 'scoring.trust.foundingDate', maxPoints: 10, points: hasFounding ? 10 : 0, met: hasFounding });

  const trustScore = Math.min(100, trustCriteria.reduce((s, c) => s + c.points, 0));

  // ═══════════════════════════════════════════════════
  // POSITIONING CLARITY SCORE (0-100)
  // Measures structured content, competitive differentiation, audience clarity
  // ═══════════════════════════════════════════════════
  const posCriteria: ScoreCriterion[] = [];

  const services = products.service || products.services || [];
  const svcCount = len(services);
  posCriteria.push({ key: 'services', labelKey: 'scoring.pos.services', maxPoints: 15, points: svcCount > 0 ? 15 : 0, met: svcCount > 0 });

  const offers = products.offer || products.offers || [];
  const offerCount = len(offers);
  posCriteria.push({ key: 'offers', labelKey: 'scoring.pos.offers', maxPoints: 10, points: offerCount > 0 ? 10 : 0, met: offerCount > 0 });

  const segments = audience.segment || audience.segments || [];
  const segCount = len(segments);
  posCriteria.push({ key: 'audience_segments', labelKey: 'scoring.pos.audienceSegments', maxPoints: 12, points: segCount > 0 ? 12 : 0, met: segCount > 0 });

  const professions = audience.profession || audience.professions || [];
  const targetUsers = audience.target_user || audience.target_users || [];
  const audienceDetail = len(professions) + len(targetUsers);
  const audienceDetailPts = audienceDetail >= 3 ? 8 : audienceDetail > 0 ? 4 : 0;
  posCriteria.push({ key: 'audience_detail', labelKey: 'scoring.pos.audienceDetail', maxPoints: 8, points: audienceDetailPts, met: audienceDetail > 0 });

  posCriteria.push({ key: 'meta_description', labelKey: 'scoring.pos.metaDescription', maxPoints: 8, points: hasDesc ? 8 : 0, met: hasDesc });

  const posWorkingPts = workingCount >= 3 ? 12 : workingCount > 0 ? 6 : 0;
  posCriteria.push({ key: 'content_strengths', labelKey: 'scoring.pos.contentStrengths', maxPoints: 12, points: posWorkingPts, met: workingCount > 0 });

  const missingCount = len(digital.what_is_missing);
  const gapPts = missingCount <= 2 ? 12 : 4;
  posCriteria.push({ key: 'low_content_gaps', labelKey: 'scoring.pos.lowContentGaps', maxPoints: 12, points: gapPts, met: missingCount <= 2 });

  const hasActionPlan = digital.action_plan?.short_term?.length > 0;
  posCriteria.push({ key: 'action_plan', labelKey: 'scoring.pos.actionPlan', maxPoints: 10, points: hasActionPlan ? 10 : 0, met: hasActionPlan });

  const hasLeverage = !!digital.executive_diagnosis?.highest_leverage_focus;
  posCriteria.push({ key: 'differentiation', labelKey: 'scoring.pos.differentiation', maxPoints: 8, points: hasLeverage ? 8 : 0, met: hasLeverage });

  const hasCompPos = !!digital.competitive_positioning;
  posCriteria.push({ key: 'competitive_clarity', labelKey: 'scoring.pos.competitiveClarity', maxPoints: 5, points: hasCompPos ? 5 : 0, met: hasCompPos });

  const posScore = Math.min(100, posCriteria.reduce((s, c) => s + c.points, 0));

  return {
    visibility: { score: visScore, criteria: visCriteria },
    trust: { score: trustScore, criteria: trustCriteria },
    positioning: { score: posScore, criteria: posCriteria },
  };
}
