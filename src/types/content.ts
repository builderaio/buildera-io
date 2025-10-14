// Tipos compartidos para el sistema de contenido unificado

export type ContentSource = 'ai_generated' | 'user_created';
export type PublicationStatus = 'draft' | 'published' | 'scheduled';
export type InsightStatus = 'active' | 'completed' | 'dismissed';

export interface ContentInsight {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  format?: string;
  platform?: string;
  timing?: string;
  status: InsightStatus;
  source?: ContentSource;
  has_generated_content?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeneratedContent {
  id: string;
  user_id: string;
  content_text: string;
  content_type: string;
  media_url?: string;
  insight_id?: string;
  generation_prompt?: string;
  publication_status?: PublicationStatus;
  published_at?: string;
  created_at: string;
}

export interface ContentGenerationOptions {
  prompt: string;
  platform?: string;
  format?: string;
  includeImage?: boolean;
  includeVideo?: boolean;
}

export interface ContentGenerationResult {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  insightId?: string;
  generatedContentId?: string;
}
