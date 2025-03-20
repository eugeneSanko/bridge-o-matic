export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      about_images: {
        Row: {
          alt_text: string
          created_at: string
          filename: string
          id: string
          section: string
          storage_path: string
        }
        Insert: {
          alt_text: string
          created_at?: string
          filename: string
          id?: string
          section: string
          storage_path: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          filename?: string
          id?: string
          section?: string
          storage_path?: string
        }
        Relationships: []
      }
      ai_analysis_results: {
        Row: {
          analysis: Json | null
          analysis_summary: string
          chain: string | null
          confidence_score: number | null
          contract_address: string | null
          created_at: string
          documentation_url: string | null
          fundamentals_score: number | null
          github_profile: string | null
          id: string
          market_activity_score: number | null
          project_name: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_rating_score: number | null
          risk_score: number
          sentiment_analysis: string | null
          social_media_handle: string | null
          social_sentiment_score: number | null
          value_opportunity_score: number | null
          volume_1h: number | null
          volume_24h: number | null
          wallet_address: string | null
          website_url: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_summary: string
          chain?: string | null
          confidence_score?: number | null
          contract_address?: string | null
          created_at?: string
          documentation_url?: string | null
          fundamentals_score?: number | null
          github_profile?: string | null
          id?: string
          market_activity_score?: number | null
          project_name: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_rating_score?: number | null
          risk_score: number
          sentiment_analysis?: string | null
          social_media_handle?: string | null
          social_sentiment_score?: number | null
          value_opportunity_score?: number | null
          volume_1h?: number | null
          volume_24h?: number | null
          wallet_address?: string | null
          website_url?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_summary?: string
          chain?: string | null
          confidence_score?: number | null
          contract_address?: string | null
          created_at?: string
          documentation_url?: string | null
          fundamentals_score?: number | null
          github_profile?: string | null
          id?: string
          market_activity_score?: number | null
          project_name?: string
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_rating_score?: number | null
          risk_score?: number
          sentiment_analysis?: string | null
          social_media_handle?: string | null
          social_sentiment_score?: number | null
          value_opportunity_score?: number | null
          volume_1h?: number | null
          volume_24h?: number | null
          wallet_address?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      alert_history: {
        Row: {
          alert_data: Json
          alert_id: string | null
          alert_type: string
          id: string
          status: string | null
          triggered_at: string
          user_id: string | null
        }
        Insert: {
          alert_data: Json
          alert_id?: string | null
          alert_type: string
          id?: string
          status?: string | null
          triggered_at?: string
          user_id?: string | null
        }
        Update: {
          alert_data?: Json
          alert_id?: string | null
          alert_type?: string
          id?: string
          status?: string | null
          triggered_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_alerts: {
        Row: {
          created_at: string
          enabled: boolean | null
          high_volume_enabled: boolean | null
          id: string
          market_cap_threshold: number | null
          social_sentiment_enabled: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          high_volume_enabled?: boolean | null
          id?: string
          market_cap_threshold?: number | null
          social_sentiment_enabled?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          high_volume_enabled?: boolean | null
          id?: string
          market_cap_threshold?: number | null
          social_sentiment_enabled?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_applications: {
        Row: {
          company_name: string | null
          contact_person: string
          created_at: string
          email: string
          id: string
          intended_use: string
          name: string
          status: string | null
        }
        Insert: {
          company_name?: string | null
          contact_person: string
          created_at?: string
          email: string
          id?: string
          intended_use: string
          name: string
          status?: string | null
        }
        Update: {
          company_name?: string | null
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          intended_use?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      bridge_currencies: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: number
          image: string | null
          name: string
          networks: Json | null
          symbol: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          image?: string | null
          name: string
          networks?: Json | null
          symbol: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: number
          image?: string | null
          name?: string
          networks?: Json | null
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bridge_rate_history: {
        Row: {
          created_at: string
          expires_at: string
          from_currency: string
          id: string
          rate: number
          reference_order_id: string | null
          to_currency: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          from_currency: string
          id?: string
          rate: number
          reference_order_id?: string | null
          to_currency: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          from_currency?: string
          id?: string
          rate?: number
          reference_order_id?: string | null
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridge_rate_history_reference_order_id_fkey"
            columns: ["reference_order_id"]
            isOneToOne: false
            referencedRelation: "bridge_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bridge_transactions: {
        Row: {
          amount: number
          cleanup_after: string | null
          client_metadata: Json | null
          created_at: string | null
          deleted_at: string | null
          deposit_address: string | null
          destination_address: string
          expiration_time: string | null
          ff_order_id: string | null
          ff_order_token: string | null
          from_currency: string
          id: string
          initial_rate: number | null
          rate_validated: boolean | null
          rate_validation_error: string | null
          status: string | null
          to_currency: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          cleanup_after?: string | null
          client_metadata?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          deposit_address?: string | null
          destination_address: string
          expiration_time?: string | null
          ff_order_id?: string | null
          ff_order_token?: string | null
          from_currency: string
          id?: string
          initial_rate?: number | null
          rate_validated?: boolean | null
          rate_validation_error?: string | null
          status?: string | null
          to_currency: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          cleanup_after?: string | null
          client_metadata?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          deposit_address?: string | null
          destination_address?: string
          expiration_time?: string | null
          ff_order_id?: string | null
          ff_order_token?: string | null
          from_currency?: string
          id?: string
          initial_rate?: number | null
          rate_validated?: boolean | null
          rate_validation_error?: string | null
          status?: string | null
          to_currency?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      collected_fees: {
        Row: {
          created_at: string | null
          fee_amount: number
          fee_type: string | null
          id: string
          input_mint: string | null
          order_id: string | null
          output_mint: string | null
          recipient_address: string
          status: string | null
          transaction_signature: string | null
        }
        Insert: {
          created_at?: string | null
          fee_amount: number
          fee_type?: string | null
          id?: string
          input_mint?: string | null
          order_id?: string | null
          output_mint?: string | null
          recipient_address: string
          status?: string | null
          transaction_signature?: string | null
        }
        Update: {
          created_at?: string | null
          fee_amount?: number
          fee_type?: string | null
          id?: string
          input_mint?: string | null
          order_id?: string | null
          output_mint?: string | null
          recipient_address?: string
          status?: string | null
          transaction_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collected_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_bridge_transactions: {
        Row: {
          amount: number
          client_metadata: Json | null
          created_at: string
          deposit_address: string
          destination_address: string
          ff_order_id: string
          ff_order_token: string
          from_currency: string
          id: string
          raw_api_response: Json | null
          status: string
          to_currency: string
        }
        Insert: {
          amount: number
          client_metadata?: Json | null
          created_at?: string
          deposit_address: string
          destination_address: string
          ff_order_id: string
          ff_order_token: string
          from_currency: string
          id?: string
          raw_api_response?: Json | null
          status?: string
          to_currency: string
        }
        Update: {
          amount?: number
          client_metadata?: Json | null
          created_at?: string
          deposit_address?: string
          destination_address?: string
          ff_order_id?: string
          ff_order_token?: string
          from_currency?: string
          id?: string
          raw_api_response?: Json | null
          status?: string
          to_currency?: string
        }
        Relationships: []
      }
      copy_trade_orders: {
        Row: {
          copy_trade_id: string
          created_at: string
          id: string
          order_id: string
        }
        Insert: {
          copy_trade_id: string
          created_at?: string
          id?: string
          order_id: string
        }
        Update: {
          copy_trade_id?: string
          created_at?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_trade_orders_copy_trade_id_fkey"
            columns: ["copy_trade_id"]
            isOneToOne: false
            referencedRelation: "copy_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_trade_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_trades: {
        Row: {
          copy_sell_enabled: boolean | null
          created_at: string | null
          id: string
          max_buy_amount: number
          selected_chain: string
          slippage: number
          target_wallet: string
          updated_at: string | null
          user_id: string | null
          wallet_tag: string
        }
        Insert: {
          copy_sell_enabled?: boolean | null
          created_at?: string | null
          id?: string
          max_buy_amount: number
          selected_chain: string
          slippage: number
          target_wallet: string
          updated_at?: string | null
          user_id?: string | null
          wallet_tag: string
        }
        Update: {
          copy_sell_enabled?: boolean | null
          created_at?: string | null
          id?: string
          max_buy_amount?: number
          selected_chain?: string
          slippage?: number
          target_wallet?: string
          updated_at?: string | null
          user_id?: string | null
          wallet_tag?: string
        }
        Relationships: []
      }
      currency_cache: {
        Row: {
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          data: Json
          id: number
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      jupiter_route_tracking: {
        Row: {
          amount_in: number
          amount_out: number
          created_at: string
          error_message: string | null
          execution_time: number | null
          id: string
          input_mint: string
          output_mint: string
          price_impact: number | null
          route_data: Json
          route_id: string
          slippage: number
          success: boolean
          user_id: string | null
        }
        Insert: {
          amount_in: number
          amount_out: number
          created_at?: string
          error_message?: string | null
          execution_time?: number | null
          id?: string
          input_mint: string
          output_mint: string
          price_impact?: number | null
          route_data?: Json
          route_id: string
          slippage: number
          success?: boolean
          user_id?: string | null
        }
        Update: {
          amount_in?: number
          amount_out?: number
          created_at?: string
          error_message?: string | null
          execution_time?: number | null
          id?: string
          input_mint?: string
          output_mint?: string
          price_impact?: number | null
          route_data?: Json
          route_id?: string
          slippage?: number
          success?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jupiter_route_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jupiter_routes: {
        Row: {
          created_at: string
          id: string
          in_amount: string
          market_infos: Json | null
          order_id: string | null
          other_amount_threshold: string | null
          out_amount: string
          platform_fee: Json | null
          price_impact_pct: number | null
          route_map: Json
          swap_mode: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          in_amount: string
          market_infos?: Json | null
          order_id?: string | null
          other_amount_threshold?: string | null
          out_amount: string
          platform_fee?: Json | null
          price_impact_pct?: number | null
          route_map: Json
          swap_mode?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          in_amount?: string
          market_infos?: Json | null
          order_id?: string | null
          other_amount_threshold?: string | null
          out_amount?: string
          platform_fee?: Json | null
          price_impact_pct?: number | null
          route_map?: Json
          swap_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jupiter_routes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      jupiter_tokens: {
        Row: {
          address: string
          chain_id: number
          created_at: string
          decimals: number
          is_native: boolean | null
          is_wrapped_sol: boolean | null
          logo_uri: string | null
          name: string
          symbol: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address: string
          chain_id?: number
          created_at?: string
          decimals: number
          is_native?: boolean | null
          is_wrapped_sol?: boolean | null
          logo_uri?: string | null
          name: string
          symbol: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string
          chain_id?: number
          created_at?: string
          decimals?: number
          is_native?: boolean | null
          is_wrapped_sol?: boolean | null
          logo_uri?: string | null
          name?: string
          symbol?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      liquidity_monitoring: {
        Row: {
          created_at: string
          id: string
          last_traded_price: number | null
          last_updated_at: string
          pool_address: string
          pool_fee_rate: number | null
          token_a_amount: number
          token_a_mint: string
          token_b_amount: number
          token_b_mint: string
          volume_24h: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_traded_price?: number | null
          last_updated_at?: string
          pool_address: string
          pool_fee_rate?: number | null
          token_a_amount: number
          token_a_mint: string
          token_b_amount: number
          token_b_mint: string
          volume_24h?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_traded_price?: number | null
          last_updated_at?: string
          pool_address?: string
          pool_fee_rate?: number | null
          token_a_amount?: number
          token_a_mint?: string
          token_b_amount?: number
          token_b_mint?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          compute_unit_limit: number | null
          created_at: string
          dynamic_slippage_report: Json | null
          execution_context: Json | null
          fee_amount: number | null
          id: string
          input_amount: number | null
          input_mint: string | null
          jupiter_compute_limit: number | null
          jupiter_in_amount: string | null
          jupiter_other_amount_threshold: string | null
          jupiter_out_amount: string | null
          jupiter_platform_fee: Json | null
          jupiter_price_impact: number | null
          jupiter_quote_id: string | null
          jupiter_route_id: string | null
          jupiter_route_priority: number | null
          jupiter_slippage: number | null
          jupiter_swap_mode: string | null
          jupiter_v6_quote: Json | null
          jupiter_v6_response: Json | null
          jupiter_version: string | null
          metadata: Json | null
          min_output_amount: number | null
          order_type: string | null
          output_amount: number | null
          output_mint: string | null
          pair: string
          platform_fee: number | null
          price: number
          priority_fee_lamports: number | null
          route_data: Json | null
          route_id: string | null
          route_info: Json | null
          side: string
          slippage: number | null
          source_wallet: string | null
          status: string
          swap_compute_units: number | null
          swap_mode: string | null
          swap_priority_fee_lamports: number | null
          total: number
          transaction_signature: string | null
          type: string
          user_email: string
          wallet_address: string | null
          wallet_version: string | null
        }
        Insert: {
          amount: number
          compute_unit_limit?: number | null
          created_at?: string
          dynamic_slippage_report?: Json | null
          execution_context?: Json | null
          fee_amount?: number | null
          id?: string
          input_amount?: number | null
          input_mint?: string | null
          jupiter_compute_limit?: number | null
          jupiter_in_amount?: string | null
          jupiter_other_amount_threshold?: string | null
          jupiter_out_amount?: string | null
          jupiter_platform_fee?: Json | null
          jupiter_price_impact?: number | null
          jupiter_quote_id?: string | null
          jupiter_route_id?: string | null
          jupiter_route_priority?: number | null
          jupiter_slippage?: number | null
          jupiter_swap_mode?: string | null
          jupiter_v6_quote?: Json | null
          jupiter_v6_response?: Json | null
          jupiter_version?: string | null
          metadata?: Json | null
          min_output_amount?: number | null
          order_type?: string | null
          output_amount?: number | null
          output_mint?: string | null
          pair: string
          platform_fee?: number | null
          price: number
          priority_fee_lamports?: number | null
          route_data?: Json | null
          route_id?: string | null
          route_info?: Json | null
          side: string
          slippage?: number | null
          source_wallet?: string | null
          status?: string
          swap_compute_units?: number | null
          swap_mode?: string | null
          swap_priority_fee_lamports?: number | null
          total: number
          transaction_signature?: string | null
          type: string
          user_email: string
          wallet_address?: string | null
          wallet_version?: string | null
        }
        Update: {
          amount?: number
          compute_unit_limit?: number | null
          created_at?: string
          dynamic_slippage_report?: Json | null
          execution_context?: Json | null
          fee_amount?: number | null
          id?: string
          input_amount?: number | null
          input_mint?: string | null
          jupiter_compute_limit?: number | null
          jupiter_in_amount?: string | null
          jupiter_other_amount_threshold?: string | null
          jupiter_out_amount?: string | null
          jupiter_platform_fee?: Json | null
          jupiter_price_impact?: number | null
          jupiter_quote_id?: string | null
          jupiter_route_id?: string | null
          jupiter_route_priority?: number | null
          jupiter_slippage?: number | null
          jupiter_swap_mode?: string | null
          jupiter_v6_quote?: Json | null
          jupiter_v6_response?: Json | null
          jupiter_version?: string | null
          metadata?: Json | null
          min_output_amount?: number | null
          order_type?: string | null
          output_amount?: number | null
          output_mint?: string | null
          pair?: string
          platform_fee?: number | null
          price?: number
          priority_fee_lamports?: number | null
          route_data?: Json | null
          route_id?: string | null
          route_info?: Json | null
          side?: string
          slippage?: number | null
          source_wallet?: string | null
          status?: string
          swap_compute_units?: number | null
          swap_mode?: string | null
          swap_priority_fee_lamports?: number | null
          total?: number
          transaction_signature?: string | null
          type?: string
          user_email?: string
          wallet_address?: string | null
          wallet_version?: string | null
        }
        Relationships: []
      }
      pool_creator_fees: {
        Row: {
          created_at: string | null
          deployment_fee_paid: boolean | null
          id: string
          payment_status: string | null
          pool_id: string | null
          tradenly_fee_paid: boolean | null
          transaction_signature: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deployment_fee_paid?: boolean | null
          id?: string
          payment_status?: string | null
          pool_id?: string | null
          tradenly_fee_paid?: boolean | null
          transaction_signature?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deployment_fee_paid?: boolean | null
          id?: string
          payment_status?: string | null
          pool_id?: string | null
          tradenly_fee_paid?: boolean | null
          transaction_signature?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_creator_fees_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "staking_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_participants: {
        Row: {
          created_at: string
          id: string
          pool_id: string | null
          staked_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pool_id?: string | null
          staked_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pool_id?: string | null
          staked_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_participants_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          apr: number | null
          created_at: string
          created_by: string
          id: string
          status: string | null
          token1_symbol: string
          token2_symbol: string
          tvl: number | null
          volume_24h: number | null
        }
        Insert: {
          apr?: number | null
          created_at?: string
          created_by: string
          id?: string
          status?: string | null
          token1_symbol: string
          token2_symbol: string
          tvl?: number | null
          volume_24h?: number | null
        }
        Update: {
          apr?: number | null
          created_at?: string
          created_by?: string
          id?: string
          status?: string | null
          token1_symbol?: string
          token2_symbol?: string
          tvl?: number | null
          volume_24h?: number | null
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          contract_address: string
          created_at: string
          enabled: boolean | null
          id: string
          market_cap_threshold: number | null
          price_change_percentage: number | null
          social_sentiment_enabled: boolean | null
          token_name: string
          user_id: string | null
          volume_threshold: number | null
        }
        Insert: {
          contract_address: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          market_cap_threshold?: number | null
          price_change_percentage?: number | null
          social_sentiment_enabled?: boolean | null
          token_name: string
          user_id?: string | null
          volume_threshold?: number | null
        }
        Update: {
          contract_address?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          market_cap_threshold?: number | null
          price_change_percentage?: number | null
          social_sentiment_enabled?: boolean | null
          token_name?: string
          user_id?: string | null
          volume_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          notification_preferences: Json | null
          updated_at: string
          username: string | null
          wallet_address: string | null
          wallet_connection_status: string | null
          wallet_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          notification_preferences?: Json | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_connection_status?: string | null
          wallet_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          notification_preferences?: Json | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_connection_status?: string | null
          wallet_type?: string | null
        }
        Relationships: []
      }
      staking_pool_periods: {
        Row: {
          apr: number
          created_at: string | null
          id: string
          lock_period_days: number
          pool_id: string
        }
        Insert: {
          apr: number
          created_at?: string | null
          id?: string
          lock_period_days: number
          pool_id: string
        }
        Update: {
          apr?: number
          created_at?: string | null
          id?: string
          lock_period_days?: number
          pool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staking_pool_periods_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "staking_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      staking_pools: {
        Row: {
          allow_dynamic_apr: boolean
          avg_stake_size: number
          claim_frequency: number
          created_at: string | null
          creator_wallet: string
          deploy_transaction_signature: string | null
          deployment_fee_paid: boolean | null
          deposit_transaction_signature: string | null
          fee_transaction_signature: string | null
          id: string
          is_default_pool: boolean | null
          is_deployment_live: boolean | null
          is_reward_pool_funded: boolean
          last_updated: string | null
          logo_url: string
          max_stake_size: number
          max_stakers: number
          min_stake_size: number
          pool_tvl: number | null
          reward_token_address: string
          reward_token_name: string
          smart_contract_address: string | null
          status: Database["public"]["Enums"]["pool_status"]
          token_contract_address: string
          token_name: string
          total_reward_pool: number
          total_rewards_distributed: number | null
          total_stakers: number | null
          updated_at: string | null
        }
        Insert: {
          allow_dynamic_apr?: boolean
          avg_stake_size?: number
          claim_frequency: number
          created_at?: string | null
          creator_wallet: string
          deploy_transaction_signature?: string | null
          deployment_fee_paid?: boolean | null
          deposit_transaction_signature?: string | null
          fee_transaction_signature?: string | null
          id?: string
          is_default_pool?: boolean | null
          is_deployment_live?: boolean | null
          is_reward_pool_funded?: boolean
          last_updated?: string | null
          logo_url: string
          max_stake_size?: number
          max_stakers: number
          min_stake_size?: number
          pool_tvl?: number | null
          reward_token_address: string
          reward_token_name: string
          smart_contract_address?: string | null
          status?: Database["public"]["Enums"]["pool_status"]
          token_contract_address: string
          token_name: string
          total_reward_pool: number
          total_rewards_distributed?: number | null
          total_stakers?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_dynamic_apr?: boolean
          avg_stake_size?: number
          claim_frequency?: number
          created_at?: string | null
          creator_wallet?: string
          deploy_transaction_signature?: string | null
          deployment_fee_paid?: boolean | null
          deposit_transaction_signature?: string | null
          fee_transaction_signature?: string | null
          id?: string
          is_default_pool?: boolean | null
          is_deployment_live?: boolean | null
          is_reward_pool_funded?: boolean
          last_updated?: string | null
          logo_url?: string
          max_stake_size?: number
          max_stakers?: number
          min_stake_size?: number
          pool_tvl?: number | null
          reward_token_address?: string
          reward_token_name?: string
          smart_contract_address?: string | null
          status?: Database["public"]["Enums"]["pool_status"]
          token_contract_address?: string
          token_name?: string
          total_reward_pool?: number
          total_rewards_distributed?: number | null
          total_stakers?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staking_positions: {
        Row: {
          amount: number
          created_at: string | null
          end_date: string
          id: string
          last_claim_date: string | null
          lock_period_days: number
          pool_id: string
          staker_wallet: string
          start_date: string | null
          status: Database["public"]["Enums"]["position_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          end_date: string
          id?: string
          last_claim_date?: string | null
          lock_period_days: number
          pool_id: string
          staker_wallet: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["position_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          end_date?: string
          id?: string
          last_claim_date?: string | null
          lock_period_days?: number
          pool_id?: string
          staker_wallet?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["position_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staking_positions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "staking_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_performance_metrics: {
        Row: {
          created_at: string
          execution_success: boolean
          gas_used: number | null
          id: string
          metadata: Json
          price_impact_percentage: number | null
          route_computation_time: number | null
          total_fee_cost: number | null
          trade_id: string | null
          transaction_signature: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          execution_success?: boolean
          gas_used?: number | null
          id?: string
          metadata?: Json
          price_impact_percentage?: number | null
          route_computation_time?: number | null
          total_fee_cost?: number | null
          trade_id?: string | null
          transaction_signature?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          execution_success?: boolean
          gas_used?: number | null
          id?: string
          metadata?: Json
          price_impact_percentage?: number | null
          route_computation_time?: number | null
          total_fee_cost?: number | null
          trade_id?: string | null
          transaction_signature?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_performance_metrics_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "jupiter_route_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tradenly_analysis_results: {
        Row: {
          analysis: Json | null
          analysis_summary: string
          chain: string
          confidence_score: number | null
          contract_address: string
          created_at: string
          documentation_url: string | null
          fundamentals_score: number | null
          github_profile: string | null
          holder_data: Json | null
          id: string
          market_activity_score: number | null
          on_chain_data: Json | null
          price_data: Json | null
          project_name: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_rating_score: number | null
          risk_score: number
          sentiment_analysis: string | null
          social_media_handle: string | null
          social_media_url: string | null
          social_sentiment_score: number | null
          token_stats: Json | null
          value_opportunity_score: number | null
          volume_1h: number | null
          volume_24h: number | null
          wallet_address: string | null
          website_url: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_summary: string
          chain: string
          confidence_score?: number | null
          contract_address: string
          created_at?: string
          documentation_url?: string | null
          fundamentals_score?: number | null
          github_profile?: string | null
          holder_data?: Json | null
          id?: string
          market_activity_score?: number | null
          on_chain_data?: Json | null
          price_data?: Json | null
          project_name: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_rating_score?: number | null
          risk_score: number
          sentiment_analysis?: string | null
          social_media_handle?: string | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          token_stats?: Json | null
          value_opportunity_score?: number | null
          volume_1h?: number | null
          volume_24h?: number | null
          wallet_address?: string | null
          website_url?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_summary?: string
          chain?: string
          confidence_score?: number | null
          contract_address?: string
          created_at?: string
          documentation_url?: string | null
          fundamentals_score?: number | null
          github_profile?: string | null
          holder_data?: Json | null
          id?: string
          market_activity_score?: number | null
          on_chain_data?: Json | null
          price_data?: Json | null
          project_name?: string
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_rating_score?: number | null
          risk_score?: number
          sentiment_analysis?: string | null
          social_media_handle?: string | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          token_stats?: Json | null
          value_opportunity_score?: number | null
          volume_1h?: number | null
          volume_24h?: number | null
          wallet_address?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      tradenly_v2_analysis_results: {
        Row: {
          analysis: Json | null
          analysis_context: string | null
          analysis_summary: string | null
          chain: string
          confidence_score: number | null
          contract_address: string
          created_at: string | null
          fundamentals_score: number | null
          id: string
          market_activity_score: number | null
          project_name: string
          risk_level: string | null
          risk_rating_score: number | null
          risk_score: number | null
          social_media_url: string | null
          social_sentiment_score: number | null
          value_opportunity_score: number | null
          wallet_address: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_context?: string | null
          analysis_summary?: string | null
          chain: string
          confidence_score?: number | null
          contract_address: string
          created_at?: string | null
          fundamentals_score?: number | null
          id?: string
          market_activity_score?: number | null
          project_name: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_context?: string | null
          analysis_summary?: string | null
          chain?: string
          confidence_score?: number | null
          contract_address?: string
          created_at?: string | null
          fundamentals_score?: number | null
          id?: string
          market_activity_score?: number | null
          project_name?: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      tradenly_v2_cardano_analysis_results: {
        Row: {
          analysis: Json | null
          analysis_context: string | null
          analysis_source: string | null
          analysis_summary: string | null
          asset_name: string | null
          chain: string
          confidence_score: number | null
          created_at: string | null
          fundamentals_score: number | null
          id: string
          market_activity_score: number | null
          policy_id: string
          project_name: string
          risk_level: string | null
          risk_rating_score: number | null
          risk_score: number | null
          social_media_url: string | null
          social_sentiment_score: number | null
          value_opportunity_score: number | null
          wallet_address: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_context?: string | null
          analysis_source?: string | null
          analysis_summary?: string | null
          asset_name?: string | null
          chain?: string
          confidence_score?: number | null
          created_at?: string | null
          fundamentals_score?: number | null
          id?: string
          market_activity_score?: number | null
          policy_id: string
          project_name: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_context?: string | null
          analysis_source?: string | null
          analysis_summary?: string | null
          asset_name?: string | null
          chain?: string
          confidence_score?: number | null
          created_at?: string | null
          fundamentals_score?: number | null
          id?: string
          market_activity_score?: number | null
          policy_id?: string
          project_name?: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      tradenly_v2_solana_analysis_results: {
        Row: {
          analysis: Json | null
          analysis_context: string | null
          analysis_summary: string | null
          chain: string
          confidence_score: number | null
          contract_address: string
          created_at: string | null
          fundamentals_score: number | null
          id: string
          market_activity_score: number | null
          project_name: string
          risk_level: string | null
          risk_rating_score: number | null
          risk_score: number | null
          social_media_url: string | null
          social_sentiment_score: number | null
          value_opportunity_score: number | null
          wallet_address: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_context?: string | null
          analysis_summary?: string | null
          chain: string
          confidence_score?: number | null
          contract_address: string
          created_at?: string | null
          fundamentals_score?: number | null
          id?: string
          market_activity_score?: number | null
          project_name: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_context?: string | null
          analysis_summary?: string | null
          chain?: string
          confidence_score?: number | null
          contract_address?: string
          created_at?: string | null
          fundamentals_score?: number | null
          id?: string
          market_activity_score?: number | null
          project_name?: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      tradenly_v3_analysis_results: {
        Row: {
          analysis: Json | null
          analysis_summary: string | null
          chain: string
          confidence_score: number
          contract_address: string
          created_at: string
          direction: string | null
          fundamentals_score: number | null
          holder_data: Json | null
          id: string
          market_activity_score: number | null
          on_chain_data: Json | null
          price_data: Json | null
          project_name: string
          risk_level: string | null
          risk_rating_score: number | null
          risk_score: number | null
          social_media_url: string | null
          social_sentiment_score: number | null
          token_stats: Json | null
          value_opportunity_score: number | null
          wallet_address: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_summary?: string | null
          chain: string
          confidence_score?: number
          contract_address: string
          created_at?: string
          direction?: string | null
          fundamentals_score?: number | null
          holder_data?: Json | null
          id?: string
          market_activity_score?: number | null
          on_chain_data?: Json | null
          price_data?: Json | null
          project_name: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          token_stats?: Json | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_summary?: string | null
          chain?: string
          confidence_score?: number
          contract_address?: string
          created_at?: string
          direction?: string | null
          fundamentals_score?: number | null
          holder_data?: Json | null
          id?: string
          market_activity_score?: number | null
          on_chain_data?: Json | null
          price_data?: Json | null
          project_name?: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          token_stats?: Json | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      tradenly_v3_api_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          source: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          source: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      tradenly_v3_solana_analysis_results: {
        Row: {
          analysis: Json | null
          analysis_summary: string | null
          chain: string
          confidence_score: number
          contract_address: string
          created_at: string
          direction: string | null
          fundamentals_score: number | null
          holder_data: Json | null
          id: string
          market_activity_score: number | null
          on_chain_data: Json | null
          project_name: string
          risk_level: string | null
          risk_rating_score: number | null
          risk_score: number | null
          social_media_url: string | null
          social_sentiment_score: number | null
          token_metadata: Json | null
          value_opportunity_score: number | null
          wallet_address: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_summary?: string | null
          chain?: string
          confidence_score?: number
          contract_address: string
          created_at?: string
          direction?: string | null
          fundamentals_score?: number | null
          holder_data?: Json | null
          id?: string
          market_activity_score?: number | null
          on_chain_data?: Json | null
          project_name: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          token_metadata?: Json | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_summary?: string | null
          chain?: string
          confidence_score?: number
          contract_address?: string
          created_at?: string
          direction?: string | null
          fundamentals_score?: number | null
          holder_data?: Json | null
          id?: string
          market_activity_score?: number | null
          on_chain_data?: Json | null
          project_name?: string
          risk_level?: string | null
          risk_rating_score?: number | null
          risk_score?: number | null
          social_media_url?: string | null
          social_sentiment_score?: number | null
          token_metadata?: Json | null
          value_opportunity_score?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      typescript_definitions: {
        Row: {
          content: string
          created_at: string | null
          file_path: string
          id: number
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_path: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_path?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_provider: string | null
          chain: string | null
          created_at: string
          id: string
          wallet_address: string
        }
        Insert: {
          auth_provider?: string | null
          chain?: string | null
          created_at?: string
          id?: string
          wallet_address: string
        }
        Update: {
          auth_provider?: string | null
          chain?: string | null
          created_at?: string
          id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_connections: {
        Row: {
          connected_at: string | null
          created_at: string | null
          disconnected_at: string | null
          id: string
          network: string | null
          public_key: string | null
          status: string | null
          user_id: string | null
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          id?: string
          network?: string | null
          public_key?: string | null
          status?: string | null
          user_id?: string | null
          wallet_address: string
          wallet_type: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          id?: string
          network?: string | null
          public_key?: string | null
          status?: string | null
          user_id?: string | null
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          auth_provider: string | null
          connected_at: string | null
          created_at: string
          disconnected_at: string | null
          id: number
          wallet_address: string | null
          wallet_connection_status: boolean | null
          wallet_type: string | null
        }
        Insert: {
          auth_provider?: string | null
          connected_at?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: number
          wallet_address?: string | null
          wallet_connection_status?: boolean | null
          wallet_type?: string | null
        }
        Update: {
          auth_provider?: string | null
          connected_at?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: number
          wallet_address?: string | null
          wallet_connection_status?: boolean | null
          wallet_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_bridge_transactions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_staking_pool: {
        Args: {
          creator_wallet_param: string
          token_name_param: string
          token_contract_address_param: string
          reward_token_name_param: string
          reward_token_address_param: string
          total_reward_pool_param: number
          max_stakers_param: number
          claim_frequency_param: number
          lock_periods_param: Json
          logo_url: string
        }
        Returns: {
          id: string
          status: string
        }[]
      }
      format_cardano_analysis_json: {
        Args: {
          analysis: Json
        }
        Returns: Json
      }
      get_token_analysis_status: {
        Args: {
          p_contract_address: string
          p_chain: string
        }
        Returns: {
          analysis_exists: boolean
          created_at: string
          is_recent: boolean
        }[]
      }
      get_token_v2_analysis_status: {
        Args: {
          p_contract_address: string
          p_chain: string
        }
        Returns: {
          analysis_exists: boolean
          created_at: string
          is_recent: boolean
        }[]
      }
      get_token_v2_cardano_analysis_status: {
        Args: {
          p_policy_id: string
        }
        Returns: {
          analysis_exists: boolean
          created_at: string
          is_recent: boolean
        }[]
      }
      get_token_v3_analysis_status: {
        Args: {
          p_contract_address: string
          p_chain: string
        }
        Returns: {
          analysis_exists: boolean
          created_at: string
          is_recent: boolean
        }[]
      }
      get_token_v3_solana_analysis_status: {
        Args: {
          p_contract_address: string
        }
        Returns: {
          analysis_exists: boolean
          created_at: string
          is_recent: boolean
        }[]
      }
    }
    Enums: {
      pool_status: "active" | "closed"
      position_status: "active" | "completed" | "withdrawn"
      risk_level: "low" | "medium" | "high"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
