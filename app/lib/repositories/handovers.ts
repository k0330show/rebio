// ─── 申し送り repository ─────────────────────────────────────────────────────
// UIコンポーネントは将来的にこの層のみを呼び出す想定。
// v13時点では既存ページはまだ app/lib/store.ts を直接呼んでおり、
// この層は「Supabase移行の受け皿」として新設している（段階的移行）。
//
// - localモード: 既存の app/lib/store.ts の実装をそのまま利用する
// - supabaseモード: Supabaseクライアントで users/handovers 等を読み書きする
//
// Supabase接続情報が無い場合は、supabaseモードが指定されていても
// 必ず local の結果を返す（クラッシュさせない）。

import { Handover } from "@/app/types";
import { isSupabaseMode } from "@/app/lib/dataMode";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import * as localStore from "@/app/lib/store";

export async function fetchHandovers(): Promise<Handover[]> {
  if (isSupabaseMode()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        // v13時点ではテーブル結合・型変換の実装は簡略化し、
        // 接続確認ができない環境でも安全にビルドが通ることを優先する。
        // 本格実装時は handovers / handover_audiences / read_receipts / handover_comments を
        // JOINして現行のHandover型に変換する処理をここに実装する。
        const { data, error } = await client.from("handovers").select("*");
        if (error) throw error;
        // Supabaseの行データをアプリ内のHandover型に変換する処理は
        // テーブル結合が必要なため、v13では未実装（today: フォールバック）。
        // dataが取得できた場合でも、変換ロジックが整うまではlocalの結果を使う。
        void data;
        return localStore.loadHandovers();
      } catch {
        // 通信失敗時はlocalStorageの内容にフォールバックする
        return localStore.loadHandovers();
      }
    }
  }
  return localStore.loadHandovers();
}

export function saveHandoversLocal(handovers: Handover[]): void {
  // Supabaseモードでも、書き込みAPIが整うまでは併用としてlocalStorageにも保存しておく。
  localStore.saveHandovers(handovers);
}

export async function appendHandoversRepo(newOnes: Handover[]): Promise<void> {
  if (isSupabaseMode()) {
    const client = getSupabaseClient();
    if (client) {
      // v13時点ではhandovers/handover_audiences/read_receiptsへのinsertは未実装。
      // Supabase接続自体は確立できるが、書き込みロジックは次段階で実装する。
      // 失敗してもlocalStorageには必ず反映し、データを失わないようにする。
    }
  }
  localStore.appendHandovers(newOnes);
}

export async function addCommentRepo(handoverId: string, body: string): Promise<void> {
  if (isSupabaseMode()) {
    const client = getSupabaseClient();
    if (client) {
      // handover_commentsへのinsertはv13では未実装。localStorageに保存する。
    }
  }
  localStore.addHandoverComment(handoverId, body);
}
