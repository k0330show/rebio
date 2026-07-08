// 申し送りの確認要求レベル
// none    = 共有のみ（読めば十分、対応ステータスは前面に出さない）
// read    = 既読のみ（読んだことだけ分かればよい）
// confirm = 確認必須（内容を確認したことを明示的にチェックしてほしい）
export type ReadRequirement = "none" | "read" | "confirm";

// 申し送りの性質
// share  = 共有のみ（対応不要）
// check  = 確認してほしい（既読・確認は必要だが対応タスクではない）
// action = 対応が必要（タスク化される）
export type HandoverKind = "share" | "check" | "action";

// 重要度
export type Priority = "urgent" | "high" | "medium" | "low";

// 信頼度
export type Confidence = "high" | "medium" | "low";

// カテゴリ
export type Category = "task" | "caution" | "report" | "note";

// レビューステータス
export type ReviewStatus = "pending" | "confirmed" | "editing" | "dismissed";

// 申し送り登録ステータス
export type HandoverStatus = "open" | "in_progress" | "completed";

// タスクステータス
export type TaskStatus = "todo" | "in_progress" | "completed";

// 勤務種別
export type ShiftType =
  | "day"
  | "evening"
  | "night"
  | "early"
  | "late"
  | "other";

// 業種
export type Industry =
  | "healthcare"
  | "security"
  | "retail"
  | "logistics"
  | "general";

// ─── 送信対象・組織マスタ（v11） ────────────────────────────────────────────
// localStorageベースのMVPのため、ユーザー・部署・役職はデモ用の固定マスタとして扱う。
// 管理画面や権限管理は今回のスコープに含めない。

export interface OrgUser {
  id: string;
  name: string;
  departmentId: string;
  roleId: string;
  shiftType: ShiftType;
}

export interface Department {
  id: string;
  name: string;
}

export interface OrgRole {
  id: string;
  name: string;
}

// 送信対象の種類
// all        = 全体向け
// department = 部署宛て
// user       = 個人宛て
// role       = 役職宛て
// shift      = シフト宛て
export type AudienceType = "all" | "department" | "user" | "role" | "shift";

// 送信対象。1件の申し送りに複数指定できる（例：夜勤チーム + 管理者）。
export interface HandoverAudience {
  type: AudienceType;
  ids: string[];  // typeがallの場合は空配列
  label: string;  // 表示用ラベル（生成時点のスナップショット）
}

// 既読・確認の記録（対象ユーザー1人につき1件）
export interface ReadReceipt {
  userId: string;
  userName: string;
  readAt?: string;
  confirmedAt?: string;
}

// 申し送りへの補足コメント（チャットではない。返信・スレッド・リアクションは持たない）
export interface HandoverComment {
  id: string;
  handoverId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

// コメント用クイック定型文
export const COMMENT_QUICK_PHRASES = [
  "確認しました",
  "明日対応します",
  "管理者に報告済みです",
  "詳細を追記します",
] as const;

// 送信対象種別のラベル
export const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  all: "全体",
  department: "部署",
  user: "個人",
  role: "役職",
  shift: "シフト",
};

// 勤務ログ入力
export interface WorkLog {
  id: string;
  shiftType: ShiftType;
  content: string;
  nextAssignee: string;
  selfPriority: Priority;
  createdAt: string;
  author: string;
  handoverCount?: number; // 生成された申し送り件数
  industry?: Industry;
  audiences?: HandoverAudience[]; // v11: このログから生成される申し送りの送信対象（未指定なら個人=nextAssignee）
}

// AI生成の申し送り候補
export interface HandoverCandidate {
  id: string;
  logId: string;
  category: Category;
  kind: HandoverKind;             // 共有のみ / 確認してほしい / 対応が必要
  readRequirement: ReadRequirement;
  title: string;
  content: string;
  priority: Priority;
  confidence: Confidence;
  sourceExcerpt: string; // 元ログの該当箇所
  reviewStatus: ReviewStatus;
  editedContent?: string;
  editedPriority?: Priority;
  audiences?: HandoverAudience[]; // v11: 送信対象（未指定ならログのnextAssigneeへの個人宛てとして扱う）
}

// v15: 軽量な履歴（activity_logs相当）。UIは重くせず、申し送り詳細の下部に小さく表示する程度に使う。
export type ActivityAction =
  | "handover_created"
  | "handover_confirmed"
  | "handover_in_progress"
  | "handover_completed"
  | "comment_added"
  | "document_added"
  | "document_deleted";

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  handover_created: "共有した",
  handover_confirmed: "確認した",
  handover_in_progress: "対応中にした",
  handover_completed: "解決した",
  comment_added: "補足した",
  document_added: "書類を追加した",
  document_deleted: "書類を削除した",
};

export interface ActivityLog {
  id: string;
  targetType: "handover" | "task" | "document" | "comment";
  targetId: string;
  action: ActivityAction;
  actorName: string;
  createdAt: string;
}

// 登録済み申し送り
export interface Handover {
  id: string;
  logId: string;
  category: Category;
  kind: HandoverKind;
  readRequirement: ReadRequirement;
  title: string;
  content: string;
  priority: Priority;
  confidence: Confidence;
  sourceExcerpt: string;
  assignee: string;        // 既存の単一担当者名。後方互換のため維持。
  author: string;
  status: HandoverStatus;
  isRead?: boolean;        // 既読フラグ（read/confirm時のみ意味を持つ）。個人宛て運用の名残として維持。
  isConfirmed?: boolean;   // 確認済みフラグ（confirm時のみ意味を持つ）。同上。
  createdAt: string;
  completedAt?: string;
  // v11: 送信対象・既読確認集計・コメント。新しいUIではこちらを優先して使う。
  audiences?: HandoverAudience[];
  receipts?: ReadReceipt[];
  comments?: HandoverComment[];
}

// タスク
export interface Task {
  id: string;
  handoverId: string;
  title: string;
  description: string;
  assignee: string;
  author: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // ISO date string (date only)
  createdAt: string;
  completedAt?: string;
  sourceHandoverTitle: string;
}

// ラベルマッピング
export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const HANDOVER_KIND_LABELS: Record<HandoverKind, string> = {
  share:  "共有事項",
  check:  "確認してほしい",
  action: "対応が必要",
};

export const READ_REQUIREMENT_LABELS: Record<ReadRequirement, string> = {
  none:    "既読確認なし",
  read:    "既読のみ",
  confirm: "確認必須",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  task: "タスク候補",
  caution: "注意事項",
  report: "報告事項",
  note: "通常記録",
};

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  day: "日勤",
  evening: "準夜勤",
  night: "夜勤",
  early: "早番",
  late: "遅番",
  other: "その他",
};

export const HANDOVER_STATUS_LABELS: Record<HandoverStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  completed: "完了",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "対応中",
  completed: "完了",
};

export const INDUSTRY_LABELS: Record<Industry, string> = {
  healthcare: "医療・介護",
  security: "警備",
  retail: "小売・販売",
  logistics: "物流・倉庫",
  general: "一般事務",
};

// ─── Library（業務書類） ────────────────────────────────────────────────────

export type FileType = "pdf" | "image" | "csv" | "excel" | "word" | "pptx";

export interface LibraryDoc {
  id: string;
  name: string;              // ファイル名
  fileType: FileType;
  category: string;          // 自由設定カテゴリ
  tags: string[];            // 自由設定タグ
  description: string;       // 説明文
  author: string;
  updatedAt: string;
  createdAt: string;
  isPinned: boolean;
  lastOpenedAt?: string;
  relatedHandoverIds: string[];
  relatedTaskIds: string[];
  mockContent: LibraryMockContent; // プレビュー用モックデータ（デモ書類用）
  // v14: 実ファイルアップロード対応（Supabaseモードのみ有効）
  isUploaded?: boolean;       // trueの場合、実ファイルがStorageに存在する
  storagePath?: string;       // Supabase Storage上のパス
  fileSizeBytes?: number;     // ファイルサイズ（バイト）
  publicUrl?: string;         // 表示・ダウンロード用URL（Supabaseモードのみ）
}

// ファイル種別ごとのモックコンテンツ
export type LibraryMockContent =
  | PdfMockContent
  | ImageMockContent
  | CsvMockContent
  | ExcelMockContent
  | WordMockContent
  | PptxMockContent;

export interface PdfMockContent {
  type: "pdf";
  pageCount: number;
  pages: string[]; // 各ページの本文テキスト
}

export interface ImageMockContent {
  type: "image";
  alt: string;
  colorScheme: string[]; // CSS gradient stops for mock image
  caption?: string;
}

export interface CsvMockContent {
  type: "csv";
  headers: string[];
  rows: string[][];
}

export interface ExcelMockContent {
  type: "excel";
  sheets: ExcelSheet[];
}

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface WordMockContent {
  type: "word";
  title: string;
  sections: WordSection[];
}

export interface WordSection {
  heading?: string;
  body: string;
}

export interface PptxMockContent {
  type: "pptx";
  slides: PptxSlide[];
}

export interface PptxSlide {
  title: string;
  body: string[];
  slideType: "title" | "content" | "image" | "table";
  accentColor?: string;
}

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  pdf:   "PDF",
  image: "画像",
  csv:   "CSV",
  excel: "Excel",
  word:  "Word",
  pptx:  "PowerPoint",
};

export const FILE_TYPE_EXT: Record<FileType, string> = {
  pdf:   ".pdf",
  image: ".png",
  csv:   ".csv",
  excel: ".xlsx",
  word:  ".docx",
  pptx:  ".pptx",
};
