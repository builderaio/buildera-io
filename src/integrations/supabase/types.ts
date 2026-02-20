export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_credentials: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          password_hash: string
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          password_hash: string
          role?: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          password_hash?: string
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      agent_usage_log: {
        Row: {
          agent_id: string | null
          company_id: string | null
          created_at: string | null
          credits_consumed: number | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          output_summary: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          credits_consumed?: number | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          output_summary?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          credits_consumed?: number | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          output_summary?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_usage_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "platform_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_usage_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      ai_function_configurations: {
        Row: {
          api_version: string | null
          category: string
          created_at: string | null
          custom_functions: Json | null
          description: string | null
          display_name: string
          function_name: string
          id: string
          instructions: string | null
          is_active: boolean | null
          max_output_tokens: number | null
          model_name: string
          parallel_tool_calls: boolean | null
          provider: string
          reasoning_effort: string | null
          reasoning_enabled: boolean | null
          requires_web_search: boolean | null
          supports_streaming: boolean | null
          system_prompt: string | null
          temperature: number | null
          tool_choice: string | null
          tools_config: Json | null
          tools_enabled: Json | null
          top_p: number | null
          updated_at: string | null
        }
        Insert: {
          api_version?: string | null
          category?: string
          created_at?: string | null
          custom_functions?: Json | null
          description?: string | null
          display_name: string
          function_name: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_output_tokens?: number | null
          model_name?: string
          parallel_tool_calls?: boolean | null
          provider?: string
          reasoning_effort?: string | null
          reasoning_enabled?: boolean | null
          requires_web_search?: boolean | null
          supports_streaming?: boolean | null
          system_prompt?: string | null
          temperature?: number | null
          tool_choice?: string | null
          tools_config?: Json | null
          tools_enabled?: Json | null
          top_p?: number | null
          updated_at?: string | null
        }
        Update: {
          api_version?: string | null
          category?: string
          created_at?: string | null
          custom_functions?: Json | null
          description?: string | null
          display_name?: string
          function_name?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_output_tokens?: number | null
          model_name?: string
          parallel_tool_calls?: boolean | null
          provider?: string
          reasoning_effort?: string | null
          reasoning_enabled?: boolean | null
          requires_web_search?: boolean | null
          supports_streaming?: boolean | null
          system_prompt?: string | null
          temperature?: number | null
          tool_choice?: string | null
          tools_config?: Json | null
          tools_enabled?: Json | null
          top_p?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      ai_model_tool_compatibility: {
        Row: {
          context_window: number | null
          created_at: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          max_output_tokens: number | null
          model_name: string
          notes: string | null
          provider: string
          supports_code_interpreter: boolean | null
          supports_file_search: boolean | null
          supports_image_generation: boolean | null
          supports_reasoning: boolean | null
          supports_responses_api: boolean | null
          supports_web_search: boolean | null
        }
        Insert: {
          context_window?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          max_output_tokens?: number | null
          model_name: string
          notes?: string | null
          provider?: string
          supports_code_interpreter?: boolean | null
          supports_file_search?: boolean | null
          supports_image_generation?: boolean | null
          supports_reasoning?: boolean | null
          supports_responses_api?: boolean | null
          supports_web_search?: boolean | null
        }
        Update: {
          context_window?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          max_output_tokens?: number | null
          model_name?: string
          notes?: string | null
          provider?: string
          supports_code_interpreter?: boolean | null
          supports_file_search?: boolean | null
          supports_image_generation?: boolean | null
          supports_reasoning?: boolean | null
          supports_responses_api?: boolean | null
          supports_web_search?: boolean | null
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
      ai_workforce_team_members: {
        Row: {
          agent_id: string
          assigned_at: string | null
          id: string
          last_active_at: string | null
          role_in_team: string | null
          tasks_completed: number | null
          team_id: string
        }
        Insert: {
          agent_id: string
          assigned_at?: string | null
          id?: string
          last_active_at?: string | null
          role_in_team?: string | null
          tasks_completed?: number | null
          team_id: string
        }
        Update: {
          agent_id?: string
          assigned_at?: string | null
          id?: string
          last_active_at?: string | null
          role_in_team?: string | null
          tasks_completed?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workforce_team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "platform_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_workforce_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "ai_workforce_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workforce_team_tasks: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          created_at: string | null
          execution_log: Json | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string | null
          status: string | null
          task_description: string | null
          task_name: string
          task_type: string | null
          team_id: string
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          execution_log?: Json | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          task_description?: string | null
          task_name: string
          task_type?: string | null
          team_id: string
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          execution_log?: Json | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          task_description?: string | null
          task_name?: string
          task_type?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workforce_team_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "platform_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_workforce_team_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "ai_workforce_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workforce_teams: {
        Row: {
          activated_at: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          mission_objective: string
          mission_type: string | null
          status: string | null
          team_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_objective: string
          mission_type?: string | null
          status?: string | null
          team_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_objective?: string
          mission_type?: string | null
          status?: string | null
          team_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workforce_teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_analysis: {
        Row: {
          analysis_data: Json
          created_at: string | null
          id: string
          insights: Json | null
          platform: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string | null
          id?: string
          insights?: Json | null
          platform: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string | null
          id?: string
          insights?: Json | null
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      audience_insights: {
        Row: {
          age_ranges: Json | null
          ai_generated_insights: Json | null
          ai_recommendations: Json | null
          analysis_period_end: string | null
          analysis_period_start: string | null
          audience_segment: string | null
          audience_segments: Json | null
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
          last_ai_analysis_at: string | null
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
          ai_generated_insights?: Json | null
          ai_recommendations?: Json | null
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          audience_segment?: string | null
          audience_segments?: Json | null
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
          last_ai_analysis_at?: string | null
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
          ai_generated_insights?: Json | null
          ai_recommendations?: Json | null
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          audience_segment?: string | null
          audience_segments?: Json | null
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
          last_ai_analysis_at?: string | null
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
      auth_rate_limits: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt: string | null
          id: string
          identifier: string
          last_attempt: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier: string
          last_attempt?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier?: string
          last_attempt?: string | null
        }
        Relationships: []
      }
      autopilot_capabilities: {
        Row: {
          activated_at: string | null
          activation_reason: string | null
          auto_activate: boolean
          capability_code: string
          capability_name: string
          company_id: string
          created_at: string
          deactivated_at: string | null
          department: string
          description: string | null
          execution_count: number | null
          gap_evidence: Json | null
          id: string
          is_active: boolean | null
          last_evaluated_at: string | null
          proposed_reason: string | null
          required_data: Json | null
          required_maturity: string
          source: string
          status: string
          success_rate: number | null
          trial_expires_at: string | null
          trigger_condition: Json
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activation_reason?: string | null
          auto_activate?: boolean
          capability_code: string
          capability_name: string
          company_id: string
          created_at?: string
          deactivated_at?: string | null
          department: string
          description?: string | null
          execution_count?: number | null
          gap_evidence?: Json | null
          id?: string
          is_active?: boolean | null
          last_evaluated_at?: string | null
          proposed_reason?: string | null
          required_data?: Json | null
          required_maturity?: string
          source?: string
          status?: string
          success_rate?: number | null
          trial_expires_at?: string | null
          trigger_condition?: Json
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activation_reason?: string | null
          auto_activate?: boolean
          capability_code?: string
          capability_name?: string
          company_id?: string
          created_at?: string
          deactivated_at?: string | null
          department?: string
          description?: string | null
          execution_count?: number | null
          gap_evidence?: Json | null
          id?: string
          is_active?: boolean | null
          last_evaluated_at?: string | null
          proposed_reason?: string | null
          required_data?: Json | null
          required_maturity?: string
          source?: string
          status?: string
          success_rate?: number | null
          trial_expires_at?: string | null
          trigger_condition?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_capabilities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_decisions: {
        Row: {
          action_parameters: Json | null
          action_taken: boolean
          actual_impact: Json | null
          agent_to_execute: string | null
          company_id: string
          created_at: string
          cycle_id: string
          decision_type: string
          description: string
          expected_impact: Json | null
          guardrail_details: string | null
          guardrail_result: string | null
          id: string
          impact_evaluated_at: string | null
          priority: string
          reasoning: string | null
        }
        Insert: {
          action_parameters?: Json | null
          action_taken?: boolean
          actual_impact?: Json | null
          agent_to_execute?: string | null
          company_id: string
          created_at?: string
          cycle_id: string
          decision_type: string
          description: string
          expected_impact?: Json | null
          guardrail_details?: string | null
          guardrail_result?: string | null
          id?: string
          impact_evaluated_at?: string | null
          priority?: string
          reasoning?: string | null
        }
        Update: {
          action_parameters?: Json | null
          action_taken?: boolean
          actual_impact?: Json | null
          agent_to_execute?: string | null
          company_id?: string
          created_at?: string
          cycle_id?: string
          decision_type?: string
          description?: string
          expected_impact?: Json | null
          guardrail_details?: string | null
          guardrail_result?: string | null
          id?: string
          impact_evaluated_at?: string | null
          priority?: string
          reasoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_execution_log: {
        Row: {
          actions_taken: Json | null
          company_id: string
          content_approved: number
          content_generated: number
          content_pending_review: number
          content_rejected: number
          context_snapshot: Json | null
          created_at: string
          credits_consumed: number
          cycle_id: string
          decisions_made: Json | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          phase: string
          status: string
        }
        Insert: {
          actions_taken?: Json | null
          company_id: string
          content_approved?: number
          content_generated?: number
          content_pending_review?: number
          content_rejected?: number
          context_snapshot?: Json | null
          created_at?: string
          credits_consumed?: number
          cycle_id?: string
          decisions_made?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          phase: string
          status?: string
        }
        Update: {
          actions_taken?: Json | null
          company_id?: string
          content_approved?: number
          content_generated?: number
          content_pending_review?: number
          content_rejected?: number
          context_snapshot?: Json | null
          created_at?: string
          credits_consumed?: number
          cycle_id?: string
          decisions_made?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          phase?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_execution_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_memory: {
        Row: {
          applies_to_future: Json | null
          company_id: string
          context_hash: string | null
          context_summary: string | null
          created_at: string
          cycle_id: string
          decision_type: string
          department: string
          evaluated_at: string | null
          external_signal_details: Json | null
          external_signal_used: boolean | null
          id: string
          lesson_learned: string | null
          outcome_evaluation: string | null
          outcome_score: number | null
        }
        Insert: {
          applies_to_future?: Json | null
          company_id: string
          context_hash?: string | null
          context_summary?: string | null
          created_at?: string
          cycle_id: string
          decision_type: string
          department?: string
          evaluated_at?: string | null
          external_signal_details?: Json | null
          external_signal_used?: boolean | null
          id?: string
          lesson_learned?: string | null
          outcome_evaluation?: string | null
          outcome_score?: number | null
        }
        Update: {
          applies_to_future?: Json | null
          company_id?: string
          context_hash?: string | null
          context_summary?: string | null
          created_at?: string
          cycle_id?: string
          decision_type?: string
          department?: string
          evaluated_at?: string | null
          external_signal_details?: Json | null
          external_signal_used?: boolean | null
          id?: string
          lesson_learned?: string | null
          outcome_evaluation?: string | null
          outcome_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      business_health_snapshots: {
        Row: {
          agent_executions: number | null
          agent_hours_saved: number | null
          company_id: string
          content_engagement: number | null
          created_at: string
          credits_consumed: number | null
          detailed_metrics: Json | null
          digital_reach: number | null
          efficiency_score: number | null
          engagement_rate: number | null
          estimated_conversions: number | null
          id: string
          posts_published: number | null
          snapshot_date: string
          snapshot_type: string | null
        }
        Insert: {
          agent_executions?: number | null
          agent_hours_saved?: number | null
          company_id: string
          content_engagement?: number | null
          created_at?: string
          credits_consumed?: number | null
          detailed_metrics?: Json | null
          digital_reach?: number | null
          efficiency_score?: number | null
          engagement_rate?: number | null
          estimated_conversions?: number | null
          id?: string
          posts_published?: number | null
          snapshot_date: string
          snapshot_type?: string | null
        }
        Update: {
          agent_executions?: number | null
          agent_hours_saved?: number | null
          company_id?: string
          content_engagement?: number | null
          created_at?: string
          credits_consumed?: number | null
          detailed_metrics?: Json | null
          digital_reach?: number | null
          efficiency_score?: number | null
          engagement_rate?: number | null
          estimated_conversions?: number | null
          id?: string
          posts_published?: number | null
          snapshot_date?: string
          snapshot_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_health_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_personas: {
        Row: {
          campaign_id: string
          created_at: string
          details: Json
          fictional_name: string
          id: string
          professional_role: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          details?: Json
          fictional_name: string
          id?: string
          professional_role?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          details?: Json
          fictional_name?: string
          id?: string
          professional_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_personas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_size: string | null
          country: string | null
          created_at: string
          created_by: string
          deactivated_at: string | null
          deactivated_by: string | null
          description: string | null
          facebook_url: string | null
          id: string
          industry_sector: string | null
          instagram_url: string | null
          is_active: boolean | null
          journey_completed_at: string | null
          journey_current_step: number | null
          journey_type: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
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
          country?: string | null
          created_at?: string
          created_by: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          industry_sector?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          journey_completed_at?: string | null
          journey_current_step?: number | null
          journey_type?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
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
          country?: string | null
          created_at?: string
          created_by?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          industry_sector?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          journey_completed_at?: string | null
          journey_current_step?: number | null
          journey_type?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
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
      company_agent_configurations: {
        Row: {
          agent_id: string
          company_id: string
          configuration: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          last_execution_at: string | null
          last_execution_result: Json | null
          last_execution_status: string | null
          next_execution_at: string | null
          schedule_config: Json | null
          total_executions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          company_id: string
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          last_execution_at?: string | null
          last_execution_result?: Json | null
          last_execution_status?: string | null
          next_execution_at?: string | null
          schedule_config?: Json | null
          total_executions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          company_id?: string
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          last_execution_at?: string | null
          last_execution_result?: Json | null
          last_execution_status?: string | null
          next_execution_at?: string | null
          schedule_config?: Json | null
          total_executions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_agent_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "platform_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_agent_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_agent_preferences: {
        Row: {
          auto_approve_content: boolean | null
          company_id: string
          content_guidelines: string | null
          created_at: string | null
          default_content_length: string | null
          default_creativity_level: number | null
          id: string
          max_daily_executions: number | null
          notification_preferences: Json | null
          preferred_ai_model: string | null
          quality_threshold: number | null
          require_human_review: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_approve_content?: boolean | null
          company_id: string
          content_guidelines?: string | null
          created_at?: string | null
          default_content_length?: string | null
          default_creativity_level?: number | null
          id?: string
          max_daily_executions?: number | null
          notification_preferences?: Json | null
          preferred_ai_model?: string | null
          quality_threshold?: number | null
          require_human_review?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_approve_content?: boolean | null
          company_id?: string
          content_guidelines?: string | null
          created_at?: string | null
          default_content_length?: string | null
          default_creativity_level?: number | null
          id?: string
          max_daily_executions?: number | null
          notification_preferences?: Json | null
          preferred_ai_model?: string | null
          quality_threshold?: number | null
          require_human_review?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_agent_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_agents: {
        Row: {
          agent_id: string
          agent_name: string
          company_id: string
          created_at: string
          id: string
          instructions: string
          is_active: boolean | null
          tools: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          company_id: string
          created_at?: string
          id?: string
          instructions: string
          is_active?: boolean | null
          tools?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          company_id?: string
          created_at?: string
          id?: string
          instructions?: string
          is_active?: boolean | null
          tools?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_audiences: {
        Row: {
          acquisition_cost_estimate: number | null
          active_hours: Json | null
          age_ranges: Json | null
          ai_insights: Json | null
          brand_affinities: Json | null
          challenges: string[] | null
          company_id: string
          company_sizes: Json | null
          confidence_score: number | null
          content_consumption_habits: Json | null
          content_preferences: Json | null
          conversion_potential: number | null
          created_at: string
          custom_attributes: Json | null
          description: string | null
          device_usage: Json | null
          education_levels: Json | null
          engagement_patterns: Json | null
          estimated_size: number | null
          facebook_targeting: Json | null
          gender_split: Json | null
          geographic_locations: Json | null
          goals: string[] | null
          hashtag_usage: Json | null
          id: string
          income_ranges: Json | null
          industries: Json | null
          influencer_following: Json | null
          instagram_targeting: Json | null
          interests: Json | null
          is_active: boolean | null
          job_titles: Json | null
          last_analysis_date: string | null
          lifetime_value_estimate: number | null
          linkedin_targeting: Json | null
          motivations: string[] | null
          name: string
          online_behaviors: Json | null
          pain_points: string[] | null
          platform_preferences: Json | null
          professional_level: Json | null
          purchase_behaviors: Json | null
          relationship_status: Json | null
          tags: string[] | null
          tiktok_targeting: Json | null
          twitter_targeting: Json | null
          updated_at: string
          user_id: string
          youtube_targeting: Json | null
        }
        Insert: {
          acquisition_cost_estimate?: number | null
          active_hours?: Json | null
          age_ranges?: Json | null
          ai_insights?: Json | null
          brand_affinities?: Json | null
          challenges?: string[] | null
          company_id: string
          company_sizes?: Json | null
          confidence_score?: number | null
          content_consumption_habits?: Json | null
          content_preferences?: Json | null
          conversion_potential?: number | null
          created_at?: string
          custom_attributes?: Json | null
          description?: string | null
          device_usage?: Json | null
          education_levels?: Json | null
          engagement_patterns?: Json | null
          estimated_size?: number | null
          facebook_targeting?: Json | null
          gender_split?: Json | null
          geographic_locations?: Json | null
          goals?: string[] | null
          hashtag_usage?: Json | null
          id?: string
          income_ranges?: Json | null
          industries?: Json | null
          influencer_following?: Json | null
          instagram_targeting?: Json | null
          interests?: Json | null
          is_active?: boolean | null
          job_titles?: Json | null
          last_analysis_date?: string | null
          lifetime_value_estimate?: number | null
          linkedin_targeting?: Json | null
          motivations?: string[] | null
          name: string
          online_behaviors?: Json | null
          pain_points?: string[] | null
          platform_preferences?: Json | null
          professional_level?: Json | null
          purchase_behaviors?: Json | null
          relationship_status?: Json | null
          tags?: string[] | null
          tiktok_targeting?: Json | null
          twitter_targeting?: Json | null
          updated_at?: string
          user_id: string
          youtube_targeting?: Json | null
        }
        Update: {
          acquisition_cost_estimate?: number | null
          active_hours?: Json | null
          age_ranges?: Json | null
          ai_insights?: Json | null
          brand_affinities?: Json | null
          challenges?: string[] | null
          company_id?: string
          company_sizes?: Json | null
          confidence_score?: number | null
          content_consumption_habits?: Json | null
          content_preferences?: Json | null
          conversion_potential?: number | null
          created_at?: string
          custom_attributes?: Json | null
          description?: string | null
          device_usage?: Json | null
          education_levels?: Json | null
          engagement_patterns?: Json | null
          estimated_size?: number | null
          facebook_targeting?: Json | null
          gender_split?: Json | null
          geographic_locations?: Json | null
          goals?: string[] | null
          hashtag_usage?: Json | null
          id?: string
          income_ranges?: Json | null
          industries?: Json | null
          influencer_following?: Json | null
          instagram_targeting?: Json | null
          interests?: Json | null
          is_active?: boolean | null
          job_titles?: Json | null
          last_analysis_date?: string | null
          lifetime_value_estimate?: number | null
          linkedin_targeting?: Json | null
          motivations?: string[] | null
          name?: string
          online_behaviors?: Json | null
          pain_points?: string[] | null
          platform_preferences?: Json | null
          professional_level?: Json | null
          purchase_behaviors?: Json | null
          relationship_status?: Json | null
          tags?: string[] | null
          tiktok_targeting?: Json | null
          twitter_targeting?: Json | null
          updated_at?: string
          user_id?: string
          youtube_targeting?: Json | null
        }
        Relationships: []
      }
      company_autopilot_config: {
        Row: {
          active_hours: Json | null
          allowed_actions: string[]
          autopilot_enabled: boolean
          brand_guardrails: Json | null
          company_id: string
          created_at: string
          execution_frequency: string
          id: string
          last_execution_at: string | null
          max_credits_per_cycle: number
          max_posts_per_day: number
          next_execution_at: string | null
          require_human_approval: boolean
          total_cycles_run: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_hours?: Json | null
          allowed_actions?: string[]
          autopilot_enabled?: boolean
          brand_guardrails?: Json | null
          company_id: string
          created_at?: string
          execution_frequency?: string
          id?: string
          last_execution_at?: string | null
          max_credits_per_cycle?: number
          max_posts_per_day?: number
          next_execution_at?: string | null
          require_human_approval?: boolean
          total_cycles_run?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_hours?: Json | null
          allowed_actions?: string[]
          autopilot_enabled?: boolean
          brand_guardrails?: Json | null
          company_id?: string
          created_at?: string
          execution_frequency?: string
          id?: string
          last_execution_at?: string | null
          max_credits_per_cycle?: number
          max_posts_per_day?: number
          next_execution_at?: string | null
          require_human_approval?: boolean
          total_cycles_run?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_autopilot_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_branding: {
        Row: {
          brand_manual_file_path: string | null
          brand_manual_url: string | null
          brand_voice: Json | null
          color_justifications: Json | null
          company_id: string
          complementary_color_1: string | null
          complementary_color_2: string | null
          created_at: string
          full_brand_data: Json | null
          id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
          visual_identity: string | null
          visual_synthesis: Json | null
        }
        Insert: {
          brand_manual_file_path?: string | null
          brand_manual_url?: string | null
          brand_voice?: Json | null
          color_justifications?: Json | null
          company_id: string
          complementary_color_1?: string | null
          complementary_color_2?: string | null
          created_at?: string
          full_brand_data?: Json | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          visual_identity?: string | null
          visual_synthesis?: Json | null
        }
        Update: {
          brand_manual_file_path?: string | null
          brand_manual_url?: string | null
          brand_voice?: Json | null
          color_justifications?: Json | null
          company_id?: string
          complementary_color_1?: string | null
          complementary_color_2?: string | null
          created_at?: string
          full_brand_data?: Json | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          visual_identity?: string | null
          visual_synthesis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_branding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_communication_settings: {
        Row: {
          approved_slogans: string[] | null
          call_to_action_phrases: string[] | null
          company_id: string
          content_pillars: string[] | null
          created_at: string | null
          emoji_usage: string | null
          forbidden_words: string[] | null
          hashtag_strategy: Json | null
          id: string
          language_formality: string | null
          response_templates: Json | null
          tone_by_platform: Json | null
          topics_to_avoid: string[] | null
          updated_at: string | null
        }
        Insert: {
          approved_slogans?: string[] | null
          call_to_action_phrases?: string[] | null
          company_id: string
          content_pillars?: string[] | null
          created_at?: string | null
          emoji_usage?: string | null
          forbidden_words?: string[] | null
          hashtag_strategy?: Json | null
          id?: string
          language_formality?: string | null
          response_templates?: Json | null
          tone_by_platform?: Json | null
          topics_to_avoid?: string[] | null
          updated_at?: string | null
        }
        Update: {
          approved_slogans?: string[] | null
          call_to_action_phrases?: string[] | null
          company_id?: string
          content_pillars?: string[] | null
          created_at?: string | null
          emoji_usage?: string | null
          forbidden_words?: string[] | null
          hashtag_strategy?: Json | null
          id?: string
          language_formality?: string | null
          response_templates?: Json | null
          tone_by_platform?: Json | null
          topics_to_avoid?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_communication_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_competitors: {
        Row: {
          ai_analysis: Json | null
          company_id: string
          competitor_name: string
          created_at: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_direct_competitor: boolean | null
          last_analyzed_at: string | null
          linkedin_url: string | null
          monitor_campaigns: boolean | null
          monitor_content: boolean | null
          monitor_pricing: boolean | null
          notes: string | null
          priority_level: number | null
          strengths: string[] | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          weaknesses: string[] | null
          website_url: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          company_id: string
          competitor_name: string
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_direct_competitor?: boolean | null
          last_analyzed_at?: string | null
          linkedin_url?: string | null
          monitor_campaigns?: boolean | null
          monitor_content?: boolean | null
          monitor_pricing?: boolean | null
          notes?: string | null
          priority_level?: number | null
          strengths?: string[] | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          weaknesses?: string[] | null
          website_url?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          company_id?: string
          competitor_name?: string
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_direct_competitor?: boolean | null
          last_analyzed_at?: string | null
          linkedin_url?: string | null
          monitor_campaigns?: boolean | null
          monitor_content?: boolean | null
          monitor_pricing?: boolean | null
          notes?: string | null
          priority_level?: number | null
          strengths?: string[] | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          weaknesses?: string[] | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_competitors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_credits: {
        Row: {
          available_credits: number
          company_id: string
          created_at: string
          id: string
          last_recharge_at: string | null
          total_credits_consumed: number
          total_credits_purchased: number
          updated_at: string
        }
        Insert: {
          available_credits?: number
          company_id: string
          created_at?: string
          id?: string
          last_recharge_at?: string | null
          total_credits_consumed?: number
          total_credits_purchased?: number
          updated_at?: string
        }
        Update: {
          available_credits?: number
          company_id?: string
          created_at?: string
          id?: string
          last_recharge_at?: string | null
          total_credits_consumed?: number
          total_credits_purchased?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_credits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      company_department_config: {
        Row: {
          active_hours: Json | null
          allowed_actions: string[]
          auto_unlocked: boolean
          auto_unlocked_at: string | null
          autopilot_enabled: boolean
          company_id: string
          created_at: string
          department: string
          execution_frequency: string
          guardrails: Json | null
          id: string
          last_execution_at: string | null
          maturity_level_required: string
          max_credits_per_cycle: number
          next_execution_at: string | null
          require_human_approval: boolean
          total_cycles_run: number
          updated_at: string
        }
        Insert: {
          active_hours?: Json | null
          allowed_actions?: string[]
          auto_unlocked?: boolean
          auto_unlocked_at?: string | null
          autopilot_enabled?: boolean
          company_id: string
          created_at?: string
          department: string
          execution_frequency?: string
          guardrails?: Json | null
          id?: string
          last_execution_at?: string | null
          maturity_level_required?: string
          max_credits_per_cycle?: number
          next_execution_at?: string | null
          require_human_approval?: boolean
          total_cycles_run?: number
          updated_at?: string
        }
        Update: {
          active_hours?: Json | null
          allowed_actions?: string[]
          auto_unlocked?: boolean
          auto_unlocked_at?: string | null
          autopilot_enabled?: boolean
          company_id?: string
          created_at?: string
          department?: string
          execution_frequency?: string
          guardrails?: Json | null
          id?: string
          last_execution_at?: string | null
          maturity_level_required?: string
          max_credits_per_cycle?: number
          next_execution_at?: string | null
          require_human_approval?: boolean
          total_cycles_run?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_department_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_digital_presence: {
        Row: {
          action_plan: Json | null
          analyzed_social_links: Json | null
          company_id: string
          competitive_positioning: string | null
          created_at: string
          digital_footprint_summary: string | null
          executive_diagnosis: Json | null
          id: string
          key_risks: Json | null
          source_url: string | null
          updated_at: string
          what_is_missing: Json | null
          what_is_working: Json | null
        }
        Insert: {
          action_plan?: Json | null
          analyzed_social_links?: Json | null
          company_id: string
          competitive_positioning?: string | null
          created_at?: string
          digital_footprint_summary?: string | null
          executive_diagnosis?: Json | null
          id?: string
          key_risks?: Json | null
          source_url?: string | null
          updated_at?: string
          what_is_missing?: Json | null
          what_is_working?: Json | null
        }
        Update: {
          action_plan?: Json | null
          analyzed_social_links?: Json | null
          company_id?: string
          competitive_positioning?: string | null
          created_at?: string
          digital_footprint_summary?: string | null
          executive_diagnosis?: Json | null
          id?: string
          key_risks?: Json | null
          source_url?: string | null
          updated_at?: string
          what_is_missing?: Json | null
          what_is_working?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_digital_presence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_email_config: {
        Row: {
          billing_email: string | null
          company_id: string
          created_at: string
          from_email: string | null
          from_name: string | null
          general_email: string | null
          id: string
          is_active: boolean | null
          marketing_email: string | null
          notifications_email: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_user: string | null
          support_email: string | null
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          company_id: string
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          general_email?: string | null
          id?: string
          is_active?: boolean | null
          marketing_email?: string | null
          notifications_email?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_user?: string | null
          support_email?: string | null
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          company_id?: string
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          general_email?: string | null
          id?: string
          is_active?: boolean | null
          marketing_email?: string | null
          notifications_email?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_user?: string | null
          support_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_email_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_enabled_agents: {
        Row: {
          agent_id: string | null
          company_id: string | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
        }
        Insert: {
          agent_id?: string | null
          company_id?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
        }
        Update: {
          agent_id?: string | null
          company_id?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_enabled_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "platform_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_enabled_agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      company_inbound_email_config: {
        Row: {
          auto_categorize: boolean | null
          billing_agent_processing: boolean | null
          billing_email: string | null
          billing_forwarding_enabled: boolean | null
          company_id: string
          created_at: string
          general_agent_processing: boolean | null
          general_email: string | null
          general_forwarding_enabled: boolean | null
          id: string
          is_active: boolean | null
          marketing_agent_processing: boolean | null
          marketing_email: string | null
          marketing_forwarding_enabled: boolean | null
          notifications_agent_processing: boolean | null
          notifications_email: string | null
          notifications_forwarding_enabled: boolean | null
          retention_days: number | null
          sendgrid_inbound_enabled: boolean | null
          sendgrid_parse_domain: string | null
          sendgrid_webhook_secret: string | null
          support_agent_processing: boolean | null
          support_email: string | null
          support_forwarding_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          auto_categorize?: boolean | null
          billing_agent_processing?: boolean | null
          billing_email?: string | null
          billing_forwarding_enabled?: boolean | null
          company_id: string
          created_at?: string
          general_agent_processing?: boolean | null
          general_email?: string | null
          general_forwarding_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          marketing_agent_processing?: boolean | null
          marketing_email?: string | null
          marketing_forwarding_enabled?: boolean | null
          notifications_agent_processing?: boolean | null
          notifications_email?: string | null
          notifications_forwarding_enabled?: boolean | null
          retention_days?: number | null
          sendgrid_inbound_enabled?: boolean | null
          sendgrid_parse_domain?: string | null
          sendgrid_webhook_secret?: string | null
          support_agent_processing?: boolean | null
          support_email?: string | null
          support_forwarding_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_categorize?: boolean | null
          billing_agent_processing?: boolean | null
          billing_email?: string | null
          billing_forwarding_enabled?: boolean | null
          company_id?: string
          created_at?: string
          general_agent_processing?: boolean | null
          general_email?: string | null
          general_forwarding_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          marketing_agent_processing?: boolean | null
          marketing_email?: string | null
          marketing_forwarding_enabled?: boolean | null
          notifications_agent_processing?: boolean | null
          notifications_email?: string | null
          notifications_forwarding_enabled?: boolean | null
          retention_days?: number | null
          sendgrid_inbound_enabled?: boolean | null
          sendgrid_parse_domain?: string | null
          sendgrid_webhook_secret?: string | null
          support_agent_processing?: boolean | null
          support_email?: string | null
          support_forwarding_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_inbound_email_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_inbound_emails: {
        Row: {
          agent_actions_taken: Json | null
          agent_analysis: Json | null
          agent_id: string | null
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          category: string | null
          company_id: string
          created_at: string
          from_email: string
          from_name: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          mailbox_type: string
          notes: string | null
          priority: string | null
          processed_at: string | null
          processing_status: string | null
          raw_headers: Json | null
          received_at: string
          sendgrid_event_id: string | null
          subject: string | null
          tags: string[] | null
          to_email: string
          updated_at: string
        }
        Insert: {
          agent_actions_taken?: Json | null
          agent_analysis?: Json | null
          agent_id?: string | null
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          from_email: string
          from_name?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          mailbox_type: string
          notes?: string | null
          priority?: string | null
          processed_at?: string | null
          processing_status?: string | null
          raw_headers?: Json | null
          received_at?: string
          sendgrid_event_id?: string | null
          subject?: string | null
          tags?: string[] | null
          to_email: string
          updated_at?: string
        }
        Update: {
          agent_actions_taken?: Json | null
          agent_analysis?: Json | null
          agent_id?: string | null
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          from_email?: string
          from_name?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          mailbox_type?: string
          notes?: string | null
          priority?: string | null
          processed_at?: string | null
          processing_status?: string | null
          raw_headers?: Json | null
          received_at?: string
          sendgrid_event_id?: string | null
          subject?: string | null
          tags?: string[] | null
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_inbound_emails_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "platform_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_inbound_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          inviter_id: string
          role: string
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          inviter_id: string
          role?: string
          status?: string
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_marketing_goals: {
        Row: {
          brand_awareness_target: number | null
          campaign_budget_monthly: number | null
          company_id: string
          created_at: string | null
          engagement_rate_target: number | null
          growth_timeline: string | null
          id: string
          kpis: Json | null
          monthly_conversion_target: number | null
          monthly_lead_target: number | null
          primary_goal: string | null
          secondary_goals: string[] | null
          target_audience_size: number | null
          updated_at: string | null
        }
        Insert: {
          brand_awareness_target?: number | null
          campaign_budget_monthly?: number | null
          company_id: string
          created_at?: string | null
          engagement_rate_target?: number | null
          growth_timeline?: string | null
          id?: string
          kpis?: Json | null
          monthly_conversion_target?: number | null
          monthly_lead_target?: number | null
          primary_goal?: string | null
          secondary_goals?: string[] | null
          target_audience_size?: number | null
          updated_at?: string | null
        }
        Update: {
          brand_awareness_target?: number | null
          campaign_budget_monthly?: number | null
          company_id?: string
          created_at?: string | null
          engagement_rate_target?: number | null
          growth_timeline?: string | null
          id?: string
          kpis?: Json | null
          monthly_conversion_target?: number | null
          monthly_lead_target?: number | null
          primary_goal?: string | null
          secondary_goals?: string[] | null
          target_audience_size?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_marketing_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      company_objective_progress: {
        Row: {
          company_id: string
          created_at: string
          id: string
          last_calculated_at: string | null
          metrics_snapshot: Json | null
          notes: string | null
          objective_id: string | null
          progress_percentage: number | null
          trend: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          metrics_snapshot?: Json | null
          notes?: string | null
          objective_id?: string | null
          progress_percentage?: number | null
          trend?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          metrics_snapshot?: Json | null
          notes?: string | null
          objective_id?: string | null
          progress_percentage?: number | null
          trend?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_objective_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_objective_progress_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "company_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      company_objectives: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          objective_type: string
          priority: number | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          objective_type: string
          priority?: number | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          objective_type?: string
          priority?: number | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_objectives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_parameters: {
        Row: {
          category: string
          company_id: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_current: boolean | null
          parameter_key: string
          parameter_value: Json
          source_agent_code: string | null
          source_execution_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_current?: boolean | null
          parameter_key: string
          parameter_value: Json
          source_agent_code?: string | null
          source_execution_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_current?: boolean | null
          parameter_key?: string
          parameter_value?: Json
          source_agent_code?: string | null
          source_execution_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_parameters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_parameters_source_execution_id_fkey"
            columns: ["source_execution_id"]
            isOneToOne: false
            referencedRelation: "agent_usage_log"
            referencedColumns: ["id"]
          },
        ]
      }
      company_platform_settings: {
        Row: {
          analytics_tracking: boolean | null
          auto_publish: boolean | null
          character_limit_override: number | null
          company_id: string
          created_at: string | null
          custom_settings: Json | null
          default_visibility: string | null
          hashtag_limit: number | null
          id: string
          is_active: boolean | null
          max_posts_per_day: number | null
          platform: string
          preferred_content_types: string[] | null
          require_approval: boolean | null
          scheduling_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          analytics_tracking?: boolean | null
          auto_publish?: boolean | null
          character_limit_override?: number | null
          company_id: string
          created_at?: string | null
          custom_settings?: Json | null
          default_visibility?: string | null
          hashtag_limit?: number | null
          id?: string
          is_active?: boolean | null
          max_posts_per_day?: number | null
          platform: string
          preferred_content_types?: string[] | null
          require_approval?: boolean | null
          scheduling_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          analytics_tracking?: boolean | null
          auto_publish?: boolean | null
          character_limit_override?: number | null
          company_id?: string
          created_at?: string | null
          custom_settings?: Json | null
          default_visibility?: string | null
          hashtag_limit?: number | null
          id?: string
          is_active?: boolean | null
          max_posts_per_day?: number | null
          platform?: string
          preferred_content_types?: string[] | null
          require_approval?: boolean | null
          scheduling_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_platform_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_play_to_win: {
        Row: {
          aspiration_metrics: Json | null
          aspiration_timeline: string | null
          business_model: string | null
          capability_roadmap: Json | null
          channels_focus: Json | null
          company_id: string
          competitive_advantage: string | null
          competitive_category: string | null
          completion_percentage: number | null
          created_at: string | null
          current_situation: string | null
          current_step: number | null
          desired_audience_positioning: string | null
          differentiation_factors: Json | null
          future_positioning: string | null
          generated_with_ai: boolean | null
          geographic_focus: Json | null
          governance_model: Json | null
          id: string
          key_assets: string | null
          kpi_definitions: Json | null
          last_review_date: string | null
          moat_type: string | null
          next_review_date: string | null
          okrs: Json | null
          required_capabilities: Json | null
          review_cadence: string | null
          status: string | null
          target_markets: Json | null
          target_segments: Json | null
          updated_at: string | null
          value_proposition_canvas: Json | null
          winning_aspiration: string | null
        }
        Insert: {
          aspiration_metrics?: Json | null
          aspiration_timeline?: string | null
          business_model?: string | null
          capability_roadmap?: Json | null
          channels_focus?: Json | null
          company_id: string
          competitive_advantage?: string | null
          competitive_category?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_situation?: string | null
          current_step?: number | null
          desired_audience_positioning?: string | null
          differentiation_factors?: Json | null
          future_positioning?: string | null
          generated_with_ai?: boolean | null
          geographic_focus?: Json | null
          governance_model?: Json | null
          id?: string
          key_assets?: string | null
          kpi_definitions?: Json | null
          last_review_date?: string | null
          moat_type?: string | null
          next_review_date?: string | null
          okrs?: Json | null
          required_capabilities?: Json | null
          review_cadence?: string | null
          status?: string | null
          target_markets?: Json | null
          target_segments?: Json | null
          updated_at?: string | null
          value_proposition_canvas?: Json | null
          winning_aspiration?: string | null
        }
        Update: {
          aspiration_metrics?: Json | null
          aspiration_timeline?: string | null
          business_model?: string | null
          capability_roadmap?: Json | null
          channels_focus?: Json | null
          company_id?: string
          competitive_advantage?: string | null
          competitive_category?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_situation?: string | null
          current_step?: number | null
          desired_audience_positioning?: string | null
          differentiation_factors?: Json | null
          future_positioning?: string | null
          generated_with_ai?: boolean | null
          geographic_focus?: Json | null
          governance_model?: Json | null
          id?: string
          key_assets?: string | null
          kpi_definitions?: Json | null
          last_review_date?: string | null
          moat_type?: string | null
          next_review_date?: string | null
          okrs?: Json | null
          required_capabilities?: Json | null
          review_cadence?: string | null
          status?: string | null
          target_markets?: Json | null
          target_segments?: Json | null
          updated_at?: string | null
          value_proposition_canvas?: Json | null
          winning_aspiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_play_to_win_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_products: {
        Row: {
          benefits: string[] | null
          category: string | null
          company_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          keywords: string[] | null
          landing_url: string | null
          name: string
          price: number | null
          target_audience: string | null
          updated_at: string | null
          value_proposition: string | null
        }
        Insert: {
          benefits?: string[] | null
          category?: string | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string[] | null
          landing_url?: string | null
          name: string
          price?: number | null
          target_audience?: string | null
          updated_at?: string | null
          value_proposition?: string | null
        }
        Update: {
          benefits?: string[] | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string[] | null
          landing_url?: string | null
          name?: string
          price?: number | null
          target_audience?: string | null
          updated_at?: string | null
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ptw_reviews: {
        Row: {
          action_items: Json | null
          adjustments: Json | null
          challenges: string[] | null
          company_id: string
          created_at: string | null
          decisions_made: Json | null
          id: string
          learnings: string[] | null
          metrics_snapshot: Json | null
          okr_progress_snapshot: Json | null
          ptw_id: string
          review_date: string
          review_type: string
          reviewed_by: string | null
          wins: string[] | null
        }
        Insert: {
          action_items?: Json | null
          adjustments?: Json | null
          challenges?: string[] | null
          company_id: string
          created_at?: string | null
          decisions_made?: Json | null
          id?: string
          learnings?: string[] | null
          metrics_snapshot?: Json | null
          okr_progress_snapshot?: Json | null
          ptw_id: string
          review_date: string
          review_type: string
          reviewed_by?: string | null
          wins?: string[] | null
        }
        Update: {
          action_items?: Json | null
          adjustments?: Json | null
          challenges?: string[] | null
          company_id?: string
          created_at?: string | null
          decisions_made?: Json | null
          id?: string
          learnings?: string[] | null
          metrics_snapshot?: Json | null
          okr_progress_snapshot?: Json | null
          ptw_id?: string
          review_date?: string
          review_type?: string
          reviewed_by?: string | null
          wins?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "company_ptw_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ptw_reviews_ptw_id_fkey"
            columns: ["ptw_id"]
            isOneToOne: false
            referencedRelation: "company_play_to_win"
            referencedColumns: ["id"]
          },
        ]
      }
      company_schedule_config: {
        Row: {
          business_hours_end: string | null
          business_hours_start: string | null
          company_id: string
          content_frequency: Json | null
          created_at: string | null
          id: string
          preferred_posting_times: Json | null
          timezone: string | null
          updated_at: string | null
          working_days: number[] | null
        }
        Insert: {
          business_hours_end?: string | null
          business_hours_start?: string | null
          company_id: string
          content_frequency?: Json | null
          created_at?: string | null
          id?: string
          preferred_posting_times?: Json | null
          timezone?: string | null
          updated_at?: string | null
          working_days?: number[] | null
        }
        Update: {
          business_hours_end?: string | null
          business_hours_start?: string | null
          company_id?: string
          content_frequency?: Json | null
          created_at?: string | null
          id?: string
          preferred_posting_times?: Json | null
          timezone?: string | null
          updated_at?: string | null
          working_days?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "company_schedule_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_score_history: {
        Row: {
          company_id: string
          consistency_bonus: number
          execution_score: number
          foundation_score: number
          gaps_score: number
          id: string
          presence_score: number
          recorded_at: string
          sdi_score: number
          stagnation_penalty: number
          weeks_below_threshold: Json | null
          weight_adjustments: Json | null
        }
        Insert: {
          company_id: string
          consistency_bonus?: number
          execution_score?: number
          foundation_score?: number
          gaps_score?: number
          id?: string
          presence_score?: number
          recorded_at?: string
          sdi_score: number
          stagnation_penalty?: number
          weeks_below_threshold?: Json | null
          weight_adjustments?: Json | null
        }
        Update: {
          company_id?: string
          consistency_bonus?: number
          execution_score?: number
          foundation_score?: number
          gaps_score?: number
          id?: string
          presence_score?: number
          recorded_at?: string
          sdi_score?: number
          stagnation_penalty?: number
          weeks_below_threshold?: Json | null
          weight_adjustments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_score_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_strategic_gaps: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string
          detected_at: string
          escalated_at: string | null
          gap_key: string
          id: string
          impact_weight: number
          linked_priority_id: string | null
          resolution_evidence: string | null
          resolution_impact_score: number | null
          resolved_at: string | null
          resolved_by_action: string | null
          severity_weight: number | null
          source: string
          title: string
          updated_at: string
          urgency: string
          variable: string
          weeks_active: number | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description?: string
          detected_at?: string
          escalated_at?: string | null
          gap_key: string
          id?: string
          impact_weight?: number
          linked_priority_id?: string | null
          resolution_evidence?: string | null
          resolution_impact_score?: number | null
          resolved_at?: string | null
          resolved_by_action?: string | null
          severity_weight?: number | null
          source?: string
          title: string
          updated_at?: string
          urgency?: string
          variable?: string
          weeks_active?: number | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string
          detected_at?: string
          escalated_at?: string | null
          gap_key?: string
          id?: string
          impact_weight?: number
          linked_priority_id?: string | null
          resolution_evidence?: string | null
          resolution_impact_score?: number | null
          resolved_at?: string | null
          resolved_by_action?: string | null
          severity_weight?: number | null
          source?: string
          title?: string
          updated_at?: string
          urgency?: string
          variable?: string
          weeks_active?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_strategic_gaps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_strategic_memory: {
        Row: {
          action_description: string | null
          action_key: string
          action_type: string
          behavioral_pattern: string | null
          business_model_at_time: string | null
          company_id: string
          context_snapshot: Json | null
          created_at: string
          decision_id: string | null
          dimension_impacted: string | null
          gap_id: string | null
          id: string
          impact_magnitude: string | null
          maturity_stage_at_time: string | null
          sdi_after: number | null
          sdi_before: number | null
          sdi_delta: number | null
        }
        Insert: {
          action_description?: string | null
          action_key: string
          action_type: string
          behavioral_pattern?: string | null
          business_model_at_time?: string | null
          company_id: string
          context_snapshot?: Json | null
          created_at?: string
          decision_id?: string | null
          dimension_impacted?: string | null
          gap_id?: string | null
          id?: string
          impact_magnitude?: string | null
          maturity_stage_at_time?: string | null
          sdi_after?: number | null
          sdi_before?: number | null
          sdi_delta?: number | null
        }
        Update: {
          action_description?: string | null
          action_key?: string
          action_type?: string
          behavioral_pattern?: string | null
          business_model_at_time?: string | null
          company_id?: string
          context_snapshot?: Json | null
          created_at?: string
          decision_id?: string | null
          dimension_impacted?: string | null
          gap_id?: string | null
          id?: string
          impact_magnitude?: string | null
          maturity_stage_at_time?: string | null
          sdi_after?: number | null
          sdi_before?: number | null
          sdi_delta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_strategic_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_strategic_memory_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "company_weekly_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_strategic_memory_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "company_strategic_gaps"
            referencedColumns: ["id"]
          },
        ]
      }
      company_strategic_state_snapshots: {
        Row: {
          active_gaps: Json
          business_model: string | null
          capability_index: number
          company_id: string
          created_at: string
          id: string
          maturity_stage: string
          resolved_gaps: Json
          score_breakdown: Json
          sdi_score: number
          strategic_dna_snapshot: Json
          structural_risks: Json
          trigger_reason: string
          triggered_by: string | null
          version: number
        }
        Insert: {
          active_gaps?: Json
          business_model?: string | null
          capability_index?: number
          company_id: string
          created_at?: string
          id?: string
          maturity_stage?: string
          resolved_gaps?: Json
          score_breakdown?: Json
          sdi_score?: number
          strategic_dna_snapshot?: Json
          structural_risks?: Json
          trigger_reason?: string
          triggered_by?: string | null
          version?: number
        }
        Update: {
          active_gaps?: Json
          business_model?: string | null
          capability_index?: number
          company_id?: string
          created_at?: string
          id?: string
          maturity_stage?: string
          resolved_gaps?: Json
          score_breakdown?: Json
          sdi_score?: number
          strategic_dna_snapshot?: Json
          structural_risks?: Json
          trigger_reason?: string
          triggered_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_strategic_state_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_strategy: {
        Row: {
          company_id: string
          created_at: string
          generated_with_ai: boolean | null
          id: string
          mision: string | null
          propuesta_valor: string | null
          updated_at: string
          vision: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          generated_with_ai?: boolean | null
          id?: string
          mision?: string | null
          propuesta_valor?: string | null
          updated_at?: string
          vision?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          generated_with_ai?: boolean | null
          id?: string
          mision?: string | null
          propuesta_valor?: string | null
          updated_at?: string
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_strategy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_weekly_decisions: {
        Row: {
          action_view: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          decision_key: string
          id: string
          reason: string
          source: string
          title: string
          variable: string
          week_start: string
        }
        Insert: {
          action_view?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          decision_key: string
          id?: string
          reason?: string
          source?: string
          title: string
          variable?: string
          week_start: string
        }
        Update: {
          action_view?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          decision_key?: string
          id?: string
          reason?: string
          source?: string
          title?: string
          variable?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_weekly_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      completed_content_ideas: {
        Row: {
          completed_at: string
          content_idea_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          content_idea_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          content_idea_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      content_approvals: {
        Row: {
          company_id: string
          content_data: Json | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewer_comments: string | null
          reviewer_id: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          content_data?: Json | null
          content_id: string
          content_type?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewer_comments?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          content_data?: Json | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewer_comments?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar_items: {
        Row: {
          content_details: Json
          created_at: string
          final_copy: string | null
          id: string
          publish_date: string
          publish_time: string | null
          social_network: string
          strategy_id: string
        }
        Insert: {
          content_details?: Json
          created_at?: string
          final_copy?: string | null
          id?: string
          publish_date: string
          publish_time?: string | null
          social_network: string
          strategy_id: string
        }
        Update: {
          content_details?: Json
          created_at?: string
          final_copy?: string | null
          id?: string
          publish_date?: string
          publish_time?: string | null
          social_network?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_items_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "marketing_strategies"
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
      content_insights: {
        Row: {
          completed_at: string | null
          content: string | null
          created_at: string
          dismissed_at: string | null
          dismissed_reason: string | null
          format: string | null
          generated_at: string
          has_generated_content: boolean | null
          hashtags: string[] | null
          id: string
          insight_type: string
          metadata: Json | null
          platform: string | null
          source: string | null
          source_analysis_id: string | null
          status: string
          strategy: string | null
          timing: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content?: string | null
          created_at?: string
          dismissed_at?: string | null
          dismissed_reason?: string | null
          format?: string | null
          generated_at?: string
          has_generated_content?: boolean | null
          hashtags?: string[] | null
          id?: string
          insight_type: string
          metadata?: Json | null
          platform?: string | null
          source?: string | null
          source_analysis_id?: string | null
          status?: string
          strategy?: string | null
          timing?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content?: string | null
          created_at?: string
          dismissed_at?: string | null
          dismissed_reason?: string | null
          format?: string | null
          generated_at?: string
          has_generated_content?: boolean | null
          hashtags?: string[] | null
          id?: string
          insight_type?: string
          metadata?: Json | null
          platform?: string | null
          source?: string | null
          source_analysis_id?: string | null
          status?: string
          strategy?: string | null
          timing?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_library: {
        Row: {
          content_text: string | null
          content_type: string | null
          created_at: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          is_favorite: boolean | null
          is_template: boolean | null
          metrics: Json | null
          notes: string | null
          platform: string
          post_id: string | null
          post_url: string | null
          published_at: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          content_text?: string | null
          content_type?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          is_template?: boolean | null
          metrics?: Json | null
          notes?: string | null
          platform: string
          post_id?: string | null
          post_url?: string | null
          published_at?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          content_text?: string | null
          content_type?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          is_template?: boolean | null
          metrics?: Json | null
          notes?: string | null
          platform?: string
          post_id?: string | null
          post_url?: string | null
          published_at?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
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
      creatify_jobs: {
        Row: {
          calendar_item_id: string | null
          campaign_id: string | null
          company_id: string
          created_at: string
          creatify_job_id: string | null
          credits_used: number | null
          id: string
          input_params: Json | null
          job_type: string
          output_data: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_item_id?: string | null
          campaign_id?: string | null
          company_id: string
          created_at?: string
          creatify_job_id?: string | null
          credits_used?: number | null
          id?: string
          input_params?: Json | null
          job_type: string
          output_data?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_item_id?: string | null
          campaign_id?: string | null
          company_id?: string
          created_at?: string
          creatify_job_id?: string | null
          credits_used?: number | null
          id?: string
          input_params?: Json | null
          job_type?: string
          output_data?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creatify_jobs_calendar_item_id_fkey"
            columns: ["calendar_item_id"]
            isOneToOne: false
            referencedRelation: "content_calendar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creatify_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creatify_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_accounts: {
        Row: {
          account_name: string
          account_tier: string | null
          account_type: string | null
          address: string | null
          ai_enrichment: Json | null
          annual_revenue: number | null
          billing_currency: string | null
          city: string | null
          company_id: string
          company_size: string | null
          country: string | null
          created_at: string | null
          custom_fields: Json | null
          employee_count: number | null
          id: string
          industry: string | null
          is_active: boolean | null
          legal_name: string | null
          lifetime_value: number | null
          linkedin_url: string | null
          owner_user_id: string | null
          primary_contact_id: string | null
          tags: string[] | null
          tax_id: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_name: string
          account_tier?: string | null
          account_type?: string | null
          address?: string | null
          ai_enrichment?: Json | null
          annual_revenue?: number | null
          billing_currency?: string | null
          city?: string | null
          company_id: string
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          legal_name?: string | null
          lifetime_value?: number | null
          linkedin_url?: string | null
          owner_user_id?: string | null
          primary_contact_id?: string | null
          tags?: string[] | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_name?: string
          account_tier?: string | null
          account_type?: string | null
          address?: string | null
          ai_enrichment?: Json | null
          annual_revenue?: number | null
          billing_currency?: string | null
          city?: string | null
          company_id?: string
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          legal_name?: string | null
          lifetime_value?: number | null
          linkedin_url?: string | null
          owner_user_id?: string | null
          primary_contact_id?: string | null
          tags?: string[] | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_accounts_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          account_id: string | null
          activity_date: string | null
          activity_type: string
          ai_generated: boolean | null
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          metadata: Json | null
          related_email_id: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          activity_date?: string | null
          activity_type: string
          ai_generated?: boolean | null
          company_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          metadata?: Json | null
          related_email_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          activity_date?: string | null
          activity_type?: string
          ai_generated?: boolean | null
          company_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          metadata?: Json | null
          related_email_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_related_email_id_fkey"
            columns: ["related_email_id"]
            isOneToOne: false
            referencedRelation: "company_inbound_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          account_id: string | null
          acquisition_cost: number | null
          ai_enrichment: Json | null
          ai_next_best_action: string | null
          ai_tags: string[] | null
          avatar_url: string | null
          birthdate: string | null
          business_type: string
          city: string | null
          company_id: string
          contact_type: string | null
          country: string | null
          created_at: string | null
          custom_fields: Json | null
          department: string | null
          email: string | null
          engagement_score: number | null
          first_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          is_subscribed_email: boolean | null
          is_subscribed_sms: boolean | null
          job_title: string | null
          last_activity_at: string | null
          last_ai_analysis: string | null
          last_name: string | null
          lifecycle_stage: string | null
          lifetime_value: number | null
          linkedin_url: string | null
          location: string | null
          owner_user_id: string | null
          phone: string | null
          source: string | null
          source_details: Json | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          acquisition_cost?: number | null
          ai_enrichment?: Json | null
          ai_next_best_action?: string | null
          ai_tags?: string[] | null
          avatar_url?: string | null
          birthdate?: string | null
          business_type?: string
          city?: string | null
          company_id: string
          contact_type?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          department?: string | null
          email?: string | null
          engagement_score?: number | null
          first_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_subscribed_email?: boolean | null
          is_subscribed_sms?: boolean | null
          job_title?: string | null
          last_activity_at?: string | null
          last_ai_analysis?: string | null
          last_name?: string | null
          lifecycle_stage?: string | null
          lifetime_value?: number | null
          linkedin_url?: string | null
          location?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          source_details?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          acquisition_cost?: number | null
          ai_enrichment?: Json | null
          ai_next_best_action?: string | null
          ai_tags?: string[] | null
          avatar_url?: string | null
          birthdate?: string | null
          business_type?: string
          city?: string | null
          company_id?: string
          contact_type?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          department?: string | null
          email?: string | null
          engagement_score?: number | null
          first_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_subscribed_email?: boolean | null
          is_subscribed_sms?: boolean | null
          job_title?: string | null
          last_activity_at?: string | null
          last_ai_analysis?: string | null
          last_name?: string | null
          lifecycle_stage?: string | null
          lifetime_value?: number | null
          linkedin_url?: string | null
          location?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          source_details?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_custom_fields: {
        Row: {
          applies_to: string
          company_id: string
          created_at: string | null
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          options: Json | null
          position: number | null
          updated_at: string | null
        }
        Insert: {
          applies_to: string
          company_id: string
          created_at?: string | null
          field_label: string
          field_name: string
          field_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          applies_to?: string
          company_id?: string
          created_at?: string | null
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_custom_fields_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          account_id: string | null
          actual_close_date: string | null
          ai_predictions: Json | null
          amount: number | null
          company_id: string
          contact_id: string | null
          created_at: string | null
          currency: string | null
          custom_fields: Json | null
          deal_name: string
          description: string | null
          expected_close_date: string | null
          id: string
          loss_reason: string | null
          owner_user_id: string | null
          pipeline_id: string
          probability: number | null
          products: Json | null
          stage_id: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
          weighted_amount: number | null
        }
        Insert: {
          account_id?: string | null
          actual_close_date?: string | null
          ai_predictions?: Json | null
          amount?: number | null
          company_id: string
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          deal_name: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          owner_user_id?: string | null
          pipeline_id: string
          probability?: number | null
          products?: Json | null
          stage_id: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          weighted_amount?: number | null
        }
        Update: {
          account_id?: string | null
          actual_close_date?: string | null
          ai_predictions?: Json | null
          amount?: number | null
          company_id?: string
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          deal_name?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          owner_user_id?: string | null
          pipeline_id?: string
          probability?: number | null
          products?: Json | null
          stage_id?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          weighted_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          auto_actions: Json | null
          color: string | null
          created_at: string | null
          default_probability: number | null
          description: string | null
          id: string
          name: string
          pipeline_id: string
          position: number
          stage_type: string
          updated_at: string | null
        }
        Insert: {
          auto_actions?: Json | null
          color?: string | null
          created_at?: string | null
          default_probability?: number | null
          description?: string | null
          id?: string
          name: string
          pipeline_id: string
          position?: number
          stage_type?: string
          updated_at?: string | null
        }
        Update: {
          auto_actions?: Json | null
          color?: string | null
          created_at?: string | null
          default_probability?: number | null
          description?: string | null
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
          stage_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          company_id: string
          created_at: string | null
          default_currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          pipeline_type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          default_currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          pipeline_type?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          default_currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          pipeline_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          id: string
          name: string
          tag_type: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          name: string
          tag_type: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
          tag_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_audiences: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string | null
          id: string
          name: string
          platform: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description?: string | null
          id?: string
          name: string
          platform?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          name?: string
          platform?: string | null
          updated_at?: string | null
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
      department_execution_log: {
        Row: {
          actions_taken: Json | null
          company_id: string
          context_snapshot: Json | null
          created_at: string
          credits_consumed: number
          cycle_id: string
          decisions_made: Json | null
          department: string
          error_message: string | null
          execution_time_ms: number | null
          guardrail_results: Json | null
          id: string
          phase: string
          status: string
        }
        Insert: {
          actions_taken?: Json | null
          company_id: string
          context_snapshot?: Json | null
          created_at?: string
          credits_consumed?: number
          cycle_id?: string
          decisions_made?: Json | null
          department: string
          error_message?: string | null
          execution_time_ms?: number | null
          guardrail_results?: Json | null
          id?: string
          phase: string
          status?: string
        }
        Update: {
          actions_taken?: Json | null
          company_id?: string
          context_snapshot?: Json | null
          created_at?: string
          credits_consumed?: number
          cycle_id?: string
          decisions_made?: Json | null
          department?: string
          error_message?: string | null
          execution_time_ms?: number | null
          guardrail_results?: Json | null
          id?: string
          phase?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_execution_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          developer_name: string
          github_url: string | null
          id: string
          linkedin_url: string | null
          specialties: string[] | null
          tier: string | null
          total_agents_created: number | null
          total_deployments: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          developer_name: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          specialties?: string[] | null
          tier?: string | null
          total_agents_created?: number | null
          total_deployments?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          developer_name?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          specialties?: string[] | null
          tier?: string | null
          total_agents_created?: number | null
          total_deployments?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          website_url?: string | null
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
        Relationships: []
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
            referencedRelation: "expert_public_profiles"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "expert_public_profiles"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "expert_public_profiles"
            referencedColumns: ["id"]
          },
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
      external_intelligence_cache: {
        Row: {
          company_id: string | null
          data: Json
          expires_at: string
          fetched_at: string
          id: string
          industry_sector: string | null
          is_processed: boolean | null
          query_used: string | null
          region: string | null
          relevance_score: number | null
          source: string
          structured_signals: Json | null
          triggered_actions: Json | null
        }
        Insert: {
          company_id?: string | null
          data?: Json
          expires_at?: string
          fetched_at?: string
          id?: string
          industry_sector?: string | null
          is_processed?: boolean | null
          query_used?: string | null
          region?: string | null
          relevance_score?: number | null
          source: string
          structured_signals?: Json | null
          triggered_actions?: Json | null
        }
        Update: {
          company_id?: string | null
          data?: Json
          expires_at?: string
          fetched_at?: string
          id?: string
          industry_sector?: string | null
          is_processed?: boolean | null
          query_used?: string | null
          region?: string | null
          relevance_score?: number | null
          source?: string
          structured_signals?: Json | null
          triggered_actions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "external_intelligence_cache_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          cid: string | null
          comments_count: number | null
          content: string | null
          created_at: string
          data_id: string | null
          engagement_rate: number | null
          from_owner: boolean | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          index_grade: number | null
          interactions_count: number | null
          is_ad: boolean | null
          is_deleted: boolean | null
          likes_count: number | null
          main_grade: string | null
          mentions: string[] | null
          post_id: string
          post_image_url: string | null
          post_type: string | null
          post_url: string | null
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
          social_post_id: string | null
          text_length: number | null
          time_update: string | null
          updated_at: string
          user_id: string
          video_url: string | null
          video_views_count: number | null
        }
        Insert: {
          cid?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string
          data_id?: string | null
          engagement_rate?: number | null
          from_owner?: boolean | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          index_grade?: number | null
          interactions_count?: number | null
          is_ad?: boolean | null
          is_deleted?: boolean | null
          likes_count?: number | null
          main_grade?: string | null
          mentions?: string[] | null
          post_id: string
          post_image_url?: string | null
          post_type?: string | null
          post_url?: string | null
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
          social_post_id?: string | null
          text_length?: number | null
          time_update?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          video_views_count?: number | null
        }
        Update: {
          cid?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string
          data_id?: string | null
          engagement_rate?: number | null
          from_owner?: boolean | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          index_grade?: number | null
          interactions_count?: number | null
          is_ad?: boolean | null
          is_deleted?: boolean | null
          likes_count?: number | null
          main_grade?: string | null
          mentions?: string[] | null
          post_id?: string
          post_image_url?: string | null
          post_type?: string | null
          post_url?: string | null
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
          social_post_id?: string | null
          text_length?: number | null
          time_update?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          video_views_count?: number | null
        }
        Relationships: []
      }
      flow_connections: {
        Row: {
          condition_config: Json | null
          created_at: string | null
          id: string
          source_handle: string | null
          source_node_id: string
          target_handle: string | null
          target_node_id: string
          template_id: string
        }
        Insert: {
          condition_config?: Json | null
          created_at?: string | null
          id?: string
          source_handle?: string | null
          source_node_id: string
          target_handle?: string | null
          target_node_id: string
          template_id: string
        }
        Update: {
          condition_config?: Json | null
          created_at?: string | null
          id?: string
          source_handle?: string | null
          source_node_id?: string
          target_handle?: string | null
          target_node_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_connections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whitelabel_agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_nodes: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          node_id: string
          node_type: string
          position: Json
          template_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          node_id: string
          node_type: string
          position: Json
          template_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          node_id?: string
          node_type?: string
          position?: Json
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_nodes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whitelabel_agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      followers_location_analysis: {
        Row: {
          analysis_date: string
          avg_age: number | null
          avg_purchasing_power: number | null
          city: string | null
          confidence_score: number | null
          coordinates: unknown
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
          coordinates?: unknown
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
          coordinates?: unknown
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
      generated_assets: {
        Row: {
          asset_type: string
          asset_url: string | null
          calendar_item_id: string
          created_at: string
          creative_assets: Json | null
          id: string
          prompt_used: string | null
        }
        Insert: {
          asset_type: string
          asset_url?: string | null
          calendar_item_id: string
          created_at?: string
          creative_assets?: Json | null
          id?: string
          prompt_used?: string | null
        }
        Update: {
          asset_type?: string
          asset_url?: string | null
          calendar_item_id?: string
          created_at?: string
          creative_assets?: Json | null
          id?: string
          prompt_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_assets_calendar_item_id_fkey"
            columns: ["calendar_item_id"]
            isOneToOne: false
            referencedRelation: "content_calendar_items"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          content_text: string
          content_type: string
          created_at: string
          generation_prompt: string | null
          id: string
          insight_id: string | null
          media_url: string | null
          publication_status: string | null
          published_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_text: string
          content_type?: string
          created_at?: string
          generation_prompt?: string | null
          id?: string
          insight_id?: string | null
          media_url?: string | null
          publication_status?: string | null
          published_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_text?: string
          content_type?: string
          created_at?: string
          generation_prompt?: string | null
          id?: string
          insight_id?: string | null
          media_url?: string | null
          publication_status?: string | null
          published_at?: string | null
          updated_at?: string
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
          cid: string | null
          comment_count: number | null
          created_at: string
          data_id: string | null
          display_url: string | null
          engagement_rate: number | null
          from_owner: boolean | null
          hashtags: string[] | null
          id: string
          impressions: number | null
          index_grade: number | null
          interactions_count: number | null
          is_ad: boolean | null
          is_deleted: boolean | null
          is_video: boolean | null
          like_count: number | null
          main_grade: string | null
          media_type: number | null
          mentions: string[] | null
          owner_full_name: string | null
          owner_profile_pic_url: string | null
          owner_username: string | null
          platform: string
          post_id: string
          post_image_url: string | null
          post_url: string | null
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
          reel_plays: number | null
          saves: number | null
          shortcode: string | null
          social_post_id: string | null
          taken_at_timestamp: number | null
          text_length: number | null
          thumbnail_url: string | null
          time_update: string | null
          updated_at: string
          user_id: string
          video_plays: number | null
          video_url: string | null
          video_view_count: number | null
        }
        Insert: {
          caption?: string | null
          cid?: string | null
          comment_count?: number | null
          created_at?: string
          data_id?: string | null
          display_url?: string | null
          engagement_rate?: number | null
          from_owner?: boolean | null
          hashtags?: string[] | null
          id?: string
          impressions?: number | null
          index_grade?: number | null
          interactions_count?: number | null
          is_ad?: boolean | null
          is_deleted?: boolean | null
          is_video?: boolean | null
          like_count?: number | null
          main_grade?: string | null
          media_type?: number | null
          mentions?: string[] | null
          owner_full_name?: string | null
          owner_profile_pic_url?: string | null
          owner_username?: string | null
          platform?: string
          post_id: string
          post_image_url?: string | null
          post_url?: string | null
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
          reel_plays?: number | null
          saves?: number | null
          shortcode?: string | null
          social_post_id?: string | null
          taken_at_timestamp?: number | null
          text_length?: number | null
          thumbnail_url?: string | null
          time_update?: string | null
          updated_at?: string
          user_id: string
          video_plays?: number | null
          video_url?: string | null
          video_view_count?: number | null
        }
        Update: {
          caption?: string | null
          cid?: string | null
          comment_count?: number | null
          created_at?: string
          data_id?: string | null
          display_url?: string | null
          engagement_rate?: number | null
          from_owner?: boolean | null
          hashtags?: string[] | null
          id?: string
          impressions?: number | null
          index_grade?: number | null
          interactions_count?: number | null
          is_ad?: boolean | null
          is_deleted?: boolean | null
          is_video?: boolean | null
          like_count?: number | null
          main_grade?: string | null
          media_type?: number | null
          mentions?: string[] | null
          owner_full_name?: string | null
          owner_profile_pic_url?: string | null
          owner_username?: string | null
          platform?: string
          post_id?: string
          post_image_url?: string | null
          post_url?: string | null
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
          reel_plays?: number | null
          saves?: number | null
          shortcode?: string | null
          social_post_id?: string | null
          taken_at_timestamp?: number | null
          text_length?: number | null
          thumbnail_url?: string | null
          time_update?: string | null
          updated_at?: string
          user_id?: string
          video_plays?: number | null
          video_url?: string | null
          video_view_count?: number | null
        }
        Relationships: []
      }
      integration_configurations: {
        Row: {
          agent_instance_id: string
          config_data: Json
          created_at: string | null
          credentials: Json | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_sync_at: string | null
          updated_at: string | null
        }
        Insert: {
          agent_instance_id: string
          config_data?: Json
          created_at?: string | null
          credentials?: Json | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_sync_at?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_instance_id?: string
          config_data?: Json
          created_at?: string | null
          credentials?: Json | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      journey_definitions: {
        Row: {
          allow_re_enrollment: boolean | null
          company_id: string
          conversion_rate: number | null
          created_at: string
          created_by: string | null
          description: string | null
          entry_segment_conditions: Json | null
          exit_conditions: Json | null
          goal_conditions: Json | null
          goal_type: string | null
          id: string
          is_template: boolean | null
          max_enrollments_per_contact: number | null
          name: string
          re_enrollment_delay_days: number | null
          status: Database["public"]["Enums"]["journey_status"]
          tags: string[] | null
          template_category: string | null
          total_completed: number | null
          total_enrolled: number | null
          total_goal_reached: number | null
          trigger_conditions: Json | null
          trigger_type: Database["public"]["Enums"]["journey_trigger_type"]
          updated_at: string
        }
        Insert: {
          allow_re_enrollment?: boolean | null
          company_id: string
          conversion_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_segment_conditions?: Json | null
          exit_conditions?: Json | null
          goal_conditions?: Json | null
          goal_type?: string | null
          id?: string
          is_template?: boolean | null
          max_enrollments_per_contact?: number | null
          name: string
          re_enrollment_delay_days?: number | null
          status?: Database["public"]["Enums"]["journey_status"]
          tags?: string[] | null
          template_category?: string | null
          total_completed?: number | null
          total_enrolled?: number | null
          total_goal_reached?: number | null
          trigger_conditions?: Json | null
          trigger_type: Database["public"]["Enums"]["journey_trigger_type"]
          updated_at?: string
        }
        Update: {
          allow_re_enrollment?: boolean | null
          company_id?: string
          conversion_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_segment_conditions?: Json | null
          exit_conditions?: Json | null
          goal_conditions?: Json | null
          goal_type?: string | null
          id?: string
          is_template?: boolean | null
          max_enrollments_per_contact?: number | null
          name?: string
          re_enrollment_delay_days?: number | null
          status?: Database["public"]["Enums"]["journey_status"]
          tags?: string[] | null
          template_category?: string | null
          total_completed?: number | null
          total_enrolled?: number | null
          total_goal_reached?: number | null
          trigger_conditions?: Json | null
          trigger_type?: Database["public"]["Enums"]["journey_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_enrollments: {
        Row: {
          company_id: string
          completed_at: string | null
          contact_id: string
          context: Json | null
          created_at: string
          current_step_id: string | null
          emails_clicked: number | null
          emails_opened: number | null
          emails_sent: number | null
          enrolled_at: string
          enrolled_by: string | null
          enrollment_source: string | null
          exit_reason: string | null
          exited_at: string | null
          goal_reached_at: string | null
          id: string
          journey_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["journey_enrollment_status"]
          steps_completed: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          contact_id: string
          context?: Json | null
          created_at?: string
          current_step_id?: string | null
          emails_clicked?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          enrolled_at?: string
          enrolled_by?: string | null
          enrollment_source?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          goal_reached_at?: string | null
          id?: string
          journey_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["journey_enrollment_status"]
          steps_completed?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          contact_id?: string
          context?: Json | null
          created_at?: string
          current_step_id?: string | null
          emails_clicked?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          enrolled_at?: string
          enrolled_by?: string | null
          enrollment_source?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          goal_reached_at?: string | null
          id?: string
          journey_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["journey_enrollment_status"]
          steps_completed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journey_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_step_executions: {
        Row: {
          created_at: string
          decision_made: string | null
          decision_reason: string | null
          email_clicked_at: string | null
          email_message_id: string | null
          email_opened_at: string | null
          email_status: string | null
          enrollment_id: string
          error_message: string | null
          executed_at: string | null
          id: string
          max_retries: number | null
          result: Json | null
          retry_count: number | null
          scheduled_for: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["journey_execution_status"]
          step_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision_made?: string | null
          decision_reason?: string | null
          email_clicked_at?: string | null
          email_message_id?: string | null
          email_opened_at?: string | null
          email_status?: string | null
          enrollment_id: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          max_retries?: number | null
          result?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["journey_execution_status"]
          step_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision_made?: string | null
          decision_reason?: string | null
          email_clicked_at?: string | null
          email_message_id?: string | null
          email_opened_at?: string | null
          email_status?: string | null
          enrollment_id?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          max_retries?: number | null
          result?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["journey_execution_status"]
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_step_executions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "journey_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_step_executions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          ai_options: Json | null
          ai_prompt: string | null
          condition_false_step_id: string | null
          condition_true_step_id: string | null
          created_at: string
          delay_unit: string | null
          delay_value: number | null
          description: string | null
          email_content: string | null
          email_subject: string | null
          email_template_id: string | null
          failed_executions: number | null
          id: string
          journey_id: string
          name: string
          next_step_id: string | null
          position: number
          position_x: number | null
          position_y: number | null
          step_config: Json
          step_type: Database["public"]["Enums"]["journey_step_type"]
          successful_executions: number | null
          total_executions: number | null
          updated_at: string
        }
        Insert: {
          ai_options?: Json | null
          ai_prompt?: string | null
          condition_false_step_id?: string | null
          condition_true_step_id?: string | null
          created_at?: string
          delay_unit?: string | null
          delay_value?: number | null
          description?: string | null
          email_content?: string | null
          email_subject?: string | null
          email_template_id?: string | null
          failed_executions?: number | null
          id?: string
          journey_id: string
          name: string
          next_step_id?: string | null
          position?: number
          position_x?: number | null
          position_y?: number | null
          step_config?: Json
          step_type: Database["public"]["Enums"]["journey_step_type"]
          successful_executions?: number | null
          total_executions?: number | null
          updated_at?: string
        }
        Update: {
          ai_options?: Json | null
          ai_prompt?: string | null
          condition_false_step_id?: string | null
          condition_true_step_id?: string | null
          created_at?: string
          delay_unit?: string | null
          delay_value?: number | null
          description?: string | null
          email_content?: string | null
          email_subject?: string | null
          email_template_id?: string | null
          failed_executions?: number | null
          id?: string
          journey_id?: string
          name?: string
          next_step_id?: string | null
          position?: number
          position_x?: number | null
          position_y?: number | null
          step_config?: Json
          step_type?: Database["public"]["Enums"]["journey_step_type"]
          successful_executions?: number | null
          total_executions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_condition_false_step_id_fkey"
            columns: ["condition_false_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_condition_true_step_id_fkey"
            columns: ["condition_true_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journey_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_next_step_id_fkey"
            columns: ["next_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
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
          cid: string | null
          click_count: number | null
          comments_count: number | null
          content: string | null
          created_at: string
          data_id: string | null
          engagement_rate: number | null
          from_owner: boolean | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          impressions_count: number | null
          index_grade: number | null
          interactions_count: number | null
          is_ad: boolean | null
          is_deleted: boolean | null
          likes_count: number | null
          main_grade: string | null
          mentions: string[] | null
          post_id: string
          post_image_url: string | null
          post_type: string | null
          post_url: string | null
          posted_at: string | null
          profile_followers_count: number | null
          profile_headline: string | null
          profile_industry: string | null
          profile_location: string | null
          profile_name: string | null
          profile_url: string | null
          raw_data: Json | null
          shares_count: number | null
          social_post_id: string | null
          text_length: number | null
          time_update: string | null
          updated_at: string
          user_id: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          cid?: string | null
          click_count?: number | null
          comments_count?: number | null
          content?: string | null
          created_at?: string
          data_id?: string | null
          engagement_rate?: number | null
          from_owner?: boolean | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          index_grade?: number | null
          interactions_count?: number | null
          is_ad?: boolean | null
          is_deleted?: boolean | null
          likes_count?: number | null
          main_grade?: string | null
          mentions?: string[] | null
          post_id: string
          post_image_url?: string | null
          post_type?: string | null
          post_url?: string | null
          posted_at?: string | null
          profile_followers_count?: number | null
          profile_headline?: string | null
          profile_industry?: string | null
          profile_location?: string | null
          profile_name?: string | null
          profile_url?: string | null
          raw_data?: Json | null
          shares_count?: number | null
          social_post_id?: string | null
          text_length?: number | null
          time_update?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          cid?: string | null
          click_count?: number | null
          comments_count?: number | null
          content?: string | null
          created_at?: string
          data_id?: string | null
          engagement_rate?: number | null
          from_owner?: boolean | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          index_grade?: number | null
          interactions_count?: number | null
          is_ad?: boolean | null
          is_deleted?: boolean | null
          likes_count?: number | null
          main_grade?: string | null
          mentions?: string[] | null
          post_id?: string
          post_image_url?: string | null
          post_type?: string | null
          post_url?: string | null
          posted_at?: string | null
          profile_followers_count?: number | null
          profile_headline?: string | null
          profile_industry?: string | null
          profile_location?: string | null
          profile_name?: string | null
          profile_url?: string | null
          raw_data?: Json | null
          shares_count?: number | null
          social_post_id?: string | null
          text_length?: number | null
          time_update?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
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
      marketing_campaigns: {
        Row: {
          business_objective: string
          campaign_description: string | null
          campaign_name: string | null
          campaign_type: string | null
          company_id: string | null
          company_name: string
          created_at: string
          current_step: string | null
          draft_data: Json | null
          id: string
          is_draft: boolean | null
          last_saved_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_objective: string
          campaign_description?: string | null
          campaign_name?: string | null
          campaign_type?: string | null
          company_id?: string | null
          company_name: string
          created_at?: string
          current_step?: string | null
          draft_data?: Json | null
          id?: string
          is_draft?: boolean | null
          last_saved_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_objective?: string
          campaign_description?: string | null
          campaign_name?: string | null
          campaign_type?: string | null
          company_id?: string | null
          company_name?: string
          created_at?: string
          current_step?: string | null
          draft_data?: Json | null
          id?: string
          is_draft?: boolean | null
          last_saved_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_diagnostic_snapshots: {
        Row: {
          company_id: string
          conversions_level: string | null
          conversions_threshold: number | null
          created_at: string
          cycle_id: string | null
          diagnostic_action: string | null
          diagnostic_reasoning: string | null
          id: string
          platform_breakdown: Json | null
          recommended_actions: Json | null
          snapshot_date: string
          total_conversions: number | null
          total_engagements: number | null
          total_views: number | null
          views_level: string | null
          views_threshold: number | null
        }
        Insert: {
          company_id: string
          conversions_level?: string | null
          conversions_threshold?: number | null
          created_at?: string
          cycle_id?: string | null
          diagnostic_action?: string | null
          diagnostic_reasoning?: string | null
          id?: string
          platform_breakdown?: Json | null
          recommended_actions?: Json | null
          snapshot_date?: string
          total_conversions?: number | null
          total_engagements?: number | null
          total_views?: number | null
          views_level?: string | null
          views_threshold?: number | null
        }
        Update: {
          company_id?: string
          conversions_level?: string | null
          conversions_threshold?: number | null
          created_at?: string
          cycle_id?: string | null
          diagnostic_action?: string | null
          diagnostic_reasoning?: string | null
          id?: string
          platform_breakdown?: Json | null
          recommended_actions?: Json | null
          snapshot_date?: string
          total_conversions?: number | null
          total_engagements?: number | null
          total_views?: number | null
          views_level?: string | null
          views_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_diagnostic_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_hook_templates: {
        Row: {
          category: string
          created_at: string
          example_caption: string | null
          hook_description: string | null
          hook_text: string
          id: string
          is_active: boolean | null
          language: string
          platform_optimized: string[] | null
          sort_order: number | null
          tier: number
          tier_name: string
          views_reference: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          example_caption?: string | null
          hook_description?: string | null
          hook_text: string
          id?: string
          is_active?: boolean | null
          language?: string
          platform_optimized?: string[] | null
          sort_order?: number | null
          tier?: number
          tier_name: string
          views_reference?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          example_caption?: string | null
          hook_description?: string | null
          hook_text?: string
          id?: string
          is_active?: boolean | null
          language?: string
          platform_optimized?: string[] | null
          sort_order?: number | null
          tier?: number
          tier_name?: string
          views_reference?: string | null
        }
        Relationships: []
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
      marketing_strategic_impact: {
        Row: {
          company_id: string
          created_at: string
          dimension_delta: Json | null
          event_source: string
          event_type: string
          evidence: Json | null
          gap_id: string | null
          id: string
          sdi_after: number
          sdi_before: number
          snapshot_version: number | null
          source_id: string | null
          strategic_dimension: string
        }
        Insert: {
          company_id: string
          created_at?: string
          dimension_delta?: Json | null
          event_source: string
          event_type: string
          evidence?: Json | null
          gap_id?: string | null
          id?: string
          sdi_after?: number
          sdi_before?: number
          snapshot_version?: number | null
          source_id?: string | null
          strategic_dimension: string
        }
        Update: {
          company_id?: string
          created_at?: string
          dimension_delta?: Json | null
          event_source?: string
          event_type?: string
          evidence?: Json | null
          gap_id?: string | null
          id?: string
          sdi_after?: number
          sdi_before?: number
          snapshot_version?: number | null
          source_id?: string | null
          strategic_dimension?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_strategic_impact_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_strategic_impact_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "company_strategic_gaps"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_strategies: {
        Row: {
          campaign_id: string
          competitive_analysis: Json
          content_plan: Json
          created_at: string
          execution_plan: Json | null
          full_strategy_data: Json | null
          id: string
          kpis: Json | null
          marketing_funnel: Json
          message_variants: Json | null
          risks_assumptions: string[] | null
          sources: string[] | null
          unified_message: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          competitive_analysis?: Json
          content_plan?: Json
          created_at?: string
          execution_plan?: Json | null
          full_strategy_data?: Json | null
          id?: string
          kpis?: Json | null
          marketing_funnel?: Json
          message_variants?: Json | null
          risks_assumptions?: string[] | null
          sources?: string[] | null
          unified_message?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          competitive_analysis?: Json
          content_plan?: Json
          created_at?: string
          execution_plan?: Json | null
          full_strategy_data?: Json | null
          id?: string
          kpis?: Json | null
          marketing_funnel?: Json
          message_variants?: Json | null
          risks_assumptions?: string[] | null
          sources?: string[] | null
          unified_message?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_strategies_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_wow_results: {
        Row: {
          agents_executed: string[] | null
          company_id: string | null
          content_result: Json | null
          created_at: string | null
          id: string
          insights_result: Json | null
          strategy_result: Json | null
          total_execution_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          agents_executed?: string[] | null
          company_id?: string | null
          content_result?: Json | null
          created_at?: string | null
          id?: string
          insights_result?: Json | null
          strategy_result?: Json | null
          total_execution_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          agents_executed?: string[] | null
          company_id?: string | null
          content_result?: Json | null
          created_at?: string | null
          id?: string
          insights_result?: Json | null
          strategy_result?: Json | null
          total_execution_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_wow_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_agents: {
        Row: {
          agent_type: string | null
          average_sfia_level: number | null
          category: string
          context_requirements: Json | null
          created_at: string | null
          created_by: string | null
          credits_per_use: number | null
          description: string | null
          edge_function_name: string | null
          execution_type: string
          guardrails_config: Json | null
          icon: string | null
          id: string
          input_schema: Json | null
          instructions: string | null
          internal_code: string
          is_active: boolean | null
          is_featured: boolean | null
          is_onboarding_agent: boolean | null
          is_premium: boolean | null
          min_plan_required: string | null
          model_name: string | null
          n8n_config: Json | null
          n8n_workflow_id: string | null
          name: string
          openai_agent_config: Json | null
          openai_assistant_id: string | null
          output_schema: Json | null
          payload_template: Json | null
          prerequisites: Json | null
          primary_function: string | null
          sample_output: Json | null
          sdk_version: string | null
          sfia_skills: Json | null
          sort_order: number | null
          supports_handoffs: boolean | null
          tools_config: Json | null
          tracing_enabled: boolean | null
          updated_at: string | null
          voice_enabled: boolean | null
        }
        Insert: {
          agent_type?: string | null
          average_sfia_level?: number | null
          category?: string
          context_requirements?: Json | null
          created_at?: string | null
          created_by?: string | null
          credits_per_use?: number | null
          description?: string | null
          edge_function_name?: string | null
          execution_type?: string
          guardrails_config?: Json | null
          icon?: string | null
          id?: string
          input_schema?: Json | null
          instructions?: string | null
          internal_code: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_onboarding_agent?: boolean | null
          is_premium?: boolean | null
          min_plan_required?: string | null
          model_name?: string | null
          n8n_config?: Json | null
          n8n_workflow_id?: string | null
          name: string
          openai_agent_config?: Json | null
          openai_assistant_id?: string | null
          output_schema?: Json | null
          payload_template?: Json | null
          prerequisites?: Json | null
          primary_function?: string | null
          sample_output?: Json | null
          sdk_version?: string | null
          sfia_skills?: Json | null
          sort_order?: number | null
          supports_handoffs?: boolean | null
          tools_config?: Json | null
          tracing_enabled?: boolean | null
          updated_at?: string | null
          voice_enabled?: boolean | null
        }
        Update: {
          agent_type?: string | null
          average_sfia_level?: number | null
          category?: string
          context_requirements?: Json | null
          created_at?: string | null
          created_by?: string | null
          credits_per_use?: number | null
          description?: string | null
          edge_function_name?: string | null
          execution_type?: string
          guardrails_config?: Json | null
          icon?: string | null
          id?: string
          input_schema?: Json | null
          instructions?: string | null
          internal_code?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_onboarding_agent?: boolean | null
          is_premium?: boolean | null
          min_plan_required?: string | null
          model_name?: string | null
          n8n_config?: Json | null
          n8n_workflow_id?: string | null
          name?: string
          openai_agent_config?: Json | null
          openai_assistant_id?: string | null
          output_schema?: Json | null
          payload_template?: Json | null
          prerequisites?: Json | null
          primary_function?: string | null
          sample_output?: Json | null
          sdk_version?: string | null
          sfia_skills?: Json | null
          sort_order?: number | null
          supports_handoffs?: boolean | null
          tools_config?: Json | null
          tracing_enabled?: boolean | null
          updated_at?: string | null
          voice_enabled?: boolean | null
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
          company_name: string | null
          country: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          email: string
          experience_years: number | null
          expertise_areas: string[] | null
          full_name: string
          functional_area: string | null
          github_url: string | null
          id: string
          is_active: boolean | null
          linked_providers: string[] | null
          linkedin_profile: string | null
          phone: string | null
          position: string | null
          preferred_language: string | null
          primary_company_id: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
          years_experience: number | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email: string
          experience_years?: number | null
          expertise_areas?: string[] | null
          full_name: string
          functional_area?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          linked_providers?: string[] | null
          linkedin_profile?: string | null
          phone?: string | null
          position?: string | null
          preferred_language?: string | null
          primary_company_id?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          years_experience?: number | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string
          experience_years?: number | null
          expertise_areas?: string[] | null
          full_name?: string
          functional_area?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          linked_providers?: string[] | null
          linkedin_profile?: string | null
          phone?: string | null
          position?: string | null
          preferred_language?: string | null
          primary_company_id?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
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
      push_subscriptions: {
        Row: {
          company_id: string | null
          created_at: string | null
          device_info: Json | null
          endpoint: string
          id: string
          is_active: boolean | null
          keys_auth: string
          keys_p256dh: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          device_info?: Json | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          keys_auth: string
          keys_p256dh: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          device_info?: Json | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          keys_auth?: string
          keys_p256dh?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_tracking: {
        Row: {
          company_id: string
          created_at: string | null
          deployment_id: string
          developer_id: string
          developer_share: number | null
          id: string
          payment_status: string | null
          platform_share: number | null
          revenue_amount: number | null
          template_id: string
          total_usage_count: number | null
          usage_period_end: string
          usage_period_start: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          deployment_id: string
          developer_id: string
          developer_share?: number | null
          id?: string
          payment_status?: string | null
          platform_share?: number | null
          revenue_amount?: number | null
          template_id: string
          total_usage_count?: number | null
          usage_period_end: string
          usage_period_start: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          deployment_id?: string
          developer_id?: string
          developer_share?: number | null
          id?: string
          payment_status?: string | null
          platform_share?: number | null
          revenue_amount?: number | null
          template_id?: string
          total_usage_count?: number | null
          usage_period_end?: string
          usage_period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_tracking_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whitelabel_agent_templates"
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
          linked_gap_id: string | null
          platform: string
          published_at: string | null
          scheduled_for: string
          status: string
          strategic_dimension: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_page_id: string
          content: Json
          created_at?: string
          error_message?: string | null
          id?: string
          linked_gap_id?: string | null
          platform: string
          published_at?: string | null
          scheduled_for: string
          status?: string
          strategic_dimension?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_page_id?: string
          content?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          linked_gap_id?: string | null
          platform?: string
          published_at?: string | null
          scheduled_for?: string
          status?: string
          strategic_dimension?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_social_posts: {
        Row: {
          company_username: string
          content: string | null
          created_at: string
          id: string
          job_id: string
          media_urls: string[] | null
          platforms: string[]
          post_type: string
          preview_url: string | null
          scheduled_date: string
          status: string | null
          title: string
          updated_at: string
          upload_post_response: Json | null
          user_id: string
        }
        Insert: {
          company_username: string
          content?: string | null
          created_at?: string
          id?: string
          job_id: string
          media_urls?: string[] | null
          platforms: string[]
          post_type: string
          preview_url?: string | null
          scheduled_date: string
          status?: string | null
          title: string
          updated_at?: string
          upload_post_response?: Json | null
          user_id: string
        }
        Update: {
          company_username?: string
          content?: string | null
          created_at?: string
          id?: string
          job_id?: string
          media_urls?: string[] | null
          platforms?: string[]
          post_type?: string
          preview_url?: string | null
          scheduled_date?: string
          status?: string | null
          title?: string
          updated_at?: string
          upload_post_response?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sfia_skills: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level_1_description: string | null
          level_2_description: string | null
          level_3_description: string | null
          level_4_description: string | null
          level_5_description: string | null
          level_6_description: string | null
          level_7_description: string | null
          name: string
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_1_description?: string | null
          level_2_description?: string | null
          level_3_description?: string | null
          level_4_description?: string | null
          level_5_description?: string | null
          level_6_description?: string | null
          level_7_description?: string | null
          name: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_1_description?: string | null
          level_2_description?: string | null
          level_3_description?: string | null
          level_4_description?: string | null
          level_5_description?: string | null
          level_6_description?: string | null
          level_7_description?: string | null
          name?: string
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      smart_link_leads: {
        Row: {
          captured_at: string
          custom_fields: Json | null
          email: string | null
          id: string
          ip_address: string | null
          link_id: string
          name: string | null
          phone: string | null
          source_platform: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          captured_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          ip_address?: string | null
          link_id: string
          name?: string | null
          phone?: string | null
          source_platform?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          captured_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string
          name?: string | null
          phone?: string | null
          source_platform?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_leads_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_links: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          destination_url: string | null
          form_fields: Json
          id: string
          is_active: boolean
          page_config: Json
          slug: string
          template_type: string
          title: string
          total_clicks: number
          total_leads: number
          updated_at: string
          user_id: string
          utm_params: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          destination_url?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean
          page_config?: Json
          slug: string
          template_type?: string
          title: string
          total_clicks?: number
          total_leads?: number
          updated_at?: string
          user_id: string
          utm_params?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          destination_url?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean
          page_config?: Json
          slug?: string
          template_type?: string
          title?: string
          total_clicks?: number
          total_leads?: number
          updated_at?: string
          user_id?: string
          utm_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          company_id: string | null
          company_username: string
          connected_at: string | null
          created_at: string
          facebook_page_id: string | null
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          linkedin_page_id: string | null
          metadata: Json | null
          platform: string
          platform_display_name: string | null
          platform_username: string | null
          updated_at: string
          upload_post_profile_exists: boolean | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          company_id?: string | null
          company_username: string
          connected_at?: string | null
          created_at?: string
          facebook_page_id?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          linkedin_page_id?: string | null
          metadata?: Json | null
          platform: string
          platform_display_name?: string | null
          platform_username?: string | null
          updated_at?: string
          upload_post_profile_exists?: boolean | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          company_id?: string | null
          company_username?: string
          connected_at?: string | null
          created_at?: string
          facebook_page_id?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          linkedin_page_id?: string | null
          metadata?: Json | null
          platform?: string
          platform_display_name?: string | null
          platform_username?: string | null
          updated_at?: string
          upload_post_profile_exists?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      social_activity_analysis: {
        Row: {
          analysis_date: string
          avg_comments_per_hour: number
          avg_interactions_per_hour: number
          avg_likes_per_hour: number
          cid: string
          created_at: string
          daily_breakdown: Json | null
          hourly_breakdown: Json | null
          id: string
          peak_day_of_week: number
          peak_hour: number
          peak_interactions: number
          platform: string
          raw_activity_data: Json | null
          raw_api_response: Json | null
          total_comments: number
          total_interactions: number
          total_likes: number
          total_reposts: number
          total_views: number
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_date?: string
          avg_comments_per_hour?: number
          avg_interactions_per_hour?: number
          avg_likes_per_hour?: number
          cid: string
          created_at?: string
          daily_breakdown?: Json | null
          hourly_breakdown?: Json | null
          id?: string
          peak_day_of_week?: number
          peak_hour?: number
          peak_interactions?: number
          platform: string
          raw_activity_data?: Json | null
          raw_api_response?: Json | null
          total_comments?: number
          total_interactions?: number
          total_likes?: number
          total_reposts?: number
          total_views?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_date?: string
          avg_comments_per_hour?: number
          avg_interactions_per_hour?: number
          avg_likes_per_hour?: number
          cid?: string
          created_at?: string
          daily_breakdown?: Json | null
          hourly_breakdown?: Json | null
          id?: string
          peak_day_of_week?: number
          peak_hour?: number
          peak_interactions?: number
          platform?: string
          raw_activity_data?: Json | null
          raw_api_response?: Json | null
          total_comments?: number
          total_interactions?: number
          total_likes?: number
          total_reposts?: number
          total_views?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_analysis: {
        Row: {
          age: string | null
          ages: Json | null
          audience_severity: number | null
          avg_er: number | null
          avg_interactions: number | null
          avg_views: number | null
          brand_safety: Json | null
          categories: string[] | null
          cid: string | null
          cities: Json | null
          city: string | null
          community_status: string | null
          contact_email: string | null
          countries: Json | null
          country: string | null
          country_code: string | null
          created_at: string
          description: string | null
          gender: string | null
          genders: Json | null
          group_id: string | null
          id: string
          image: string | null
          interests: Json | null
          is_blocked: boolean | null
          is_closed: boolean | null
          last_from_mentions: Json | null
          last_posts: Json | null
          members_cities: Json | null
          members_countries: Json | null
          members_genders_ages: Json | null
          members_reachability: Json | null
          members_types: Json | null
          name: string | null
          pct_fake_followers: number | null
          profile_type: string | null
          quality_score: number | null
          rating_index: number | null
          rating_tags: Json | null
          raw_api_response: Json
          screen_name: string | null
          similar_profiles: Json | null
          social_type: string
          start_date: string | null
          suggested_tags: string[] | null
          tags: string[] | null
          time_posts_loaded: string | null
          time_short_loop: string | null
          time_statistics: string | null
          updated_at: string
          url: string
          user_id: string
          users_count: number | null
          verified: boolean | null
        }
        Insert: {
          age?: string | null
          ages?: Json | null
          audience_severity?: number | null
          avg_er?: number | null
          avg_interactions?: number | null
          avg_views?: number | null
          brand_safety?: Json | null
          categories?: string[] | null
          cid?: string | null
          cities?: Json | null
          city?: string | null
          community_status?: string | null
          contact_email?: string | null
          countries?: Json | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          genders?: Json | null
          group_id?: string | null
          id?: string
          image?: string | null
          interests?: Json | null
          is_blocked?: boolean | null
          is_closed?: boolean | null
          last_from_mentions?: Json | null
          last_posts?: Json | null
          members_cities?: Json | null
          members_countries?: Json | null
          members_genders_ages?: Json | null
          members_reachability?: Json | null
          members_types?: Json | null
          name?: string | null
          pct_fake_followers?: number | null
          profile_type?: string | null
          quality_score?: number | null
          rating_index?: number | null
          rating_tags?: Json | null
          raw_api_response: Json
          screen_name?: string | null
          similar_profiles?: Json | null
          social_type: string
          start_date?: string | null
          suggested_tags?: string[] | null
          tags?: string[] | null
          time_posts_loaded?: string | null
          time_short_loop?: string | null
          time_statistics?: string | null
          updated_at?: string
          url: string
          user_id: string
          users_count?: number | null
          verified?: boolean | null
        }
        Update: {
          age?: string | null
          ages?: Json | null
          audience_severity?: number | null
          avg_er?: number | null
          avg_interactions?: number | null
          avg_views?: number | null
          brand_safety?: Json | null
          categories?: string[] | null
          cid?: string | null
          cities?: Json | null
          city?: string | null
          community_status?: string | null
          contact_email?: string | null
          countries?: Json | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          genders?: Json | null
          group_id?: string | null
          id?: string
          image?: string | null
          interests?: Json | null
          is_blocked?: boolean | null
          is_closed?: boolean | null
          last_from_mentions?: Json | null
          last_posts?: Json | null
          members_cities?: Json | null
          members_countries?: Json | null
          members_genders_ages?: Json | null
          members_reachability?: Json | null
          members_types?: Json | null
          name?: string | null
          pct_fake_followers?: number | null
          profile_type?: string | null
          quality_score?: number | null
          rating_index?: number | null
          rating_tags?: Json | null
          raw_api_response?: Json
          screen_name?: string | null
          similar_profiles?: Json | null
          social_type?: string
          start_date?: string | null
          suggested_tags?: string[] | null
          tags?: string[] | null
          time_posts_loaded?: string | null
          time_short_loop?: string | null
          time_statistics?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          users_count?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
      social_automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          company_id: string
          cooldown_minutes: number | null
          created_at: string
          description: string | null
          execution_count: number
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          platforms: string[] | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          company_id: string
          cooldown_minutes?: number | null
          created_at?: string
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          platforms?: string[] | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          company_id?: string
          cooldown_minutes?: number | null
          created_at?: string
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          platforms?: string[] | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_automation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_content_analysis: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          cid: string
          created_at: string
          id: string
          platform: string
          posts_analyzed: number
          posts_data: Json | null
          raw_api_response: Json | null
          summary_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          cid: string
          created_at?: string
          id?: string
          platform: string
          posts_analyzed?: number
          posts_data?: Json | null
          raw_api_response?: Json | null
          summary_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          cid?: string
          created_at?: string
          id?: string
          platform?: string
          posts_analyzed?: number
          posts_data?: Json | null
          raw_api_response?: Json | null
          summary_data?: Json | null
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
      social_retrospective_analysis: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          average_er: number
          avg_posts_per_week: number
          cid: string
          created_at: string
          current_followers: number
          followers_growth: number
          id: string
          platform: string
          quality_score: number
          raw_api_response: Json | null
          series_data: Json | null
          summary_data: Json | null
          total_comments: number
          total_interactions: number
          total_likes: number
          total_posts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          average_er?: number
          avg_posts_per_week?: number
          cid: string
          created_at?: string
          current_followers?: number
          followers_growth?: number
          id?: string
          platform: string
          quality_score?: number
          raw_api_response?: Json | null
          series_data?: Json | null
          summary_data?: Json | null
          total_comments?: number
          total_interactions?: number
          total_likes?: number
          total_posts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          average_er?: number
          avg_posts_per_week?: number
          cid?: string
          created_at?: string
          current_followers?: number
          followers_growth?: number
          id?: string
          platform?: string
          quality_score?: number
          raw_api_response?: Json | null
          series_data?: Json | null
          summary_data?: Json | null
          total_comments?: number
          total_interactions?: number
          total_likes?: number
          total_posts?: number
          updated_at?: string
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
          cid: string | null
          collect_count: number | null
          comment_count: number | null
          content: string | null
          cover_url: string | null
          create_time: number | null
          created_at: string
          data_id: string | null
          digg_count: number | null
          download_count: number | null
          duration: number | null
          forward_count: number | null
          from_owner: boolean | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          index_grade: number | null
          interactions_count: number | null
          is_ad: boolean | null
          is_deleted: boolean | null
          main_grade: string | null
          mentions: string[] | null
          play_count: number | null
          post_image_url: string | null
          post_url: string | null
          posted_at: string | null
          profile_avatar_url: string | null
          profile_display_name: string | null
          profile_followers_count: number | null
          profile_following_count: number | null
          profile_is_verified: boolean | null
          profile_username: string | null
          raw_data: Json | null
          share_count: number | null
          social_post_id: string | null
          text_length: number | null
          tiktok_user_id: string
          time_update: string | null
          title: string | null
          updated_at: string
          user_id: string
          video_id: string
          whatsapp_share_count: number | null
        }
        Insert: {
          aweme_id: string
          cid?: string | null
          collect_count?: number | null
          comment_count?: number | null
          content?: string | null
          cover_url?: string | null
          create_time?: number | null
          created_at?: string
          data_id?: string | null
          digg_count?: number | null
          download_count?: number | null
          duration?: number | null
          forward_count?: number | null
          from_owner?: boolean | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          index_grade?: number | null
          interactions_count?: number | null
          is_ad?: boolean | null
          is_deleted?: boolean | null
          main_grade?: string | null
          mentions?: string[] | null
          play_count?: number | null
          post_image_url?: string | null
          post_url?: string | null
          posted_at?: string | null
          profile_avatar_url?: string | null
          profile_display_name?: string | null
          profile_followers_count?: number | null
          profile_following_count?: number | null
          profile_is_verified?: boolean | null
          profile_username?: string | null
          raw_data?: Json | null
          share_count?: number | null
          social_post_id?: string | null
          text_length?: number | null
          tiktok_user_id: string
          time_update?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          video_id: string
          whatsapp_share_count?: number | null
        }
        Update: {
          aweme_id?: string
          cid?: string | null
          collect_count?: number | null
          comment_count?: number | null
          content?: string | null
          cover_url?: string | null
          create_time?: number | null
          created_at?: string
          data_id?: string | null
          digg_count?: number | null
          download_count?: number | null
          duration?: number | null
          forward_count?: number | null
          from_owner?: boolean | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          index_grade?: number | null
          interactions_count?: number | null
          is_ad?: boolean | null
          is_deleted?: boolean | null
          main_grade?: string | null
          mentions?: string[] | null
          play_count?: number | null
          post_image_url?: string | null
          post_url?: string | null
          posted_at?: string | null
          profile_avatar_url?: string | null
          profile_display_name?: string | null
          profile_followers_count?: number | null
          profile_following_count?: number | null
          profile_is_verified?: boolean | null
          profile_username?: string | null
          raw_data?: Json | null
          share_count?: number | null
          social_post_id?: string | null
          text_length?: number | null
          tiktok_user_id?: string
          time_update?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
          whatsapp_share_count?: number | null
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
      user_credentials: {
        Row: {
          counter: number | null
          created_at: string | null
          credential_id: string
          device_name: string | null
          device_type: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number | null
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
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
      user_guided_tour: {
        Row: {
          completed_steps: number[] | null
          created_at: string | null
          current_step: number | null
          id: string
          tour_completed: boolean | null
          tour_completed_at: string | null
          tour_skipped: boolean | null
          tour_started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          tour_completed?: boolean | null
          tour_completed_at?: string | null
          tour_skipped?: boolean | null
          tour_started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          tour_completed?: boolean | null
          tour_completed_at?: string | null
          tour_skipped?: boolean | null
          tour_started_at?: string | null
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
      user_onboarding_status: {
        Row: {
          created_at: string
          current_step: number | null
          dna_empresarial_completed: boolean | null
          first_login_completed: boolean | null
          id: string
          marketing_hub_visited: boolean | null
          onboarding_completed_at: string | null
          onboarding_started_at: string | null
          registration_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number | null
          dna_empresarial_completed?: boolean | null
          first_login_completed?: boolean | null
          id?: string
          marketing_hub_visited?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          registration_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number | null
          dna_empresarial_completed?: boolean | null
          first_login_completed?: boolean | null
          id?: string
          marketing_hub_visited?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          registration_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      utm_click_events: {
        Row: {
          clicked_at: string
          company_id: string
          country: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          post_id: string | null
          referrer: string | null
          smart_link_id: string | null
          url: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          clicked_at?: string
          company_id: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          post_id?: string | null
          referrer?: string | null
          smart_link_id?: string | null
          url: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          clicked_at?: string
          company_id?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          post_id?: string | null
          referrer?: string | null
          smart_link_id?: string | null
          url?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utm_click_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utm_click_events_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelabel_agent_templates: {
        Row: {
          ai_capabilities: Json | null
          average_rating: number | null
          banner_image_url: string | null
          base_price: number | null
          category: string
          created_at: string | null
          customization_options: Json | null
          demo_url: string | null
          description: string | null
          developer_id: string
          documentation_url: string | null
          flow_definition: Json
          icon: string | null
          id: string
          integration_config: Json | null
          is_featured: boolean | null
          is_published: boolean | null
          knowledge_base_config: Json | null
          pricing_model: string | null
          revenue_share_percentage: number | null
          tags: string[] | null
          template_name: string
          total_deployments: number | null
          total_ratings: number | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          ai_capabilities?: Json | null
          average_rating?: number | null
          banner_image_url?: string | null
          base_price?: number | null
          category: string
          created_at?: string | null
          customization_options?: Json | null
          demo_url?: string | null
          description?: string | null
          developer_id: string
          documentation_url?: string | null
          flow_definition?: Json
          icon?: string | null
          id?: string
          integration_config?: Json | null
          is_featured?: boolean | null
          is_published?: boolean | null
          knowledge_base_config?: Json | null
          pricing_model?: string | null
          revenue_share_percentage?: number | null
          tags?: string[] | null
          template_name: string
          total_deployments?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          ai_capabilities?: Json | null
          average_rating?: number | null
          banner_image_url?: string | null
          base_price?: number | null
          category?: string
          created_at?: string | null
          customization_options?: Json | null
          demo_url?: string | null
          description?: string | null
          developer_id?: string
          documentation_url?: string | null
          flow_definition?: Json
          icon?: string | null
          id?: string
          integration_config?: Json | null
          is_featured?: boolean | null
          is_published?: boolean | null
          knowledge_base_config?: Json | null
          pricing_model?: string | null
          revenue_share_percentage?: number | null
          tags?: string[] | null
          template_name?: string
          total_deployments?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_agent_templates_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelabel_analytics: {
        Row: {
          deployment_id: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          period_end: string | null
          period_start: string | null
          recorded_at: string | null
        }
        Insert: {
          deployment_id: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          period_end?: string | null
          period_start?: string | null
          recorded_at?: string | null
        }
        Update: {
          deployment_id?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          period_end?: string | null
          period_start?: string | null
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_analytics_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "whitelabel_deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelabel_deployments: {
        Row: {
          agent_config: Json | null
          api_key: string | null
          billing_config: Json | null
          branding_config: Json | null
          company_id: string
          created_at: string | null
          custom_domain: string | null
          deployment_name: string
          deployment_url: string | null
          id: string
          integration_settings: Json | null
          last_activity_at: string | null
          status: string | null
          template_id: string
          updated_at: string | null
          usage_stats: Json | null
        }
        Insert: {
          agent_config?: Json | null
          api_key?: string | null
          billing_config?: Json | null
          branding_config?: Json | null
          company_id: string
          created_at?: string | null
          custom_domain?: string | null
          deployment_name: string
          deployment_url?: string | null
          id?: string
          integration_settings?: Json | null
          last_activity_at?: string | null
          status?: string | null
          template_id: string
          updated_at?: string | null
          usage_stats?: Json | null
        }
        Update: {
          agent_config?: Json | null
          api_key?: string | null
          billing_config?: Json | null
          branding_config?: Json | null
          company_id?: string
          created_at?: string | null
          custom_domain?: string | null
          deployment_name?: string
          deployment_url?: string | null
          id?: string
          integration_settings?: Json | null
          last_activity_at?: string | null
          status?: string | null
          template_id?: string
          updated_at?: string | null
          usage_stats?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_deployments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whitelabel_deployments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whitelabel_agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelabel_knowledge_bases: {
        Row: {
          chunk_overlap: number | null
          chunk_size: number | null
          created_at: string | null
          description: string | null
          embeddings_model: string | null
          id: string
          last_updated_at: string | null
          name: string
          processing_config: Json | null
          source_config: Json
          status: string | null
          template_id: string
          total_chunks: number | null
          type: string
        }
        Insert: {
          chunk_overlap?: number | null
          chunk_size?: number | null
          created_at?: string | null
          description?: string | null
          embeddings_model?: string | null
          id?: string
          last_updated_at?: string | null
          name: string
          processing_config?: Json | null
          source_config?: Json
          status?: string | null
          template_id: string
          total_chunks?: number | null
          type: string
        }
        Update: {
          chunk_overlap?: number | null
          chunk_size?: number | null
          created_at?: string | null
          description?: string | null
          embeddings_model?: string | null
          id?: string
          last_updated_at?: string | null
          name?: string
          processing_config?: Json | null
          source_config?: Json
          status?: string | null
          template_id?: string
          total_chunks?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_knowledge_bases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whitelabel_agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelabel_revenue: {
        Row: {
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          deployment_id: string
          developer_id: string
          developer_share: number
          id: string
          platform_share: number
          revenue_amount: number
          status: string | null
          transaction_type: string
        }
        Insert: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          deployment_id: string
          developer_id: string
          developer_share: number
          id?: string
          platform_share: number
          revenue_amount: number
          status?: string | null
          transaction_type: string
        }
        Update: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          deployment_id?: string
          developer_id?: string
          developer_share?: number
          id?: string
          platform_share?: number
          revenue_amount?: number
          status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_revenue_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "whitelabel_deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whitelabel_revenue_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelabel_reviews: {
        Row: {
          company_id: string
          created_at: string | null
          ease_of_use_rating: number | null
          features_rating: number | null
          id: string
          is_public: boolean | null
          rating: number
          review_text: string | null
          support_rating: number | null
          template_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          ease_of_use_rating?: number | null
          features_rating?: number | null
          id?: string
          is_public?: boolean | null
          rating: number
          review_text?: string | null
          support_rating?: number | null
          template_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          ease_of_use_rating?: number | null
          features_rating?: number | null
          id?: string
          is_public?: boolean | null
          rating?: number
          review_text?: string | null
          support_rating?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whitelabel_reviews_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whitelabel_agent_templates"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
    }
    Views: {
      company_current_parameters: {
        Row: {
          category: string | null
          company_id: string | null
          parameter_key: string | null
          parameter_value: Json | null
          source_agent_code: string | null
          source_execution_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          parameter_key?: string | null
          parameter_value?: Json | null
          source_agent_code?: string | null
          source_execution_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          parameter_key?: string | null
          parameter_value?: Json | null
          source_agent_code?: string | null
          source_execution_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_parameters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_parameters_source_execution_id_fkey"
            columns: ["source_execution_id"]
            isOneToOne: false
            referencedRelation: "agent_usage_log"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_public_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          experience_years: number | null
          full_name: string | null
          id: string | null
          is_available: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          profile_image_url: string | null
          rating: number | null
          specializations: string | null
          total_sessions: number | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string | null
          is_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          profile_image_url?: string | null
          rating?: number | null
          specializations?: string | null
          total_sessions?: number | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string | null
          is_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          profile_image_url?: string | null
          rating?: number | null
          specializations?: string | null
          total_sessions?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_linked_provider: {
        Args: { _provider: string; _user_id: string }
        Returns: undefined
      }
      assign_admin_role: { Args: { target_user_id: string }; Returns: boolean }
      calculate_competitive_landscape_score: {
        Args: { analysis_id_param: string }
        Returns: number
      }
      calculate_engagement_rate: {
        Args: { comments: number; followers: number; likes: number }
        Returns: number
      }
      calculate_posting_optimal_times: {
        Args: { platform_param: string; user_id_param: string }
        Returns: Json
      }
      calculate_user_level: { Args: { total_points: number }; Returns: number }
      check_usage_limit: {
        Args: {
          limit_key_param: string
          usage_type_param: string
          user_id_param: string
        }
        Returns: boolean
      }
      create_company_with_owner:
        | {
            Args: {
              company_description?: string
              company_name: string
              company_size?: string
              industry_sector?: string
              website_url?: string
            }
            Returns: string
          }
        | {
            Args: {
              company_description?: string
              company_name: string
              company_size?: string
              industry_sector?: string
              user_id_param?: string
              website_url?: string
            }
            Returns: string
          }
      current_user_is_admin: { Args: never; Returns: boolean }
      deactivate_company: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      deactivate_user: { Args: { target_user_id: string }; Returns: boolean }
      deduct_company_credits: {
        Args: { _company_id: string; _credits: number }
        Returns: boolean
      }
      delete_company_cascade: {
        Args: { target_company_id: string }
        Returns: undefined
      }
      delete_user_cascade: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      deprecate_unused_capabilities: { Args: never; Returns: undefined }
      expire_old_invitations: { Args: never; Returns: undefined }
      extract_hashtags: { Args: { caption: string }; Returns: string[] }
      extract_mentions: { Args: { caption: string }; Returns: string[] }
      get_admin_analytics_data: {
        Args: { end_date: string; start_date: string }
        Returns: {
          metadata: Json
          metric_name: string
          metric_value: number
          period_end: string
          period_start: string
          platform: string
        }[]
      }
      get_admin_analytics_summary: {
        Args: { end_date: string; start_date: string }
        Returns: {
          active_models: number
          total_ai_logs: number
          total_companies: number
          total_developers: number
          total_experts: number
          total_facebook_connections: number
          total_linkedin_connections: number
          total_tiktok_connections: number
          total_users: number
        }[]
      }
      get_admin_recent_activity: {
        Args: never
        Returns: {
          recent_connections: Json
          recent_profiles: Json
        }[]
      }
      get_admin_social_connections: {
        Args: never
        Returns: {
          facebook_connections: number
          linkedin_connections: number
          recent_facebook: number
          recent_linkedin: number
          recent_tiktok: number
          tiktok_connections: number
        }[]
      }
      get_admin_user_analytics: {
        Args: never
        Returns: {
          companies: number
          developers: number
          experts: number
          recent_users: number
          total_users: number
          users_with_facebook: number
          users_with_linkedin: number
          users_with_tiktok: number
        }[]
      }
      get_ai_model_config: {
        Args: { function_name_param: string }
        Returns: {
          frequency_penalty: number
          max_tokens: number
          model_name: string
          presence_penalty: number
          temperature: number
          top_p: number
        }[]
      }
      get_all_companies_admin: {
        Args: never
        Returns: {
          company_size: string
          country: string
          created_at: string
          deactivated_at: string
          description: string
          id: string
          industry_sector: string
          is_active: boolean
          logo_url: string
          member_count: number
          name: string
          owner_email: string
          owner_name: string
          website_url: string
        }[]
      }
      get_all_profiles_admin: {
        Args: never
        Returns: {
          avatar_url: string
          company_id: string
          company_name: string
          company_role: string
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          industry: string
          is_primary_company: boolean
          linked_providers: string[]
          onboarding_completed: boolean
          onboarding_completed_at: string
          registration_method: string
          user_id: string
          user_position: string
          user_type: Database["public"]["Enums"]["user_type"]
          website_url: string
        }[]
      }
      get_company_members_with_profiles: {
        Args: never
        Returns: {
          company_id: string
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      get_dimension_stagnation: {
        Args: {
          p_company_id: string
          p_dimension: string
          p_threshold?: number
        }
        Returns: number
      }
      get_expert_pricing: {
        Args: { expert_id: string }
        Returns: {
          email: string
          hourly_rate: number
        }[]
      }
      get_user_primary_company: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_primary_company_data: {
        Args: { user_id_param: string }
        Returns: {
          company_id: string
          company_name: string
          company_size: string
          country: string
          created_at: string
          description: string
          facebook_url: string
          industry_sector: string
          instagram_url: string
          linkedin_url: string
          location: string
          logo_url: string
          primary_color: string
          secondary_color: string
          tiktok_url: string
          twitter_url: string
          updated_at: string
          website_url: string
          youtube_url: string
        }[]
      }
      get_user_stats_admin: {
        Args: never
        Returns: {
          active_last_30_days: number
          companies: number
          developers: number
          experts: number
          total_users: number
        }[]
      }
      get_user_subscription: {
        Args: { user_id_param: string }
        Returns: {
          current_period_end: string
          limits: Json
          plan_name: string
          plan_slug: string
          status: string
        }[]
      }
      handle_webhook_notification: { Args: never; Returns: undefined }
      increment_usage: {
        Args: {
          increment_by?: number
          usage_type_param: string
          user_id_param: string
        }
        Returns: undefined
      }
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      mark_onboarding_completed: {
        Args: { _registration_method?: string; _user_id: string }
        Returns: undefined
      }
      next_strategic_state_version: {
        Args: { p_company_id: string }
        Returns: number
      }
      promote_trial_capabilities: { Args: never; Returns: undefined }
      reactivate_company: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      reactivate_user: { Args: { target_user_id: string }; Returns: boolean }
      remove_linked_provider: {
        Args: { _provider: string; _user_id: string }
        Returns: undefined
      }
      restore_agent_template_version: {
        Args: {
          new_version_param: string
          template_id_param: string
          version_number_param: string
        }
        Returns: boolean
      }
      update_user_gamification: {
        Args: { p_points_earned?: number; p_user_id: string }
        Returns: undefined
      }
      update_user_primary_company: {
        Args: { company_data: Json; user_id_param: string }
        Returns: string
      }
      validate_admin_credentials: {
        Args: { p_password: string; p_username: string }
        Returns: {
          role: string
          user_id: string
          username: string
        }[]
      }
      validate_admin_login: {
        Args: { p_password: string; p_username: string }
        Returns: {
          role: string
          user_id: string
          username: string
        }[]
      }
      validate_password_strength: {
        Args: { password_input: string }
        Returns: Json
      }
    }
    Enums: {
      ai_model_type:
        | "text_generation"
        | "image_generation"
        | "audio_generation"
        | "video_generation"
        | "reasoning"
      app_role: "admin" | "moderator" | "user"
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
      journey_enrollment_status:
        | "active"
        | "completed"
        | "goal_reached"
        | "exited"
        | "failed"
        | "paused"
      journey_execution_status:
        | "pending"
        | "scheduled"
        | "executing"
        | "executed"
        | "failed"
        | "skipped"
      journey_status: "draft" | "active" | "paused" | "archived"
      journey_step_type:
        | "send_email"
        | "delay"
        | "condition"
        | "ai_decision"
        | "update_contact"
        | "create_activity"
        | "move_deal_stage"
        | "add_tag"
        | "remove_tag"
        | "webhook"
        | "enroll_in_journey"
        | "exit"
      journey_trigger_type:
        | "lifecycle_change"
        | "manual"
        | "tag_added"
        | "deal_created"
        | "deal_stage_changed"
        | "form_submit"
        | "inbound_email"
        | "ai_triggered"
        | "contact_created"
        | "activity_completed"
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
      app_role: ["admin", "moderator", "user"],
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
      journey_enrollment_status: [
        "active",
        "completed",
        "goal_reached",
        "exited",
        "failed",
        "paused",
      ],
      journey_execution_status: [
        "pending",
        "scheduled",
        "executing",
        "executed",
        "failed",
        "skipped",
      ],
      journey_status: ["draft", "active", "paused", "archived"],
      journey_step_type: [
        "send_email",
        "delay",
        "condition",
        "ai_decision",
        "update_contact",
        "create_activity",
        "move_deal_stage",
        "add_tag",
        "remove_tag",
        "webhook",
        "enroll_in_journey",
        "exit",
      ],
      journey_trigger_type: [
        "lifecycle_change",
        "manual",
        "tag_added",
        "deal_created",
        "deal_stage_changed",
        "form_submit",
        "inbound_email",
        "ai_triggered",
        "contact_created",
        "activity_completed",
      ],
      user_type: ["developer", "expert", "company"],
    },
  },
} as const
