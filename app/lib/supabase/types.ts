// ─── Supabase Database 型定義 ────────────────────────────────────────────────
// docs/supabase-schema.sql のテーブル定義に対応する型。
// 実際のSupabaseプロジェクトに接続する際は、Supabase CLIの
// `supabase gen types typescript` で自動生成した型に置き換えることを推奨する。
// ここでは repository層のビルドを通すための最小限の型を手動定義している。

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; name: string; created_at: string; updated_at: string };
        Insert: { id: string; name: string };
        Update: Partial<{ name: string }>;
        Relationships: [];
      };
      teams: {
        Row: { id: string; name: string; created_at: string };
        Insert: { name: string };
        Update: Partial<{ name: string }>;
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string; team_id: string; user_id: string;
          department_id: string | null; role_id: string | null; shift_id: string | null;
          permission: "admin" | "leader" | "member" | "viewer";
          created_at: string;
        };
        Insert: {
          team_id: string; user_id: string;
          department_id?: string | null; role_id?: string | null; shift_id?: string | null;
          permission?: "admin" | "leader" | "member" | "viewer";
        };
        Update: Partial<{ department_id: string | null; role_id: string | null; shift_id: string | null; permission: string }>;
        Relationships: [];
      };
      departments: {
        Row: { id: string; team_id: string; name: string; created_at: string };
        Insert: { team_id: string; name: string };
        Update: Partial<{ name: string }>;
        Relationships: [];
      };
      roles: {
        Row: { id: string; team_id: string; name: string; created_at: string };
        Insert: { team_id: string; name: string };
        Update: Partial<{ name: string }>;
        Relationships: [];
      };
      shifts: {
        Row: { id: string; team_id: string; name: string; sort_order: number; created_at: string };
        Insert: { team_id: string; name: string; sort_order?: number };
        Update: Partial<{ name: string; sort_order: number }>;
        Relationships: [];
      };
      work_logs: {
        Row: {
          id: string; team_id: string; author_id: string; shift_id: string | null;
          content: string; next_assignee_id: string | null; self_priority: string;
          handover_count: number; industry: string | null; created_at: string;
        };
        Insert: {
          team_id: string; author_id: string; shift_id?: string | null;
          content: string; next_assignee_id?: string | null; self_priority: string;
          handover_count?: number; industry?: string | null;
        };
        Update: Partial<{ handover_count: number }>;
        Relationships: [];
      };
      handovers: {
        Row: {
          id: string; team_id: string; work_log_id: string | null;
          category: string; kind: string; read_requirement: string;
          title: string; content: string; priority: string; confidence: string;
          source_excerpt: string | null; assignee_id: string | null; author_id: string;
          status: string; created_at: string; completed_at: string | null;
        };
        Insert: {
          team_id: string; work_log_id?: string | null;
          category: string; kind: string; read_requirement: string;
          title: string; content: string; priority: string; confidence: string;
          source_excerpt?: string | null; assignee_id?: string | null; author_id: string;
          status?: string;
        };
        Update: Partial<{ status: string; completed_at: string | null }>;
        Relationships: [];
      };
      handover_audiences: {
        Row: {
          id: string; handover_id: string; audience_type: string;
          target_department_id: string | null; target_user_id: string | null;
          target_role_id: string | null; target_shift_id: string | null;
          label: string; created_at: string;
        };
        Insert: {
          handover_id: string; audience_type: string;
          target_department_id?: string | null; target_user_id?: string | null;
          target_role_id?: string | null; target_shift_id?: string | null;
          label: string;
        };
        Update: Partial<{ label: string }>;
        Relationships: [];
      };
      read_receipts: {
        Row: {
          id: string; handover_id: string; user_id: string;
          read_at: string | null; confirmed_at: string | null; created_at: string;
        };
        Insert: { handover_id: string; user_id: string; read_at?: string | null; confirmed_at?: string | null };
        Update: Partial<{ read_at: string | null; confirmed_at: string | null }>;
        Relationships: [];
      };
      handover_comments: {
        Row: { id: string; handover_id: string; author_id: string; body: string; created_at: string };
        Insert: { handover_id: string; author_id: string; body: string };
        Update: never;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string; team_id: string; handover_id: string;
          title: string; description: string | null; assignee_id: string | null;
          author_id: string; priority: string; status: string;
          due_date: string | null; created_at: string; completed_at: string | null;
        };
        Insert: {
          team_id: string; handover_id: string;
          title: string; description?: string | null; assignee_id?: string | null;
          author_id: string; priority: string; status?: string; due_date?: string | null;
        };
        Update: Partial<{ status: string; completed_at: string | null }>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string; team_id: string; name: string; file_type: string;
          category: string; tags: string[]; description: string | null;
          storage_path: string | null; file_size_bytes: number | null;
          uploaded_by: string | null; is_pinned: boolean;
          created_at: string; updated_at: string; last_opened_at: string | null;
        };
        Insert: {
          team_id: string; name: string; file_type: string;
          category: string; tags?: string[]; description?: string | null;
          storage_path?: string | null; file_size_bytes?: number | null;
          uploaded_by?: string | null; is_pinned?: boolean;
        };
        Update: Partial<{ is_pinned: boolean; last_opened_at: string | null; tags: string[] }>;
        Relationships: [];
      };
      document_links: {
        Row: { id: string; document_id: string; handover_id: string | null; task_id: string | null; created_at: string };
        Insert: { document_id: string; handover_id?: string | null; task_id?: string | null };
        Update: never;
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string; team_id: string; actor_id: string; action: string;
          target_type: string; target_id: string; metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          team_id: string; actor_id: string; action: string;
          target_type: string; target_id: string; metadata?: Record<string, unknown> | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
