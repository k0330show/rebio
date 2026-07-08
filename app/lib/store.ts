import {
  WorkLog, Handover, Task, Category, Priority, HandoverStatus, TaskStatus,
  OrgUser, Department, OrgRole, HandoverAudience, ReadReceipt, HandoverComment,
  ActivityLog, ActivityAction,
} from "@/app/types";

// ─── ストレージキー ──────────────────────────────────────────────────────────

const KEY_CURRENT_LOG = "rebio_current_log";
const KEY_HANDOVERS   = "rebio_handovers";
const KEY_LOGS        = "rebio_logs";
const KEY_TASKS       = "rebio_tasks";
const KEY_ACTIVITY    = "rebio_activity_logs"; // v15
const KEY_INITIALIZED = "rebio_initialized_v3";

// ─── 組織マスタ（デモ固定・v11） ─────────────────────────────────────────────
// localStorageベースのMVPのため、ユーザー管理・部署管理画面は作らず固定値で扱う。

export const DEMO_DEPARTMENTS: Department[] = [
  { id: "dept-care",     name: "介護フロア" },
  { id: "dept-security", name: "警備" },
  { id: "dept-retail",   name: "小売" },
  { id: "dept-logistics", name: "物流" },
  { id: "dept-admin",    name: "管理者" },
];

export const DEMO_ROLES: OrgRole[] = [
  { id: "role-staff", name: "スタッフ" },
  { id: "role-leader", name: "リーダー" },
  { id: "role-admin", name: "管理者" },
];

// シフトは既存のShiftTypeを流用するが、v11の「シフト宛て」選択肢としては
// 現場でよく使う4種類（早番・日勤・遅番・夜勤）に絞って提示する。
export const DEMO_SHIFT_TYPES: { id: string; label: string }[] = [
  { id: "early", label: "早番" },
  { id: "day",   label: "日勤" },
  { id: "late",  label: "遅番" },
  { id: "night", label: "夜勤" },
];

export const DEMO_USERS: OrgUser[] = [
  { id: "user-tanaka", name: "田中 花子", departmentId: "dept-care",      roleId: "role-staff",  shiftType: "day" },
  { id: "user-sato",   name: "佐藤 健",   departmentId: "dept-security",  roleId: "role-leader", shiftType: "night" },
  { id: "user-suzuki", name: "鈴木 美咲", departmentId: "dept-retail",    roleId: "role-staff",  shiftType: "early" },
  { id: "user-yamamoto", name: "山本 大輔", departmentId: "dept-admin",   roleId: "role-admin",  shiftType: "day" },
];

// ログイン機能はまだ無いため、デモでは「田中 花子」を自分として固定する。
export const CURRENT_USER: OrgUser = DEMO_USERS[0];

export function findUserByName(name: string): OrgUser | undefined {
  return DEMO_USERS.find(u => u.name === name);
}

export function findUserById(id: string): OrgUser | undefined {
  return DEMO_USERS.find(u => u.id === id);
}

export function findDepartmentById(id: string): Department | undefined {
  return DEMO_DEPARTMENTS.find(d => d.id === id);
}

export function findRoleById(id: string): OrgRole | undefined {
  return DEMO_ROLES.find(r => r.id === id);
}

// ─── デモデータ用の相対日付ヘルパー ──────────────────────────────────────────
// デモデータの日付が固定だと数週間後に古く見えるため、
// モジュール読み込み時点（＝アプリ起動時点）の「今日」「昨日」を基準に生成する。
function demoDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TODAY_STR     = demoDateString(0);
const YESTERDAY_STR = demoDateString(-1);

// ─── デモ勤務ログデータ（多業種） ────────────────────────────────────────────

export const DEMO_LOGS: WorkLog[] = [
  // 介護施設
  {
    id: "log-demo-001",
    shiftType: "day",
    content:
      "A棟2号室の利用者さまが朝食時に嚥下困難の様子を見せました。ゼリー食に切り替えて対応しましたが、次の担当者にも引き続き観察をお願いします。また、B棟廊下の手すり近くに段差が生じているため、転倒リスクがあります。施設管理への報告と注意喚起の表示設置をお願いします。定期薬の配薬は全員完了しています。",
    nextAssignee: "早川 みどり",
    selfPriority: "high",
    createdAt: `${TODAY_STR}T08:45:00`,
    author: "岡田 けい子",
    handoverCount: 3,
    industry: "healthcare",
  },
  {
    id: "log-demo-002",
    shiftType: "night",
    content:
      "夜間は全体的に落ち着いた様子でした。3号室の利用者さまが23時頃に覚醒し、不安を訴えていたため傍に寄り添い対応。30分ほどで落ち着かれました。担当医への報告が必要かどうか、朝のカンファレンスで確認してください。バイタルは全員問題なし。朝6時の検温も完了しています。",
    nextAssignee: "岡田 けい子",
    selfPriority: "medium",
    createdAt: `${TODAY_STR}T06:30:00`,
    author: "林 たかし",
    handoverCount: 2,
    industry: "healthcare",
  },
  // 警備
  {
    id: "log-demo-003",
    shiftType: "night",
    content:
      "Bゲート付近で不審車両の停車を確認しました。ナンバーを記録し、2回声がけの後に退去してもらいました。念のため警察への連絡も検討してください。また、東側駐車場の防犯カメラ3番が映像乱れを起こしています。設備管理への連絡を本日中にお願いします。巡回は定刻通り実施、異常なし。",
    nextAssignee: "中島 たけし",
    selfPriority: "high",
    createdAt: `${TODAY_STR}T06:00:00`,
    author: "松本 ひろ",
    handoverCount: 3,
    industry: "security",
  },
  {
    id: "log-demo-004",
    shiftType: "evening",
    content:
      "正面入口のオートロックの反応が鈍くなっています。スムーズに開錠できない場面が数回ありました。設備会社への点検依頼を至急お願いします。来訪者対応は問題なく、定時巡回は全コース完了しています。",
    nextAssignee: "佐伯 なな",
    selfPriority: "medium",
    createdAt: `${YESTERDAY_STR}T22:00:00`,
    author: "中島 たけし",
    handoverCount: 2,
    industry: "security",
  },
  // 小売
  {
    id: "log-demo-005",
    shiftType: "late",
    content:
      "本日の売上目標は達成しました。ただ、レジ3番のバーコードリーダーが時折読み取りエラーを起こしています。明日の開店前に確認と清掃をお願いします。冷蔵コーナーの牛乳が夕方に品薄になりました。バックヤードに在庫があるので、朝一番で補充をお願いします。閉店時の現金確認は完了しています。",
    nextAssignee: "石川 まさお",
    selfPriority: "medium",
    createdAt: `${YESTERDAY_STR}T21:30:00`,
    author: "坂本 るり",
    handoverCount: 3,
    industry: "retail",
  },
  {
    id: "log-demo-006",
    shiftType: "day",
    content:
      "午前中に商品棚の点検を実施。賞味期限が3日以内の商品を5点確認しました。値引きシールの対応をお願いします。また、クレームが1件ありました。購入した商品の袋が破損していたとのことで、交換と謝罪対応済みです。記録表に記入しています。",
    nextAssignee: "坂本 るり",
    selfPriority: "low",
    createdAt: `${YESTERDAY_STR}T17:00:00`,
    author: "石川 まさお",
    handoverCount: 2,
    industry: "retail",
  },
  // 物流
  {
    id: "log-demo-007",
    shiftType: "early",
    content:
      "本日の入荷トラックが定刻より1時間遅れ、仕分け作業が押しています。14時便の出荷には支障ありませんでしたが、17時便のピッキングが5件未完了のまま残っています。次の担当者で対応をお願いします。フォークリフト2号機のバッテリー残量が少ないため、充電をお願いします。",
    nextAssignee: "村上 こうへい",
    selfPriority: "high",
    createdAt: `${TODAY_STR}T13:00:00`,
    author: "富田 あいこ",
    handoverCount: 3,
    industry: "logistics",
  },
  {
    id: "log-demo-008",
    shiftType: "night",
    content:
      "夜間作業は予定通り完了しました。ただし、倉庫C棟の照明が2箇所切れています。安全上の問題があるため、早急に管理部門へ連絡してください。在庫確認は完了しており、差異はありませんでした。",
    nextAssignee: "富田 あいこ",
    selfPriority: "medium",
    createdAt: `${YESTERDAY_STR}T23:00:00`,
    author: "村上 こうへい",
    handoverCount: 2,
    industry: "logistics",
  },
];

// ─── デモ申し送りデータ ───────────────────────────────────────────────────────

export const DEMO_HANDOVERS: Handover[] = [
  // 介護
  {
    id: "h-demo-001",
    logId: "log-demo-001",
    category: "caution",
    kind: "check",
    readRequirement: "confirm",
    title: "【注意】A棟2号室の利用者さまの嚥下困難",
    content:
      "A棟2号室の利用者さまが朝食時に嚥下困難の様子を見せました。ゼリー食に切り替え済みですが、次の食事でも引き続きゼリー食を提供し、様子を観察してください。悪化がみられる場合は担当医に連絡を。",
    priority: "urgent",
    confidence: "high",
    sourceExcerpt: "A棟2号室の利用者さまが朝食時に嚥下困難の様子を見せました",
    assignee: "田中 花子",
    author: "岡田 けい子",
    status: "open",
    isRead: true,
    isConfirmed: false,
    createdAt: `${TODAY_STR}T08:45:00`,
    audiences: [
      { type: "department", ids: ["dept-care"], label: "介護フロア" },
      { type: "role", ids: ["role-admin"], label: "管理者" },
    ],
  },
  {
    id: "h-demo-002",
    logId: "log-demo-001",
    category: "task",
    kind: "action",
    readRequirement: "confirm",
    title: "【要対応】B棟廊下の段差解消と転倒リスク対策",
    content:
      "B棟廊下の手すり近くに段差が生じており、転倒リスクがあります。施設管理部門への報告と、注意喚起の表示設置をお願いします。対応後は記録に残してください。",
    priority: "high",
    confidence: "high",
    sourceExcerpt: "B棟廊下の手すり近くに段差が生じているため、転倒リスクがあります",
    assignee: "早川 みどり",
    author: "岡田 けい子",
    status: "in_progress",
    isRead: true,
    isConfirmed: true,
    createdAt: `${TODAY_STR}T08:45:00`,
  },
  {
    id: "h-demo-003",
    logId: "log-demo-002",
    category: "report",
    kind: "share",
    readRequirement: "none",
    title: "【報告】3号室の利用者さまの夜間不安への対応",
    content:
      "3号室の利用者さまが23時頃に覚醒し、不安を訴えていました。傍に寄り添い30分ほどで落ち着かれましたが、担当医への報告が必要か朝のカンファレンスでご確認ください。",
    priority: "medium",
    confidence: "high",
    sourceExcerpt: "3号室の利用者さまが23時頃に覚醒し、不安を訴えていた",
    assignee: "岡田 けい子",
    author: "林 たかし",
    status: "open",
    isRead: true,
    isConfirmed: false,
    createdAt: `${TODAY_STR}T06:30:00`,
  },
  // 警備
  {
    id: "h-demo-004",
    logId: "log-demo-003",
    category: "caution",
    kind: "check",
    readRequirement: "confirm",
    title: "【注意】Bゲート付近の不審車両について",
    content:
      "Bゲート付近で不審車両の停車を確認しナンバーを記録しました。退去済みですが、再出現の場合は即時に警察への連絡を検討してください。記録ファイルに詳細を記入済みです。",
    priority: "high",
    confidence: "high",
    sourceExcerpt: "Bゲート付近で不審車両の停車を確認しました",
    assignee: "中島 たけし",
    author: "松本 ひろ",
    status: "open",
    isRead: true,
    isConfirmed: false,
    createdAt: `${TODAY_STR}T06:00:00`,
  },
  {
    id: "h-demo-005",
    logId: "log-demo-003",
    category: "task",
    kind: "action",
    readRequirement: "confirm",
    title: "【要対応】東側駐車場カメラ3番の映像乱れ",
    content:
      "東側駐車場の防犯カメラ3番が映像乱れを起こしています。本日中に設備管理部門へ連絡し、点検依頼をお願いします。",
    priority: "high",
    confidence: "high",
    sourceExcerpt: "東側駐車場の防犯カメラ3番が映像乱れを起こしています",
    assignee: "田中 花子",
    author: "松本 ひろ",
    status: "open",
    isRead: false,
    isConfirmed: false,
    createdAt: `${TODAY_STR}T06:00:00`,
  },
  {
    id: "h-demo-006",
    logId: "log-demo-004",
    category: "task",
    kind: "action",
    readRequirement: "confirm",
    title: "【要対応】正面入口オートロックの点検依頼",
    content:
      "正面入口のオートロックの反応が鈍く、開錠に時間がかかる事象が数回発生しています。設備会社への点検依頼を至急お願いします。",
    priority: "medium",
    confidence: "high",
    sourceExcerpt: "正面入口のオートロックの反応が鈍くなっています",
    assignee: "佐伯 なな",
    author: "中島 たけし",
    status: "completed",
    isRead: true,
    isConfirmed: true,
    createdAt: `${YESTERDAY_STR}T22:00:00`,
    completedAt: `${TODAY_STR}T09:00:00`,
  },
  // 小売
  {
    id: "h-demo-007",
    logId: "log-demo-005",
    category: "task",
    kind: "action",
    readRequirement: "confirm",
    title: "【要対応】レジ3番バーコードリーダーの確認",
    content:
      "レジ3番のバーコードリーダーが時折読み取りエラーを起こしています。開店前に確認・清掃をお願いします。解決しない場合は保守会社への連絡を検討してください。",
    priority: "medium",
    confidence: "high",
    sourceExcerpt: "レジ3番のバーコードリーダーが時折読み取りエラーを起こしています",
    assignee: "石川 まさお",
    author: "坂本 るり",
    status: "open",
    isRead: false,
    isConfirmed: false,
    createdAt: `${YESTERDAY_STR}T21:30:00`,
  },
  {
    id: "h-demo-008",
    logId: "log-demo-005",
    category: "task",
    kind: "action",
    readRequirement: "confirm",
    title: "【要対応】冷蔵コーナー牛乳の補充",
    content:
      "冷蔵コーナーの牛乳が品薄になっています。バックヤードに在庫がありますので、開店前に補充をお願いします。",
    priority: "medium",
    confidence: "high",
    sourceExcerpt: "冷蔵コーナーの牛乳が夕方に品薄になりました",
    assignee: "石川 まさお",
    author: "坂本 るり",
    status: "completed",
    isRead: true,
    isConfirmed: true,
    createdAt: `${YESTERDAY_STR}T21:30:00`,
    completedAt: `${TODAY_STR}T08:30:00`,
  },
  {
    id: "h-demo-009",
    logId: "log-demo-006",
    category: "task",
    kind: "action",
    readRequirement: "confirm",
    title: "【要対応】賞味期限3日以内商品の値引き対応",
    content:
      "賞味期限が3日以内の商品を5点確認しました。値引きシールの貼付対応をお願いします。対象商品の詳細は記録表に記載済みです。",
    priority: "medium",
    confidence: "high",
    sourceExcerpt: "賞味期限が3日以内の商品を5点確認しました",
    assignee: "坂本 るり",
    author: "石川 まさお",
    status: "open",
    isRead: false,
    isConfirmed: false,
    createdAt: `${YESTERDAY_STR}T17:00:00`,
  },
  // 物流
  {
    id: "h-demo-010",
    logId: "log-demo-007",
    category: "task",
    kind: "action",
    readRequirement: "confirm",
    title: "【要対応】17時便ピッキング未完了5件",
    content:
      "17時便のピッキングが5件未完了のまま残っています。出荷遅延を防ぐため、優先的に対応をお願いします。リストはシステム内「未完了」タブに表示されています。",
    priority: "high",
    confidence: "high",
    sourceExcerpt: "17時便のピッキングが5件未完了のまま残っています",
    assignee: "村上 こうへい",
    author: "富田 あいこ",
    status: "open",
    isRead: false,
    isConfirmed: false,
    createdAt: `${TODAY_STR}T13:00:00`,
  },
  {
    id: "h-demo-011",
    logId: "log-demo-007",
    category: "caution",
    kind: "check",
    readRequirement: "read",
    title: "【注意】フォークリフト2号機のバッテリー残量",
    content:
      "フォークリフト2号機のバッテリー残量が少ない状態です。使用前に充電を完了させてください。残量不足のまま使用すると作業中断の原因になります。",
    priority: "medium",
    confidence: "high",
    sourceExcerpt: "フォークリフト2号機のバッテリー残量が少ないため",
    assignee: "村上 こうへい",
    author: "富田 あいこ",
    status: "open",
    isRead: false,
    isConfirmed: false,
    createdAt: `${TODAY_STR}T13:00:00`,
    audiences: [
      { type: "all", ids: [], label: "全体" },
    ],
  },
  {
    id: "h-demo-012",
    logId: "log-demo-008",
    category: "task",
    kind: "action",
    readRequirement: "confirm",
    title: "【要対応】倉庫C棟の照明切れ2箇所",
    content:
      "倉庫C棟の照明が2箇所切れており、安全上のリスクがあります。管理部門へ至急連絡し、交換対応を依頼してください。それまでの間は当該エリアの作業時に注意を促してください。",
    priority: "urgent",
    confidence: "high",
    sourceExcerpt: "倉庫C棟の照明が2箇所切れています",
    assignee: "富田 あいこ",
    author: "村上 こうへい",
    status: "open",
    isRead: false,
    isConfirmed: false,
    createdAt: `${YESTERDAY_STR}T23:00:00`,
  },
];

// ─── デモタスクデータ ──────────────────────────────────────────────────────────

export const DEMO_TASKS: Task[] = [
  {
    id: "t-demo-001",
    handoverId: "h-demo-002",
    title: "B棟廊下の段差を施設管理に報告する",
    description: "B棟廊下の手すり近くに段差が生じており転倒リスクがあります。施設管理部門への報告と注意喚起の表示設置を依頼してください。",
    assignee: "早川 みどり",
    author: "岡田 けい子",
    priority: "high",
    status: "in_progress",
    dueDate: TODAY_STR,
    createdAt: `${TODAY_STR}T08:45:00`,
    sourceHandoverTitle: "【要対応】B棟廊下の段差解消と転倒リスク対策",
  },
  {
    id: "t-demo-002",
    handoverId: "h-demo-005",
    title: "東側駐車場カメラ3番の設備管理への点検依頼",
    description: "防犯カメラの映像乱れが発生しています。設備管理部門に本日中に連絡し、点検を依頼してください。",
    assignee: "中島 たけし",
    author: "松本 ひろ",
    priority: "high",
    status: "todo",
    dueDate: demoDateString(1),
    createdAt: `${TODAY_STR}T06:00:00`,
    sourceHandoverTitle: "【要対応】東側駐車場カメラ3番の映像乱れ",
  },
  {
    id: "t-demo-003",
    handoverId: "h-demo-007",
    title: "レジ3番バーコードリーダーの清掃・確認",
    description: "開店前にレジ3番のバーコードリーダーを清掃し、動作確認を行ってください。問題が続く場合は保守会社に連絡してください。",
    assignee: "石川 まさお",
    author: "坂本 るり",
    priority: "medium",
    status: "todo",
    dueDate: TODAY_STR,
    createdAt: `${YESTERDAY_STR}T21:30:00`,
    sourceHandoverTitle: "【要対応】レジ3番バーコードリーダーの確認",
  },
  {
    id: "t-demo-004",
    handoverId: "h-demo-010",
    title: "17時便ピッキング未完了5件を処理する",
    description: "前シフトで未完了となったピッキング5件を優先して対応してください。リストはシステムの「未完了」タブに表示されています。",
    assignee: "村上 こうへい",
    author: "富田 あいこ",
    priority: "high",
    status: "todo",
    dueDate: TODAY_STR,
    createdAt: `${TODAY_STR}T13:00:00`,
    sourceHandoverTitle: "【要対応】17時便ピッキング未完了5件",
  },
  {
    id: "t-demo-005",
    handoverId: "h-demo-012",
    title: "倉庫C棟の照明交換を管理部門に依頼",
    description: "C棟照明が2箇所切れており安全上の問題があります。管理部門に至急連絡し、交換対応を依頼してください。",
    assignee: "富田 あいこ",
    author: "村上 こうへい",
    priority: "urgent",
    status: "todo",
    dueDate: TODAY_STR,
    createdAt: `${YESTERDAY_STR}T23:00:00`,
    sourceHandoverTitle: "【要対応】倉庫C棟の照明切れ2箇所",
  },
  {
    id: "t-demo-006",
    handoverId: "h-demo-009",
    title: "賞味期限3日以内の商品に値引きシールを貼付",
    description: "記録表に記載された5点の商品に値引きシールを貼付してください。詳細は記録表を参照してください。",
    assignee: "坂本 るり",
    author: "石川 まさお",
    priority: "medium",
    status: "completed",
    dueDate: YESTERDAY_STR,
    createdAt: `${YESTERDAY_STR}T17:00:00`,
    completedAt: `${YESTERDAY_STR}T18:30:00`,
    sourceHandoverTitle: "【要対応】賞味期限3日以内商品の値引き対応",
  },
];

// ─── localStorage ストア ──────────────────────────────────────────────────────

function lsGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function lsSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

// 初期化（デモデータが未投入なら投入）
export function initializeStore(): void {
  if (typeof window === "undefined") return;
  const initialized = lsGet(KEY_INITIALIZED);
  if (initialized) return;

  lsSet(KEY_HANDOVERS, JSON.stringify(DEMO_HANDOVERS));
  lsSet(KEY_LOGS, JSON.stringify(DEMO_LOGS));
  lsSet(KEY_TASKS, JSON.stringify(DEMO_TASKS));
  lsSet(KEY_INITIALIZED, "true");
}

// ─── 勤務ログ ─────────────────────────────────────────────────────────────────

export function saveCurrentLog(log: WorkLog): void {
  lsSet(KEY_CURRENT_LOG, JSON.stringify(log));
}

export function loadCurrentLog(): WorkLog | null {
  const raw = lsGet(KEY_CURRENT_LOG);
  if (!raw) return null;
  try { return JSON.parse(raw) as WorkLog; } catch { return null; }
}

// 登録完了後に呼び出し、同じログからの二重登録を防ぐ
export function clearCurrentLog(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY_CURRENT_LOG); } catch { /* noop */ }
}

export function loadLogs(): WorkLog[] {
  const raw = lsGet(KEY_LOGS);
  if (!raw) return DEMO_LOGS;
  try { return JSON.parse(raw) as WorkLog[]; } catch { return DEMO_LOGS; }
}

export function saveLogs(logs: WorkLog[]): void {
  lsSet(KEY_LOGS, JSON.stringify(logs));
}

export function appendLog(log: WorkLog): void {
  const current = loadLogs();
  saveLogs([log, ...current]);
}

// ─── 申し送り ─────────────────────────────────────────────────────────────────

// v8以前のデータには kind が存在しないため、category / priority から推定する。
// 常に "share" | "check" | "action" のいずれかを返す（フォールバック関数）。
export function getHandoverKind(h: Partial<Handover>): "share" | "check" | "action" {
  if (h.kind) return h.kind;
  if (h.category === "task") return "action";
  if (h.category === "caution" || h.priority === "urgent" || h.priority === "high") return "check";
  return "share";
}

// v8以前のデータには readRequirement が存在しないため、kind から妥当な既定値を推定する。
export function getDefaultReadRequirement(
  kind: "share" | "check" | "action",
  h: Partial<Handover>
): "none" | "read" | "confirm" {
  if (h.readRequirement) return h.readRequirement;
  if (kind === "action") return "confirm";
  if (kind === "check") {
    if (h.priority === "urgent" || h.priority === "high" || h.confidence === "low") return "confirm";
    return "read";
  }
  return "none";
}

// v10以前のデータには audiences / receipts / comments が存在しないため補完する。
// 補完方針：
// - audiences が無ければ assignee から個人宛てとして推定する（assignee不明時は全体向け）
// - receipts が無ければ audiences（推定含む）から対象ユーザーを割り出して作成する
//   このとき、既存の isRead / isConfirmed があれば该当ユーザーのreceiptに反映する
// - comments が無ければ空配列にする
function getDefaultAudiences(h: Partial<Handover>): HandoverAudience[] {
  if (h.audiences && h.audiences.length > 0) return h.audiences;
  const assignee = h.assignee?.trim();
  if (!assignee) {
    return [{ type: "all", ids: [], label: "全体" }];
  }
  const user = findUserByName(assignee);
  return [{
    type: "user",
    ids: user ? [user.id] : [],
    label: assignee,
  }];
}

export function resolveAudienceUserIds(audience: HandoverAudience): string[] {
  switch (audience.type) {
    case "all":
      return DEMO_USERS.map(u => u.id);
    case "user":
      return audience.ids;
    case "department":
      return DEMO_USERS.filter(u => audience.ids.includes(u.departmentId)).map(u => u.id);
    case "role":
      return DEMO_USERS.filter(u => audience.ids.includes(u.roleId)).map(u => u.id);
    case "shift":
      return DEMO_USERS.filter(u => audience.ids.includes(u.shiftType)).map(u => u.id);
    default:
      return [];
  }
}

// v11: 新規に申し送りを登録する際、audiencesから未読・未確認状態のreceiptsを作成する。
export function createInitialReceipts(audiences: HandoverAudience[]): ReadReceipt[] {
  const userIds = Array.from(new Set(audiences.flatMap(resolveAudienceUserIds)));
  return userIds.map(userId => {
    const user = findUserById(userId);
    return {
      userId,
      userName: user?.name ?? "不明なユーザー",
      readAt: undefined,
      confirmedAt: undefined,
    };
  });
}

function getDefaultReceipts(h: Partial<Handover>, audiences: HandoverAudience[]): ReadReceipt[] {
  if (h.receipts && h.receipts.length > 0) return h.receipts;

  const userIds = Array.from(new Set(audiences.flatMap(resolveAudienceUserIds)));
  if (userIds.length === 0) return [];

  // 既存の isRead / isConfirmed は「assigneeとして名指しされていた1人」の状態として
  // 該当ユーザーのreceiptに反映する。それ以外の対象者は未読・未確認として扱う。
  const assigneeUser = h.assignee ? findUserByName(h.assignee) : undefined;

  return userIds.map(userId => {
    const user = findUserById(userId);
    const isAssignee = assigneeUser && assigneeUser.id === userId;
    const now = new Date().toISOString();
    return {
      userId,
      userName: user?.name ?? "不明なユーザー",
      readAt: isAssignee && (h.isRead || h.isConfirmed) ? now : undefined,
      confirmedAt: isAssignee && h.isConfirmed ? now : undefined,
    };
  });
}

// 旧バージョンのHandoverデータを現行の型に補完する。
// kind / readRequirement / isRead / isConfirmed / audiences / receipts / comments のいずれが
// 欠けていても安全なデフォルト値を割り当てる。
function migrateHandover(h: Handover): Handover {
  const kind = getHandoverKind(h);
  const readRequirement = getDefaultReadRequirement(kind, h);
  const audiences = getDefaultAudiences(h);
  const receipts = getDefaultReceipts(h, audiences);
  return {
    ...h,
    kind,
    readRequirement,
    isRead: h.isRead ?? false,
    isConfirmed: h.isConfirmed ?? false,
    audiences,
    receipts,
    comments: h.comments ?? [],
  };
}

export function loadHandovers(): Handover[] {
  const raw = lsGet(KEY_HANDOVERS);
  if (!raw) return DEMO_HANDOVERS;
  try {
    const parsed = JSON.parse(raw) as Handover[];
    return parsed.map(migrateHandover);
  } catch {
    return DEMO_HANDOVERS;
  }
}

export function saveHandovers(handovers: Handover[]): void {
  lsSet(KEY_HANDOVERS, JSON.stringify(handovers));
}

// ─── 履歴（activity_logs相当・v15） ──────────────────────────────────────────
// UIを重くしないため、申し送り詳細の下部に小さく表示する程度の軽量な履歴機能。

export function loadActivityLogs(): ActivityLog[] {
  const raw = lsGet(KEY_ACTIVITY);
  if (!raw) return [];
  try { return JSON.parse(raw) as ActivityLog[]; } catch { return []; }
}

function saveActivityLogs(logs: ActivityLog[]): void {
  lsSet(KEY_ACTIVITY, JSON.stringify(logs));
}

export function recordActivity(
  targetType: ActivityLog["targetType"],
  targetId: string,
  action: ActivityAction,
  actor: OrgUser = CURRENT_USER
): void {
  const current = loadActivityLogs();
  const entry: ActivityLog = {
    id: generateId("act"),
    targetType,
    targetId,
    action,
    actorName: actor.name,
    createdAt: new Date().toISOString(),
  };
  // 直近200件に制限し、localStorageの肥大化を防ぐ
  saveActivityLogs([entry, ...current].slice(0, 200));
}

export function loadActivityLogsFor(targetType: ActivityLog["targetType"], targetId: string): ActivityLog[] {
  return loadActivityLogs()
    .filter(a => a.targetType === targetType && a.targetId === targetId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function appendHandovers(newOnes: Handover[]): void {
  const current = loadHandovers();
  saveHandovers([...newOnes, ...current]);
  newOnes.forEach(h => recordActivity("handover", h.id, "handover_created", findUserByName(h.author) ?? CURRENT_USER));
}

// v11: 申し送りにコメントを1件追加する。
export function addHandoverComment(handoverId: string, body: string, author: OrgUser = CURRENT_USER): void {
  const current = loadHandovers();
  const comment: HandoverComment = {
    id: generateId("cmt"),
    handoverId,
    authorId: author.id,
    authorName: author.name,
    body,
    createdAt: new Date().toISOString(),
  };
  const updated = current.map(h =>
    h.id === handoverId ? { ...h, comments: [...(h.comments ?? []), comment] } : h
  );
  saveHandovers(updated);
  recordActivity("handover", handoverId, "comment_added", author);
}

// v11: 指定ユーザーの既読・確認状態を更新する。
export function setReadReceipt(
  handoverId: string,
  userId: string,
  update: { read?: boolean; confirmed?: boolean }
): void {
  const current = loadHandovers();
  const now = new Date().toISOString();
  const updated = current.map(h => {
    if (h.id !== handoverId) return h;
    const receipts = h.receipts ?? [];
    const nextReceipts = receipts.map(r => {
      if (r.userId !== userId) return r;
      return {
        ...r,
        readAt: update.read !== undefined ? (update.read ? (r.readAt ?? now) : undefined) : r.readAt,
        confirmedAt: update.confirmed !== undefined ? (update.confirmed ? (r.confirmedAt ?? now) : undefined) : r.confirmedAt,
      };
    });
    return { ...h, receipts: nextReceipts };
  });
  saveHandovers(updated);
}

// v11: 既読・確認の集計（対象者数、既読数、確認数）を返す。
export function summarizeReceipts(receipts: ReadReceipt[] | undefined): { total: number; read: number; confirmed: number } {
  const list = receipts ?? [];
  return {
    total: list.length,
    read: list.filter(r => !!r.readAt).length,
    confirmed: list.filter(r => !!r.confirmedAt).length,
  };
}

// v11: 指定ユーザーが対象に含まれているかどうかを判定する。
export function isUserInAudiences(audiences: HandoverAudience[] | undefined, user: OrgUser): boolean {
  if (!audiences || audiences.length === 0) return false;
  return audiences.some(a => resolveAudienceUserIds(a).includes(user.id));
}

// ─── タスク ───────────────────────────────────────────────────────────────────

export function loadTasks(): Task[] {
  const raw = lsGet(KEY_TASKS);
  if (!raw) return DEMO_TASKS;
  try { return JSON.parse(raw) as Task[]; } catch { return DEMO_TASKS; }
}

export function saveTasks(tasks: Task[]): void {
  lsSet(KEY_TASKS, JSON.stringify(tasks));
}

export function appendTasks(newOnes: Task[]): void {
  const current = loadTasks();
  saveTasks([...newOnes, ...current]);
}

export function updateTaskStatus(id: string, status: TaskStatus): void {
  const tasks = loadTasks();
  const updated = tasks.map((t) =>
    t.id === id
      ? { ...t, status, completedAt: status === "completed" ? new Date().toISOString() : undefined }
      : t
  );
  saveTasks(updated);
}

// ─── ユーティリティ ──────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function priorityOrder(p: Priority): number {
  const map: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return map[p];
}

export function categoryOrder(c: Category): number {
  const map: Record<Category, number> = { caution: 0, task: 1, report: 2, note: 3 };
  return map[c];
}

export function statusOrder(s: HandoverStatus): number {
  const map: Record<HandoverStatus, number> = { open: 0, in_progress: 1, completed: 2 };
  return map[s];
}

export function taskStatusOrder(s: TaskStatus): number {
  const map: Record<TaskStatus, number> = { todo: 0, in_progress: 1, completed: 2 };
  return map[s];
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// 日付のみの文字列（YYYY-MM-DD）を「今日より前か」でローカル日付ベース比較する。
// new Date("YYYY-MM-DD") はUTC 0時として解釈されるため、
// new Date() との直接比較はタイムゾーンによって当日を期限切れ扱いしてしまう。
// ここでは年月日のみを取り出して比較することで、当日は期限切れにならないようにする。
export function isBeforeToday(dateString: string): boolean {
  const [y, m, d] = dateString.split("-").map(Number);
  if (!y || !m || !d) return false;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return target.getTime() < today.getTime();
}

// 今日から daysOffset 日後の日付を YYYY-MM-DD 形式で返す
export function relativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

// ─── Library デモデータ ──────────────────────────────────────────────────────

import { LibraryDoc } from "@/app/types";

export const DEMO_LIBRARY: LibraryDoc[] = [
  // ── PDF ──────────────────────────────────────────────────────────────────
  {
    id: "doc-001",
    name: "緊急時対応マニュアル",
    fileType: "pdf",
    category: "マニュアル",
    tags: ["緊急対応", "安全", "全スタッフ共通"],
    description: "施設内で緊急事態が発生した際の対応手順をまとめたマニュアルです。119番通報の手順、AEDの場所、避難経路を記載しています。",
    author: "管理部門",
    updatedAt: `${demoDateString(-17)}T10:00:00`,
    createdAt: "2025-04-01T09:00:00",
    isPinned: true,
    lastOpenedAt: `${YESTERDAY_STR}T08:30:00`,
    relatedHandoverIds: ["h-demo-001"],
    relatedTaskIds: [],
    mockContent: {
      type: "pdf",
      pageCount: 4,
      pages: [
        "【緊急時対応マニュアル】\n\n本マニュアルは、施設内で緊急事態が発生した際に速やかに対応するための手順書です。全スタッフは内容を把握し、定期的に訓練に参加してください。\n\n■ 対象となる緊急事態\n・利用者の急変（意識消失・呼吸困難・骨折など）\n・火災・地震・水害などの自然災害\n・不審者の侵入\n・設備の重大な故障",
        "■ 急変対応の手順\n\n1. 発見者はその場を離れず、大声でスタッフを呼ぶ\n2. 意識・呼吸を確認する\n3. 意識なし・呼吸なし → ただちに119番通報＋AED手配\n4. 意識あり → バイタル測定・担当医に連絡\n5. 家族への連絡は管理者が行う\n\n■ AEDの設置場所\n・1階 エントランス正面\n・2階 ナースステーション前\n・3階 食堂入口横",
        "■ 避難経路\n\n各フロアの避難経路は廊下の誘導標識に従ってください。\n\n非常口一覧：\n・1階 南側出口（正面玄関）\n・1階 北側出口（搬入口）\n・2階 外階段（東側）\n・3階 屋上経由（西側階段）\n\n避難に時間がかかる利用者は優先的に車椅子・ストレッチャーで誘導すること。",
        "■ 連絡先一覧\n\n・消防署：119\n・警察：110\n・施設管理者：（管理者氏名と連絡先を記入）\n・担当医：（医師名と連絡先を記入）\n・保険会社：（担当者名と連絡先を記入）\n\n■ 改訂履歴\n2025/04/01 初版作成\n2025/10/15 AED設置場所を更新\n2026/06/15 連絡先一覧を更新",
      ],
    },
  },
  {
    id: "doc-002",
    name: "月次巡回点検報告書_2026年6月",
    fileType: "pdf",
    category: "報告書",
    tags: ["点検", "月次", "設備"],
    description: "2026年6月実施の施設設備巡回点検の結果報告書です。",
    author: "施設管理 村上",
    updatedAt: `${YESTERDAY_STR}T16:00:00`,
    createdAt: `${YESTERDAY_STR}T16:00:00`,
    isPinned: false,
    lastOpenedAt: `${TODAY_STR}T09:00:00`,
    relatedHandoverIds: ["h-demo-005"],
    relatedTaskIds: ["t-demo-002"],
    mockContent: {
      type: "pdf",
      pageCount: 2,
      pages: [
        "【月次巡回点検報告書】\n実施日：2026年6月30日\n担当者：村上 こうへい\n\n■ 点検結果サマリー\n・点検箇所数：48箇所\n・異常なし：45箇所\n・要注意：2箇所\n・要修繕：1箇所\n\n■ 要注意・要修繕箇所の詳細\n\n1. 東側駐車場 防犯カメラ3番（要修繕）\n   映像に乱れが発生。設備業者への点検依頼が必要。\n\n2. B棟廊下 手すり付近（要注意）\n   経年劣化による微小な段差が生じている。利用者の転倒リスクあり。早急な補修を推奨。\n\n3. 倉庫C棟 照明設備（要修繕）\n   2箇所の照明が切れている。交換部品の手配が必要。",
        "■ 設備別点検結果一覧\n\n消防設備：異常なし（消火器12本・スプリンクラー全棟確認済）\n電気設備：異常なし（ブレーカー・非常灯・誘導灯全確認）\n空調設備：異常なし（フィルター清掃実施済）\n給排水設備：異常なし\n エレベーター：定期点検済（6/20実施）\n防犯設備：一部異常あり（上記参照）\n\n■ 次回点検予定\n2026年7月31日（予定）\n\n■ 添付書類\n・点検チェックリスト（別紙A）\n・写真記録（別紙B）",
      ],
    },
  },

  // ── Excel ─────────────────────────────────────────────────────────────────
  {
    id: "doc-003",
    name: "備品在庫管理表",
    fileType: "excel",
    category: "管理表",
    tags: ["在庫", "備品", "定期確認"],
    description: "消耗品・備品の在庫数と発注基準をまとめた管理表です。在庫が基準値を下回った場合は発注申請を行ってください。",
    author: "総務 坂本",
    updatedAt: `${TODAY_STR}T08:00:00`,
    createdAt: `${demoDateString(-123)}T09:00:00`,
    isPinned: true,
    lastOpenedAt: `${TODAY_STR}T08:00:00`,
    relatedHandoverIds: ["h-demo-002"],
    relatedTaskIds: ["t-demo-001"],
    mockContent: {
      type: "excel",
      sheets: [
        {
          name: "消耗品",
          headers: ["品目", "現在庫数", "発注基準", "単位", "最終更新", "担当者", "備考"],
          rows: [
            ["使い捨て手袋（M）",  120, 50,  "枚", "2026/07/02", "坂本 るり", ""],
            ["使い捨て手袋（L）",  80,  50,  "枚", "2026/07/02", "坂本 るり", ""],
            ["マスク（不織布）",   200, 100, "枚", "2026/07/01", "坂本 るり", ""],
            ["消毒用アルコール",   3,   5,   "本", "2026/07/02", "坂本 るり", "⚠ 要発注"],
            ["体温計（予備）",     2,   3,   "本", "2026/06/30", "坂本 るり", "⚠ 要発注"],
            ["血圧計（予備）",     1,   1,   "台", "2026/06/15", "坂本 るり", ""],
            ["おむつ（M）",       150, 100, "枚", "2026/07/01", "早川 みどり", ""],
            ["おむつ（L）",       90,  80,  "枚", "2026/07/01", "早川 みどり", ""],
          ],
        },
        {
          name: "設備・工具",
          headers: ["品目", "数量", "状態", "最終点検日", "次回点検日", "担当部署"],
          rows: [
            ["フォークリフト 1号機", 1, "正常",   "2026/06/01", "2026/09/01", "物流部門"],
            ["フォークリフト 2号機", 1, "要充電", "2026/07/02", "2026/09/01", "物流部門"],
            ["AED",                   2, "正常",   "2026/06/01", "2026/12/01", "安全管理"],
            ["台車",                  8, "正常",   "2026/05/15", "2026/08/15", "物流部門"],
            ["バーコードリーダー",    4, "1台要確認", "2026/07/01", "2026/10/01", "販売部門"],
          ],
        },
      ],
    },
  },
  {
    id: "doc-004",
    name: "シフト表_2026年7月",
    fileType: "excel",
    category: "シフト・勤怠",
    tags: ["シフト", "7月", "勤務計画"],
    description: "2026年7月のシフト表です。変更がある場合は管理者に連絡してください。",
    author: "管理者 岡田",
    updatedAt: `${demoDateString(-4)}T17:00:00`,
    createdAt: `${demoDateString(-4)}T17:00:00`,
    isPinned: false,
    lastOpenedAt: undefined,
    relatedHandoverIds: [],
    relatedTaskIds: [],
    mockContent: {
      type: "excel",
      sheets: [
        {
          name: "7月シフト",
          headers: ["氏名", "7/1", "7/2", "7/3", "7/4", "7/5", "7/6", "7/7"],
          rows: [
            ["岡田 けい子", "日勤",   "日勤",   "休",    "日勤",   "日勤",   "休",    "日勤"],
            ["早川 みどり", "休",     "日勤",   "日勤",  "休",     "日勤",   "日勤",  "休"],
            ["林 たかし",   "夜勤",   "休",     "夜勤",  "夜勤",   "休",     "夜勤",  "夜勤"],
            ["中島 たけし", "準夜勤", "準夜勤", "休",    "準夜勤", "準夜勤", "休",    "準夜勤"],
            ["松本 ひろ",   "休",     "夜勤",   "夜勤",  "休",     "夜勤",   "夜勤",  "休"],
          ],
        },
      ],
    },
  },

  // ── CSV ───────────────────────────────────────────────────────────────────
  {
    id: "doc-005",
    name: "販売実績データ_2026年6月",
    fileType: "csv",
    category: "実績データ",
    tags: ["売上", "月次", "分析用"],
    description: "2026年6月の日別販売実績データです。分析・レポート作成にご活用ください。",
    author: "販売管理",
    updatedAt: `${YESTERDAY_STR}T09:00:00`,
    createdAt: `${YESTERDAY_STR}T09:00:00`,
    isPinned: false,
    lastOpenedAt: `${YESTERDAY_STR}T10:30:00`,
    relatedHandoverIds: [],
    relatedTaskIds: [],
    mockContent: {
      type: "csv",
      headers: ["日付", "売上合計", "客数", "客単価", "前年比", "担当者"],
      rows: [
        ["2026/06/01", "285,400", "142", "2,010", "98.2%", "石川 まさお"],
        ["2026/06/02", "312,800", "158", "1,980", "103.5%", "坂本 るり"],
        ["2026/06/03", "298,200", "149", "2,002", "99.1%", "石川 まさお"],
        ["2026/06/04", "410,500", "201", "2,042", "107.8%", "坂本 るり"],
        ["2026/06/05", "388,900", "193", "2,016", "105.2%", "石川 まさお"],
        ["2026/06/06", "276,300", "138", "2,002", "95.7%", "坂本 るり"],
        ["2026/06/07", "195,600", "98",  "1,996", "89.4%", "石川 まさお"],
        ["2026/06/08", "301,200", "151", "1,995", "100.3%", "坂本 るり"],
      ],
    },
  },

  // ── Word ──────────────────────────────────────────────────────────────────
  {
    id: "doc-006",
    name: "新人研修テキスト",
    fileType: "word",
    category: "研修・教育",
    tags: ["研修", "新人", "オンボーディング"],
    description: "新しく入ったスタッフ向けの業務研修テキストです。基本的なルールと手順を記載しています。",
    author: "人事・教育担当",
    updatedAt: `${demoDateString(-43)}T14:00:00`,
    createdAt: "2025-09-01T09:00:00",
    isPinned: false,
    lastOpenedAt: `${demoDateString(-22)}T11:00:00`,
    relatedHandoverIds: [],
    relatedTaskIds: [],
    mockContent: {
      type: "word",
      title: "新人研修テキスト",
      sections: [
        {
          heading: "はじめに",
          body: "このテキストは、新しく着任されたスタッフの皆さんが現場での業務をスムーズにスタートできるよう作成しました。まずはこのテキストを通読し、わからない点は遠慮なく先輩スタッフや管理者に確認してください。",
        },
        {
          heading: "1. 基本ルール",
          body: "① 出勤時は必ずタイムカードを打刻してください。\n② 制服・身だしなみは規定に従ってください。\n③ スマートフォンの業務中使用は禁止です（緊急時を除く）。\n④ 申し送りは口頭だけでなく、必ずRebioに記録してください。",
        },
        {
          heading: "2. 申し送りの書き方",
          body: "申し送りは現場の安全と品質を守るための重要なコミュニケーションです。以下の点を意識して記録してください。\n\n・5W1H（いつ・どこで・誰が・何を・なぜ・どのように）を意識する\n・重要度を正直に申告する\n・次の担当者が迷わないよう具体的に書く\n・個人情報の取り扱いに注意する",
        },
        {
          heading: "3. 緊急時の対応",
          body: "緊急事態が発生した場合は、まず自分の安全を確保してください。その後、別途配布している「緊急時対応マニュアル」の手順に従って行動してください。マニュアルはLibraryからいつでも確認できます。",
        },
      ],
    },
  },

  // ── PowerPoint ────────────────────────────────────────────────────────────
  {
    id: "doc-007",
    name: "業務改善提案_Q2レビュー",
    fileType: "pptx",
    category: "会議資料",
    tags: ["改善提案", "Q2", "マネジメント"],
    description: "2026年Q2（4〜6月）の業務改善活動のレビューと次四半期への提案スライドです。",
    author: "マネジメントチーム",
    updatedAt: `${YESTERDAY_STR}T12:00:00`,
    createdAt: `${YESTERDAY_STR}T12:00:00`,
    isPinned: false,
    lastOpenedAt: undefined,
    relatedHandoverIds: [],
    relatedTaskIds: [],
    mockContent: {
      type: "pptx",
      slides: [
        {
          title: "業務改善活動 Q2レビュー",
          body: ["2026年4月〜6月", "マネジメントチーム"],
          slideType: "title",
          accentColor: "#2563EB",
        },
        {
          title: "Q2 主なトピックス",
          body: [
            "✓ 申し送りデジタル化の推進（Rebio導入）",
            "✓ 設備点検サイクルの短縮（月1回→隔週）",
            "✓ 新人研修プログラムの改訂",
            "△ 備品在庫管理の自動化（検討中）",
            "△ シフト表クラウド共有（次期対応）",
          ],
          slideType: "content",
          accentColor: "#0D9488",
        },
        {
          title: "申し送りデジタル化の効果",
          body: [
            "引き継ぎ漏れ件数：月平均8件 → 1件（▲87%）",
            "申し送り時間：1件あたり平均5分 → 2分（▲60%）",
            "スタッフ満足度（申し送り関連）：62% → 84%",
            "緊急事案の対応開始までの時間：平均12分 → 5分",
          ],
          slideType: "content",
          accentColor: "#2563EB",
        },
        {
          title: "Q3 優先アクション",
          body: [
            "1. 備品在庫管理の自動アラート設定",
            "2. シフト表の共有フローをRebioと連携",
            "3. 月次点検報告書のフォーマット統一",
            "4. スタッフ全員への追加研修（8月予定）",
          ],
          slideType: "content",
          accentColor: "#7C3AED",
        },
      ],
    },
  },

  // ── 画像 ──────────────────────────────────────────────────────────────────
  {
    id: "doc-008",
    name: "施設フロアマップ（全館）",
    fileType: "image",
    category: "施設情報",
    tags: ["フロアマップ", "避難", "施設案内"],
    description: "施設全館のフロアマップです。AEDの位置・避難経路・各部屋の配置を確認できます。",
    author: "管理部門",
    updatedAt: `${demoDateString(-92)}T10:00:00`,
    createdAt: "2025-04-01T09:00:00",
    isPinned: true,
    lastOpenedAt: `${TODAY_STR}T07:30:00`,
    relatedHandoverIds: [],
    relatedTaskIds: [],
    mockContent: {
      type: "image",
      alt: "施設フロアマップ",
      colorScheme: ["#EFF6FF", "#BFDBFE", "#93C5FD", "#60A5FA"],
      caption: "施設フロアマップ（2026年4月改訂版）— 実際のファイルではSVG形式で提供されます",
    },
  },
  {
    id: "doc-009",
    name: "設備点検写真記録_2026年6月",
    fileType: "image",
    category: "点検記録",
    tags: ["写真", "点検", "設備"],
    description: "2026年6月の設備巡回点検で撮影した記録写真です。異常箇所の写真を含みます。",
    author: "施設管理 村上",
    updatedAt: `${YESTERDAY_STR}T16:30:00`,
    createdAt: `${YESTERDAY_STR}T16:30:00`,
    isPinned: false,
    lastOpenedAt: `${TODAY_STR}T09:00:00`,
    relatedHandoverIds: ["h-demo-005", "h-demo-012"],
    relatedTaskIds: ["t-demo-002", "t-demo-005"],
    mockContent: {
      type: "image",
      alt: "設備点検写真記録",
      colorScheme: ["#F8FAFC", "#E2E8F0", "#CBD5E1", "#94A3B8"],
      caption: "点検写真記録（グレースケール）— 実際のファイルでは高解像度JPEGで提供されます",
    },
  },
];

// ─── Library store 関数 ──────────────────────────────────────────────────────

const KEY_LIBRARY     = "rebio_library";
const KEY_LIB_RECENT  = "rebio_lib_recent";   // string[] (doc ids, max 10)

export function loadLibrary(): LibraryDoc[] {
  const raw = lsGet(KEY_LIBRARY);
  if (!raw) return DEMO_LIBRARY;
  try { return JSON.parse(raw) as LibraryDoc[]; } catch { return DEMO_LIBRARY; }
}

export function saveLibrary(docs: LibraryDoc[]): void {
  lsSet(KEY_LIBRARY, JSON.stringify(docs));
}

export function togglePin(id: string): void {
  const docs = loadLibrary();
  const updated = docs.map(d => d.id === id ? { ...d, isPinned: !d.isPinned } : d);
  saveLibrary(updated);
}

export function recordOpen(id: string): void {
  // lastOpenedAt を更新
  const docs = loadLibrary();
  const now = new Date().toISOString();
  saveLibrary(docs.map(d => d.id === id ? { ...d, lastOpenedAt: now } : d));

  // recent list を更新（最大10件）
  const rawRecent = lsGet(KEY_LIB_RECENT);
  let recent: string[] = [];
  if (rawRecent) {
    try { recent = JSON.parse(rawRecent) as string[]; } catch { recent = []; }
  }
  const next = [id, ...recent.filter(r => r !== id)].slice(0, 10);
  lsSet(KEY_LIB_RECENT, JSON.stringify(next));
}

export function loadRecentIds(): string[] {
  const raw = lsGet(KEY_LIB_RECENT);
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

// initializeStore に Library を追加（KEY_INITIALIZED を v4 に上げて再実行）
const KEY_INITIALIZED_V4 = "rebio_initialized_v4";

export function initializeLibrary(): void {
  if (typeof window === "undefined") return;
  const done = lsGet(KEY_INITIALIZED_V4);
  if (done) return;
  lsSet(KEY_LIBRARY, JSON.stringify(DEMO_LIBRARY));
  lsSet(KEY_INITIALIZED_V4, "true");
}
