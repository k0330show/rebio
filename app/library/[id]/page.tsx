"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import LoadingScreen from "@/app/components/LoadingScreen";
import FileTypeIcon, { FileTypeBadge, FILE_TYPE_CONFIG } from "@/app/components/FileTypeIcon";
import DocPreview from "@/app/components/DocPreview";
import { LibraryDoc, FILE_TYPE_EXT } from "@/app/types";
import {
  initializeStore, initializeLibrary,
  loadLibrary, loadHandovers, loadTasks,
  recordOpen, togglePin, formatDate,
} from "@/app/lib/store";
import {
  ArrowLeft, Pin, PinOff, Tag, User, Calendar,
  ClipboardList, CheckSquare, ExternalLink, Download,
  Link2,
} from "lucide-react";

// タグバッジ
function TagChip({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "3px 9px", borderRadius: "100px",
      background: "#F1F5F9", color: "#475569",
      border: "1px solid #E2E8F0", fontSize: "12px",
    }}>
      <Tag size={11} />
      {label}
    </span>
  );
}

export default function LibraryDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [doc, setDoc]           = useState<LibraryDoc | null>(null);
  const [sameCategory, setSameCategory] = useState<LibraryDoc[]>([]);
  const [relHandovers, setRelHandovers] = useState<ReturnType<typeof loadHandovers>>([]);
  const [relTasks, setRelTasks]         = useState<ReturnType<typeof loadTasks>>([]);
  const [mounted, setMounted]   = useState(false);
  const [pinned, setPinned]     = useState(false);

  useEffect(() => {
    initializeStore();
    initializeLibrary();
    const docs = loadLibrary();
    const found = docs.find(d => d.id === id);
    if (!found) { router.push("/library"); return; }
    setDoc(found);
    setPinned(found.isPinned);
    setSameCategory(docs.filter(d => d.category === found.category && d.id !== found.id).slice(0, 4));
    const allHandovers = loadHandovers();
    const allTasks     = loadTasks();
    setRelHandovers(allHandovers.filter(h => found.relatedHandoverIds.includes(h.id)));
    setRelTasks(allTasks.filter(t => found.relatedTaskIds.includes(t.id)));
    recordOpen(id);
    setMounted(true);
  }, [id, router]);

  const handlePin = () => {
    togglePin(id);
    setPinned(prev => !prev);
  };

  if (!mounted || !doc) return <LoadingScreen />;

  const config = FILE_TYPE_CONFIG[doc.fileType];
  const ext    = FILE_TYPE_EXT[doc.fileType];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />

      {/* パンくず */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 1.5rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Link href="/library" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#64748B", textDecoration: "none" }}>
            <ArrowLeft size={14} /> 書類ライブラリ
          </Link>
          <span style={{ fontSize: "13px", color: "#CBD5E1" }}>/</span>
          <span style={{ fontSize: "13px", color: "#1E293B", fontWeight: 500 }}>{doc.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "20px",
          alignItems: "start",
        }}>

          {/* ── 左：プレビュー ── */}
          <div>
            {/* ファイルヘッダーカード */}
            <div style={{
              background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px",
              overflow: "hidden", marginBottom: "16px",
            }}>
              <div style={{
                background: config.bg, borderBottom: `1px solid ${config.border}`,
                padding: "20px 24px",
                display: "flex", alignItems: "flex-start", gap: "14px",
              }}>
                <FileTypeIcon fileType={doc.fileType} size={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <FileTypeBadge fileType={doc.fileType} />
                    <span style={{ fontSize: "12px", color: "#64748B" }}>{doc.category}</span>
                  </div>
                  <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.3px", lineHeight: 1.3 }}>
                    {doc.name}{ext}
                  </h1>
                </div>

                {/* アクション */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={handlePin}
                    title={pinned ? "ピン留めを外す" : "ピン留めする"}
                    style={{
                      padding: "7px 10px", borderRadius: "7px",
                      border: `1.5px solid ${pinned ? "#E5E9EF" : "#E2E8F0"}`,
                      background: pinned ? "#FEF3C7" : "#FFFFFF",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
                      fontSize: "12px", fontWeight: 500, color: pinned ? "#B45309" : "#64748B",
                    }}
                  >
                    {pinned ? <Pin size={13} fill="#B45309" /> : <PinOff size={13} />}
                    {pinned ? "ピン留め中" : "ピン留め"}
                  </button>
                  {doc.isUploaded && doc.publicUrl ? (
                    <a
                      href={doc.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 10px", borderRadius: "7px",
                        border: "1px solid #C9DAF1", background: "#EEF3FB",
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        fontSize: "12px", color: "#2F5EAA", fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      <Download size={12} />
                      ダウンロード
                    </a>
                  ) : (
                    <span style={{
                      padding: "6px 10px", borderRadius: "7px",
                      border: "1px solid #E2E8F0", background: "#F7F8FA",
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      fontSize: "11px", color: "#94A3B8",
                    }}>
                      <Download size={12} />
                      ファイル操作はSupabaseモードのみ
                    </span>
                  )}
                </div>
              </div>

              {/* 説明 */}
              <div style={{ padding: "16px 24px" }}>
                <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.7 }}>{doc.description}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                  {doc.tags.map(tag => <TagChip key={tag} label={tag} />)}
                </div>
              </div>
            </div>

            {/* プレビュー */}
            <div style={{
              background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid #F1F5F9",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>プレビュー</span>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                  ※ デモ用プレビュー。実際のファイルとは異なります。
                </span>
              </div>
              <div style={{ padding: "16px" }}>
                <DocPreview content={doc.mockContent} />
              </div>
            </div>
          </div>

          {/* ── 右：サイドバー ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* ファイル情報 */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                書類情報
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { icon: User, label: "作成者", value: doc.author },
                  {
                    icon: Calendar, label: "最終更新",
                    value: formatDate(doc.updatedAt),
                  },
                  ...(doc.fileSizeBytes !== undefined ? [{
                    icon: Calendar, label: "サイズ",
                    value: `${(doc.fileSizeBytes / 1024).toFixed(1)} KB`,
                  }] : []),
                  {
                    icon: Calendar, label: "最後に開いた",
                    value: doc.lastOpenedAt ? formatDate(doc.lastOpenedAt) : "—",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <Icon size={14} color="#94A3B8" style={{ marginTop: "1px", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "11px", color: "#94A3B8" }}>{label}</p>
                      <p style={{ fontSize: "13px", color: "#1E293B", fontWeight: 500 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 関連申し送り */}
            {relHandovers.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Link2 size={12} /> 関連する申し送り
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {relHandovers.map(h => (
                    <Link key={h.id} href="/handover" style={{ textDecoration: "none" }}>
                      <div style={{
                        padding: "8px 10px", background: "#F7F8FA",
                        border: "1px solid #F1F5F9", borderRadius: "8px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                          <ClipboardList size={12} color="#0F766E" />
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#0F766E" }}>
                            {h.status === "open" ? "未対応" : h.status === "in_progress" ? "対応中" : "完了"}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#1E293B", fontWeight: 500, lineHeight: 1.4 }}>{h.title}</p>
                        <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>{h.assignee}へ</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/handover" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#2F5EAA", textDecoration: "none", marginTop: "8px" }}>
                  申し送り一覧へ <ExternalLink size={10} />
                </Link>
              </div>
            )}

            {/* 関連タスク */}
            {relTasks.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Link2 size={12} /> 関連するタスク
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {relTasks.map(t => (
                    <Link key={t.id} href="/tasks" style={{ textDecoration: "none" }}>
                      <div style={{
                        padding: "8px 10px", background: "#F7F8FA",
                        border: "1px solid #F1F5F9", borderRadius: "8px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                          <CheckSquare size={12} color="#2F5EAA" />
                          <span style={{ fontSize: "11px", fontWeight: 600, color: t.status === "completed" ? "#0F766E" : t.status === "in_progress" ? "#2F5EAA" : "#64748B" }}>
                            {t.status === "todo" ? "未着手" : t.status === "in_progress" ? "対応中" : "完了"}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#1E293B", fontWeight: 500, lineHeight: 1.4 }}>{t.title}</p>
                        <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>{t.assignee}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/tasks" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#2F5EAA", textDecoration: "none", marginTop: "8px" }}>
                  タスク一覧へ <ExternalLink size={10} />
                </Link>
              </div>
            )}

            {/* 同カテゴリの書類 */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                同じカテゴリの書類
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {sameCategory.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#94A3B8" }}>同カテゴリの書類はありません</p>
                ) : sameCategory.map(d => (
                  <Link key={d.id} href={`/library/${d.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", background: "#F7F8FA", borderRadius: "7px", border: "1px solid #F1F5F9" }}>
                      <FileTypeIcon fileType={d.fileType} size={13} />
                      <p style={{ fontSize: "12px", color: "#1E293B", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
