import { supabase } from "@/integrations/supabase/client";

export interface SaveToLibraryOptions {
  userId: string;
  title: string;
  description: string;
  imageUrl: string;
  contentText?: string;
  platform?: string;
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
}

export async function saveImageToContentLibrary({
  userId,
  title,
  description,
  imageUrl,
  contentText,
  platform = 'general',
  metrics = {}
}: SaveToLibraryOptions): Promise<boolean> {
  try {
    await supabase
      .from('content_recommendations')
      .insert({
        user_id: userId,
        title: title.slice(0, 100), // Limit title length
        description: description.slice(0, 500), // Limit description length
        recommendation_type: 'post_template',
        status: 'template',
        platform,
        suggested_content: {
          content_text: contentText || '',
          image_url: imageUrl,
          metrics
        }
      });
    
    console.log('✅ Image saved to content library:', { title, imageUrl });
    return true;
  } catch (error) {
    console.error('❌ Error saving to content library:', error);
    return false;
  }
}

export async function savePostToContentLibrary({
  userId,
  post,
  platform
}: {
  userId: string;
  post: any;
  platform: string;
}): Promise<boolean> {
  // Extract image URL from post data
  let imageUrl = '';
  
  if (post.media_url) {
    imageUrl = post.media_url;
  } else if (post.image_url) {
    imageUrl = post.image_url;
  } else if (post.media && Array.isArray(post.media) && post.media.length > 0) {
    imageUrl = post.media[0].url || post.media[0].media_url || '';
  }

  // Only save if there's an image
  if (!imageUrl) {
    return false;
  }

  const title = post.text 
    ? `Post de ${platform} - ${post.text.slice(0, 50)}...`
    : `Imagen de ${platform}`;

  const description = post.text || `Contenido visual de ${platform}`;

  const metrics = {
    likes: post.like_count || post.likes_count || post.digg_count || 0,
    comments: post.comment_count || post.comments_count || 0,
    shares: post.share_count || post.shares_count || 0,
    views: post.view_count || post.play_count || post.impressions || 0
  };

  return await saveImageToContentLibrary({
    userId,
    title,
    description,
    imageUrl,
    contentText: post.text || '',
    platform,
    metrics
  });
}

export async function batchSavePostsToLibrary({
  userId,
  posts,
  platform
}: {
  userId: string;
  posts: any[];
  platform: string;
}): Promise<number> {
  let savedCount = 0;
  
  for (const post of posts) {
    const saved = await savePostToContentLibrary({ userId, post, platform });
    if (saved) {
      savedCount++;
    }
    // Add small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Saved ${savedCount}/${posts.length} images from ${platform} to content library`);
  return savedCount;
}