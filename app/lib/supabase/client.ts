// ─── Supabaseクライアント ────────────────────────────────────────────────────
// 接続情報が無い環境でもimport時にエラーにならないよう、
// クライアントの生成は遅延させ、未設定時は null を返す。

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let cachedClient: SupabaseClient<Database> | null = null;
let attempted = false;

// Supabaseクライアントを取得する。接続情報が無ければ null を返す。
// repository層は、この関数がnullを返す場合は必ずlocalStorage実装にフォールバックすること。
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (attempted) return cachedClient;
  attempted = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    cachedClient = null;
    return null;
  }

  try {
    cachedClient = createClient<Database>(url, anonKey);
  } catch {
    // URLの形式が不正な場合など、生成自体に失敗するケースも安全側に倒す
    cachedClient = null;
  }
  return cachedClient;
}
