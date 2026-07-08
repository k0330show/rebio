"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import LoadingScreen from "@/app/components/LoadingScreen";
import FileTypeIcon, { FileTypeBadge } from "@/app/components/FileTypeIcon";
import DocPreviewCompact from "@/app/components/DocPreviewCompact";
import UploadModal from "@/app/components/UploadModal";
import { LibraryDoc, FileType, FILE_TYPE_LABELS } from "@/app/types";
import {
  initializeStore, initializeLibrary,
  loadLibrary, loadRecentIds, recordOpen, togglePin,
  loadHandovers, loadTasks,
  formatDate,
} from "@/app/lib/store";
import {
  Pin, PinOff, Search, LayoutList, AlignJustify,
  Tag, Link2, FolderOpen, X, ExternalLink, Info,
  Upload, Trash2, HardDrive,
} from "lucide-react";
import { isSupabaseMode } from "@/app/lib/dataMode";
import { deleteDocument } from "@/app/lib/repositories/documents";

type ViewMode = "list" | "compact";
type CategoryFilter = "all" | "pinned" | "recent" | string;

// ── タグバッジ ────────────────────────────────────────────────────────────────
function TagChip({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "3px",
      padding: "1px 7px", borderRadius: "100px",
      background: "#F1F5F9", color: "#475569",
      fontSize: "10px", fontWeight: 500,
    }}>
      <Tag size={9} />
      {label}
    </span>
  );
}

// ── 左カラム：カテゴリ一覧の各項目 ──────────────────────────────────────────────
function CategorySidebarItem({
  id, label, count, icon: Icon, isActive, onSelect,
}: {
  id: CategoryFilter; label: string; count: number; icon: React.ElementType;
  isActive: boolean; onSelect: (c: CategoryFilter) => void;
}) {
  return (
    <button
      onClick={() => onSelect(id)}
      style={{
        display: "flex", alignItems: "center", gap: "8px", width: "100%",
        padding: "7px 10px", borderRadius: "7px", border: "none",
        background: isActive ? "#EEF3FB" : "transparent",
        color: isActive ? "#2F5EAA" : "#475569",
        fontSize: "13px", fontWeight: isActive ? 600 : 400,
        cursor: "pointer", textAlign: "left",
      }}
    >
      <Icon size={14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: "11px", color: "#94A3B8" }}>{count}</span>
    </button>
  );
}

// ── 左カラム：カテゴリ一覧 ──────────────────────────────────────────────────────
function CategorySidebar({
  categories, activeCategory, onSelect, counts, pinnedCount, recentCount,
}: {
  categories: string[]; activeCategory: CategoryFilter;
  onSelect: (c: CategoryFilter) => void;
  counts: Record<string, number>; pinnedCount: number; recentCount: number;
}) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <CategorySidebarItem id="all" label="すべての書類" count={totalCount} icon={FolderOpen} isActive={activeCategory === "all"} onSelect={onSelect} />
      <CategorySidebarItem id="pinned" label="ピン留め" count={pinnedCount} icon={Pin} isActive={activeCategory === "pinned"} onSelect={onSelect} />
      <CategorySidebarItem id="recent" label="最近開いた" count={recentCount} icon={AlignJustify} isActive={activeCategory === "recent"} onSelect={onSelect} />
      <div style={{ height: "1px", background: "#F1F5F9", margin: "8px 0" }} />
      <p style={{ fontSize: "10px", fontWeight: 700, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 10px", marginBottom: "4px" }}>
        カテゴリ（自由設定）
      </p>
      {categories.map(c => (
        <CategorySidebarItem key={c} id={c} label={c} count={counts[c] ?? 0} icon={FolderOpen} isActive={activeCategory === c} onSelect={onSelect} />
      ))}
    </div>
  );
}

// ── 中央：ファイル一覧行 ────────────────────────────────────────────────────────
function FileRow({ doc, isActive, viewMode, onSelect, onPin }: {
  doc: LibraryDoc; isActive: boolean; viewMode: ViewMode;
  onSelect: () => void; onPin: () => void;
}) {
  const compact = viewMode === "compact";
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: compact ? "5px 10px" : "8px 12px",
        borderRadius: "7px", cursor: "pointer",
        background: isActive ? "#EEF3FB" : "transparent",
        border: `1px solid ${isActive ? "#C9DAF1" : "transparent"}`,
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#F7F8FA"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <FileTypeIcon fileType={doc.fileType} size={compact ? 14 : 16} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: compact ? "12px" : "13px", fontWeight: 600, color: "#1E293B",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {doc.name}
        </p>
        {!compact && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{doc.category}</span>
            <span style={{ fontSize: "11px", color: "#CBD5E1" }}>·</span>
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{formatDate(doc.updatedAt)}</span>
          </div>
        )}
      </div>
      {(doc.relatedHandoverIds.length > 0 || doc.relatedTaskIds.length > 0) && !compact && (
        <Link2 size={12} color="#CBD5E1" style={{ flexShrink: 0 }} />
      )}
      <button
        onClick={e => { e.stopPropagation(); onPin(); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", flexShrink: 0 }}
        title={doc.isPinned ? "ピン留めを外す" : "ピン留めする"}
      >
        {doc.isPinned
          ? <Pin size={12} color="#B45309" fill="#B45309" />
          : <PinOff size={12} color="#E2E8F0" />}
      </button>
    </div>
  );
}

// ── 右カラム：詳細ペイン ────────────────────────────────────────────────────────
function DetailPane({ doc, onPin, onDelete }: {
  doc: LibraryDoc | null;
  onPin: (id: string) => void;
  onDelete: (doc: LibraryDoc) => void;
}) {
  const [handovers, setHandovers] = useState<ReturnType<typeof loadHandovers>>([]);
  const [tasks, setTasks] = useState<ReturnType<typeof loadTasks>>([]);

  useEffect(() => {
    if (!doc) return;
    setHandovers(loadHandovers().filter(h => doc.relatedHandoverIds.includes(h.id)));
    setTasks(loadTasks().filter(t => doc.relatedTaskIds.includes(t.id)));
  }, [doc]);

  if (!doc) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 20px", textAlign: "center" }}>
        <FolderOpen size={32} color="#E2E8F0" style={{ marginBottom: "10px" }} />
        <p style={{ fontSize: "13px", color: "#94A3B8" }}>ファイルを選択すると詳細が表示されます</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
        <FileTypeIcon fileType={doc.fileType} size={22} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", lineHeight: 1.4, wordBreak: "break-word" }}>{doc.name}</p>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px", alignItems: "center" }}>
            <FileTypeBadge fileType={doc.fileType} />
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{doc.category}</span>
            {doc.isUploaded && (
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#0F766E", background: "#EAF6F4", border: "1px solid #BFE3DE", borderRadius: "100px", padding: "1px 7px" }}>
                実ファイル
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          <button
            onClick={() => onPin(doc.id)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "3px" }}
          >
            {doc.isPinned
              ? <Pin size={15} color="#B45309" fill="#B45309" />
              : <PinOff size={15} color="#CBD5E1" />}
          </button>
          <button
            onClick={() => onDelete(doc)}
            title="削除"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "3px" }}
          >
            <Trash2 size={14} color="#CBD5E1" />
          </button>
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6, marginBottom: "12px" }}>{doc.description}</p>

      {/* メタ情報 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "12px", fontSize: "11px", color: "#94A3B8" }}>
        <div>更新日：{formatDate(doc.updatedAt)}</div>
        <div>作成者：{doc.author}</div>
        {doc.fileSizeBytes !== undefined && <div>サイズ：{(doc.fileSizeBytes / 1024).toFixed(1)} KB</div>}
        {doc.lastOpenedAt && <div>最終閲覧：{formatDate(doc.lastOpenedAt)}</div>}
      </div>

      {/* タグ */}
      {doc.tags.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "14px" }}>
          {doc.tags.map(t => <TagChip key={t} label={t} />)}
        </div>
      )}

      {/* 簡易プレビュー */}
      <div style={{ marginBottom: "14px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
          プレビュー
        </p>
        <DocPreviewCompact content={doc.mockContent} />
        <p style={{ fontSize: "10px", color: "#CBD5E1", marginTop: "6px" }}>
          {doc.isUploaded
            ? "実ファイルがアップロードされています。"
            : "※ 簡易プレビューです（デモ表示）。ファイルアップロード・ダウンロードはSupabaseモードでのみ利用できます。"}
        </p>
        {doc.isUploaded && doc.publicUrl && (
          <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "8px", fontSize: "12px", color: "#2F5EAA", textDecoration: "none" }}>
            <ExternalLink size={12} /> ダウンロード
          </a>
        )}
      </div>

      {/* 関連申し送り */}
      {handovers.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
            関連する申し送り
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {handovers.map(h => (
              <div key={h.id} style={{ fontSize: "12px", color: "#334155", padding: "6px 8px", background: "#F7F8FA", borderRadius: "6px" }}>
                {h.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 関連タスク */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
            関連するタスク
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {tasks.map(t => (
              <div key={t.id} style={{ fontSize: "12px", color: "#334155", padding: "6px 8px", background: "#F7F8FA", borderRadius: "6px" }}>
                {t.title}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/library/${doc.id}`}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          padding: "8px", marginTop: "10px",
          border: "1px solid #E2E8F0", borderRadius: "7px",
          fontSize: "12px", color: "#64748B", textDecoration: "none",
        }}
      >
        大きく表示する <ExternalLink size={12} />
      </Link>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const [docs, setDocs]             = useState<LibraryDoc[]>([]);
  const [recentIds, setRecentIds]   = useState<string[]>([]);
  const [viewMode, setViewMode]     = useState<ViewMode>("list");
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState<FileType | "all">("all");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted]       = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LibraryDoc | null>(null);

  useEffect(() => {
    initializeStore();
    initializeLibrary();
    setDocs(loadLibrary());
    setRecentIds(loadRecentIds());
    setMounted(true);
  }, []);

  const handlePin = useCallback((id: string) => {
    togglePin(id);
    setDocs(loadLibrary());
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    recordOpen(id);
    setRecentIds(prev => [id, ...prev.filter(r => r !== id)].slice(0, 10));
  }, []);

  const handleUploaded = useCallback((doc: LibraryDoc) => {
    setDocs(prev => [doc, ...prev]);
    setSelectedId(doc.id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await deleteDocument({ id: deleteTarget.id, storagePath: deleteTarget.storagePath });
    if (result.success) {
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
    }
    setDeleteTarget(null);
  }, [deleteTarget, selectedId]);

  const allCategories = useMemo(() => Array.from(new Set(docs.map(d => d.category))).sort(), [docs]);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => { counts[d.category] = (counts[d.category] ?? 0) + 1; });
    return counts;
  }, [docs]);

  const pinned = useMemo(() => docs.filter(d => d.isPinned), [docs]);
  const recent = useMemo(() => recentIds.map(id => docs.find(d => d.id === id)).filter(Boolean) as LibraryDoc[], [recentIds, docs]);

  const filtered = useMemo(() => {
    let base = docs;
    if (activeCategory === "pinned") base = pinned;
    else if (activeCategory === "recent") base = recent;
    else if (activeCategory !== "all") base = docs.filter(d => d.category === activeCategory);

    return base
      .filter(d => filterType === "all" || d.fileType === filterType)
      .filter(d => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some(t => t.toLowerCase().includes(q)) ||
          d.category.toLowerCase().includes(q)
        );
      });
  }, [docs, activeCategory, pinned, recent, filterType, search]);

  if (!mounted) return <LoadingScreen />;

  const selectedDoc = docs.find(d => d.id === selectedId) ?? null;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1.5rem 3rem" }}>

        {/* ── ヘッダー ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.4px", marginBottom: "3px" }}>
              書類
            </h1>
            <p style={{ fontSize: "13px", color: "#94A3B8" }}>
              使い方は自由です。マニュアル・点検表・報告書など、対応の根拠になる書類を現場に合わせて残してください
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", background: "#2F5EAA", color: "white",
              border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Upload size={14} /> アップロード
          </button>
        </div>

        {/* ── 検索・表示切替 ── */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search size={14} color="#94A3B8" style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ファイル名・タグ・カテゴリで検索"
              style={{
                width: "100%", padding: "8px 11px 8px 32px",
                border: "1.5px solid #E2E8F0", borderRadius: "8px",
                fontSize: "13px", color: "#1E293B", outline: "none", background: "#FFFFFF",
              }}
              onFocus={e => e.target.style.borderColor = "#2F5EAA"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                <X size={13} color="#94A3B8" />
              </button>
            )}
          </div>

          <select value={filterType} onChange={e => setFilterType(e.target.value as FileType | "all")} style={{
            padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #E2E8F0",
            background: "#FFFFFF", color: "#475569", fontSize: "12px", cursor: "pointer", outline: "none",
          }}>
            <option value="all">すべての種別</option>
            {(Object.keys(FILE_TYPE_LABELS) as FileType[]).map(ft => (
              <option key={ft} value={ft}>{FILE_TYPE_LABELS[ft]}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => setViewMode("list")} style={{ padding: "7px 10px", borderRadius: "7px", border: `1.5px solid ${viewMode === "list" ? "#2F5EAA" : "#E2E8F0"}`, background: viewMode === "list" ? "#EEF3FB" : "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <LayoutList size={14} color={viewMode === "list" ? "#2F5EAA" : "#94A3B8"} />
            </button>
            <button onClick={() => setViewMode("compact")} style={{ padding: "7px 10px", borderRadius: "7px", border: `1.5px solid ${viewMode === "compact" ? "#2F5EAA" : "#E2E8F0"}`, background: viewMode === "compact" ? "#EEF3FB" : "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <AlignJustify size={14} color={viewMode === "compact" ? "#2F5EAA" : "#94A3B8"} />
            </button>
          </div>
        </div>

        {/* ── 3カラム エクスプローラー ── */}
        <style>{`
          .rebio-library-explorer {
            display: grid;
            grid-template-columns: 180px minmax(0,1fr) 320px;
            gap: 0;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            overflow: hidden;
            min-height: 560px;
          }
          .rebio-library-col-sidebar {
            border-right: 1px solid #EDF1F5;
            border-bottom: none;
            padding: 12px 8px;
            overflow-y: auto;
          }
          .rebio-library-col-list {
            border-right: 1px solid #EDF1F5;
            border-bottom: none;
            padding: 10px;
            overflow-y: auto;
          }
          .rebio-library-col-detail {
            overflow-y: auto;
            background: #FCFCFD;
          }
          @media (max-width: 860px) {
            .rebio-library-explorer {
              grid-template-columns: 1fr;
              min-height: 0;
            }
            .rebio-library-col-sidebar {
              border-right: none;
              border-bottom: 1px solid #EDF1F5;
              max-height: 160px;
            }
            .rebio-library-col-list {
              border-right: none;
              border-bottom: 1px solid #EDF1F5;
              max-height: 340px;
            }
            .rebio-library-col-detail {
              max-height: 480px;
            }
          }
        `}</style>
        <div className="rebio-library-explorer">
          {/* 左：カテゴリ */}
          <div className="rebio-library-col-sidebar">
            <CategorySidebar
              categories={allCategories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
              counts={categoryCounts}
              pinnedCount={pinned.length}
              recentCount={recent.length}
            />
          </div>

          {/* 中央：ファイル一覧 */}
          <div className="rebio-library-col-list">
            <p style={{ fontSize: "11px", color: "#CBD5E1", marginBottom: "6px", paddingLeft: "2px" }}>{filtered.length}件</p>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 12px" }}>
                <FolderOpen size={28} color="#E2E8F0" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", color: "#94A3B8" }}>
                  {search ? `「${search}」に一致する書類はありません` : "書類がありません"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {filtered.map(doc => (
                  <FileRow
                    key={doc.id}
                    doc={doc}
                    isActive={selectedId === doc.id}
                    viewMode={viewMode}
                    onSelect={() => handleSelect(doc.id)}
                    onPin={() => handlePin(doc.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 右：詳細ペイン */}
          <div className="rebio-library-col-detail">
            <DetailPane doc={selectedDoc} onPin={handlePin} onDelete={setDeleteTarget} />
          </div>
        </div>

        {/* モード注記 */}
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "12px", padding: "10px 14px", background: "#F7F8FA", border: "1px solid #F1F5F9", borderRadius: "8px" }}>
          {isSupabaseMode() ? <HardDrive size={13} color="#94A3B8" style={{ flexShrink: 0, marginTop: "1px" }} /> : <Info size={13} color="#94A3B8" style={{ flexShrink: 0, marginTop: "1px" }} />}
          <p style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.6 }}>
            {isSupabaseMode()
              ? "Supabaseモードで動作しています。PDF・PNG・JPG・JPEG・WEBP・CSVの実ファイルをアップロードできます。"
              : "これはデモ用のファイル管理画面です。localStorageデモモードのため実ファイルのアップロード・ダウンロードはできません（デモ表示）。Supabase環境変数を設定すると利用できます。"}
          </p>
        </div>
      </div>

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onUploaded={handleUploaded} />
      )}

      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1.5rem" }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "13px", padding: "24px", maxWidth: "360px", width: "100%", boxShadow: "0 8px 28px rgba(15,23,42,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Trash2 size={16} color="#C0392B" />
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>書類を削除しますか？</h2>
            </div>
            <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6, marginBottom: "18px" }}>
              「{deleteTarget.name}」を削除します。この操作は取り消せません。
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#64748B", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                キャンセル
              </button>
              <button onClick={handleDeleteConfirm} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "none", background: "#C0392B", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
