// ─── 勤務ログ repository ─────────────────────────────────────────────────────
// handovers.ts と同様、v13時点ではlocalStorage実装への薄いラッパーとして機能する。

import { WorkLog } from "@/app/types";
import { isSupabaseMode } from "@/app/lib/dataMode";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import * as localStore from "@/app/lib/store";

export async function fetchWorkLogs(): Promise<WorkLog[]> {
  if (isSupabaseMode()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from("work_logs").select("*");
        if (error) throw error;
        void data;
        // work_logsテーブルの行からWorkLog型への変換はv13では未実装。
        return localStore.loadLogs();
      } catch {
        return localStore.loadLogs();
      }
    }
  }
  return localStore.loadLogs();
}

export async function appendWorkLogRepo(log: WorkLog): Promise<void> {
  if (isSupabaseMode()) {
    const client = getSupabaseClient();
    if (client) {
      // work_logsへのinsertはv13では未実装。localStorageに保存する。
    }
  }
  localStore.appendLog(log);
}
