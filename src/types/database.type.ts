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
      chat_conversations: {
        Row: {
          answer: string
          chat_id: string
          created_at: string
          id: string
          metadata: Json | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          chat_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          chat_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          last_interaction_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_interaction_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_interaction_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_draft: {
        Row: {
          content: string | null
          contract_id: string
          created_at: string
          id: string
          metadata: Json
          review_metadata: Json | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          contract_id: string
          created_at?: string
          id?: string
          metadata?: Json
          review_metadata?: Json | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          review_metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_draft_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_review: {
        Row: {
          content: string
          contract_id: string
          created_at: string
          fairness_score: number
          id: string
          metadata: Json
          total_clausul_risk: number
          updated_at: string
        }
        Insert: {
          content: string
          contract_id: string
          created_at?: string
          fairness_score: number
          id?: string
          metadata?: Json
          total_clausul_risk?: number
          updated_at?: string
        }
        Update: {
          content?: string
          contract_id?: string
          created_at?: string
          fairness_score?: number
          id?: string
          metadata?: Json
          total_clausul_risk?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_review_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_articles: {
        Row: {
          article_number: string
          book_title: string | null
          chapter_title: string | null
          content: string
          created_at: string
          embedding: string | null
          explanation: string | null
          id: string
          regulation_id: string
          section_title: string | null
          updated_at: string
        }
        Insert: {
          article_number: string
          book_title?: string | null
          chapter_title?: string | null
          content: string
          created_at?: string
          embedding?: string | null
          explanation?: string | null
          id?: string
          regulation_id: string
          section_title?: string | null
          updated_at?: string
        }
        Update: {
          article_number?: string
          book_title?: string | null
          chapter_title?: string | null
          content?: string
          created_at?: string
          embedding?: string | null
          explanation?: string | null
          id?: string
          regulation_id?: string
          section_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_articles_regulation_id_fkey"
            columns: ["regulation_id"]
            isOneToOne: false
            referencedRelation: "legal_regulations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_regulations: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          name: string
          official_source_url: string | null
          short_name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          id?: string
          name: string
          official_source_url?: string | null
          short_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          official_source_url?: string | null
          short_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_comment_draft: {
        Args: { target_contract_id: string }
        Returns: boolean
      }
      can_edit_draft: { Args: { target_contract_id: string }; Returns: boolean }
      can_view_draft: { Args: { target_contract_id: string }; Returns: boolean }
      create_draft_document: {
        Args: {
          p_content?: string
          p_metadata?: Json
          p_title: string
          p_user_id: string
        }
        Returns: Json
      }
      is_draft_owner: { Args: { target_contract_id: string }; Returns: boolean }
      is_workspace_editor: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      match_legal_articles: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          article_number: string
          book_title: string
          chapter_title: string
          code: string
          content: string
          explanation: string
          id: string
          name: string
          regulation_id: string
          section_title: string
          similarity: number
        }[]
      }
      save_chat_conversation: {
        Args: {
          p_answer: string
          p_chat_id?: string
          p_last_interaction_id?: string
          p_metadata?: Json
          p_question: string
          p_title?: string
          p_user_id: string
        }
        Returns: Json
      }
      upload_contract_review: {
        Args: {
          p_content?: string
          p_fairness_score?: number
          p_is_pinned?: boolean
          p_metadata?: Json
          p_title: string
          p_total_clausul_risk?: number
          p_type?: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      document_status: "draft" | "processing" | "review_ready" | "archived"
      draft_collaborator_role: "editor" | "commenter" | "viewer"
      draft_status: "private" | "shared" | "archived"
      finding_severity: "critical" | "attention" | "fair"
      member_role: "owner" | "editor" | "viewer"
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
    Enums: {
      document_status: ["draft", "processing", "review_ready", "archived"],
      draft_collaborator_role: ["editor", "commenter", "viewer"],
      draft_status: ["private", "shared", "archived"],
      finding_severity: ["critical", "attention", "fair"],
      member_role: ["owner", "editor", "viewer"],
    },
  },
} as const
