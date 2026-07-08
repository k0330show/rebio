// ─── データモード判定 ────────────────────────────────────────────────────────
// Rebioは環境変数によって "local"（localStorage）と "supabase"（Supabaseクラウド）
// の2モードを切り替える。Supabaseの接続情報が無い場合は、明示的に
// supabaseモードを指定していても安全に localモードへフォールバックする。

export type DataMode = "local" | "supabase";

function hasSupabaseCredentials(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !!anonKey && url.length > 0 && anonKey.length > 0;
}

// 実際に使用するデータモードを返す。
// 環境変数が supabase を指していても、接続情報が欠けていれば local にフォールバックする。
export function getDataMode(): DataMode {
  const requested = process.env.NEXT_PUBLIC_REBIO_DATA_MODE;
  if (requested === "supabase" && hasSupabaseCredentials()) {
    return "supabase";
  }
  return "local";
}

// UIから「なぜlocalモードなのか」を説明するために使う。
export function getDataModeReason(): string | null {
  const requested = process.env.NEXT_PUBLIC_REBIO_DATA_MODE;
  if (requested === "supabase" && !hasSupabaseCredentials()) {
    return "Supabaseの接続情報が設定されていないため、localStorageデモモードで動作しています。";
  }
  return null;
}

export function isSupabaseMode(): boolean {
  return getDataMode() === "supabase";
}
