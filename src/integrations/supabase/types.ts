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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auto_responders: {
        Row: {
          allowed_channels: string[]
          allowed_roles: string[]
          case_sensitive: boolean
          cooldown_seconds: number
          created_at: string
          delete_trigger: boolean
          embed: Json | null
          enabled: boolean
          guild_id: string
          id: string
          match_type: string
          responses: string[]
          trigger: string
          updated_at: string
          uses: number
        }
        Insert: {
          allowed_channels?: string[]
          allowed_roles?: string[]
          case_sensitive?: boolean
          cooldown_seconds?: number
          created_at?: string
          delete_trigger?: boolean
          embed?: Json | null
          enabled?: boolean
          guild_id: string
          id?: string
          match_type?: string
          responses?: string[]
          trigger: string
          updated_at?: string
          uses?: number
        }
        Update: {
          allowed_channels?: string[]
          allowed_roles?: string[]
          case_sensitive?: boolean
          cooldown_seconds?: number
          created_at?: string
          delete_trigger?: boolean
          embed?: Json | null
          enabled?: boolean
          guild_id?: string
          id?: string
          match_type?: string
          responses?: string[]
          trigger?: string
          updated_at?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "auto_responders_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist: {
        Row: {
          added_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      bot_status: {
        Row: {
          commands_processed: number
          cpu_percent: number | null
          guild_count: number
          latency_ms: number | null
          memory_mb: number | null
          shard_id: number
          started_at: string | null
          status: string
          updated_at: string
          user_count: number
          version: string | null
        }
        Insert: {
          commands_processed?: number
          cpu_percent?: number | null
          guild_count?: number
          latency_ms?: number | null
          memory_mb?: number | null
          shard_id?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          user_count?: number
          version?: string | null
        }
        Update: {
          commands_processed?: number
          cpu_percent?: number | null
          guild_count?: number
          latency_ms?: number | null
          memory_mb?: number | null
          shard_id?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          user_count?: number
          version?: string | null
        }
        Relationships: []
      }
      bot_tasks: {
        Row: {
          created_at: string
          error: string | null
          guild_id: string
          id: string
          payload: Json
          processed_at: string | null
          requested_by: string | null
          result: Json | null
          status: string
          task_type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          guild_id: string
          id?: string
          payload?: Json
          processed_at?: string | null
          requested_by?: string | null
          result?: Json | null
          status?: string
          task_type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          guild_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          requested_by?: string | null
          result?: Json | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_tasks_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      command_settings: {
        Row: {
          aliases: string[]
          allowed_channels: string[]
          allowed_roles: string[]
          allowed_users: string[]
          command: string
          cooldown_scope: string
          cooldown_seconds: number | null
          denied_channels: string[]
          denied_roles: string[]
          enabled: boolean
          guild_id: string
          id: string
          permission_level: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          allowed_channels?: string[]
          allowed_roles?: string[]
          allowed_users?: string[]
          command: string
          cooldown_scope?: string
          cooldown_seconds?: number | null
          denied_channels?: string[]
          denied_roles?: string[]
          enabled?: boolean
          guild_id: string
          id?: string
          permission_level?: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          allowed_channels?: string[]
          allowed_roles?: string[]
          allowed_users?: string[]
          command?: string
          cooldown_scope?: string
          cooldown_seconds?: number | null
          denied_channels?: string[]
          denied_roles?: string[]
          enabled?: boolean
          guild_id?: string
          id?: string
          permission_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_settings_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      command_usage: {
        Row: {
          command: string
          created_at: string
          guild_id: string | null
          id: string
          success: boolean
          user_id: string | null
        }
        Insert: {
          command: string
          created_at?: string
          guild_id?: string | null
          id?: string
          success?: boolean
          user_id?: string | null
        }
        Update: {
          command?: string
          created_at?: string
          guild_id?: string | null
          id?: string
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      custom_commands: {
        Row: {
          allowed_channels: string[]
          allowed_roles: string[]
          cooldown_seconds: number
          created_at: string
          created_by: string | null
          embed: Json | null
          enabled: boolean
          guild_id: string
          id: string
          response: string
          trigger: string
          updated_at: string
          uses: number
        }
        Insert: {
          allowed_channels?: string[]
          allowed_roles?: string[]
          cooldown_seconds?: number
          created_at?: string
          created_by?: string | null
          embed?: Json | null
          enabled?: boolean
          guild_id: string
          id?: string
          response: string
          trigger: string
          updated_at?: string
          uses?: number
        }
        Update: {
          allowed_channels?: string[]
          allowed_roles?: string[]
          cooldown_seconds?: number
          created_at?: string
          created_by?: string | null
          embed?: Json | null
          enabled?: boolean
          guild_id?: string
          id?: string
          response?: string
          trigger?: string
          updated_at?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_commands_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_audit: {
        Row: {
          action: string
          actor_id: string
          actor_tag: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          guild_id: string | null
          id: string
          ip_hash: string | null
          target: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_tag?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          guild_id?: string | null
          id?: string
          ip_hash?: string | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_tag?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          guild_id?: string | null
          id?: string
          ip_hash?: string | null
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_audit_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          command: string | null
          created_at: string
          guild_id: string | null
          id: string
          message: string
          source: string
          stack: string | null
        }
        Insert: {
          command?: string | null
          created_at?: string
          guild_id?: string | null
          id?: string
          message: string
          source: string
          stack?: string | null
        }
        Update: {
          command?: string | null
          created_at?: string
          guild_id?: string | null
          id?: string
          message?: string
          source?: string
          stack?: string | null
        }
        Relationships: []
      }
      filter_words: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          list_type: string
          match_mode: string
          word: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          list_type?: string
          match_mode?: string
          word: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          list_type?: string
          match_mode?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "filter_words_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          blacklisted_roles: string[]
          bonus_entries: Json
          channel_id: string | null
          created_at: string
          ends_at: string
          entries: string[]
          guild_id: string
          host_id: string | null
          id: string
          message_id: string | null
          min_account_age_days: number
          prize: string
          required_roles: string[]
          status: string
          updated_at: string
          winners: string[]
          winners_count: number
        }
        Insert: {
          blacklisted_roles?: string[]
          bonus_entries?: Json
          channel_id?: string | null
          created_at?: string
          ends_at: string
          entries?: string[]
          guild_id: string
          host_id?: string | null
          id?: string
          message_id?: string | null
          min_account_age_days?: number
          prize: string
          required_roles?: string[]
          status?: string
          updated_at?: string
          winners?: string[]
          winners_count?: number
        }
        Update: {
          blacklisted_roles?: string[]
          bonus_entries?: Json
          channel_id?: string | null
          created_at?: string
          ends_at?: string
          entries?: string[]
          guild_id?: string
          host_id?: string | null
          id?: string
          message_id?: string | null
          min_account_age_days?: number
          prize?: string
          required_roles?: string[]
          status?: string
          updated_at?: string
          winners?: string[]
          winners_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "giveaways_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      guild_configs: {
        Row: {
          created_at: string
          enabled: boolean
          guild_id: string
          module: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          guild_id: string
          module: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          guild_id?: string
          module?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guild_configs_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_stats_daily: {
        Row: {
          antinuke_events: number
          antiraid_events: number
          automod_triggers: number
          bans: number
          commands_used: number
          day: string
          guild_id: string
          joins: number
          kicks: number
          leaves: number
          messages: number
          mutes: number
          warns: number
        }
        Insert: {
          antinuke_events?: number
          antiraid_events?: number
          automod_triggers?: number
          bans?: number
          commands_used?: number
          day: string
          guild_id: string
          joins?: number
          kicks?: number
          leaves?: number
          messages?: number
          mutes?: number
          warns?: number
        }
        Update: {
          antinuke_events?: number
          antiraid_events?: number
          automod_triggers?: number
          bans?: number
          commands_used?: number
          day?: string
          guild_id?: string
          joins?: number
          kicks?: number
          leaves?: number
          messages?: number
          mutes?: number
          warns?: number
        }
        Relationships: [
          {
            foreignKeyName: "guild_stats_daily_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          blacklisted: boolean
          bot_present: boolean
          channel_count: number
          created_at: string
          icon: string | null
          id: string
          last_seen_at: string | null
          member_count: number
          name: string
          owner_id: string | null
          premium: boolean
          role_count: number
          setup_completed: boolean
          updated_at: string
        }
        Insert: {
          blacklisted?: boolean
          bot_present?: boolean
          channel_count?: number
          created_at?: string
          icon?: string | null
          id: string
          last_seen_at?: string | null
          member_count?: number
          name?: string
          owner_id?: string | null
          premium?: boolean
          role_count?: number
          setup_completed?: boolean
          updated_at?: string
        }
        Update: {
          blacklisted?: boolean
          bot_present?: boolean
          channel_count?: number
          created_at?: string
          icon?: string | null
          id?: string
          last_seen_at?: string | null
          member_count?: number
          name?: string
          owner_id?: string | null
          premium?: boolean
          role_count?: number
          setup_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      lockdowns: {
        Row: {
          active: boolean
          channel_ids: string[]
          created_at: string
          ends_at: string | null
          guild_id: string
          id: string
          mode: string
          reason: string | null
          scope: string
          started_by: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          channel_ids?: string[]
          created_at?: string
          ends_at?: string | null
          guild_id: string
          id?: string
          mode: string
          reason?: string | null
          scope?: string
          started_by?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          channel_ids?: string[]
          created_at?: string
          ends_at?: string | null
          guild_id?: string
          id?: string
          mode?: string
          reason?: string | null
          scope?: string
          started_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lockdowns_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      log_events: {
        Row: {
          actor_id: string | null
          category: string
          channel_id: string | null
          created_at: string
          data: Json
          event_type: string
          guild_id: string
          id: string
          summary: string | null
          target_id: string | null
        }
        Insert: {
          actor_id?: string | null
          category: string
          channel_id?: string | null
          created_at?: string
          data?: Json
          event_type: string
          guild_id: string
          id?: string
          summary?: string | null
          target_id?: string | null
        }
        Update: {
          actor_id?: string | null
          category?: string
          channel_id?: string | null
          created_at?: string
          data?: Json
          event_type?: string
          guild_id?: string
          id?: string
          summary?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_events_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      member_economy: {
        Row: {
          balance: number
          bank: number
          guild_id: string
          inventory: Json
          last_daily_at: string | null
          last_weekly_at: string | null
          last_work_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          bank?: number
          guild_id: string
          inventory?: Json
          last_daily_at?: string | null
          last_weekly_at?: string | null
          last_work_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          bank?: number
          guild_id?: string
          inventory?: Json
          last_daily_at?: string | null
          last_weekly_at?: string | null
          last_work_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_economy_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      member_levels: {
        Row: {
          guild_id: string
          last_xp_at: string | null
          level: number
          messages: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          guild_id: string
          last_xp_at?: string | null
          level?: number
          messages?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          guild_id?: string
          last_xp_at?: string | null
          level?: number
          messages?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_levels_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_cases: {
        Row: {
          action: string
          active: boolean
          case_number: number
          created_at: string
          duration_seconds: number | null
          expires_at: string | null
          guild_id: string
          id: string
          metadata: Json
          moderator_id: string
          moderator_tag: string | null
          reason: string | null
          source: string
          target_id: string
          target_tag: string | null
          updated_at: string
        }
        Insert: {
          action: string
          active?: boolean
          case_number: number
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          guild_id: string
          id?: string
          metadata?: Json
          moderator_id: string
          moderator_tag?: string | null
          reason?: string | null
          source?: string
          target_id: string
          target_tag?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          active?: boolean
          case_number?: number
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          guild_id?: string
          id?: string
          metadata?: Json
          moderator_id?: string
          moderator_tag?: string | null
          reason?: string | null
          source?: string
          target_id?: string
          target_tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mod_cases_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      mod_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          guild_id: string
          id: string
          user_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          guild_id: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          guild_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mod_notes_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      role_panels: {
        Row: {
          allow_removal: boolean
          channel_id: string | null
          color: string | null
          created_at: string
          description: string | null
          guild_id: string
          id: string
          max_roles: number | null
          message_id: string | null
          name: string
          options: Json
          panel_type: string
          published: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          allow_removal?: boolean
          channel_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          guild_id: string
          id?: string
          max_roles?: number | null
          message_id?: string | null
          name: string
          options?: Json
          panel_type?: string
          published?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          allow_removal?: boolean
          channel_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          guild_id?: string
          id?: string
          max_roles?: number | null
          message_id?: string | null
          name?: string
          options?: Json
          panel_type?: string
          published?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_panels_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          action_taken: string | null
          actor_id: string | null
          actor_tag: string | null
          created_at: string
          details: Json
          event_type: string
          guild_id: string
          id: string
          resolved: boolean
          severity: string
          system: string
        }
        Insert: {
          action_taken?: string | null
          actor_id?: string | null
          actor_tag?: string | null
          created_at?: string
          details?: Json
          event_type: string
          guild_id: string
          id?: string
          resolved?: boolean
          severity?: string
          system: string
        }
        Update: {
          action_taken?: string | null
          actor_id?: string | null
          actor_tag?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          guild_id?: string
          id?: string
          resolved?: boolean
          severity?: string
          system?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_events_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          guild_id: string
          id: string
          name: string
          price: number
          role_reward: string | null
          stock: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          guild_id: string
          id?: string
          name: string
          price?: number
          role_reward?: string | null
          stock?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          guild_id?: string
          id?: string
          name?: string
          price?: number
          role_reward?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      starboard_entries: {
        Row: {
          author_id: string | null
          channel_id: string | null
          created_at: string
          guild_id: string
          id: string
          source_message_id: string
          star_count: number
          starboard_message_id: string | null
        }
        Insert: {
          author_id?: string | null
          channel_id?: string | null
          created_at?: string
          guild_id: string
          id?: string
          source_message_id: string
          star_count?: number
          starboard_message_id?: string | null
        }
        Update: {
          author_id?: string | null
          channel_id?: string | null
          created_at?: string
          guild_id?: string
          id?: string
          source_message_id?: string
          star_count?: number
          starboard_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "starboard_entries_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          author_id: string
          content: string
          created_at: string
          downvotes: number
          guild_id: string
          handled_by: string | null
          id: string
          message_id: string | null
          staff_note: string | null
          status: string
          suggestion_number: number
          updated_at: string
          upvotes: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          downvotes?: number
          guild_id: string
          handled_by?: string | null
          id?: string
          message_id?: string | null
          staff_note?: string | null
          status?: string
          suggestion_number: number
          updated_at?: string
          upvotes?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          downvotes?: number
          guild_id?: string
          handled_by?: string | null
          id?: string
          message_id?: string | null
          staff_note?: string | null
          status?: string
          suggestion_number?: number
          updated_at?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_panels: {
        Row: {
          auto_close_hours: number | null
          button_label: string
          category_id: string | null
          channel_id: string | null
          created_at: string
          description: string | null
          guild_id: string
          id: string
          message_id: string | null
          name: string
          naming_scheme: string
          published: boolean
          staff_roles: string[]
          title: string | null
          transcript_channel_id: string | null
          updated_at: string
        }
        Insert: {
          auto_close_hours?: number | null
          button_label?: string
          category_id?: string | null
          channel_id?: string | null
          created_at?: string
          description?: string | null
          guild_id: string
          id?: string
          message_id?: string | null
          name: string
          naming_scheme?: string
          published?: boolean
          staff_roles?: string[]
          title?: string | null
          transcript_channel_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_close_hours?: number | null
          button_label?: string
          category_id?: string | null
          channel_id?: string | null
          created_at?: string
          description?: string | null
          guild_id?: string
          id?: string
          message_id?: string | null
          name?: string
          naming_scheme?: string
          published?: boolean
          staff_roles?: string[]
          title?: string | null
          transcript_channel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_panels_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          channel_id: string | null
          claimed_by: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          guild_id: string
          id: string
          opener_id: string
          panel_id: string | null
          participants: string[]
          status: string
          subject: string | null
          ticket_number: number
          transcript: string | null
          updated_at: string
        }
        Insert: {
          channel_id?: string | null
          claimed_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          guild_id: string
          id?: string
          opener_id: string
          panel_id?: string | null
          participants?: string[]
          status?: string
          subject?: string | null
          ticket_number: number
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          channel_id?: string | null
          claimed_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          guild_id?: string
          id?: string
          opener_id?: string
          panel_id?: string | null
          participants?: string[]
          status?: string
          subject?: string | null
          ticket_number?: number
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "ticket_panels"
            referencedColumns: ["id"]
          },
        ]
      }
      warnings: {
        Row: {
          case_id: string | null
          cleared: boolean
          created_at: string
          expires_at: string | null
          guild_id: string
          id: string
          moderator_id: string
          points: number
          reason: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          cleared?: boolean
          created_at?: string
          expires_at?: string | null
          guild_id: string
          id?: string
          moderator_id: string
          points?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          cleared?: boolean
          created_at?: string
          expires_at?: string | null
          guild_id?: string
          id?: string
          moderator_id?: string
          points?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warnings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mod_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelists: {
        Row: {
          added_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          guild_id: string
          id: string
          label: string | null
          scope: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          guild_id: string
          id?: string
          label?: string | null
          scope: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          guild_id?: string
          id?: string
          label?: string | null
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelists_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_case_number: { Args: { p_guild: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
