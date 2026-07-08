// ─── タスク repository ───────────────────────────────────────────────────────

import { Task, TaskStatus } from "@/app/types";
import { isSupabaseMode } from "@/app/lib/dataMode";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import * as localStore from "@/app/lib/store";

export async function fetchTasks(): Promise<Task[]> {
  if (isSupabaseMode()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from("tasks").select("*");
        if (error) throw error;
        void data;
        // tasksテーブルの行からTask型への変換はv13では未実装。
        return localStore.loadTasks();
      } catch {
        return localStore.loadTasks();
      }
    }
  }
  return localStore.loadTasks();
}

export async function updateTaskStatusRepo(id: string, status: TaskStatus): Promise<void> {
  if (isSupabaseMode()) {
    const client = getSupabaseClient();
    if (client) {
      // tasksのupdateはv13では未実装。localStorageに保存する。
    }
  }
  localStore.updateTaskStatus(id, status);
}
