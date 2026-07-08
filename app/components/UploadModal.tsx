"use client";

import { useState, useRef } from "react";
import { LibraryDoc } from "@/app/types";
import { isSupabaseMode } from "@/app/lib/dataMode";
import { uploadDocument, ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES } from "@/app/lib/repositories/documents";
import { UploadCloud, X, AlertTriangle, Loader2 } from "lucide-react";

interface UploadModalProps {
  onClose: () => void;
  onUploaded: (doc: LibraryDoc) => void;
}

export default function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabaseMode = isSupabaseMode();

  const handleFileSelect = (f: File | null) => {
    setErrorMessage(null);
    setFile(f);
    if (f && !title) setTitle(f.name);
  };

  const handleSubmit = async () => {
    if (!supabaseMode) {
      setErrorMessage("localStorageデモモードでは実ファイルのアップロードはできません。Supabase環境変数を設定すると利用できます。");
      return;
    }
    if (!file) {
      setErrorMessage("ファイルを選択してください。");
      return;
    }
    setIsUploading(true);
    setErrorMessage(null);
    const tags = tagsInput.split(/[,、\s]+/).map(t => t.trim()).filter(Boolean);
    const result = await uploadDocument(file, {
      title: title || file.name,
      category: category || "未分類",
      tags,
      description,
    });
    setIsUploading(false);
    if (!result.success) {
      setErrorMessage(result.message ?? "アップロードに失敗しました。");
      return;
    }
    if (result.doc) onUploaded(result.doc);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "1.5rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFFFF", borderRadius: "13px", padding: "24px",
          maxWidth: "440px", width: "100%",
          boxShadow: "0 8px 28px rgba(15,23,42,0.12)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>書類をアップロード</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
            <X size={16} color="#94A3B8" />
          </button>
        </div>

        {!supabaseMode && (
          <div style={{ display: "flex", gap: "8px", padding: "10px 12px", background: "#FDF6EC", border: "1px solid #F0DDBB", borderRadius: "9px", marginBottom: "14px" }}>
            <AlertTriangle size={14} color="#B45309" style={{ flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "12px", color: "#78350F", lineHeight: 1.6 }}>
              現在はlocalStorageデモモードのため、実ファイルのアップロードはできません（デモ表示のみ）。Supabase環境変数を設定すると利用できます。
            </p>
          </div>
        )}

        {/* ファイル選択 */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "1.5px dashed #C9DAF1", borderRadius: "9px", padding: "20px",
            textAlign: "center", cursor: "pointer", background: "#F7F8FA", marginBottom: "14px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_UPLOAD_EXTENSIONS.map(e => `.${e}`).join(",")}
            onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          <UploadCloud size={22} color="#2F5EAA" style={{ margin: "0 auto 6px" }} />
          <p style={{ fontSize: "13px", color: "#334155", fontWeight: 600 }}>
            {file ? file.name : "クリックしてファイルを選択"}
          </p>
          <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "3px" }}>
            対応形式：{ALLOWED_UPLOAD_EXTENSIONS.join(" / ")}（上限{Math.floor(MAX_UPLOAD_SIZE_BYTES / 1024 / 1024)}MB）
          </p>
        </div>

        {/* メタ情報 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>タイトル</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例：点検表_7月"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>カテゴリ</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="例：点検表"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>タグ（カンマ区切り）</label>
            <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="例：設備, 月次"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: "7px", fontSize: "13px", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>説明</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="任意"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: "7px", fontSize: "13px", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
          </div>
        </div>

        {errorMessage && (
          <div style={{ display: "flex", gap: "7px", padding: "9px 11px", background: "#FBEEEC", border: "1px solid #EFCCC6", borderRadius: "8px", marginBottom: "12px" }}>
            <AlertTriangle size={13} color="#C0392B" style={{ flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "12px", color: "#8C3229", lineHeight: 1.6 }}>{errorMessage}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#64748B", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            style={{
              flex: 1, padding: "10px", borderRadius: "8px", border: "none",
              background: isUploading ? "#94A3B8" : "#2F5EAA", color: "white",
              fontSize: "13px", fontWeight: 700, cursor: isUploading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
          >
            {isUploading ? <><Loader2 size={13} className="animate-spin" /> アップロード中…</> : "アップロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
