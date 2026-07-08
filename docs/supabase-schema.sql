-- ============================================================================
-- Rebio Supabase スキーマ設計（v12）
-- ============================================================================
-- このSQLは設計ドキュメントとして作成しており、v13での実装時に
-- Supabaseのマイグレーションとして適用することを想定している。
-- 型は app/types/index.ts の既存型（v11時点）と対応させている。
-- ============================================================================

-- ─── 拡張機能 ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── profiles（Supabase Authのuserと1:1） ───────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── teams（現場単位。1施設・1店舗など） ─────────────────────────────────────
create table teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ─── team_members（ユーザーとチームの所属関係） ──────────────────────────────
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  department_id uuid references departments(id),
  role_id uuid references roles(id),
  shift_id uuid references shifts(id),
  -- team内での権限。Rebio独自の"role"（スタッフ/リーダー/管理者など）とは別に
  -- システム権限としてこちらを使う（admin/leader/member/viewer）。
  permission text not null default 'member'
    check (permission in ('admin', 'leader', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- ─── departments（部署。チームごとに自由設定） ───────────────────────────────
create table departments (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ─── roles（役職。チームごとに自由設定） ─────────────────────────────────────
create table roles (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ─── shifts（シフト。チームごとに自由設定） ──────────────────────────────────
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,       -- 例: "早番", "日勤", "遅番", "夜勤"
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- team_members の外部キーは departments/roles/shifts 定義後に追加する
alter table team_members
  add constraint team_members_department_fk foreign key (department_id) references departments(id),
  add constraint team_members_role_fk foreign key (role_id) references roles(id),
  add constraint team_members_shift_fk foreign key (shift_id) references shifts(id);

-- ─── work_logs（勤務ログ） ───────────────────────────────────────────────────
create table work_logs (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  author_id uuid not null references profiles(id),
  shift_id uuid references shifts(id),
  content text not null,
  next_assignee_id uuid references profiles(id),  -- 後方互換：個人宛ての既定値
  self_priority text not null check (self_priority in ('urgent', 'high', 'medium', 'low')),
  handover_count int not null default 0,
  industry text,
  created_at timestamptz not null default now()
);

-- ─── handovers（申し送り） ───────────────────────────────────────────────────
create table handovers (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  work_log_id uuid references work_logs(id) on delete set null,
  category text not null check (category in ('task', 'caution', 'report', 'note')),
  kind text not null check (kind in ('share', 'check', 'action')),
  read_requirement text not null check (read_requirement in ('none', 'read', 'confirm')),
  title text not null,
  content text not null,
  priority text not null check (priority in ('urgent', 'high', 'medium', 'low')),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  source_excerpt text,
  assignee_id uuid references profiles(id),  -- 後方互換：個人宛ての既定値
  author_id uuid not null references profiles(id),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ─── handover_audiences（送信対象。1申し送りに複数行） ───────────────────────
create table handover_audiences (
  id uuid primary key default uuid_generate_v4(),
  handover_id uuid not null references handovers(id) on delete cascade,
  audience_type text not null check (audience_type in ('all', 'department', 'user', 'role', 'shift')),
  -- typeに応じて該当IDを1つ格納する。全体(all)の場合はnull。
  target_department_id uuid references departments(id),
  target_user_id uuid references profiles(id),
  target_role_id uuid references roles(id),
  target_shift_id uuid references shifts(id),
  label text not null,  -- 表示用ラベルのスナップショット
  created_at timestamptz not null default now()
);

-- ─── read_receipts（既読・確認の記録。対象ユーザー1人につき1行） ─────────────
create table read_receipts (
  id uuid primary key default uuid_generate_v4(),
  handover_id uuid not null references handovers(id) on delete cascade,
  user_id uuid not null references profiles(id),
  read_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (handover_id, user_id)
);

-- ─── handover_comments（申し送りへの補足コメント） ───────────────────────────
-- 返信・スレッド・リアクション・メンションは意図的に持たせない。
create table handover_comments (
  id uuid primary key default uuid_generate_v4(),
  handover_id uuid not null references handovers(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ─── tasks（タスク。「対応が必要」な申し送りからのみ生成） ───────────────────
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  handover_id uuid not null references handovers(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references profiles(id),
  author_id uuid not null references profiles(id),
  priority text not null check (priority in ('urgent', 'high', 'medium', 'low')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed')),
  due_date date,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ─── documents（書類メタデータ。実ファイルはv14でStorageに保存） ─────────────
create table documents (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  file_type text not null check (file_type in ('pdf', 'excel', 'word', 'pptx', 'csv', 'image')),
  category text not null,
  tags text[] not null default '{}',
  description text,
  storage_path text,           -- v14で使用。Supabase Storage上のパス
  file_size_bytes bigint,       -- v14で使用
  uploaded_by uuid references profiles(id),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz
);

-- ─── document_links（書類と申し送り/タスクの紐づけ） ─────────────────────────
create table document_links (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  handover_id uuid references handovers(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint document_links_target_check check (
    (handover_id is not null and task_id is null) or
    (handover_id is null and task_id is not null)
  )
);

-- ─── activity_logs（軽い履歴。v15で使用） ────────────────────────────────────
create table activity_logs (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  actor_id uuid not null references profiles(id),
  action text not null check (action in (
    'handover_created', 'handover_confirmed', 'handover_in_progress',
    'handover_completed', 'comment_added', 'document_added', 'document_deleted'
  )),
  target_type text not null check (target_type in ('handover', 'task', 'document', 'comment')),
  target_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ─── インデックス ────────────────────────────────────────────────────────────
create index idx_handovers_team on handovers(team_id);
create index idx_handovers_status on handovers(status);
create index idx_handover_audiences_handover on handover_audiences(handover_id);
create index idx_read_receipts_handover on read_receipts(handover_id);
create index idx_read_receipts_user on read_receipts(user_id);
create index idx_tasks_team on tasks(team_id);
create index idx_tasks_status on tasks(status);
create index idx_documents_team on documents(team_id);
create index idx_document_links_document on document_links(document_id);
create index idx_activity_logs_team on activity_logs(team_id);
create index idx_activity_logs_target on activity_logs(target_type, target_id);
