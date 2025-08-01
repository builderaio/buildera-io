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
      agent_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          agent_id: string | null
          context_data: Json | null
          created_at: string
          id: string
          messages: Json
          status: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          context_data?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          context_data?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_instances: {
        Row: {
          contextualized_instructions: string
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          openai_agent_id: string | null
          status: string
          template_id: string
          tenant_config: Json | null
          tools_permissions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contextualized_instructions: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
          openai_agent_id?: string | null
          status?: string
          template_id: string
          tenant_config?: Json | null
          tools_permissions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contextualized_instructions?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          openai_agent_id?: string | null
          status?: string
          template_id?: string
          tenant_config?: Json | null
          tools_permissions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_files: {
        Row: {
          agent_instance_id: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          openai_file_id: string | null
          processing_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_instance_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          openai_file_id?: string | null
          processing_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_instance_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          openai_file_id?: string | null
          processing_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_files_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_logs: {
        Row: {
          agent_instance_id: string | null
          created_at: string
          id: string
          log_level: string
          message: string
          metadata: Json | null
          mission_id: string | null
        }
        Insert: {
          agent_instance_id?: string | null
          created_at?: string
          id?: string
          log_level?: string
          message: string
          metadata?: Json | null
          mission_id?: string | null
        }
        Update: {
          agent_instance_id?: string | null
          created_at?: string
          id?: string
          log_level?: string
          message?: string
          metadata?: Json | null
          mission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "agent_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_missions: {
        Row: {
          agent_instance_id: string
          completed_at: string | null
          created_at: string
          description: string
          error_message: string | null
          id: string
          mission_context: Json | null
          openai_run_id: string | null
          priority: number | null
          progress: number | null
          results: Json | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_instance_id: string
          completed_at?: string | null
          created_at?: string
          description: string
          error_message?: string | null
          id?: string
          mission_context?: Json | null
          openai_run_id?: string | null
          priority?: number | null
          progress?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_instance_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          error_message?: string | null
          id?: string
          mission_context?: Json | null
          openai_run_id?: string | null
          priority?: number | null
          progress?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_missions_agent_instance_id_fkey"
            columns: ["agent_instance_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ratings: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_ratings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_template_versions: {
        Row: {
          category: string
          change_notes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          instructions_template: string
          is_active: boolean
          is_featured: boolean
          name: string
          permissions_template: Json | null
          pricing_amount: number | null
          pricing_model: string
          template_id: string
          tools_config: Json | null
          version_number: string
        }
        Insert: {
          category?: string
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          instructions_template: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          permissions_template?: Json | null
          pricing_amount?: number | null
          pricing_model?: string
          template_id: string
          tools_config?: Json | null
          version_number: string
        }
        Update: {
          category?: string
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          instructions_template?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          permissions_template?: Json | null
          pricing_amount?: number | null
          pricing_model?: string
          template_id?: string
          tools_config?: Json | null
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          instructions_template: string
          is_active: boolean
          is_featured: boolean
          name: string
          permissions_template: Json | null
          pricing_amount: number | null
          pricing_model: string
          tools_config: Json | null
          updated_at: string
          version: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          instructions_template: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          permissions_template?: Json | null
          pricing_amount?: number | null
          pricing_model?: string
          tools_config?: Json | null
          updated_at?: string
          version?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          instructions_template?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          permissions_template?: Json | null
          pricing_amount?: number | null
          pricing_model?: string
          tools_config?: Json | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          avatar_url: string | null
          capabilities: string[] | null
          category_id: string | null
          created_at: string
          description: string
          detailed_description: string | null
          id: string
          is_active: boolean | null
          model_name: string | null
          model_provider: string | null
          monthly_price: number | null
          name: string
          popularity_score: number | null
          price_per_use: number | null
          pricing_model: string | null
          rating: number | null
          sample_conversations: Json | null
          system_prompt: string
          total_ratings: number | null
          updated_at: string
          use_cases: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          capabilities?: string[] | null
          category_id?: string | null
          created_at?: string
          description: string
          detailed_description?: string | null
          id?: string
          is_active?: boolean | null
          model_name?: string | null
          model_provider?: string | null
          monthly_price?: number | null
          name: string
          popularity_score?: number | null
          price_per_use?: number | null
          pricing_model?: string | null
          rating?: number | null
          sample_conversations?: Json | null
          system_prompt: string
          total_ratings?: number | null
          updated_at?: string
          use_cases?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          capabilities?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string
          detailed_description?: string | null
          id?: string
          is_active?: boolean | null
          model_name?: string | null
          model_provider?: string | null
          monthly_price?: number | null
          name?: string
          popularity_score?: number | null
          price_per_use?: number | null
          pricing_model?: string | null
          rating?: number | null
          sample_conversations?: Json | null
          system_prompt?: string
          total_ratings?: number | null
          updated_at?: string
          use_cases?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "agent_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assessments: {
        Row: {
          ai_evaluation: Json | null
          assessment_type: string
          certification_eligible: boolean | null
          created_at: string | null
          difficulty_adapted: boolean | null
          id: string
          improvement_areas: string[] | null
          knowledge_areas_assessed: string[] | null
          max_score: number
          module_id: string | null
          next_recommendations: string[] | null
          passed: boolean | null
          questions: Json | null
          score: number
          strengths_identified: string[] | null
          taken_at: string | null
          time_taken_minutes: number | null
          user_answers: Json | null
          user_id: string
        }
        Insert: {
          ai_evaluation?: Json | null
          assessment_type?: string
          certification_eligible?: boolean | null
          created_at?: string | null
          difficulty_adapted?: boolean | null
          id?: string
          improvement_areas?: string[] | null
          knowledge_areas_assessed?: string[] | null
          max_score: number
          module_id?: string | null
          next_recommendations?: string[] | null
          passed?: boolean | null
          questions?: Json | null
          score: number
          strengths_identified?: string[] | null
          taken_at?: string | null
          time_taken_minutes?: number | null
          user_answers?: Json | null
          user_id: string
        }
        Update: {
          ai_evaluation?: Json | null
          assessment_type?: string
          certification_eligible?: boolean | null
          created_at?: string | null
          difficulty_adapted?: boolean | null
          id?: string
          improvement_areas?: string[] | null
          knowledge_areas_assessed?: string[] | null
          max_score?: number
          module_id?: string | null
          next_recommendations?: string[] | null
          passed?: boolean | null
          questions?: Json | null
          score?: number
          strengths_identified?: string[] | null
          taken_at?: string | null
          time_taken_minutes?: number | null
          user_answers?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_assignments: {
        Row: {
          ai_model_id: string | null
          ai_provider_id: string | null
          business_function: string
          configuration: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          ai_model_id?: string | null
          ai_provider_id?: string | null
          business_function: string
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ai_model_id?: string | null
          ai_provider_id?: string | null
          business_function?: string
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_assignments_ai_model_id_fkey"
            columns: ["ai_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_model_assignments_ai_provider_id_fkey"
            columns: ["ai_provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ai_model_selections: {
        Row: {
          api_key_id: string
          created_at: string
          id: string
          is_active: boolean
          model_name: string
          provider: string
          updated_at: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          model_name: string
          provider: string
          updated_at?: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          model_name?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_model_status_logs: {
        Row: {
          created_at: string
          error_rate: number
          id: string
          last_checked: string
          name: string
          provider: string
          response_time: number
          status: string
          uptime: number
        }
        Insert: {
          created_at?: string
          error_rate?: number
          id?: string
          last_checked?: string
          name: string
          provider: string
          response_time?: number
          status: string
          uptime?: number
        }
        Update: {
          created_at?: string
          error_rate?: number
          id?: string
          last_checked?: string
          name?: string
          provider?: string
          response_time?: number
          status?: string
          uptime?: number
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          configuration: Json | null
          cost_per_token: number | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model_type: string
          name: string
          provider_id: string | null
          supports_streaming: boolean | null
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          cost_per_token?: number | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_type: string
          name: string
          provider_id?: string | null
          supports_streaming?: boolean | null
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          cost_per_token?: number | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_type?: string
          name?: string
          provider_id?: string | null
          supports_streaming?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_models: {
        Row: {
          capabilities: Json | null
          created_at: string
          display_name: string
          id: string
          is_available: boolean
          is_preferred: boolean
          model_name: string
          model_type: Database["public"]["Enums"]["ai_model_type"]
          pricing_info: Json | null
          provider_id: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string
          display_name: string
          id?: string
          is_available?: boolean
          is_preferred?: boolean
          model_name: string
          model_type: Database["public"]["Enums"]["ai_model_type"]
          pricing_info?: Json | null
          provider_id: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json | null
          created_at?: string
          display_name?: string
          id?: string
          is_available?: boolean
          is_preferred?: boolean
          model_name?: string
          model_type?: Database["public"]["Enums"]["ai_model_type"]
          pricing_info?: Json | null
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          auth_type: string
          base_url: string
          configuration: Json | null
          created_at: string
          description: string | null
          display_name: string
          env_key: string
          id: string
          is_active: boolean
          name: string
          supported_model_types: Database["public"]["Enums"]["ai_model_type"][]
          updated_at: string
        }
        Insert: {
          auth_type?: string
          base_url: string
          configuration?: Json | null
          created_at?: string
          description?: string | null
          display_name: string
          env_key: string
          id?: string
          is_active?: boolean
          name: string
          supported_model_types?: Database["public"]["Enums"]["ai_model_type"][]
          updated_at?: string
        }
        Update: {
          auth_type?: string
          base_url?: string
          configuration?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string
          env_key?: string
          id?: string
          is_active?: boolean
          name?: string
          supported_model_types?: Database["public"]["Enums"]["ai_model_type"][]
          updated_at?: string
        }
        Relationships: []
      }
      ai_tutor_sessions: {
        Row: {
          ai_personality: Json | null
          created_at: string | null
          ended_at: string | null
          id: string
          knowledge_gaps_identified: string[] | null
          learning_effectiveness_score: number | null
          messages: Json | null
          module_id: string | null
          recommendations: string[] | null
          satisfaction_rating: number | null
          session_duration_minutes: number | null
          session_type: string
          started_at: string | null
          topics_covered: string[] | null
          user_id: string
        }
        Insert: {
          ai_personality?: Json | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          knowledge_gaps_identified?: string[] | null
          learning_effectiveness_score?: number | null
          messages?: Json | null
          module_id?: string | null
          recommendations?: string[] | null
          satisfaction_rating?: number | null
          session_duration_minutes?: number | null
          session_type?: string
          started_at?: string | null
          topics_covered?: string[] | null
          user_id: string
        }
        Update: {
          ai_personality?: Json | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          knowledge_gaps_identified?: string[] | null
          learning_effectiveness_score?: number | null
          messages?: Json | null
          module_id?: string | null
          recommendations?: string[] | null
          satisfaction_rating?: number | null
          session_duration_minutes?: number | null
          session_type?: string
          started_at?: string | null
          topics_covered?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_insights: {
        Row: {
          age_ranges: Json | null
          analysis_period_end: string | null
          analysis_period_start: string | null
          audience_segment: string | null
          brand_affinities: string[] | null
          confidence_level: number | null
          content_consumption_habits: Json | null
          content_preferences: Json | null
          conversion_potential: number | null
          created_at: string
          device_usage: Json | null
          education_levels: Json | null
          engagement_patterns: Json | null
          gender_split: Json | null
          id: string
          income_ranges: Json | null
          insight_type: string
          interests: Json | null
          lifetime_value_estimate: number | null
          online_activity_patterns: Json | null
          platform: string
          purchase_intent_score: number | null
          raw_insights: Json | null
          relationship_status: Json | null
          sample_size: number | null
          segment_percentage: number | null
          segment_size: number | null
          shopping_behaviors: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_ranges?: Json | null
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          audience_segment?: string | null
          brand_affinities?: string[] | null
          confidence_level?: number | null
          content_consumption_habits?: Json | null
          content_preferences?: Json | null
          conversion_potential?: number | null
          created_at?: string
          device_usage?: Json | null
          education_levels?: Json | null
          engagement_patterns?: Json | null
          gender_split?: Json | null
          id?: string
          income_ranges?: Json | null
          insight_type: string
          interests?: Json | null
          lifetime_value_estimate?: number | null
          online_activity_patterns?: Json | null
          platform: string
          purchase_intent_score?: number | null
          raw_insights?: Json | null
          relationship_status?: Json | null
          sample_size?: number | null
          segment_percentage?: number | null
          segment_size?: number | null
          shopping_behaviors?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_ranges?: Json | null
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          audience_segment?: string | null
          brand_affinities?: string[] | null
          confidence_level?: number | null
          content_consumption_habits?: Json | null
          content_preferences?: Json | null
          conversion_potential?: number | null
          created_at?: string
          device_usage?: Json | null
          education_levels?: Json | null
          engagement_patterns?: Json | null
          gender_split?: Json | null
          id?: string
          income_ranges?: Json | null
          insight_type?: string
          interests?: Json | null
          lifetime_value_estimate?: number | null
          online_activity_patterns?: Json | null
          platform?: string
          purchase_intent_score?: number | null
          raw_insights?: Json | null
          relationship_status?: Json | null
          sample_size?: number | null
          segment_percentage?: number | null
          segment_size?: number | null
          shopping_behaviors?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_function_configurations: {
        Row: {
          configuration: Json | null
          created_at: string
          default_model_id: string | null
          default_provider_id: string | null
          description: string | null
          display_name: string
          function_name: Database["public"]["Enums"]["business_function_type"]
          id: string
          is_active: boolean
          required_model_type: Database["public"]["Enums"]["ai_model_type"]
          updated_at: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          default_model_id?: string | null
          default_provider_id?: string | null
          description?: string | null
          display_name: string
          function_name: Database["public"]["Enums"]["business_function_type"]
          id?: string
          is_active?: boolean
          required_model_type: Database["public"]["Enums"]["ai_model_type"]
          updated_at?: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          default_model_id?: string | null
          default_provider_id?: string | null
          description?: string | null
          display_name?: string
          function_name?: Database["public"]["Enums"]["business_function_type"]
          id?: string
          is_active?: boolean
          required_model_type?: Database["public"]["Enums"]["ai_model_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_function_configurations_default_model_id_fkey"
            columns: ["default_model_id"]
            isOneToOne: false
            referencedRelation: "ai_provider_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_function_configurations_default_provider_id_fkey"
            columns: ["default_provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_size: string | null
          created_at: string
          created_by: string
          descripcion_empresa: string | null
          description: string | null
          facebook_url: string | null
          id: string
          industria_principal: string | null
          industry_sector: string | null
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          webhook_data: Json | null
          webhook_processed_at: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          company_size?: string | null
          created_at?: string
          created_by: string
          descripcion_empresa?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          industria_principal?: string | null
          industry_sector?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          webhook_data?: Json | null
          webhook_processed_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          company_size?: string | null
          created_at?: string
          created_by?: string
          descripcion_empresa?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          industria_principal?: string | null
          industry_sector?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          webhook_data?: Json | null
          webhook_processed_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
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
      company_dashboard_metrics: {
        Row: {
          active_agents: number | null
          agent_hours_saved: number | null
          agent_missions_completed: number | null
          created_at: string
          efficiency_score: number | null
          estimated_cost_savings: number | null
          id: string
          knowledge_base_size_mb: number | null
          last_calculated_at: string | null
          metadata: Json | null
          period_end: string
          period_start: string
          reach_growth_percent: number | null
          roi_percentage: number | null
          tasks_automated: number | null
          total_agents: number | null
          total_engagement: number | null
          total_files: number | null
          total_posts: number | null
          total_social_connections: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_agents?: number | null
          agent_hours_saved?: number | null
          agent_missions_completed?: number | null
          created_at?: string
          efficiency_score?: number | null
          estimated_cost_savings?: number | null
          id?: string
          knowledge_base_size_mb?: number | null
          last_calculated_at?: string | null
          metadata?: Json | null
          period_end: string
          period_start: string
          reach_growth_percent?: number | null
          roi_percentage?: number | null
          tasks_automated?: number | null
          total_agents?: number | null
          total_engagement?: number | null
          total_files?: number | null
          total_posts?: number | null
          total_social_connections?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_agents?: number | null
          agent_hours_saved?: number | null
          agent_missions_completed?: number | null
          created_at?: string
          efficiency_score?: number | null
          estimated_cost_savings?: number | null
          id?: string
          knowledge_base_size_mb?: number | null
          last_calculated_at?: string | null
          metadata?: Json | null
          period_end?: string
          period_start?: string
          reach_growth_percent?: number | null
          roi_percentage?: number | null
          tasks_automated?: number | null
          total_agents?: number | null
          total_engagement?: number | null
          total_files?: number | null
          total_posts?: number | null
          total_social_connections?: number | null
          updated_at?: string
          user_id?: string
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
      company_members: {
        Row: {
          company_id: string
          id: string
          is_primary: boolean
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          is_primary?: boolean
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          is_primary?: boolean
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      competitive_analysis_sessions: {
        Row: {
          analysis_id: string | null
          collected_data: Json | null
          conversation_history: Json | null
          created_at: string
          current_step: string | null
          id: string
          last_interaction: string | null
          session_status: string | null
          step_progress: number | null
          total_steps: number | null
          updated_at: string
          user_id: string
          user_responses: Json | null
        }
        Insert: {
          analysis_id?: string | null
          collected_data?: Json | null
          conversation_history?: Json | null
          created_at?: string
          current_step?: string | null
          id?: string
          last_interaction?: string | null
          session_status?: string | null
          step_progress?: number | null
          total_steps?: number | null
          updated_at?: string
          user_id: string
          user_responses?: Json | null
        }
        Update: {
          analysis_id?: string | null
          collected_data?: Json | null
          conversation_history?: Json | null
          created_at?: string
          current_step?: string | null
          id?: string
          last_interaction?: string | null
          session_status?: string | null
          step_progress?: number | null
          total_steps?: number | null
          updated_at?: string
          user_id?: string
          user_responses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_sessions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitive_intelligence"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_intelligence: {
        Row: {
          ai_discovered_competitors: Json | null
          ai_model_used: string | null
          analysis_confidence_score: number | null
          analysis_depth: string | null
          analysis_session_id: string | null
          analysis_status: string | null
          business_model: string | null
          company_id: string | null
          competitive_advantages: Json | null
          competitive_landscape: Json | null
          competitive_positioning: Json | null
          competitor_strengths_weaknesses: Json | null
          completed_at: string | null
          created_at: string
          data_sources: Json | null
          differentiation_opportunities: Json | null
          direct_competitors: Json | null
          geographic_scope: string[] | null
          global_competitors: string[] | null
          growth_opportunities: Json | null
          id: string
          indirect_competitors: Json | null
          industry_sector: string | null
          local_competitors: string[] | null
          market_gaps: Json | null
          market_leaders: Json | null
          market_size_analysis: Json | null
          market_trends: Json | null
          marketing_strategies_analysis: Json | null
          pricing_analysis: Json | null
          product_comparison: Json | null
          strategic_recommendations: Json | null
          target_market: string | null
          threat_assessment: Json | null
          updated_at: string
          user_id: string
          user_identified_competitors: string[] | null
        }
        Insert: {
          ai_discovered_competitors?: Json | null
          ai_model_used?: string | null
          analysis_confidence_score?: number | null
          analysis_depth?: string | null
          analysis_session_id?: string | null
          analysis_status?: string | null
          business_model?: string | null
          company_id?: string | null
          competitive_advantages?: Json | null
          competitive_landscape?: Json | null
          competitive_positioning?: Json | null
          competitor_strengths_weaknesses?: Json | null
          completed_at?: string | null
          created_at?: string
          data_sources?: Json | null
          differentiation_opportunities?: Json | null
          direct_competitors?: Json | null
          geographic_scope?: string[] | null
          global_competitors?: string[] | null
          growth_opportunities?: Json | null
          id?: string
          indirect_competitors?: Json | null
          industry_sector?: string | null
          local_competitors?: string[] | null
          market_gaps?: Json | null
          market_leaders?: Json | null
          market_size_analysis?: Json | null
          market_trends?: Json | null
          marketing_strategies_analysis?: Json | null
          pricing_analysis?: Json | null
          product_comparison?: Json | null
          strategic_recommendations?: Json | null
          target_market?: string | null
          threat_assessment?: Json | null
          updated_at?: string
          user_id: string
          user_identified_competitors?: string[] | null
        }
        Update: {
          ai_discovered_competitors?: Json | null
          ai_model_used?: string | null
          analysis_confidence_score?: number | null
          analysis_depth?: string | null
          analysis_session_id?: string | null
          analysis_status?: string | null
          business_model?: string | null
          company_id?: string | null
          competitive_advantages?: Json | null
          competitive_landscape?: Json | null
          competitive_positioning?: Json | null
          competitor_strengths_weaknesses?: Json | null
          completed_at?: string | null
          created_at?: string
          data_sources?: Json | null
          differentiation_opportunities?: Json | null
          direct_competitors?: Json | null
          geographic_scope?: string[] | null
          global_competitors?: string[] | null
          growth_opportunities?: Json | null
          id?: string
          indirect_competitors?: Json | null
          industry_sector?: string | null
          local_competitors?: string[] | null
          market_gaps?: Json | null
          market_leaders?: Json | null
          market_size_analysis?: Json | null
          market_trends?: Json | null
          marketing_strategies_analysis?: Json | null
          pricing_analysis?: Json | null
          product_comparison?: Json | null
          strategic_recommendations?: Json | null
          target_market?: string | null
          threat_assessment?: Json | null
          updated_at?: string
          user_id?: string
          user_identified_competitors?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_intelligence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_profiles: {
        Row: {
          analysis_id: string | null
          business_model: string | null
          company_name: string
          competitive_threat_score: number | null
          confidence_level: string | null
          content_strategy: Json | null
          created_at: string
          data_sources: string[] | null
          description: string | null
          employee_count: string | null
          estimated_revenue: string | null
          funding_status: string | null
          geographic_presence: string[] | null
          id: string
          innovation_score: number | null
          last_updated: string | null
          market_position: string | null
          market_share_percentage: number | null
          marketing_channels: string[] | null
          opportunities: string[] | null
          pricing_strategy: Json | null
          products_services: Json | null
          seo_performance: Json | null
          social_media_presence: Json | null
          strengths: string[] | null
          target_market: string | null
          threats: string[] | null
          unique_value_propositions: string[] | null
          updated_at: string
          valuation: string | null
          weaknesses: string[] | null
          website_url: string | null
        }
        Insert: {
          analysis_id?: string | null
          business_model?: string | null
          company_name: string
          competitive_threat_score?: number | null
          confidence_level?: string | null
          content_strategy?: Json | null
          created_at?: string
          data_sources?: string[] | null
          description?: string | null
          employee_count?: string | null
          estimated_revenue?: string | null
          funding_status?: string | null
          geographic_presence?: string[] | null
          id?: string
          innovation_score?: number | null
          last_updated?: string | null
          market_position?: string | null
          market_share_percentage?: number | null
          marketing_channels?: string[] | null
          opportunities?: string[] | null
          pricing_strategy?: Json | null
          products_services?: Json | null
          seo_performance?: Json | null
          social_media_presence?: Json | null
          strengths?: string[] | null
          target_market?: string | null
          threats?: string[] | null
          unique_value_propositions?: string[] | null
          updated_at?: string
          valuation?: string | null
          weaknesses?: string[] | null
          website_url?: string | null
        }
        Update: {
          analysis_id?: string | null
          business_model?: string | null
          company_name?: string
          competitive_threat_score?: number | null
          confidence_level?: string | null
          content_strategy?: Json | null
          created_at?: string
          data_sources?: string[] | null
          description?: string | null
          employee_count?: string | null
          estimated_revenue?: string | null
          funding_status?: string | null
          geographic_presence?: string[] | null
          id?: string
          innovation_score?: number | null
          last_updated?: string | null
          market_position?: string | null
          market_share_percentage?: number | null
          marketing_channels?: string[] | null
          opportunities?: string[] | null
          pricing_strategy?: Json | null
          products_services?: Json | null
          seo_performance?: Json | null
          social_media_presence?: Json | null
          strengths?: string[] | null
          target_market?: string | null
          threats?: string[] | null
          unique_value_propositions?: string[] | null
          updated_at?: string
          valuation?: string | null
          weaknesses?: string[] | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_profiles_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitive_intelligence"
            referencedColumns: ["id"]
          },
        ]
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
          content_type: string | null
          created_at: string
          embedding: string | null
          embedding_model: string | null
          id: string
          instagram_post_id: string | null
          metadata: Json | null
          platform: string
          post_id: string
          processing_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_text: string
          content_type?: string | null
          created_at?: string
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          instagram_post_id?: string | null
          metadata?: Json | null
          platform: string
          post_id: string
          processing_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_text?: string
          content_type?: string | null
          created_at?: string
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          instagram_post_id?: string | null
          metadata?: Json | null
          platform?: string
          post_id?: string
          processing_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_embeddings_instagram_post_id_fkey"
            columns: ["instagram_post_id"]
            isOneToOne: false
            referencedRelation: "instagram_posts"
            referencedColumns: ["id"]
          },
        ]
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
      dashboard_alerts: {
        Row: {
          action_text: string | null
          action_url: string | null
          alert_type: string
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          priority: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_text?: string | null
          action_url?: string | null
          alert_type: string
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          priority?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_text?: string | null
          action_url?: string | null
          alert_type?: string
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_configurations: {
        Row: {
          access_level: string
          agent_id: string
          analytics_enabled: boolean
          created_at: string
          dashboard_id: string
          id: string
          real_time_updates: boolean
          updated_at: string
        }
        Insert: {
          access_level?: string
          agent_id: string
          analytics_enabled?: boolean
          created_at?: string
          dashboard_id: string
          id?: string
          real_time_updates?: boolean
          updated_at?: string
        }
        Update: {
          access_level?: string
          agent_id?: string
          analytics_enabled?: boolean
          created_at?: string
          dashboard_id?: string
          id?: string
          real_time_updates?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
        ]
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
      email_attachments: {
        Row: {
          created_at: string
          created_by: string | null
          file_path: string
          file_size: number
          id: string
          mime_type: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          name?: string
        }
        Relationships: []
      }
      email_configurations: {
        Row: {
          created_at: string
          from_email: string
          from_name: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_secure: boolean
          smtp_user: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_email: string
          from_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          smtp_host: string
          smtp_password: string
          smtp_port?: number
          smtp_secure?: boolean
          smtp_user: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_secure?: boolean
          smtp_user?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_integrations: {
        Row: {
          agent_id: string
          created_at: string
          email_address: string
          id: string
          imap_server: string
          smtp_server: string
          status: string
          updated_at: string
          webhook_url: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          email_address: string
          id?: string
          imap_server: string
          smtp_server: string
          status?: string
          updated_at?: string
          webhook_url: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          email_address?: string
          id?: string
          imap_server?: string
          smtp_server?: string
          status?: string
          updated_at?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_integrations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_history: {
        Row: {
          attachments: Json | null
          bcc_emails: string[] | null
          cc_emails: string[] | null
          configuration_id: string | null
          created_at: string
          error_message: string | null
          html_content: string
          id: string
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          text_content: string | null
          to_email: string
          to_name: string | null
          variables: Json | null
        }
        Insert: {
          attachments?: Json | null
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          configuration_id?: string | null
          created_at?: string
          error_message?: string | null
          html_content: string
          id?: string
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          text_content?: string | null
          to_email: string
          to_name?: string | null
          variables?: Json | null
        }
        Update: {
          attachments?: Json | null
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          configuration_id?: string | null
          created_at?: string
          error_message?: string | null
          html_content?: string
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          text_content?: string | null
          to_email?: string
          to_name?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_send_history_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "email_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_send_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          attachments: Json | null
          created_at: string
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean
          name: string
          subject: string
          template_type: string
          text_content: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          template_type: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      era_prompt_templates: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_active: boolean | null
          max_words: number | null
          specific_instructions: string
          system_prompt: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_type: string
          id?: string
          is_active?: boolean | null
          max_words?: number | null
          specific_instructions: string
          system_prompt: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          max_words?: number | null
          specific_instructions?: string
          system_prompt?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expert_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          expert_id: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          expert_id: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          expert_id?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_availability_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_sessions: {
        Row: {
          client_feedback: string | null
          client_rating: number | null
          client_user_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          expert_id: string
          expert_notes: string | null
          id: string
          meeting_link: string | null
          notes: string | null
          price_paid: number | null
          scheduled_at: string
          session_type: string
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          client_feedback?: string | null
          client_rating?: number | null
          client_user_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          expert_id: string
          expert_notes?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          price_paid?: number | null
          scheduled_at: string
          session_type?: string
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          client_feedback?: string | null
          client_rating?: number | null
          client_user_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          expert_id?: string
          expert_notes?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          price_paid?: number | null
          scheduled_at?: string
          session_type?: string
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_sessions_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_specializations: {
        Row: {
          category: string
          certifications: string[] | null
          created_at: string
          description: string | null
          expert_id: string
          id: string
          skill_level: string
          subcategory: string
          years_experience: number | null
        }
        Insert: {
          category: string
          certifications?: string[] | null
          created_at?: string
          description?: string | null
          expert_id: string
          id?: string
          skill_level?: string
          subcategory: string
          years_experience?: number | null
        }
        Update: {
          category?: string
          certifications?: string[] | null
          created_at?: string
          description?: string | null
          expert_id?: string
          id?: string
          skill_level?: string
          subcategory?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_specializations_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      experts: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          experience_years: number | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          linkedin_url: string | null
          profile_image_url: string | null
          rating: number | null
          specialization: string
          timezone: string | null
          total_sessions: number | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          profile_image_url?: string | null
          rating?: number | null
          specialization: string
          timezone?: string | null
          total_sessions?: number | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          profile_image_url?: string | null
          rating?: number | null
          specialization?: string
          timezone?: string | null
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
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
      facebook_page_data: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          page_details: Json | null
          page_url: string
          reviews: Json | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          page_details?: Json | null
          page_url: string
          reviews?: Json | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          page_details?: Json | null
          page_url?: string
          reviews?: Json | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      facebook_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string
          engagement_rate: number | null
          id: string
          likes_count: number | null
          post_id: string
          post_type: string | null
          posted_at: string | null
          profile_category: string | null
          profile_followers_count: number | null
          profile_likes_count: number | null
          profile_page_id: string | null
          profile_page_name: string | null
          profile_website: string | null
          raw_data: Json | null
          reactions_count: number | null
          shares_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          engagement_rate?: number | null
          id?: string
          likes_count?: number | null
          post_id: string
          post_type?: string | null
          posted_at?: string | null
          profile_category?: string | null
          profile_followers_count?: number | null
          profile_likes_count?: number | null
          profile_page_id?: string | null
          profile_page_name?: string | null
          profile_website?: string | null
          raw_data?: Json | null
          reactions_count?: number | null
          shares_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          engagement_rate?: number | null
          id?: string
          likes_count?: number | null
          post_id?: string
          post_type?: string | null
          posted_at?: string | null
          profile_category?: string | null
          profile_followers_count?: number | null
          profile_likes_count?: number | null
          profile_page_id?: string | null
          profile_page_name?: string | null
          profile_website?: string | null
          raw_data?: Json | null
          reactions_count?: number | null
          shares_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      followers_location_analysis: {
        Row: {
          analysis_date: string
          avg_age: number | null
          avg_purchasing_power: number | null
          city: string | null
          confidence_score: number | null
          coordinates: unknown | null
          country: string
          country_code: string | null
          created_at: string
          data_source: string | null
          followers_count: number
          gender_distribution: Json | null
          id: string
          interest_categories: Json | null
          language_distribution: Json | null
          market_potential_score: number | null
          peak_activity_days: number[] | null
          peak_activity_hours: number[] | null
          percentage: number | null
          platform: string
          raw_data: Json | null
          region: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_date?: string
          avg_age?: number | null
          avg_purchasing_power?: number | null
          city?: string | null
          confidence_score?: number | null
          coordinates?: unknown | null
          country: string
          country_code?: string | null
          created_at?: string
          data_source?: string | null
          followers_count?: number
          gender_distribution?: Json | null
          id?: string
          interest_categories?: Json | null
          language_distribution?: Json | null
          market_potential_score?: number | null
          peak_activity_days?: number[] | null
          peak_activity_hours?: number[] | null
          percentage?: number | null
          platform: string
          raw_data?: Json | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_date?: string
          avg_age?: number | null
          avg_purchasing_power?: number | null
          city?: string | null
          confidence_score?: number | null
          coordinates?: unknown | null
          country?: string
          country_code?: string | null
          created_at?: string
          data_source?: string | null
          followers_count?: number
          gender_distribution?: Json | null
          id?: string
          interest_categories?: Json | null
          language_distribution?: Json | null
          market_potential_score?: number | null
          peak_activity_days?: number[] | null
          peak_activity_hours?: number[] | null
          percentage?: number | null
          platform?: string
          raw_data?: Json | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      function_model_assignments: {
        Row: {
          api_key_id: string | null
          created_at: string
          function_config_id: string
          id: string
          is_active: boolean
          model_id: string
          model_parameters: Json | null
          priority: number
          provider_id: string
          updated_at: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          function_config_id: string
          id?: string
          is_active?: boolean
          model_id: string
          model_parameters?: Json | null
          priority?: number
          provider_id: string
          updated_at?: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          function_config_id?: string
          id?: string
          is_active?: boolean
          model_id?: string
          model_parameters?: Json | null
          priority?: number
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "function_model_assignments_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "llm_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "function_model_assignments_function_config_id_fkey"
            columns: ["function_config_id"]
            isOneToOne: false
            referencedRelation: "business_function_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "function_model_assignments_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_provider_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "function_model_assignments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
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
      instagram_content_analysis: {
        Row: {
          ai_generated_tags: string[] | null
          brand_mentions: string[] | null
          competitor_mentions: string[] | null
          content_category: string | null
          content_quality_score: number | null
          created_at: string
          engagement_prediction: number | null
          id: string
          optimal_posting_time: string | null
          post_id: string
          sentiment_label: string | null
          sentiment_score: number | null
          text_complexity_score: number | null
          topics: string[] | null
          trending_keywords: string[] | null
          updated_at: string
          user_id: string
          virality_score: number | null
          visual_elements: string[] | null
        }
        Insert: {
          ai_generated_tags?: string[] | null
          brand_mentions?: string[] | null
          competitor_mentions?: string[] | null
          content_category?: string | null
          content_quality_score?: number | null
          created_at?: string
          engagement_prediction?: number | null
          id?: string
          optimal_posting_time?: string | null
          post_id: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          text_complexity_score?: number | null
          topics?: string[] | null
          trending_keywords?: string[] | null
          updated_at?: string
          user_id: string
          virality_score?: number | null
          visual_elements?: string[] | null
        }
        Update: {
          ai_generated_tags?: string[] | null
          brand_mentions?: string[] | null
          competitor_mentions?: string[] | null
          content_category?: string | null
          content_quality_score?: number | null
          created_at?: string
          engagement_prediction?: number | null
          id?: string
          optimal_posting_time?: string | null
          post_id?: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          text_complexity_score?: number | null
          topics?: string[] | null
          trending_keywords?: string[] | null
          updated_at?: string
          user_id?: string
          virality_score?: number | null
          visual_elements?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_content_analysis_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "instagram_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_followers_detailed: {
        Row: {
          created_at: string
          follower_avg_comments: number | null
          follower_avg_likes: number | null
          follower_bio: string | null
          follower_business_category: string | null
          follower_city: string | null
          follower_country: string | null
          follower_engagement_rate: number | null
          follower_external_url: string | null
          follower_followers_count: number | null
          follower_following_count: number | null
          follower_full_name: string | null
          follower_is_private: boolean | null
          follower_is_verified: boolean | null
          follower_language: string | null
          follower_last_activity: string | null
          follower_location: string | null
          follower_media_count: number | null
          follower_profile_pic_url: string | null
          follower_timezone: string | null
          follower_user_id: string
          follower_username: string | null
          id: string
          instagram_user_id: string
          raw_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          follower_avg_comments?: number | null
          follower_avg_likes?: number | null
          follower_bio?: string | null
          follower_business_category?: string | null
          follower_city?: string | null
          follower_country?: string | null
          follower_engagement_rate?: number | null
          follower_external_url?: string | null
          follower_followers_count?: number | null
          follower_following_count?: number | null
          follower_full_name?: string | null
          follower_is_private?: boolean | null
          follower_is_verified?: boolean | null
          follower_language?: string | null
          follower_last_activity?: string | null
          follower_location?: string | null
          follower_media_count?: number | null
          follower_profile_pic_url?: string | null
          follower_timezone?: string | null
          follower_user_id: string
          follower_username?: string | null
          id?: string
          instagram_user_id: string
          raw_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          follower_avg_comments?: number | null
          follower_avg_likes?: number | null
          follower_bio?: string | null
          follower_business_category?: string | null
          follower_city?: string | null
          follower_country?: string | null
          follower_engagement_rate?: number | null
          follower_external_url?: string | null
          follower_followers_count?: number | null
          follower_following_count?: number | null
          follower_full_name?: string | null
          follower_is_private?: boolean | null
          follower_is_verified?: boolean | null
          follower_language?: string | null
          follower_last_activity?: string | null
          follower_location?: string | null
          follower_media_count?: number | null
          follower_profile_pic_url?: string | null
          follower_timezone?: string | null
          follower_user_id?: string
          follower_username?: string | null
          id?: string
          instagram_user_id?: string
          raw_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_posts: {
        Row: {
          caption: string | null
          comment_count: number | null
          created_at: string
          display_url: string | null
          engagement_rate: number | null
          hashtags: string[] | null
          id: string
          impressions: number | null
          is_video: boolean | null
          like_count: number | null
          media_type: number | null
          mentions: string[] | null
          owner_full_name: string | null
          owner_profile_pic_url: string | null
          owner_username: string | null
          platform: string
          post_id: string
          posted_at: string | null
          profile_followers_count: number | null
          profile_following_count: number | null
          profile_full_name: string | null
          profile_is_business: boolean | null
          profile_is_verified: boolean | null
          profile_pic_url: string | null
          profile_username: string | null
          raw_data: Json | null
          reach: number | null
          saves: number | null
          shortcode: string | null
          taken_at_timestamp: number | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_view_count: number | null
        }
        Insert: {
          caption?: string | null
          comment_count?: number | null
          created_at?: string
          display_url?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          impressions?: number | null
          is_video?: boolean | null
          like_count?: number | null
          media_type?: number | null
          mentions?: string[] | null
          owner_full_name?: string | null
          owner_profile_pic_url?: string | null
          owner_username?: string | null
          platform?: string
          post_id: string
          posted_at?: string | null
          profile_followers_count?: number | null
          profile_following_count?: number | null
          profile_full_name?: string | null
          profile_is_business?: boolean | null
          profile_is_verified?: boolean | null
          profile_pic_url?: string | null
          profile_username?: string | null
          raw_data?: Json | null
          reach?: number | null
          saves?: number | null
          shortcode?: string | null
          taken_at_timestamp?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_view_count?: number | null
        }
        Update: {
          caption?: string | null
          comment_count?: number | null
          created_at?: string
          display_url?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          impressions?: number | null
          is_video?: boolean | null
          like_count?: number | null
          media_type?: number | null
          mentions?: string[] | null
          owner_full_name?: string | null
          owner_profile_pic_url?: string | null
          owner_username?: string | null
          platform?: string
          post_id?: string
          posted_at?: string | null
          profile_followers_count?: number | null
          profile_following_count?: number | null
          profile_full_name?: string | null
          profile_is_business?: boolean | null
          profile_is_verified?: boolean | null
          profile_pic_url?: string | null
          profile_username?: string | null
          raw_data?: Json | null
          reach?: number | null
          saves?: number | null
          shortcode?: string | null
          taken_at_timestamp?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_view_count?: number | null
        }
        Relationships: []
      }
      learning_badges: {
        Row: {
          badge_image_url: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: number
          linkedin_badge_data: Json | null
          name: string
          points_required: number | null
          requirements: Json | null
        }
        Insert: {
          badge_image_url?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          linkedin_badge_data?: Json | null
          name: string
          points_required?: number | null
          requirements?: Json | null
        }
        Update: {
          badge_image_url?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          linkedin_badge_data?: Json | null
          name?: string
          points_required?: number | null
          requirements?: Json | null
        }
        Relationships: []
      }
      learning_modules: {
        Row: {
          ai_tutor_personality: Json | null
          badge_design: Json | null
          category: string
          content_outline: Json | null
          created_at: string | null
          description: string | null
          difficulty_level: string
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          learning_objectives: string[] | null
          points_reward: number | null
          prerequisites: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_tutor_personality?: Json | null
          badge_design?: Json | null
          category: string
          content_outline?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          learning_objectives?: string[] | null
          points_reward?: number | null
          prerequisites?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_tutor_personality?: Json | null
          badge_design?: Json | null
          category?: string
          content_outline?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          learning_objectives?: string[] | null
          points_reward?: number | null
          prerequisites?: string[] | null
          title?: string
          updated_at?: string | null
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
      linkedin_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string
          engagement_rate: number | null
          id: string
          likes_count: number | null
          post_id: string
          post_type: string | null
          posted_at: string | null
          profile_followers_count: number | null
          profile_headline: string | null
          profile_industry: string | null
          profile_location: string | null
          profile_name: string | null
          profile_url: string | null
          raw_data: Json | null
          shares_count: number | null
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          engagement_rate?: number | null
          id?: string
          likes_count?: number | null
          post_id: string
          post_type?: string | null
          posted_at?: string | null
          profile_followers_count?: number | null
          profile_headline?: string | null
          profile_industry?: string | null
          profile_location?: string | null
          profile_name?: string | null
          profile_url?: string | null
          raw_data?: Json | null
          shares_count?: number | null
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          engagement_rate?: number | null
          id?: string
          likes_count?: number | null
          post_id?: string
          post_type?: string | null
          posted_at?: string | null
          profile_followers_count?: number | null
          profile_headline?: string | null
          profile_industry?: string | null
          profile_location?: string | null
          profile_name?: string | null
          profile_url?: string | null
          raw_data?: Json | null
          shares_count?: number | null
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      llm_api_billing: {
        Row: {
          api_key_id: string
          billing_period_end: string
          billing_period_start: string
          created_at: string
          currency: string | null
          id: string
          provider: string
          status: string | null
          total_cost: number | null
          total_usage_tokens: number | null
          updated_at: string
        }
        Insert: {
          api_key_id: string
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          currency?: string | null
          id?: string
          provider: string
          status?: string | null
          total_cost?: number | null
          total_usage_tokens?: number | null
          updated_at?: string
        }
        Update: {
          api_key_id?: string
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          currency?: string | null
          id?: string
          provider?: string
          status?: string | null
          total_cost?: number | null
          total_usage_tokens?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_api_billing_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "llm_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_api_keys: {
        Row: {
          api_key_hash: string
          api_key_name: string
          available_models: string[] | null
          cost_limit_monthly: number | null
          created_at: string
          id: string
          key_last_four: string
          last_usage_check: string | null
          model_name: string | null
          notes: string | null
          provider: string
          status: string
          updated_at: string
          usage_limit_monthly: number | null
        }
        Insert: {
          api_key_hash: string
          api_key_name: string
          available_models?: string[] | null
          cost_limit_monthly?: number | null
          created_at?: string
          id?: string
          key_last_four: string
          last_usage_check?: string | null
          model_name?: string | null
          notes?: string | null
          provider: string
          status?: string
          updated_at?: string
          usage_limit_monthly?: number | null
        }
        Update: {
          api_key_hash?: string
          api_key_name?: string
          available_models?: string[] | null
          cost_limit_monthly?: number | null
          created_at?: string
          id?: string
          key_last_four?: string
          last_usage_check?: string | null
          model_name?: string | null
          notes?: string | null
          provider?: string
          status?: string
          updated_at?: string
          usage_limit_monthly?: number | null
        }
        Relationships: []
      }
      llm_api_usage: {
        Row: {
          api_key_id: string
          completion_tokens: number | null
          created_at: string
          id: string
          model_name: string
          prompt_tokens: number | null
          provider: string
          total_cost: number | null
          total_requests: number | null
          total_tokens: number | null
          updated_at: string
          usage_date: string
        }
        Insert: {
          api_key_id: string
          completion_tokens?: number | null
          created_at?: string
          id?: string
          model_name: string
          prompt_tokens?: number | null
          provider: string
          total_cost?: number | null
          total_requests?: number | null
          total_tokens?: number | null
          updated_at?: string
          usage_date?: string
        }
        Update: {
          api_key_id?: string
          completion_tokens?: number | null
          created_at?: string
          id?: string
          model_name?: string
          prompt_tokens?: number | null
          provider?: string
          total_cost?: number | null
          total_requests?: number | null
          total_tokens?: number | null
          updated_at?: string
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_api_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "llm_api_keys"
            referencedColumns: ["id"]
          },
        ]
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
          generated_by: string | null
          id: string
          impact_level: string | null
          insight_type: string
          platform: string | null
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
          generated_by?: string | null
          id?: string
          impact_level?: string | null
          insight_type: string
          platform?: string | null
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
          generated_by?: string | null
          id?: string
          impact_level?: string | null
          insight_type?: string
          platform?: string | null
          platforms?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_onboarding_status: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          onboarding_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          onboarding_version?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          onboarding_version?: string
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
          primary_company_id: string | null
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
          primary_company_id?: string | null
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
          primary_company_id?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_company_id_fkey"
            columns: ["primary_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          period_type?: string
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
      social_media_calendar: {
        Row: {
          comments_count: number | null
          created_at: string
          day_of_week: number | null
          engagement_rate: number | null
          has_location: boolean | null
          hashtags: string[] | null
          hour_of_day: number | null
          id: string
          impressions: number | null
          likes_count: number | null
          location_name: string | null
          mentions: string[] | null
          performance_score: number | null
          platform: string
          platform_specific_data: Json | null
          post_caption: string | null
          post_id: string
          post_title: string | null
          post_type: string | null
          published_at: string
          reach: number | null
          scheduled_at: string | null
          shares_count: number | null
          time_zone: string | null
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string
          day_of_week?: number | null
          engagement_rate?: number | null
          has_location?: boolean | null
          hashtags?: string[] | null
          hour_of_day?: number | null
          id?: string
          impressions?: number | null
          likes_count?: number | null
          location_name?: string | null
          mentions?: string[] | null
          performance_score?: number | null
          platform: string
          platform_specific_data?: Json | null
          post_caption?: string | null
          post_id: string
          post_title?: string | null
          post_type?: string | null
          published_at: string
          reach?: number | null
          scheduled_at?: string | null
          shares_count?: number | null
          time_zone?: string | null
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string
          day_of_week?: number | null
          engagement_rate?: number | null
          has_location?: boolean | null
          hashtags?: string[] | null
          hour_of_day?: number | null
          id?: string
          impressions?: number | null
          likes_count?: number | null
          location_name?: string | null
          mentions?: string[] | null
          performance_score?: number | null
          platform?: string
          platform_specific_data?: Json | null
          post_caption?: string | null
          post_id?: string
          post_title?: string | null
          post_type?: string | null
          published_at?: string
          reach?: number | null
          scheduled_at?: string | null
          shares_count?: number | null
          time_zone?: string | null
          updated_at?: string
          user_id?: string
          views_count?: number | null
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
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_usage: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          updated_at: string
          usage_count: number
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          updated_at?: string
          usage_count?: number
          usage_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          usage_count?: number
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      system_analytics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          period_end: string | null
          period_start: string
          platform: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type?: string
          metric_value: number
          period_end?: string | null
          period_start?: string
          platform?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          period_end?: string | null
          period_start?: string
          platform?: string | null
          user_id?: string | null
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
      tiktok_followers: {
        Row: {
          avatar_url: string | null
          created_at: string
          follower_count: number | null
          follower_nickname: string | null
          follower_unique_id: string | null
          follower_user_id: string
          id: string
          raw_data: Json | null
          tiktok_user_id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          follower_count?: number | null
          follower_nickname?: string | null
          follower_unique_id?: string | null
          follower_user_id: string
          id?: string
          raw_data?: Json | null
          tiktok_user_id: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          follower_count?: number | null
          follower_nickname?: string | null
          follower_unique_id?: string | null
          follower_user_id?: string
          id?: string
          raw_data?: Json | null
          tiktok_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tiktok_following: {
        Row: {
          avatar_url: string | null
          created_at: string
          follower_count: number | null
          following_nickname: string | null
          following_unique_id: string | null
          following_user_id: string
          id: string
          raw_data: Json | null
          tiktok_user_id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          follower_count?: number | null
          following_nickname?: string | null
          following_unique_id?: string | null
          following_user_id: string
          id?: string
          raw_data?: Json | null
          tiktok_user_id: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          follower_count?: number | null
          following_nickname?: string | null
          following_unique_id?: string | null
          following_user_id?: string
          id?: string
          raw_data?: Json | null
          tiktok_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tiktok_posts: {
        Row: {
          aweme_id: string
          collect_count: number | null
          comment_count: number | null
          cover_url: string | null
          create_time: number | null
          created_at: string
          digg_count: number | null
          download_count: number | null
          duration: number | null
          id: string
          is_ad: boolean | null
          play_count: number | null
          posted_at: string | null
          profile_avatar_url: string | null
          profile_display_name: string | null
          profile_followers_count: number | null
          profile_following_count: number | null
          profile_is_verified: boolean | null
          profile_username: string | null
          raw_data: Json | null
          share_count: number | null
          tiktok_user_id: string
          title: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          aweme_id: string
          collect_count?: number | null
          comment_count?: number | null
          cover_url?: string | null
          create_time?: number | null
          created_at?: string
          digg_count?: number | null
          download_count?: number | null
          duration?: number | null
          id?: string
          is_ad?: boolean | null
          play_count?: number | null
          posted_at?: string | null
          profile_avatar_url?: string | null
          profile_display_name?: string | null
          profile_followers_count?: number | null
          profile_following_count?: number | null
          profile_is_verified?: boolean | null
          profile_username?: string | null
          raw_data?: Json | null
          share_count?: number | null
          tiktok_user_id: string
          title?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          aweme_id?: string
          collect_count?: number | null
          comment_count?: number | null
          cover_url?: string | null
          create_time?: number | null
          created_at?: string
          digg_count?: number | null
          download_count?: number | null
          duration?: number | null
          id?: string
          is_ad?: boolean | null
          play_count?: number | null
          posted_at?: string | null
          profile_avatar_url?: string | null
          profile_display_name?: string | null
          profile_followers_count?: number | null
          profile_following_count?: number | null
          profile_is_verified?: boolean | null
          profile_username?: string | null
          raw_data?: Json | null
          share_count?: number | null
          tiktok_user_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      tiktok_user_data: {
        Row: {
          avatar_url: string | null
          created_at: string
          follower_count: number | null
          following_count: number | null
          heart_count: number | null
          id: string
          is_verified: boolean | null
          nickname: string
          raw_data: Json | null
          signature: string | null
          tiktok_user_id: string
          unique_id: string
          updated_at: string
          user_id: string
          video_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          follower_count?: number | null
          following_count?: number | null
          heart_count?: number | null
          id?: string
          is_verified?: boolean | null
          nickname: string
          raw_data?: Json | null
          signature?: string | null
          tiktok_user_id: string
          unique_id: string
          updated_at?: string
          user_id: string
          video_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          follower_count?: number | null
          following_count?: number | null
          heart_count?: number | null
          id?: string
          is_verified?: boolean | null
          nickname?: string
          raw_data?: Json | null
          signature?: string | null
          tiktok_user_id?: string
          unique_id?: string
          updated_at?: string
          user_id?: string
          video_count?: number | null
        }
        Relationships: []
      }
      user_agents: {
        Row: {
          added_at: string
          agent_id: string | null
          custom_name: string | null
          custom_settings: Json | null
          id: string
          is_favorite: boolean | null
          last_used_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          added_at?: string
          agent_id?: string | null
          custom_name?: string | null
          custom_settings?: Json | null
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          added_at?: string
          agent_id?: string | null
          custom_name?: string | null
          custom_settings?: Json | null
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string | null
          certificate_url: string | null
          created_at: string | null
          earned_at: string | null
          id: string
          linkedin_shared: boolean | null
          linkedin_shared_at: string | null
          metadata: Json | null
          user_id: string
          verification_code: string | null
        }
        Insert: {
          badge_id?: string | null
          certificate_url?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          linkedin_shared?: boolean | null
          linkedin_shared_at?: string | null
          metadata?: Json | null
          user_id: string
          verification_code?: string | null
        }
        Update: {
          badge_id?: string | null
          certificate_url?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          linkedin_shared?: boolean | null
          linkedin_shared_at?: string | null
          metadata?: Json | null
          user_id?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "learning_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          achievements: Json | null
          ai_interactions_count: number | null
          badges_earned: number | null
          created_at: string | null
          experience_points: number | null
          id: string
          last_activity: string | null
          level: number | null
          longest_streak: number | null
          modules_completed: number | null
          rank_position: number | null
          streak_days: number | null
          total_points: number | null
          total_study_time_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements?: Json | null
          ai_interactions_count?: number | null
          badges_earned?: number | null
          created_at?: string | null
          experience_points?: number | null
          id?: string
          last_activity?: string | null
          level?: number | null
          longest_streak?: number | null
          modules_completed?: number | null
          rank_position?: number | null
          streak_days?: number | null
          total_points?: number | null
          total_study_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements?: Json | null
          ai_interactions_count?: number | null
          badges_earned?: number | null
          created_at?: string | null
          experience_points?: number | null
          id?: string
          last_activity?: string | null
          level?: number | null
          longest_streak?: number | null
          modules_completed?: number | null
          rank_position?: number | null
          streak_days?: number | null
          total_points?: number | null
          total_study_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_learning_progress: {
        Row: {
          ai_feedback: Json | null
          ai_interactions_count: number | null
          best_quiz_score: number | null
          completed_at: string | null
          created_at: string | null
          current_lesson: number | null
          id: string
          last_interaction: string | null
          learning_notes: string | null
          module_id: string | null
          progress_percentage: number | null
          quiz_attempts: number | null
          started_at: string | null
          status: string
          time_spent_minutes: number | null
          total_lessons: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          ai_interactions_count?: number | null
          best_quiz_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_lesson?: number | null
          id?: string
          last_interaction?: string | null
          learning_notes?: string | null
          module_id?: string | null
          progress_percentage?: number | null
          quiz_attempts?: number | null
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          total_lessons?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_feedback?: Json | null
          ai_interactions_count?: number | null
          best_quiz_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_lesson?: number | null
          id?: string
          last_interaction?: string | null
          learning_notes?: string | null
          module_id?: string | null
          progress_percentage?: number | null
          quiz_attempts?: number | null
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          total_lessons?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      widget_configurations: {
        Row: {
          agent_id: string
          company_logo: string | null
          company_name: string | null
          created_at: string
          id: string
          primary_color: string | null
          updated_at: string
          widget_id: string
          widget_type: string
        }
        Insert: {
          agent_id: string
          company_logo?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          primary_color?: string | null
          updated_at?: string
          widget_id: string
          widget_type?: string
        }
        Update: {
          agent_id?: string
          company_logo?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          primary_color?: string | null
          updated_at?: string
          widget_id?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_instances"
            referencedColumns: ["id"]
          },
        ]
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
      calculate_competitive_landscape_score: {
        Args: { analysis_id_param: string }
        Returns: number
      }
      calculate_engagement_rate: {
        Args: { likes: number; comments: number; followers: number }
        Returns: number
      }
      calculate_posting_optimal_times: {
        Args: { user_id_param: string; platform_param: string }
        Returns: Json
      }
      calculate_user_level: {
        Args: { total_points: number }
        Returns: number
      }
      check_usage_limit: {
        Args: {
          user_id_param: string
          usage_type_param: string
          limit_key_param: string
        }
        Returns: boolean
      }
      create_company_with_owner: {
        Args:
          | {
              company_name: string
              company_description?: string
              website_url?: string
              industry_sector?: string
              company_size?: string
            }
          | {
              company_name: string
              company_description?: string
              website_url?: string
              industry_sector?: string
              company_size?: string
              user_id_param?: string
            }
        Returns: string
      }
      extract_hashtags: {
        Args: { caption: string }
        Returns: string[]
      }
      extract_mentions: {
        Args: { caption: string }
        Returns: string[]
      }
      get_admin_analytics_data: {
        Args: { start_date: string; end_date: string }
        Returns: {
          metric_name: string
          metric_value: number
          period_start: string
          period_end: string
          platform: string
          metadata: Json
        }[]
      }
      get_admin_analytics_summary: {
        Args: { start_date: string; end_date: string }
        Returns: {
          total_users: number
          total_companies: number
          total_developers: number
          total_experts: number
          total_linkedin_connections: number
          total_facebook_connections: number
          total_tiktok_connections: number
          total_ai_logs: number
          active_models: number
        }[]
      }
      get_admin_recent_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          recent_profiles: Json
          recent_connections: Json
        }[]
      }
      get_admin_social_connections: {
        Args: Record<PropertyKey, never>
        Returns: {
          linkedin_connections: number
          facebook_connections: number
          tiktok_connections: number
          recent_linkedin: number
          recent_facebook: number
          recent_tiktok: number
        }[]
      }
      get_admin_user_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          recent_users: number
          companies: number
          developers: number
          experts: number
          users_with_linkedin: number
          users_with_facebook: number
          users_with_tiktok: number
        }[]
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
      get_all_profiles_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          email: string
          full_name: string
          user_type: Database["public"]["Enums"]["user_type"]
          company_name: string
          website_url: string
          industry: string
          created_at: string
          linked_providers: string[]
          avatar_url: string
          user_position: string
          country: string
          location: string
        }[]
      }
      get_user_primary_company: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_stats_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          companies: number
          developers: number
          experts: number
          active_last_30_days: number
        }[]
      }
      get_user_subscription: {
        Args: { user_id_param: string }
        Returns: {
          plan_name: string
          plan_slug: string
          limits: Json
          status: string
          current_period_end: string
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
      handle_webhook_notification: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      increment_usage: {
        Args: {
          user_id_param: string
          usage_type_param: string
          increment_by?: number
        }
        Returns: undefined
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
      restore_agent_template_version: {
        Args: {
          template_id_param: string
          version_number_param: string
          new_version_param: string
        }
        Returns: boolean
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
      update_user_gamification: {
        Args: { p_user_id: string; p_points_earned?: number }
        Returns: undefined
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
      ai_model_type:
        | "text_generation"
        | "image_generation"
        | "audio_generation"
        | "video_generation"
        | "reasoning"
      business_function_type:
        | "content_optimization"
        | "content_generation"
        | "chat_assistant"
        | "image_creation"
        | "audio_synthesis"
        | "video_creation"
        | "data_analysis"
        | "competitive_intelligence"
        | "instagram_intelligent_analysis"
        | "linkedin_intelligent_analysis"
        | "facebook_intelligent_analysis"
        | "tiktok_intelligent_analysis"
        | "content_analysis"
        | "marketing_analysis"
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
      ai_model_type: [
        "text_generation",
        "image_generation",
        "audio_generation",
        "video_generation",
        "reasoning",
      ],
      business_function_type: [
        "content_optimization",
        "content_generation",
        "chat_assistant",
        "image_creation",
        "audio_synthesis",
        "video_creation",
        "data_analysis",
        "competitive_intelligence",
        "instagram_intelligent_analysis",
        "linkedin_intelligent_analysis",
        "facebook_intelligent_analysis",
        "tiktok_intelligent_analysis",
        "content_analysis",
        "marketing_analysis",
      ],
      user_type: ["developer", "expert", "company"],
    },
  },
} as const
