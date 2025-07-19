export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_model_configurations: {
        Row: {
          created_at: string
          frequency_penalty: number | null
          function_name: string
          id: string
          max_tokens: number | null
          model_name: string
          presence_penalty: number | null
          temperature: number | null
          top_p: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency_penalty?: number | null
          function_name: string
          id?: string
          max_tokens?: number | null
          model_name?: string
          presence_penalty?: number | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency_penalty?: number | null
          function_name?: string
          id?: string
          max_tokens?: number | null
          model_name?: string
          presence_penalty?: number | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      company_branding: {
        Row: {
          brand_manual_file_path: string | null
          brand_manual_url: string | null
          complementary_color_1: string | null
          complementary_color_2: string | null
          created_at: string
          id: string
          logo_file_path: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
          user_id: string
          visual_identity: string | null
        }
        Insert: {
          brand_manual_file_path?: string | null
          brand_manual_url?: string | null
          complementary_color_1?: string | null
          complementary_color_2?: string | null
          created_at?: string
          id?: string
          logo_file_path?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          user_id: string
          visual_identity?: string | null
        }
        Update: {
          brand_manual_file_path?: string | null
          brand_manual_url?: string | null
          complementary_color_1?: string | null
          complementary_color_2?: string | null
          created_at?: string
          id?: string
          logo_file_path?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          user_id?: string
          visual_identity?: string | null
        }
        Relationships: []
      }
      company_external_data: {
        Row: {
          brand_data: Json | null
          company_url: string | null
          created_at: string
          id: string
          updated_at: string
          url_data: Json | null
          user_id: string
        }
        Insert: {
          brand_data?: Json | null
          company_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          url_data?: Json | null
          user_id: string
        }
        Update: {
          brand_data?: Json | null
          company_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          url_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      company_files: {
        Row: {
          access_level: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_confidential: boolean | null
          is_encrypted: boolean | null
          last_accessed: string | null
          tags: string[] | null
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          access_level?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_confidential?: boolean | null
          is_encrypted?: boolean | null
          last_accessed?: string | null
          tags?: string[] | null
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          access_level?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_confidential?: boolean | null
          is_encrypted?: boolean | null
          last_accessed?: string | null
          tags?: string[] | null
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      company_objectives: {
        Row: {
          created_at: string
          description: string | null
          id: string
          objective_type: string
          priority: number | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          objective_type: string
          priority?: number | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          objective_type?: string
          priority?: number | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_strategy: {
        Row: {
          created_at: string
          generated_with_ai: boolean | null
          id: string
          mision: string | null
          propuesta_valor: string | null
          updated_at: string
          user_id: string
          vision: string | null
        }
        Insert: {
          created_at?: string
          generated_with_ai?: boolean | null
          id?: string
          mision?: string | null
          propuesta_valor?: string | null
          updated_at?: string
          user_id: string
          vision?: string | null
        }
        Update: {
          created_at?: string
          generated_with_ai?: boolean | null
          id?: string
          mision?: string | null
          propuesta_valor?: string | null
          updated_at?: string
          user_id?: string
          vision?: string | null
        }
        Relationships: []
      }
      content_clusters: {
        Row: {
          avg_engagement: number | null
          cluster_name: string
          content_theme: string
          created_at: string
          embedding_centroid: string | null
          id: string
          platform: string
          post_count: number | null
          representative_posts: string[] | null
          top_hashtags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_engagement?: number | null
          cluster_name: string
          content_theme: string
          created_at?: string
          embedding_centroid?: string | null
          id?: string
          platform: string
          post_count?: number | null
          representative_posts?: string[] | null
          top_hashtags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_engagement?: number | null
          cluster_name?: string
          content_theme?: string
          created_at?: string
          embedding_centroid?: string | null
          id?: string
          platform?: string
          post_count?: number | null
          representative_posts?: string[] | null
          top_hashtags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_embeddings: {
        Row: {
          content_text: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          platform: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_text: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          platform: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_text?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string
          description: string
          id: string
          platform: string
          recommendation_type: string
          similar_post_ids: string[] | null
          status: string | null
          suggested_content: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          description: string
          id?: string
          platform: string
          recommendation_type: string
          similar_post_ids?: string[] | null
          status?: string | null
          suggested_content?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          description?: string
          id?: string
          platform?: string
          recommendation_type?: string
          similar_post_ids?: string[] | null
          status?: string | null
          suggested_content?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          metadata: Json | null
          platform: string
          processed_items: number | null
          progress: number | null
          started_at: string | null
          status: string
          total_items: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          metadata?: Json | null
          platform: string
          processed_items?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          total_items?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          platform?: string
          processed_items?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          total_items?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facebook_instagram_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          facebook_user_id: string
          id: string
          token_type: string
          updated_at: string
          user_data: Json | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          facebook_user_id: string
          id?: string
          token_type?: string
          updated_at?: string
          user_data?: Json | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          facebook_user_id?: string
          id?: string
          token_type?: string
          updated_at?: string
          user_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      instagram_business_connections: {
        Row: {
          account_data: Json | null
          created_at: string
          facebook_page_id: string
          id: string
          insights_data: Json | null
          instagram_account_id: string
          is_active: boolean
          page_access_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_data?: Json | null
          created_at?: string
          facebook_page_id: string
          id?: string
          insights_data?: Json | null
          instagram_account_id: string
          is_active?: boolean
          page_access_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_data?: Json | null
          created_at?: string
          facebook_page_id?: string
          id?: string
          insights_data?: Json | null
          instagram_account_id?: string
          is_active?: boolean
          page_access_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_publications: {
        Row: {
          content_data: Json
          created_at: string
          id: string
          instagram_account_id: string
          media_id: string
          published_at: string
          user_id: string
        }
        Insert: {
          content_data: Json
          created_at?: string
          id?: string
          instagram_account_id: string
          media_id: string
          published_at?: string
          user_id: string
        }
        Update: {
          content_data?: Json
          created_at?: string
          id?: string
          instagram_account_id?: string
          media_id?: string
          published_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linkedin_connections: {
        Row: {
          access_token: string
          company_page_data: Json | null
          company_page_id: string | null
          company_page_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          company_page_data?: Json | null
          company_page_id?: string | null
          company_page_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          company_page_data?: Json | null
          company_page_id?: string | null
          company_page_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_actionables: {
        Row: {
          action_type: string
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          estimated_impact: string | null
          id: string
          insight_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          completed_at?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          estimated_impact?: string | null
          id?: string
          insight_id?: string | null
          priority: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          estimated_impact?: string | null
          id?: string
          insight_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_actionables_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "marketing_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          data: Json
          date_range_end: string | null
          date_range_start: string | null
          description: string
          id: string
          impact_level: string | null
          insight_type: string
          platforms: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          data: Json
          date_range_end?: string | null
          date_range_start?: string | null
          description: string
          id?: string
          impact_level?: string | null
          insight_type: string
          platforms: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          data?: Json
          date_range_end?: string | null
          date_range_start?: string | null
          description?: string
          id?: string
          impact_level?: string | null
          insight_type?: string
          platforms?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          bio: string | null
          business_objectives: string | null
          company_name: string | null
          company_size: string | null
          country: string | null
          created_at: string
          email: string
          experience_years: number | null
          expertise_areas: string[] | null
          full_name: string
          functional_area: string | null
          github_url: string | null
          headquarters_address: string | null
          headquarters_city: string | null
          headquarters_country: string | null
          headquarters_lat: number | null
          headquarters_lng: number | null
          id: string
          industry: string | null
          industry_sector: string | null
          linked_providers: string[] | null
          linkedin_profile: string | null
          location: string | null
          nit: string | null
          phone: string | null
          position: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_objectives?: string | null
          company_name?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          expertise_areas?: string[] | null
          full_name: string
          functional_area?: string | null
          github_url?: string | null
          headquarters_address?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          headquarters_lat?: number | null
          headquarters_lng?: number | null
          id?: string
          industry?: string | null
          industry_sector?: string | null
          linked_providers?: string[] | null
          linkedin_profile?: string | null
          location?: string | null
          nit?: string | null
          phone?: string | null
          position?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_objectives?: string | null
          company_name?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          expertise_areas?: string[] | null
          full_name?: string
          functional_area?: string | null
          github_url?: string | null
          headquarters_address?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          headquarters_lat?: number | null
          headquarters_lng?: number | null
          id?: string
          industry?: string | null
          industry_sector?: string | null
          linked_providers?: string[] | null
          linkedin_profile?: string | null
          location?: string | null
          nit?: string | null
          phone?: string | null
          position?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          company_page_id: string
          content: Json
          created_at: string
          error_message: string | null
          id: string
          platform: string
          published_at: string | null
          scheduled_for: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_page_id: string
          content: Json
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          published_at?: string | null
          scheduled_for: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_page_id?: string
          content?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          published_at?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_analytics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          period_end: string
          period_start: string
          period_type: string
          platform: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          period_end: string
          period_start: string
          period_type: string
          platform: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          period_end?: string
          period_start?: string
          period_type?: string
          platform?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      social_media_comments: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string
          id: string
          platform_comment_id: string
          post_id: string | null
          published_at: string
          raw_data: Json | null
          sentiment_label: string | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          platform_comment_id: string
          post_id?: string | null
          published_at: string
          raw_data?: Json | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          platform_comment_id?: string
          post_id?: string | null
          published_at?: string
          raw_data?: Json | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_media_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_posts: {
        Row: {
          content: string | null
          created_at: string
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          mentions: string[] | null
          metrics: Json | null
          platform: string
          platform_post_id: string
          post_type: string | null
          published_at: string
          raw_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          mentions?: string[] | null
          metrics?: Json | null
          platform: string
          platform_post_id: string
          post_type?: string | null
          published_at: string
          raw_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          mentions?: string[] | null
          metrics?: Json | null
          platform?: string
          platform_post_id?: string
          post_type?: string | null
          published_at?: string
          raw_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tiktok_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          scope: string
          tiktok_user_id: string
          updated_at: string
          user_data: Json | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          scope: string
          tiktok_user_id: string
          updated_at?: string
          user_data?: Json | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string
          tiktok_user_id?: string
          updated_at?: string
          user_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      tiktok_publications: {
        Row: {
          content_data: Json
          created_at: string
          id: string
          published_at: string
          tiktok_user_id: string
          user_id: string
          video_id: string
        }
        Insert: {
          content_data: Json
          created_at?: string
          id?: string
          published_at?: string
          tiktok_user_id: string
          user_id: string
          video_id: string
        }
        Update: {
          content_data?: Json
          created_at?: string
          id?: string
          published_at?: string
          tiktok_user_id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      user_tutorials: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          tutorial_name: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          tutorial_name: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          tutorial_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_linked_provider: {
        Args: { _user_id: string; _provider: string }
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_ai_model_config: {
        Args: { function_name_param: string }
        Returns: {
          model_name: string
          temperature: number
          max_tokens: number
          top_p: number
          frequency_penalty: number
          presence_penalty: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      remove_linked_provider: {
        Args: { _user_id: string; _provider: string }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      user_type: "developer" | "expert" | "company"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_type: ["developer", "expert", "company"],
    },
  },
} as const
