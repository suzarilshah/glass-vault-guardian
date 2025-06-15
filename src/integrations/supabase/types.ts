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
      api_entries: {
        Row: {
          api_key_encrypted: string
          api_name: string | null
          api_secret_encrypted: string | null
          created_at: string
          description: string | null
          endpoint_url: string | null
          environment: string | null
          expires_at: string | null
          group_id: string | null
          id: string
          is_expired: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_name?: string | null
          api_secret_encrypted?: string | null
          created_at?: string
          description?: string | null
          endpoint_url?: string | null
          environment?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_expired?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_name?: string | null
          api_secret_encrypted?: string | null
          created_at?: string
          description?: string | null
          endpoint_url?: string | null
          environment?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_expired?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "api_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      api_groups: {
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
      api_histories: {
        Row: {
          api_key_encrypted: string
          api_secret_encrypted: string | null
          changed_at: string
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_secret_encrypted?: string | null
          changed_at?: string
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_secret_encrypted?: string | null
          changed_at?: string
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_histories_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "api_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_entries: {
        Row: {
          certificate_file_encrypted: string
          certificate_type: string | null
          common_name: string | null
          created_at: string
          environment: string | null
          expires_at: string | null
          group_id: string | null
          id: string
          is_expired: boolean | null
          issuer: string | null
          passphrase_encrypted: string | null
          private_key_encrypted: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_file_encrypted: string
          certificate_type?: string | null
          common_name?: string | null
          created_at?: string
          environment?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_expired?: boolean | null
          issuer?: string | null
          passphrase_encrypted?: string | null
          private_key_encrypted?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_file_encrypted?: string
          certificate_type?: string | null
          common_name?: string | null
          created_at?: string
          environment?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_expired?: boolean | null
          issuer?: string | null
          passphrase_encrypted?: string | null
          private_key_encrypted?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "certificate_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_groups: {
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
      certificate_histories: {
        Row: {
          certificate_file_encrypted: string
          changed_at: string
          entry_id: string
          id: string
          private_key_encrypted: string | null
          user_id: string
        }
        Insert: {
          certificate_file_encrypted: string
          changed_at?: string
          entry_id: string
          id?: string
          private_key_encrypted?: string | null
          user_id: string
        }
        Update: {
          certificate_file_encrypted?: string
          changed_at?: string
          entry_id?: string
          id?: string
          private_key_encrypted?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_histories_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "certificate_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      password_entries: {
        Row: {
          created_at: string
          expires_at: string | null
          group_id: string | null
          id: string
          is_expired: boolean | null
          notes: string | null
          password_encrypted: string
          title: string
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_expired?: boolean | null
          notes?: string | null
          password_encrypted: string
          title: string
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_expired?: boolean | null
          notes?: string | null
          password_encrypted?: string
          title?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "password_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      password_groups: {
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
      password_histories: {
        Row: {
          changed_at: string
          entry_id: string
          id: string
          password_encrypted: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          entry_id: string
          id?: string
          password_encrypted: string
          user_id: string
        }
        Update: {
          changed_at?: string
          entry_id?: string
          id?: string
          password_encrypted?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_histories_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "password_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deactivated_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_master_passwords: {
        Row: {
          created_at: string
          id: string
          master_password_hash: string
          updated_at: string
          use_unified_password: boolean | null
          user_id: string
          vault_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          master_password_hash: string
          updated_at?: string
          use_unified_password?: boolean | null
          user_id: string
          vault_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          master_password_hash?: string
          updated_at?: string
          use_unified_password?: boolean | null
          user_id?: string
          vault_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
