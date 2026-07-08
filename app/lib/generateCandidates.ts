import {
  WorkLog,
  HandoverCandidate,
  Priority,
  Confidence,
  Category,
  HandoverKind,
  ReadRequirement,
} from "@/app/types";

// キーワードルール定義
const URGENT_KEYWORDS = [
  "緊急",
  "急変",
  "危険",
  "119",
  "救急",
  "転倒",
  "骨折",
  "意識",
  "呼吸",
  "出血",
  "アレルギー",
  "ショック",
  "心停止",
];

const HIGH_KEYWORDS = [
  "重要",
  "必ず",
  "絶対",
  "注意",
  "要注意",
  "確認",
  "連絡",
  "報告",
  "変化",
  "悪化",
  "発熱",
  "痛み",
  "不安",
  "拒否",
];

const TASK_KEYWORDS = [
  "してください",
  "お願い",
  "確認をお願い",
  "対応",
  "手配",
  "発注",
  "連絡",
  "電話",
  "記録",
  "提出",
  "予約",
  "準備",
];

const CAUTION_KEYWORDS = [
  "注意",
  "気をつけ",
  "要注意",
  "アレルギー",
  "禁忌",
  "リスク",
  "危険",
  "転倒リスク",
  "誤嚥",
  "皮膚",
  "傷",
];

const REPORT_KEYWORDS = [
  "報告",
  "連絡",
  "お伝え",
  "ご家族",
  "家族",
  "医師",
  "先生",
  "ドクター",
  "変化あり",
  "変化がありました",
];

// 申し送りの性質を判定する。
// task カテゴリ（対応・手配・連絡などのキーワードを含む）は「対応が必要」。
// caution / report は内容の性質上「確認してほしい」。
// note（通常記録）は基本的に「共有のみ」。
// ただし緊急・高優先度の場合は note でも確認を求める。
function detectKind(category: Category, priority: Priority): HandoverKind {
  if (category === "task") return "action";
  if (category === "caution" || category === "report") return "check";
  if (priority === "urgent" || priority === "high") return "check";
  return "share";
}

// 確認要求レベルを判定する。
// 対応が必要なものは確認必須。確認してほしいものは既読のみで足りる場合が多い。
// 共有のみは既読確認そのものを求めない。
function detectReadRequirement(kind: HandoverKind, priority: Priority, confidence: Confidence): ReadRequirement {
  if (kind === "action") return "confirm";
  if (kind === "check") {
    if (priority === "urgent" || priority === "high" || confidence === "low") return "confirm";
    return "read";
  }
  return "none";
}

function detectPriority(text: string, selfPriority: Priority): Priority {
  const lower = text;
  if (URGENT_KEYWORDS.some((kw) => lower.includes(kw))) return "urgent";
  if (selfPriority === "urgent") return "urgent";
  if (HIGH_KEYWORDS.some((kw) => lower.includes(kw))) return "high";
  if (selfPriority === "high") return "high";
  if (selfPriority === "medium") return "medium";
  return "low";
}

function detectCategory(text: string): Category {
  if (CAUTION_KEYWORDS.some((kw) => text.includes(kw))) return "caution";
  if (TASK_KEYWORDS.some((kw) => text.includes(kw))) return "task";
  if (REPORT_KEYWORDS.some((kw) => text.includes(kw))) return "report";
  return "note";
}

function detectConfidence(
  text: string,
  category: Category,
  priority: Priority
): Confidence {
  // 緊急度が高いが根拠が曖昧な場合
  if (priority === "urgent" && text.length < 30) return "low";
  // カテゴリ判定が明確なキーワードを多く含む場合
  const allKeywords = [...TASK_KEYWORDS, ...CAUTION_KEYWORDS, ...REPORT_KEYWORDS];
  const matchCount = allKeywords.filter((kw) => text.includes(kw)).length;
  if (matchCount >= 3) return "high";
  if (matchCount >= 1) return "medium";
  if (category === "note") return "medium";
  return "low";
}

function extractSourceExcerpt(text: string, keywords: string[]): string {
  // キーワードを含む文を抽出
  const sentences = text.split(/[。\n]/);
  const matched = sentences.find((s) =>
    keywords.some((kw) => s.includes(kw))
  );
  if (matched && matched.trim().length > 0) {
    return matched.trim().slice(0, 80) + (matched.trim().length > 80 ? "…" : "");
  }
  return text.slice(0, 60) + (text.length > 60 ? "…" : "");
}

function generateTitle(text: string, category: Category): string {
  const sentences = text.split(/[。\n]/).filter((s) => s.trim().length > 5);
  const first = sentences[0]?.trim() ?? text.trim();
  const truncated = first.slice(0, 25) + (first.length > 25 ? "…" : "");

  switch (category) {
    case "task":
      return `【要対応】${truncated}`;
    case "caution":
      return `【注意】${truncated}`;
    case "report":
      return `【報告】${truncated}`;
    default:
      return truncated;
  }
}

// メインのログ解析・候補生成関数
export function generateCandidates(log: WorkLog): HandoverCandidate[] {
  const candidates: HandoverCandidate[] = [];
  const text = log.content;

  // 文をセンテンス単位で分割
  const sentences = text
    .split(/[。\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (sentences.length === 0) return [];

  // 複数センテンスをグルーピングしてカテゴリを判定
  // 2〜3センテンスのチャンクで処理
  const chunkSize = Math.max(1, Math.ceil(sentences.length / 3));
  const chunks: string[][] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    chunks.push(sentences.slice(i, i + chunkSize));
  }

  const usedCategories = new Set<Category>();

  for (const chunk of chunks) {
    const chunkText = chunk.join("。");
    const category = detectCategory(chunkText);
    const priority = detectPriority(chunkText, log.selfPriority);
    const confidence = detectConfidence(chunkText, category, priority);

    // 同カテゴリが複数あっても追加（重要な場合）
    const shouldAdd =
      !usedCategories.has(category) ||
      priority === "urgent" ||
      priority === "high";

    if (shouldAdd) {
      usedCategories.add(category);

      const allKeywords = [
        ...TASK_KEYWORDS,
        ...CAUTION_KEYWORDS,
        ...REPORT_KEYWORDS,
        ...URGENT_KEYWORDS,
        ...HIGH_KEYWORDS,
      ];

      const kind = detectKind(category, priority);
      const readRequirement = detectReadRequirement(kind, priority, confidence);

      candidates.push({
        id: `candidate-${log.id}-${candidates.length}`,
        logId: log.id,
        category,
        kind,
        readRequirement,
        title: generateTitle(chunkText, category),
        content: chunkText,
        priority,
        confidence,
        sourceExcerpt: extractSourceExcerpt(chunkText, allKeywords),
        reviewStatus: "pending",
        audiences: log.audiences,
      });
    }
  }

  // ログ全体が短く1件しか生成されない場合の補完
  if (candidates.length === 0 && text.trim().length > 0) {
    const kind = detectKind("note", log.selfPriority);
    const readRequirement = detectReadRequirement(kind, log.selfPriority, "medium");
    candidates.push({
      id: `candidate-${log.id}-0`,
      logId: log.id,
      category: "note",
      kind,
      readRequirement,
      title: generateTitle(text, "note"),
      content: text.trim(),
      priority: log.selfPriority,
      confidence: "medium",
      sourceExcerpt: text.slice(0, 60) + (text.length > 60 ? "…" : ""),
      reviewStatus: "pending",
      audiences: log.audiences,
    });
  }

  return candidates;
}
