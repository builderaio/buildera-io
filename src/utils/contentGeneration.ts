import { supabase } from "@/integrations/supabase/client";
import type { ContentGenerationOptions, ContentGenerationResult } from "@/types/content";

/**
 * Genera contenido de texto usando IA
 */
export async function generateAIText(
  prompt: string,
  userId: string,
  platform?: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-company-content', {
    body: {
      prompt,
      userId,
      platform: platform || 'general',
      generateText: true
    }
  });

  if (error) throw error;
  return data?.text || data?.generatedText || '';
}

/**
 * Genera una imagen usando IA
 */
export async function generateAIImage(
  prompt: string,
  userId: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('marketing-hub-image-creator', {
    body: { prompt, userId }
  });

  if (error) throw error;
  return data?.imageUrl || '';
}

/**
 * Genera un video usando IA
 */
export async function generateAIVideo(
  prompt: string,
  userId: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('marketing-hub-video-creator', {
    body: { prompt, userId }
  });

  if (error) throw error;
  return data?.videoUrl || '';
}

/**
 * Guarda un insight en la base de datos
 */
export async function saveInsight(
  userId: string,
  title: string,
  content: string,
  options: {
    type?: string;
    format?: string;
    platform?: string;
    source?: 'ai_generated' | 'user_created';
  } = {}
): Promise<string> {
  const insertData: any = {
    user_id: userId,
    title,
    content,
    type: options.type || 'content_ideas',
    status: 'active'
  };

  // Only add optional fields if they have values
  if (options.format) insertData.format = options.format;
  if (options.platform) insertData.platform = options.platform;
  if (options.source) insertData.source = options.source;

  const { data, error } = await supabase
    .from('content_insights')
    .insert(insertData)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Guarda contenido generado en la base de datos
 */
export async function saveGeneratedContent(
  userId: string,
  contentText: string,
  options: {
    contentType?: string;
    mediaUrl?: string;
    insightId?: string;
    generationPrompt?: string;
    publicationStatus?: 'draft' | 'published' | 'scheduled';
  } = {}
): Promise<string> {
  const { data, error } = await supabase
    .from('generated_content')
    .insert({
      user_id: userId,
      content_text: contentText,
      content_type: options.contentType || 'post',
      media_url: options.mediaUrl,
      insight_id: options.insightId,
      generation_prompt: options.generationPrompt,
      publication_status: options.publicationStatus || 'draft'
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Marca un insight como usado (tiene contenido generado)
 */
export async function markInsightAsUsed(insightId: string): Promise<void> {
  const { error } = await supabase
    .from('content_insights')
    .update({ has_generated_content: true })
    .eq('id', insightId);

  if (error) throw error;
}

/**
 * Flujo completo de generación de contenido con IA
 */
export async function generateCompleteContent(
  userId: string,
  options: ContentGenerationOptions
): Promise<ContentGenerationResult> {
  let insightId: string | undefined;
  let generatedContentId: string | undefined;
  
  // 1. Generar texto
  const text = await generateAIText(options.prompt, userId, options.platform);
  
  // 2. Guardar como insight
  insightId = await saveInsight(userId, 'Contenido generado por IA', text, {
    type: 'content_ideas',
    format: options.format,
    platform: options.platform,
    source: 'ai_generated'
  });
  
  // 3. Generar media si se solicita
  let imageUrl: string | undefined;
  let videoUrl: string | undefined;
  
  if (options.includeImage) {
    try {
      imageUrl = await generateAIImage(options.prompt, userId);
    } catch (error) {
      console.warn('Error generating image:', error);
    }
  }
  
  if (options.includeVideo) {
    try {
      videoUrl = await generateAIVideo(options.prompt, userId);
    } catch (error) {
      console.warn('Error generating video:', error);
    }
  }
  
  // 4. Guardar contenido generado
  generatedContentId = await saveGeneratedContent(userId, text, {
    contentType: options.format || 'post',
    mediaUrl: imageUrl || videoUrl,
    insightId,
    generationPrompt: options.prompt
  });
  
  // 5. Marcar insight como usado
  await markInsightAsUsed(insightId);
  
  return {
    text,
    imageUrl,
    videoUrl,
    insightId,
    generatedContentId
  };
}
