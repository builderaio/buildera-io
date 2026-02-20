import { supabase } from "@/integrations/supabase/client";

const invoke = async (action: string, params: Record<string, any> = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/creatify-proxy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action, params }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `API error ${response.status}`);
  return data;
};

// === Links ===
export const createLink = (url: string, extras?: Record<string, any>) =>
  invoke("create-link", { url, ...extras });

// === URL to Video ===
export const createUrlToVideo = (params: {
  link_id: string;
  visual_style?: string;
  script_style?: string;
  aspect_ratio?: string;
  target_platform?: string;
  target_audience?: string;
  language?: string;
  video_length?: number;
  override_script?: string;
  no_background_music?: boolean;
  no_caption?: boolean;
  no_cta?: boolean;
  model_version?: string;
  company_id: string;
  campaign_id?: string;
  calendar_item_id?: string;
}) => invoke("url-to-video", params);

export const checkVideoStatus = (id: string) =>
  invoke("check-video-status", { id });

// === AI Avatar ===
export const createAvatarVideo = (params: {
  avatar_id: string;
  script: string;
  voice_id?: string;
  aspect_ratio?: string;
  background?: Record<string, any>;
  company_id: string;
  campaign_id?: string;
}) => invoke("avatar-video", params);

export const checkAvatarStatus = (id: string) =>
  invoke("check-avatar-status", { id });

// === Ad Clone ===
export const createAdClone = (params: {
  video_url: string;
  link_id: string;
  company_id: string;
  campaign_id?: string;
}) => invoke("ad-clone", params);

export const checkCloneStatus = (id: string) =>
  invoke("check-clone-status", { id });

// === IAB Images ===
export const createIABImages = (params: {
  image_url: string;
  brand_name?: string;
  tagline?: string;
  cta_text?: string;
  company_id: string;
  campaign_id?: string;
}) => invoke("iab-images", params);

export const checkIABStatus = (id: string) =>
  invoke("check-iab-status", { id });

// === Asset Generator ===
export const createAsset = (params: {
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  company_id: string;
}) => invoke("asset-generator", params);

export const checkAssetStatus = (id: string) =>
  invoke("check-asset-status", { id });

// === AI Scripts ===
export const generateScript = (params: {
  product_name: string;
  product_description: string;
  script_style?: string;
  target_audience?: string;
  language?: string;
}) => invoke("ai-scripts", params);

// === Text to Speech ===
export const createTTS = (params: {
  text: string;
  voice_id: string;
  company_id: string;
}) => invoke("text-to-speech", params);

export const checkTTSStatus = (id: string) =>
  invoke("check-tts-status", { id });

// === List Resources ===
export const getAvatars = () => invoke("get-avatars");
export const getVoices = () => invoke("get-voices");
export const getVisualStyles = () => invoke("get-visual-styles");

// === Platform/Aspect Ratio Mappings ===
export const PLATFORM_ASPECT_RATIO: Record<string, string> = {
  tiktok: "9x16",
  instagram_reels: "9x16",
  youtube_shorts: "9x16",
  youtube: "16x9",
  linkedin: "16x9",
  instagram_feed: "1x1",
  facebook_feed: "1x1",
};

// === Objective → Script Style Mappings (expanded) ===
export const OBJECTIVE_SCRIPT_STYLE: Record<string, string> = {
  brand_awareness: "BrandStoryV2",
  lead_generation: "CallToActionV2",
  sales: "SpecialOffersV2",
  engagement: "DiscoveryWriter",
  education: "HowToV2",
  traffic: "ProblemSolutionV2",
  conversions: "BenefitsV2",
  product_launch: "ProductHighlightsV2",
  viral: "NegativeHook",
  community: "EmotionalWriter",
  retention: "MotivationalWriter",
};

// === Visual Style Options (official Creatify templates) ===
export const VISUAL_STYLES = [
  { value: "AvatarBubbleTemplate", labelKey: "visualStyles.avatarBubble" },
  { value: "DynamicProductTemplate", labelKey: "visualStyles.dynamicProduct" },
  { value: "FullScreenTemplate", labelKey: "visualStyles.fullScreen" },
  { value: "VanillaTemplate", labelKey: "visualStyles.vanilla" },
  { value: "MotionCardsTemplate", labelKey: "visualStyles.motionCards" },
  { value: "SplitScreenTemplate", labelKey: "visualStyles.splitScreen" },
  { value: "ProductShowcaseTemplate", labelKey: "visualStyles.productShowcase" },
  { value: "MinimalistTemplate", labelKey: "visualStyles.minimalist" },
] as const;

// === Script Style Options (expanded catalog) ===
export const SCRIPT_STYLES = [
  // Classic
  { value: "BrandStoryV2", labelKey: "scriptStyles.brandStory", group: "classic" },
  { value: "CallToActionV2", labelKey: "scriptStyles.callToAction", group: "classic" },
  { value: "SpecialOffersV2", labelKey: "scriptStyles.specialOffers", group: "classic" },
  { value: "DiscoveryWriter", labelKey: "scriptStyles.discovery", group: "classic" },
  { value: "HowToV2", labelKey: "scriptStyles.howTo", group: "classic" },
  { value: "BenefitsV2", labelKey: "scriptStyles.benefits", group: "classic" },
  { value: "ProblemSolutionV2", labelKey: "scriptStyles.problemSolution", group: "classic" },
  { value: "ProductHighlightsV2", labelKey: "scriptStyles.productHighlights", group: "classic" },
  // Emotional
  { value: "EmotionalWriter", labelKey: "scriptStyles.emotional", group: "emotional" },
  { value: "MotivationalWriter", labelKey: "scriptStyles.motivational", group: "emotional" },
  { value: "ThreeReasonsWriter", labelKey: "scriptStyles.threeReasons", group: "emotional" },
  // Viral Hooks
  { value: "NegativeHook", labelKey: "scriptStyles.negativeHook", group: "hooks" },
  { value: "SecretHook", labelKey: "scriptStyles.secretHook", group: "hooks" },
  { value: "NumberOneHook", labelKey: "scriptStyles.numberOneHook", group: "hooks" },
  { value: "GenzWriter", labelKey: "scriptStyles.genZ", group: "hooks" },
  { value: "TrendingTopicsV2", labelKey: "scriptStyles.trendingTopics", group: "hooks" },
] as const;

// === Video Length Options ===
export const VIDEO_LENGTHS = [15, 30, 45, 60] as const;

// === Model Version Options ===
export const MODEL_VERSIONS = [
  { value: "standard", labelKey: "modelVersions.standard" },
  { value: "aurora_v1", labelKey: "modelVersions.auroraV1" },
  { value: "aurora_v1_fast", labelKey: "modelVersions.auroraV1Fast" },
] as const;
