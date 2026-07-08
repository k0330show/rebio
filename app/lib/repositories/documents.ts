// ─── 書類（documents） repository ────────────────────────────────────────────
// v14: Supabase Storageへの実ファイルアップロードに対応する。
// localモードでは実アップロードができないため、常に「デモ表示」であることを
// 呼び出し側（UI）が明示する前提で、この層は保存の成否のみを返す。

import { LibraryDoc, FileType } from "@/app/types";
import { isSupabaseMode } from "@/app/lib/dataMode";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import * as localStore from "@/app/lib/store";

export const STORAGE_BUCKET = "documents";

// アップロード可能な拡張子（v14時点。Officeファイルの実アップロードは対象外）
export const ALLOWED_UPLOAD_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "csv"] as const;
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type UploadErrorReason =
  | "not_supabase_mode"
  | "no_client"
  | "unsupported_type"
  | "too_large"
  | "bucket_missing"
  | "network_error";

export interface UploadResult {
  success: boolean;
  reason?: UploadErrorReason;
  message?: string;
  doc?: LibraryDoc;
}

function extensionToFileType(filename: string): FileType | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "pdf";
    case "png": case "jpg": case "jpeg": case "webp": return "image";
    case "csv": return "csv";
    default: return null;
  }
}

export function validateFile(file: File): { ok: boolean; reason?: UploadErrorReason; message?: string } {
  const fileType = extensionToFileType(file.name);
  if (!fileType) {
    return { ok: false, reason: "unsupported_type", message: "対応していないファイル形式です（PDF・PNG・JPG・JPEG・WEBP・CSVのみ対応）。" };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { ok: false, reason: "too_large", message: "ファイルサイズが大きすぎます（上限10MB）。" };
  }
  return { ok: true };
}

// v14: 実ファイルをSupabase Storageにアップロードし、documentsメタデータを保存する。
// localモードの場合は常に失敗を返す（呼び出し側で「デモ表示」の案内をする前提）。
export async function uploadDocument(
  file: File,
  meta: { title: string; category: string; tags: string[]; description: string }
): Promise<UploadResult> {
  if (!isSupabaseMode()) {
    return {
      success: false,
      reason: "not_supabase_mode",
      message: "localStorageデモモードでは実ファイルのアップロードはできません。Supabase環境変数を設定すると利用できます。",
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, reason: "no_client", message: "Supabaseへの接続に失敗しました。環境変数を確認してください。" };
  }

  const validation = validateFile(file);
  if (!validation.ok) {
    return { success: false, reason: validation.reason, message: validation.message };
  }

  try {
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(path, file);
    if (uploadError) {
      // bucket未作成の場合もここに来る想定
      const isMissingBucket = uploadError.message?.toLowerCase().includes("bucket");
      return {
        success: false,
        reason: isMissingBucket ? "bucket_missing" : "network_error",
        message: isMissingBucket
          ? `Storageバケット「${STORAGE_BUCKET}」が見つかりません。Supabase側でバケットを作成してください。`
          : "ファイルのアップロードに失敗しました。通信状況を確認して再度お試しください。",
      };
    }

    const { data: urlData } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const fileType = extensionToFileType(file.name);

    const { error: insertError } = await client.from("documents").insert({
      team_id: "", // v14時点ではチーム機能未実装のため空文字。v15以降で実装。
      name: file.name,
      file_type: fileType ?? "pdf",
      category: meta.category,
      tags: meta.tags,
      description: meta.description,
      storage_path: path,
      file_size_bytes: file.size,
      is_pinned: false,
    });

    if (insertError) {
      return { success: false, reason: "network_error", message: "ファイルは保存されましたが、情報の登録に失敗しました。" };
    }

    return {
      success: true,
      doc: {
        id: path,
        name: file.name,
        fileType: fileType ?? "pdf",
        category: meta.category,
        tags: meta.tags,
        description: meta.description,
        author: "you",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isPinned: false,
        relatedHandoverIds: [],
        relatedTaskIds: [],
        mockContent: { type: "pdf", pageCount: 1, pages: [""] },
        isUploaded: true,
        storagePath: path,
        fileSizeBytes: file.size,
        publicUrl: urlData?.publicUrl,
      },
    };
  } catch {
    return { success: false, reason: "network_error", message: "予期しないエラーが発生しました。時間をおいて再度お試しください。" };
  }
}

// v14: ファイル削除。呼び出し側で必ず確認ダイアログを表示すること。
export async function deleteDocument(doc: { id: string; storagePath?: string }): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseMode() || !doc.storagePath) {
    // localモード or デモ書類（実ファイルなし）の場合は、localStorage上のデモデータ削除として扱う
    const docs = localStore.loadLibrary().filter(d => d.id !== doc.id);
    localStore.saveLibrary(docs);
    return { success: true };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: "Supabaseへの接続に失敗しました。" };
  }

  try {
    const { error: storageError } = await client.storage.from(STORAGE_BUCKET).remove([doc.storagePath]);
    if (storageError) {
      return { success: false, message: "ファイルの削除に失敗しました。" };
    }
    const { error: dbError } = await client.from("documents").delete().eq("id", doc.id);
    if (dbError) {
      return { success: false, message: "ファイルは削除されましたが、情報の削除に失敗しました。" };
    }
    return { success: true };
  } catch {
    return { success: false, message: "予期しないエラーが発生しました。" };
  }
}
