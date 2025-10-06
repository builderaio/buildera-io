import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Content library helper functions
async function savePostToContentLibrary({
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
  } else if (post.image) {
    imageUrl = post.image;
  } else if (post.videoLink) {
    imageUrl = post.videoLink;
  } else if (post.media && Array.isArray(post.media) && post.media.length > 0) {
    imageUrl = post.media[0].url || post.media[0].media_url || '';
  }

  // Only save if there's an image or video
  if (!imageUrl) {
    return false;
  }

  const title = post.text 
    ? `Post de ${platform} - ${post.text.slice(0, 50)}...`
    : `Contenido de ${platform}`;

  const description = post.text || `Contenido visual de ${platform}`;

  const metrics = {
    likes: post.like_count || post.likes_count || post.likes || post.digg_count || 0,
    comments: post.comment_count || post.comments_count || post.comments || 0,
    shares: post.share_count || post.shares_count || post.rePosts || 0,
    views: post.view_count || post.play_count || post.views || post.videoViews || post.impressions || 0
  };

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if content already exists to avoid duplicates
    const { data: existing } = await supabaseClient
      .from('content_recommendations')
      .select('id')
      .eq('user_id', userId)
      .contains('suggested_content', { image_url: imageUrl })
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('📚 Content already exists in library, skipping...');
      return false;
    }
    
    await supabaseClient
      .from('content_recommendations')
      .insert({
        user_id: userId,
        title: title.slice(0, 100), // Limit title length
        description: description.slice(0, 500), // Limit description length
        recommendation_type: 'post_template',
        status: 'template',
        platform,
        suggested_content: {
          content_text: post.text || '',
          image_url: imageUrl,
          metrics
        }
      });
    
    console.log('✅ Content saved to library:', { title, imageUrl: imageUrl.slice(0, 100) + '...' });
    return true;
  } catch (error) {
    console.error('❌ Error saving to content library:', error);
    return false;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to save posts to specific platform tables
async function savePostsToTables(
  supabaseClient: any,
  userId: string,
  platform: string,
  posts: any[],
  cid: string
): Promise<void> {
  try {
    for (const post of posts) {
      const commonData = {
        user_id: userId,
        cid: cid,
        data_id: post.dataId || post.postID || post.id,
        from_owner: post.fromOwner || false,
        posted_at: post.date || post.published_at || new Date().toISOString(),
        engagement_rate: post.er || 0,
        is_ad: post.isAd || false,
        is_deleted: post.isDeleted || false,
        interactions_count: post.interactions || 0,
        time_update: post.timeUpdate || new Date().toISOString(),
        post_url: post.postUrl || post.url,
        post_image_url: post.postImage,
        social_post_id: post.socialPostID,
        text_length: post.textLength || 0,
        index_grade: post.indexGrade,
        main_grade: post.mainGrade,
        raw_data: post
      };

      if (platform === 'facebook') {
        const { error } = await supabaseClient
          .from('facebook_posts')
          .upsert({
            ...commonData,
            post_id: post.postID,
            content: post.text || '',
            likes_count: post.likes || 0,
            comments_count: post.comments || 0,
            shares_count: post.rePosts || 0,
            reactions_count: post.likes || 0,
            hashtags: post.hashTags || [],
            mentions: post.mentions || [],
            image_url: post.image,
            video_url: post.videoLink,
            video_views_count: post.videoViews || 0
          }, {
            onConflict: 'user_id,post_id',
            ignoreDuplicates: false
          });

        if (error) console.error('Error saving Facebook post:', error);
      } 
      else if (platform === 'instagram') {
        const { error } = await supabaseClient
          .from('instagram_posts')
          .upsert({
            ...commonData,
            platform: 'instagram',
            post_id: post.postID,
            shortcode: post.shortcode,
            caption: post.text || '',
            like_count: post.likes || 0,
            comment_count: post.comments || 0,
            video_view_count: post.videoViews || post.reelPlays || 0,
            display_url: post.image,
            video_url: post.videoLink,
            hashtags: post.hashTags || [],
            mentions: post.mentions || [],
            reel_plays: post.reelPlays || 0,
            video_plays: post.videoViews || 0
          }, {
            onConflict: 'user_id,post_id',
            ignoreDuplicates: false
          });

        if (error) console.error('Error saving Instagram post:', error);
      }
      else if (platform === 'linkedin') {
        const { error } = await supabaseClient
          .from('linkedin_posts')
          .upsert({
            ...commonData,
            post_id: post.postID,
            content: post.text || '',
            likes_count: post.likes || 0,
            comments_count: post.comments || 0,
            shares_count: post.rePosts || 0,
            views_count: post.views || 0,
            hashtags: post.hashTags || [],
            mentions: post.mentions || [],
            image_url: post.image,
            video_url: post.videoLink,
            impressions_count: post.impressions || 0
          }, {
            onConflict: 'user_id,post_id',
            ignoreDuplicates: false
          });

        if (error) console.error('Error saving LinkedIn post:', error);
      }
      else if (platform === 'tiktok') {
        const { error } = await supabaseClient
          .from('tiktok_posts')
          .upsert({
            ...commonData,
            tiktok_user_id: post.authorId || '',
            video_id: post.postID || post.videoId,
            aweme_id: post.postID,
            title: post.text || '',
            content: post.text || '',
            cover_url: post.image,
            duration: post.duration || 0,
            play_count: post.videoViews || post.views || 0,
            digg_count: post.likes || post.diggCount || 0,
            comment_count: post.comments || 0,
            share_count: post.rePosts || post.shareCount || 0,
            download_count: post.downloadCount || 0,
            hashtags: post.hashTags || [],
            mentions: post.mentions || [],
            image_url: post.image,
            forward_count: post.forwardCount || 0,
            whatsapp_share_count: post.whatsappShareCount || 0
          }, {
            onConflict: 'user_id,video_id',
            ignoreDuplicates: false
          });

        if (error) console.error('Error saving TikTok post:', error);
      }
    }

    console.log(`✅ Successfully saved ${posts.length} posts to ${platform}_posts table`);
  } catch (error) {
    console.error(`Error saving posts to ${platform} table:`, error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Analyzing social content for user:', user.id);

    // Get social analysis data for the user (contains CIDs)
    const { data: socialAnalyses, error: analysisError } = await supabaseClient
      .from('social_analysis')
      .select('*')
      .eq('user_id', user.id)

    if (analysisError) {
      console.error('Error fetching social analyses:', analysisError);
      return new Response(
        JSON.stringify({ error: 'Error fetching social analyses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!socialAnalyses || socialAnalyses.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No social networks analyzed. Please analyze your social media audience first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate date range (last 90 days)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const fromFormatted = formatDate(fromDate);
    const toFormatted = formatDate(toDate);

    console.log(`📅 Current date: ${toFormatted}`);
    console.log(`📅 Analyzing content from ${fromFormatted} to ${toFormatted} (last 90 days)`);

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({ error: 'RapidAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = [];

    // Analyze content for each social network
    for (const analysis of socialAnalyses) {
      try {
        // Extract CID from social_analysis data
        let cid = null;
        
        // Check if cid is directly stored
        if (analysis.cid) {
          cid = analysis.cid;
        } else if (analysis.raw_data && analysis.raw_data.cid) {
          cid = analysis.raw_data.cid;
        } else if (analysis.platform_data && analysis.platform_data.cid) {
          cid = analysis.platform_data.cid;
        }

        if (!cid) {
          console.log(`⚠️ No CID found for analysis ${analysis.id}, skipping...`);
          continue;
        }

        console.log(`📊 Analyzing content for CID: ${cid}`);

        // Call RapidAPI Instagram Statistics API
        const apiUrl = `https://instagram-statistics-api.p.rapidapi.com/posts?cid=${encodeURIComponent(cid)}&from=${fromFormatted}&to=${toFormatted}&type=posts&sort=date`;
        
        let apiResponse;
        let retryCount = 0;
        const maxRetries = 3;
        const baseDelay = 2000; // 2 seconds

        // Implement exponential backoff for rate limiting
        while (retryCount <= maxRetries) {
          apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
              'x-rapidapi-key': rapidApiKey,
            },
          });

          if (apiResponse.ok) {
            break; // Success
          }

          if (apiResponse.status === 429 && retryCount < maxRetries) {
            // Rate limited - wait and retry
            const delay = baseDelay * Math.pow(2, retryCount);
            console.log(`Rate limited for CID ${cid}. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            continue;
          }

          // Other error or max retries reached
          console.error(`API error for CID ${cid}:`, apiResponse.status, apiResponse.statusText);
          if (apiResponse.status === 429) {
            console.error(`Rate limit exceeded for CID ${cid} after ${maxRetries + 1} attempts`);
          }
          break;
        }

        if (!apiResponse?.ok) {
          // Store partial analysis with error info for better user feedback
          const errorAnalysisData = {
            user_id: user.id,
            platform: analysis.social_type || 'instagram',
            cid: cid,
            analysis_period_start: fromDate.toISOString(),
            analysis_period_end: toDate.toISOString(),
            posts_analyzed: 0,
            posts_data: [],
            summary_data: null,
            error_details: {
              status: apiResponse?.status,
              statusText: apiResponse?.statusText,
              message: apiResponse?.status === 429 ? 'Rate limit exceeded - try again later' : 'API error'
            },
            raw_api_response: null,
            created_at: new Date().toISOString(),
          };

          const platformStr = analysis.social_type || 'instagram';

          // Upsert manually without unique constraint
          const { data: existingErrorRow } = await supabaseClient
            .from('social_content_analysis')
            .select('id')
            .eq('user_id', user.id)
            .eq('platform', platformStr)
            .eq('cid', cid)
            .maybeSingle();

          if (existingErrorRow?.id) {
            await supabaseClient
              .from('social_content_analysis')
              .update({ ...errorAnalysisData, updated_at: new Date().toISOString() })
              .eq('id', existingErrorRow.id);
          } else {
            await supabaseClient
              .from('social_content_analysis')
              .insert(errorAnalysisData);
          }

          continue;
        }

        const contentData = await apiResponse.json();

        if (!contentData.data || !contentData.data.posts) {
          console.log(`No posts found for CID ${cid} — storing empty analysis`);
          contentData.data = contentData.data || {};
          contentData.data.posts = [];
          contentData.data.summary = contentData.data.summary || null;
        }

        console.log(`✅ Found ${contentData.data.posts.length} posts for CID ${cid}`);

        // Save posts to content library
        if (contentData.data.posts.length > 0) {
          console.log(`📚 Saving ${contentData.data.posts.length} posts to content library...`);
          
          // Map Instagram API format to helper format
          const mappedPosts = contentData.data.posts.map((post: any) => ({
            ...post,
            // Map Instagram API fields to helper expected fields
            image_url: post.image || post.videoLink, // Use image first, then videoLink as fallback
            media_url: post.image || post.videoLink,
            like_count: post.likes || 0,
            comment_count: post.comments || 0,
            text: post.text || '',
          }));

          try {
            let savedCount = 0;
            const platformName = analysis.social_type === 'INST' ? 'Instagram' : 
                               analysis.social_type === 'TT' ? 'TikTok' : 
                               analysis.social_type || 'Instagram';

            for (const post of mappedPosts) {
              // Skip posts without media
              if (!post.image_url) continue;

              const saved = await savePostToContentLibrary({
                userId: user.id,
                post: post,
                platform: platformName
              });
              
              if (saved) savedCount++;
              
              // Small delay to avoid overwhelming the database
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`✅ Saved ${savedCount}/${mappedPosts.length} posts to content library for platform ${platformName}`);
          } catch (libraryError) {
            console.error('Error saving posts to content library:', libraryError);
            // Continue with analysis even if library save fails
          }
        }

        // Map platform codes to full names
        const platformMapping: Record<string, string> = {
          'INST': 'instagram',
          'TT': 'tiktok',
          'LI': 'linkedin',
          'FB': 'facebook',
          'instagram': 'instagram',
          'tiktok': 'tiktok',
          'linkedin': 'linkedin',
          'facebook': 'facebook'
        };

        const platformCode = analysis.social_type || analysis.platform || 'instagram';
        const platformStr = platformMapping[platformCode] || platformCode.toLowerCase();

        // Save individual posts to platform-specific tables
        if (contentData.data.posts && contentData.data.posts.length > 0) {
          console.log(`📝 Guardando ${contentData.data.posts.length} posts en tabla ${platformStr}_posts...`);
          
          for (const post of contentData.data.posts) {
            try {
              // Map common fields
              const basePostData = {
                user_id: user.id,
                cid: cid,
                data_id: post.dataId || post.id,
                from_owner: post.fromOwner || false,
                hashtags: post.hashTags || [],
                mentions: post.mentions || [],
                index_grade: post.indexGrade || null,
                main_grade: post.mainGrade || null,
                is_ad: post.isAd || false,
                is_deleted: post.isDeleted || false,
                interactions_count: post.interactions || 0,
                time_update: post.timeUpdate ? new Date(post.timeUpdate) : null,
                post_url: post.postUrl || null,
                social_post_id: post.socialPostID || post.postID,
                text_length: post.textLength || 0,
                posted_at: post.date ? new Date(post.date) : null,
                engagement_rate: post.er || 0,
                raw_data: post
              };

              // Platform-specific mapping
              let platformPostData: any = null;

              if (platformStr === 'facebook') {
                platformPostData = {
                  ...basePostData,
                  post_id: post.postID || post.id,
                  post_type: post.type || 'post',
                  content: post.text || '',
                  likes_count: post.likes || 0,
                  comments_count: post.comments || 0,
                  shares_count: post.rePosts || 0,
                  reactions_count: post.reactions || 0,
                  image_url: post.image || null,
                  video_url: post.videoLink || null,
                  video_views_count: post.videoViews || 0,
                  post_image_url: post.postImage || null
                };

                // Upsert into facebook_posts
                const { data: existingPost } = await supabaseClient
                  .from('facebook_posts')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('post_id', platformPostData.post_id)
                  .maybeSingle();

                if (existingPost) {
                  await supabaseClient
                    .from('facebook_posts')
                    .update({ ...platformPostData, updated_at: new Date().toISOString() })
                    .eq('id', existingPost.id);
                } else {
                  await supabaseClient
                    .from('facebook_posts')
                    .insert(platformPostData);
                }

              } else if (platformStr === 'instagram') {
                platformPostData = {
                  ...basePostData,
                  platform: 'instagram',
                  post_id: post.postID || post.id,
                  shortcode: post.shortcode || null,
                  caption: post.text || '',
                  like_count: post.likes || 0,
                  comment_count: post.comments || 0,
                  media_type: post.type === 'video' ? 2 : 1,
                  is_video: post.type === 'video',
                  video_view_count: post.videoViews || post.views || 0,
                  display_url: post.image || post.postImage || null,
                  thumbnail_url: post.postImage || null,
                  video_url: post.videoLink || null,
                  owner_username: post.name || null,
                  reel_plays: post.reelPlays || 0,
                  video_plays: post.videoViews || 0,
                  post_image_url: post.postImage || null
                };

                const { data: existingPost } = await supabaseClient
                  .from('instagram_posts')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('post_id', platformPostData.post_id)
                  .maybeSingle();

                if (existingPost) {
                  await supabaseClient
                    .from('instagram_posts')
                    .update({ ...platformPostData, updated_at: new Date().toISOString() })
                    .eq('id', existingPost.id);
                } else {
                  await supabaseClient
                    .from('instagram_posts')
                    .insert(platformPostData);
                }

              } else if (platformStr === 'tiktok') {
                platformPostData = {
                  ...basePostData,
                  tiktok_user_id: post.authorId || null,
                  video_id: post.postID || post.videoId || post.id,
                  aweme_id: post.awemeId || post.postID,
                  title: post.text || '',
                  content: post.text || '',
                  cover_url: post.image || post.postImage || null,
                  image_url: post.image || null,
                  post_image_url: post.postImage || null,
                  duration: post.duration || 0,
                  play_count: post.videoViews || post.views || 0,
                  digg_count: post.diggCount || post.likes || 0,
                  comment_count: post.comments || 0,
                  share_count: post.rePosts || post.shares || 0,
                  download_count: post.downloadCount || 0,
                  collect_count: post.collectCount || 0,
                  forward_count: post.forwardCount || 0,
                  whatsapp_share_count: post.whatsappShareCount || 0
                };

                const { data: existingPost } = await supabaseClient
                  .from('tiktok_posts')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('video_id', platformPostData.video_id)
                  .maybeSingle();

                if (existingPost) {
                  await supabaseClient
                    .from('tiktok_posts')
                    .update({ ...platformPostData, updated_at: new Date().toISOString() })
                    .eq('id', existingPost.id);
                } else {
                  await supabaseClient
                    .from('tiktok_posts')
                    .insert(platformPostData);
                }

              } else if (platformStr === 'linkedin') {
                platformPostData = {
                  ...basePostData,
                  post_id: post.postID || post.id,
                  post_type: post.type || 'post',
                  content: post.text || '',
                  likes_count: post.likes || 0,
                  comments_count: post.comments || 0,
                  shares_count: post.rePosts || 0,
                  views_count: post.views || 0,
                  impressions_count: post.impressions || 0,
                  click_count: post.clicks || 0,
                  image_url: post.image || null,
                  video_url: post.videoLink || null,
                  post_image_url: post.postImage || null
                };

                const { data: existingPost } = await supabaseClient
                  .from('linkedin_posts')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('post_id', platformPostData.post_id)
                  .maybeSingle();

                if (existingPost) {
                  await supabaseClient
                    .from('linkedin_posts')
                    .update({ ...platformPostData, updated_at: new Date().toISOString() })
                    .eq('id', existingPost.id);
                } else {
                  await supabaseClient
                    .from('linkedin_posts')
                    .insert(platformPostData);
                }
              }

              console.log(`✅ Post guardado en ${platformStr}_posts: ${post.postID || post.id}`);
            } catch (postError) {
              console.error(`❌ Error guardando post en ${platformStr}_posts:`, postError);
              // Continue with other posts even if one fails
            }
          }
        }

        // Store content analysis results
        const contentAnalysisData = {
          user_id: user.id,
          platform: platformStr,
          cid: cid,
          analysis_period_start: fromDate.toISOString(),
          analysis_period_end: toDate.toISOString(),
          posts_analyzed: contentData.data.posts.length,
          posts_data: contentData.data.posts,
          summary_data: contentData.data.summary,
          raw_api_response: contentData,
          created_at: new Date().toISOString(),
        };

        // Upsert manually without requiring a DB unique constraint
        const { data: existingRow } = await supabaseClient
          .from('social_content_analysis')
          .select('id')
          .eq('user_id', user.id)
          .eq('platform', platformStr)
          .eq('cid', cid)
          .maybeSingle();

        let analysisId: string | null = null;
        if (existingRow?.id) {
          const { data: updatedRow, error: updateError } = await supabaseClient
            .from('social_content_analysis')
            .update({ ...contentAnalysisData, updated_at: new Date().toISOString() })
            .eq('id', existingRow.id)
            .select()
            .single();
          if (updateError) {
            console.error('Error updating content analysis:', updateError);
            continue;
          }
          analysisId = updatedRow?.id ?? existingRow.id;
        } else {
          const { data: insertedRow, error: insertError } = await supabaseClient
            .from('social_content_analysis')
            .insert(contentAnalysisData)
            .select()
            .single();
          if (insertError) {
            console.error('Error inserting content analysis:', insertError);
            continue;
          }
          analysisId = insertedRow?.id ?? null;
        }

        // 🆕 Guardar posts en tablas específicas por plataforma
        if (contentData.data.posts && contentData.data.posts.length > 0) {
          console.log(`💾 Guardando ${contentData.data.posts.length} posts en la tabla ${platformStr}_posts...`);
          await savePostsToTables(supabaseClient, user.id, platformStr, contentData.data.posts, cid);
        }

        results.push({
          platform: platformStr,
          cid: cid,
          posts_count: contentData.data.posts.length,
          analysis_id: analysisId,
          summary: contentData.data.summary,
        });

      } catch (error) {
        console.error(`Error analyzing content for analysis ${analysis.id}:`, error);
        continue;
      }
    }

    console.log(`🎉 Content analysis completed. Analyzed ${results.length} social networks.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Content analysis completed for ${results.length} social networks`,
        results: results,
        period: {
          from: fromFormatted,
          to: toFormatted,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in analyze-social-content function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})