// ─── Rebio デザイントークン ────────────────────────────────────────────────────
// 落ち着いた業務SaaSのトーンを保つための共通カラー・スタイル定数。
// 派手さより清潔感・安心感・見通しの良さを優先する。
// 緊急・重要な警告以外では強い色を使わない。

export const colors = {
  // 背景・カード
  bg: "#F7F8FA",
  bgSubtle: "#FAFBFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderSubtle: "#EDF1F5",

  // テキスト
  text: "#1E293B",
  textSub: "#64748B",
  textFaint: "#94A3B8",
  textMuted: "#CBD5E1",

  // ブランド
  brand: "#2F5EAA",
  brandSoft: "#EEF3FB",
  brandBorder: "#C9DAF1",
  teal: "#0F766E",
  tealSoft: "#EAF6F4",
  tealBorder: "#BFE3DE",

  // 状態色（控えめに使う）
  warn: "#B45309",
  warnSoft: "#FDF6EC",
  warnBorder: "#F0DDBB",
  urgent: "#C0392B",
  urgentSoft: "#FBEEEC",
  urgentBorder: "#EFCCC6",
  success: "#0F766E",
  successSoft: "#EAF6F4",
  successBorder: "#BFE3DE",
} as const;

export const radius = {
  sm: "8px",
  md: "10px",
  lg: "13px",
  pill: "999px",
} as const;

export const shadow = {
  // ごく弱い影。基本は border で輪郭を出す。
  card: "0 1px 2px rgba(15, 23, 42, 0.04)",
  raised: "0 2px 8px rgba(15, 23, 42, 0.06)",
} as const;

export const font = {
  // 見出し・本文で共通のトラッキング
  headingLetterSpacing: "-0.3px",
} as const;
