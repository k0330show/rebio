"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import LoadingScreen from "@/app/components/LoadingScreen";
import PriorityBadge from "@/app/components/PriorityBadge";
import FileTypeIcon from "@/app/components/FileTypeIcon";
import {
  Handover, Task, LibraryDoc, Priority, HandoverStatus, HandoverKind,
  HANDOVER_STATUS_LABELS, HANDOVER_KIND_LABELS, COMMENT_QUICK_PHRASES,
  ACTIVITY_ACTION_LABELS,
} from "@/app/types";
import {
  initializeStore, initializeLibrary,
  loadHandovers, saveHandovers, loadTasks, saveTasks, loadLibrary,
  priorityOrder, formatDate, isBeforeToday,
  getHandoverKind, getDefaultReadRequirement,
  summarizeReceipts, addHandoverComment, CURRENT_USER,
  recordActivity, loadActivityLogsFor,
} from "@/app/lib/store";
import {
  CheckCircle2, Circle, Clock3, User, PlusCircle,
  AlertTriangle, ChevronDown, ChevronUp, Quote, Search, X,
  Link2, Calendar, Eye, MessageSquare, ListChecks, Users, Send,
} from "lucide-react";

type FS = HandoverStatus | "all";
type FK = HandoverKind | "all";
type FP = Priority | "all";
type Tab = "handover" | "task";

const PBAR: Record<string, string> = {
  urgent: "#C0392B", high: "#B45309", medium: "#8A8F98", low: "#CBD5E1",
};

// kind ごとの見た目の重さを分ける
const KIND_STYLE: Record<HandoverKind, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  share:  { icon: MessageSquare, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  check:  { icon: Eye,           color: "#2F5EAA", bg: "#EEF3FB", border: "#C9DAF1" },
  action: { icon: ListChecks,    color: "#B45309", bg: "#FDF6EC", border: "#F0DDBB" },
};

// v11: メタ情報行に表示する宛先ラベル。audiences があれば優先し、無ければ従来のassigneeを使う。
function audienceLabel(h: Handover): string {
  if (h.audiences && h.audiences.length > 0) {
    return h.audiences.map(a => `${a.label}`).join("・") + "へ";
  }
  return h.assignee ? `${h.assignee}へ` : "宛先未設定";
}

// v16: 「止まっている日数」を表示するためのヘルパー。作成からの経過日数。
function stalledDays(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── 関連書類チップ ───────────────────────────────────────────────────────────
function RelatedDocs({ handoverId, library }: { handoverId: string; library: LibraryDoc[] }) {
  const docs = library.filter(d => d.relatedHandoverIds.includes(handoverId));
  if (docs.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "8px" }}>
      <span style={{ fontSize: "10.5px", color: "#94A3B8" }}>根拠：</span>
      {docs.map(doc => (
        <Link key={doc.id} href={`/library?doc=${doc.id}`} style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 9px", background: "#FDF6EC", border: "1px solid #F0DDBB", borderRadius: "100px" }}>
            <FileTypeIcon fileType={doc.fileType} size={10} />
            <span style={{ fontSize: "11px", color: "#B45309", fontWeight: 500 }}>{doc.name}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── タスク行 ─────────────────────────────────────────────────────────────────
function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = !!task.dueDate && isBeforeToday(task.dueDate) && task.status !== "completed";
  const sc =
    task.status === "completed"   ? { color: "#0F766E", bg: "#EAF6F4", border: "#BFE3DE", label: "完了" }
    : task.status === "in_progress" ? { color: "#2F5EAA", bg: "#EEF3FB", border: "#C9DAF1", label: "対応中" }
    :                                  { color: "#94A3B8", bg: "#F8FAFC", border: "#E2E8F0", label: "未着手" };
  const SIcon = task.status === "completed" ? CheckCircle2 : task.status === "in_progress" ? Clock3 : Circle;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden", opacity: task.status === "completed" ? 0.7 : 1 }}>
      <div style={{ display: "flex" }}>
        <div style={{ width: "3px", flexShrink: 0, background: task.status === "completed" ? "#E2E8F0" : PBAR[task.priority] }} />
        <div style={{ flex: 1, padding: "11px 13px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
            <button onClick={() => onComplete(task.id)} style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, marginTop: "2px", border: `2px solid ${task.status === "completed" ? "#0F766E" : "#CBD5E1"}`, background: task.status === "completed" ? "#EAF6F4" : "transparent", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {task.status === "completed" && <CheckCircle2 size={12} color="#0F766E" />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: task.status === "completed" ? "#94A3B8" : "#1E293B", textDecoration: task.status === "completed" ? "line-through" : "none", lineHeight: 1.4 }}>
                {task.title}
              </p>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap", alignItems: "center" }}>
                <PriorityBadge priority={task.priority} size="sm" />
                <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "#94A3B8" }}>
                  <User size={10} />{task.assignee}
                </span>
                {task.dueDate && (
                  <span style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "11px", color: isOverdue ? "#C0392B" : "#94A3B8", fontWeight: isOverdue ? 600 : 400 }}>
                    <Calendar size={10} />{isOverdue && <AlertTriangle size={9} />}{task.dueDate}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: "2px 8px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "3px" }}>
                <SIcon size={10} />{sc.label}
              </span>
              <button onClick={() => setExpanded(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {expanded ? <ChevronUp size={13} color="#94A3B8" /> : <ChevronDown size={13} color="#94A3B8" />}
              </button>
            </div>
          </div>
          {expanded && (
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
              <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.7, marginBottom: "8px" }}>{task.description}</p>
              <div style={{ display: "flex", gap: "5px", alignItems: "center", background: "#F7F8FA", border: "1px solid #F1F5F9", borderRadius: "7px", padding: "7px 10px" }}>
                <Link2 size={11} color="#94A3B8" />
                <span style={{ fontSize: "11px", color: "#64748B" }}>{task.sourceHandoverTitle}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 申し送りカード ───────────────────────────────────────────────────────────
function HandoverCard({
  h, library, isExpanded, onToggle, onStatusChange, onReadToggle, onConfirm, onAddComment,
}: {
  h: Handover; library: LibraryDoc[]; isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: HandoverStatus) => void;
  onReadToggle: (id: string) => void;
  onConfirm: (id: string) => void;
  onAddComment: (id: string, body: string) => void;
}) {
  // v8以前のlocalStorageデータには kind / readRequirement / isRead / isConfirmed が
  // 存在しない場合があるため、h.xxx を直接使わず必ずフォールバックする。
  const kind = h.kind ?? getHandoverKind(h);
  const readRequirement = h.readRequirement ?? getDefaultReadRequirement(kind, h);
  const isRead = h.isRead ?? false;
  const isConfirmed = h.isConfirmed ?? false;

  const style = KIND_STYLE[kind] ?? KIND_STYLE.share;
  const KindIcon = style.icon;
  const isAction = kind === "action";
  const needsConfirm = readRequirement === "confirm" && !isConfirmed;

  // 共有のみは軽量表示：カードを薄く・小さく
  if (kind === "share") {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #F1F5F9", borderRadius: "9px", padding: "10px 13px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <MessageSquare size={13} color="#94A3B8" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "2px" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#94A3B8", background: "#F1F5F9", padding: "1px 7px", borderRadius: "100px" }}>
                共有事項
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>{h.title}</p>
            <p style={{ fontSize: "11px", color: "#CBD5E1", marginTop: "3px" }}>
              {audienceLabel(h)} · {h.author} · {formatDate(h.createdAt)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${needsConfirm ? style.border : "#E2E8F0"}`, borderRadius: "10px", overflow: "hidden", opacity: h.status === "completed" ? 0.7 : 1 }}>
      <div style={{ display: "flex" }}>
        <div style={{ width: "3px", flexShrink: 0, background: h.status === "completed" ? "#E2E8F0" : (isAction ? PBAR[h.priority] : style.color) }} />
        <div style={{ flex: 1 }}>
          <div style={{ padding: "11px 13px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "10px" }} onClick={onToggle}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "4px", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px", fontWeight: 600, color: style.color, background: style.bg, border: `1px solid ${style.border}`, padding: "1px 7px", borderRadius: "100px" }}>
                  <KindIcon size={10} />{HANDOVER_KIND_LABELS[kind]}
                </span>
                {isAction && <PriorityBadge priority={h.priority} size="sm" />}
                {needsConfirm && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "11px", fontWeight: 600, color: "#C0392B" }}>
                    <AlertTriangle size={10} />要確認
                  </span>
                )}
              </div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: h.status === "completed" ? "#94A3B8" : "#1E293B", lineHeight: 1.4, textDecoration: h.status === "completed" ? "line-through" : "none" }}>
                {h.title}
              </p>
              <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                <User size={10} />{audienceLabel(h)} · {h.author} · {formatDate(h.createdAt)}
                {isAction && h.status !== "completed" && (
                  <span style={{ color: stalledDays(h.createdAt) >= 3 ? "#C0392B" : "#94A3B8", fontWeight: stalledDays(h.createdAt) >= 3 ? 600 : 400 }}>
                    · 止まって{stalledDays(h.createdAt)}日
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
              {isAction ? (
                <>
                  {(() => {
                    const SIcon = h.status === "open" ? Circle : h.status === "in_progress" ? Clock3 : CheckCircle2;
                    const sColor = h.status === "open" ? "#CBD5E1" : h.status === "in_progress" ? "#2F5EAA" : "#0F766E";
                    return <SIcon size={15} color={sColor} />;
                  })()}
                  <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 500 }}>{HANDOVER_STATUS_LABELS[h.status]}</span>
                </>
              ) : (
                isRead && <CheckCircle2 size={14} color="#0F766E" />
              )}
              {isExpanded ? <ChevronUp size={13} color="#CBD5E1" /> : <ChevronDown size={13} color="#CBD5E1" />}
            </div>
          </div>
          {isExpanded && (
            <div style={{ borderTop: "1px solid #F1F5F9", padding: "12px 13px" }}>
              <p style={{ fontSize: "13px", color: "#1E293B", lineHeight: 1.7, marginBottom: "10px" }}>{h.content}</p>
              <div style={{ background: "#F7F8FA", border: "1px solid #E2E8F0", borderRadius: "7px", padding: "8px 11px", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "3px" }}>
                  <Quote size={11} color="#94A3B8" />
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.4px" }}>元ログの該当箇所</span>
                </div>
                <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}>「{h.sourceExcerpt}」</p>
              </div>
              <RelatedDocs handoverId={h.id} library={library} />

              {/* v11: 既読・確認の集計（対象が複数人の場合） */}
              {readRequirement !== "none" && h.receipts && h.receipts.length > 1 && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px", padding: "7px 11px", background: "#F7F8FA", border: "1px solid #E2E8F0", borderRadius: "7px" }}>
                  <Users size={12} color="#94A3B8" />
                  {(() => {
                    const { total, read, confirmed } = summarizeReceipts(h.receipts);
                    return (
                      <span style={{ fontSize: "11px", color: "#64748B" }}>
                        既読 {read}/{total}
                        {readRequirement === "confirm" && <> ・ 確認 {confirmed}/{total}</>}
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* action：対応ステータス操作 */}
              {isAction && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                  {h.status !== "open" && (
                    <button onClick={() => onStatusChange(h.id, "open")} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 11px", background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
                      <Circle size={12} /> 未対応に戻す
                    </button>
                  )}
                  {h.status !== "in_progress" && (
                    <button onClick={() => onStatusChange(h.id, "in_progress")} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 11px", background: "#EEF3FB", color: "#2F5EAA", border: "1px solid #C9DAF1", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      <Clock3 size={12} /> 対応中
                    </button>
                  )}
                  {h.status !== "completed" && (
                    <button onClick={() => onStatusChange(h.id, "completed")} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 11px", background: "#EAF6F4", color: "#0F766E", border: "1px solid #BFE3DE", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      <CheckCircle2 size={12} /> 完了
                    </button>
                  )}
                </div>
              )}

              {/* check：既読・確認操作 */}
              {kind === "check" && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                  {readRequirement === "confirm" ? (
                    <button
                      onClick={() => onConfirm(h.id)}
                      disabled={isConfirmed}
                      style={{
                        display: "flex", alignItems: "center", gap: "4px", padding: "6px 11px",
                        background: isConfirmed ? "#EAF6F4" : "#2F5EAA",
                        color: isConfirmed ? "#0F766E" : "#FFFFFF",
                        border: isConfirmed ? "1px solid #BFE3DE" : "none",
                        borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                        cursor: isConfirmed ? "default" : "pointer",
                      }}
                    >
                      <CheckCircle2 size={12} /> {isConfirmed ? "確認済み" : "内容を確認する"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onReadToggle(h.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "4px", padding: "6px 11px",
                        background: isRead ? "#EAF6F4" : "#F8FAFC",
                        color: isRead ? "#0F766E" : "#64748B",
                        border: `1px solid ${isRead ? "#BFE3DE" : "#E2E8F0"}`,
                        borderRadius: "6px", fontSize: "12px", fontWeight: isRead ? 600 : 400, cursor: "pointer",
                      }}
                    >
                      <Eye size={12} /> {isRead ? "既読" : "既読にする"}
                    </button>
                  )}
                </div>
              )}

              {/* v11: 申し送りへの補足コメント（チャットではない） */}
              <CommentSection handover={h} onAdd={(body) => onAddComment(h.id, body)} />

              {/* v15: 軽量な履歴表示 */}
              <ActivityHistory handoverId={h.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── コメント欄（申し送りへの補足。返信・スレッド・リアクションは持たない） ─────
function CommentSection({ handover, onAdd }: { handover: Handover; onAdd: (body: string) => void }) {
  const [text, setText] = useState("");
  const comments = handover.comments ?? [];

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    onAdd(body);
    setText("");
  };

  return (
    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
      <p style={{ fontSize: "10px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "7px" }}>
        コメント{comments.length > 0 ? `（${comments.length}）` : ""}
      </p>

      {/* 既存コメント一覧 */}
      {comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "9px" }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#EEF3FB", border: "1px solid #C9DAF1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px", fontWeight: 700, color: "#2F5EAA", marginTop: "1px" }}>
                {c.authorName.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "11px", color: "#94A3B8" }}>
                  {c.authorName} · {formatDate(c.createdAt)}
                </p>
                <p style={{ fontSize: "12.5px", color: "#334155", lineHeight: 1.5 }}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 定型文チップ */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
        {COMMENT_QUICK_PHRASES.map(phrase => (
          <button
            key={phrase}
            onClick={() => onAdd(phrase)}
            style={{
              padding: "3px 9px", borderRadius: "100px",
              border: "1px solid #E2E8F0", background: "#FFFFFF",
              fontSize: "11px", color: "#64748B", cursor: "pointer",
            }}
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* 自由入力 */}
      <div style={{ display: "flex", gap: "6px" }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="補足コメントを入力"
          style={{
            flex: 1, padding: "6px 10px",
            border: "1px solid #E2E8F0", borderRadius: "7px",
            fontSize: "12px", color: "#1E293B", outline: "none",
          }}
          onFocus={e => { e.target.style.borderColor = "#2F5EAA"; }}
          onBlur={e => { e.target.style.borderColor = "#E2E8F0"; }}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "30px", height: "30px", borderRadius: "7px",
            border: "none", background: text.trim() ? "#2F5EAA" : "#E2E8F0",
            color: "#FFFFFF", cursor: text.trim() ? "pointer" : "default", flexShrink: 0,
          }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── 履歴表示（軽量。activity_logs相当。v15） ─────────────────────────────────
function ActivityHistory({ handoverId }: { handoverId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<ReturnType<typeof loadActivityLogsFor>>([]);

  useEffect(() => {
    if (expanded) setLogs(loadActivityLogsFor("handover", handoverId));
  }, [expanded, handoverId]);

  return (
    <div style={{ marginTop: "8px" }}>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", fontSize: "10.5px", color: "#CBD5E1", padding: 0 }}
      >
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />} 責任の流れ
      </button>
      {expanded && (
        <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
          {logs.length === 0 ? (
            <p style={{ fontSize: "11px", color: "#CBD5E1" }}>まだ記録がありません</p>
          ) : (
            logs.map(log => (
              <p key={log.id} style={{ fontSize: "11px", color: "#94A3B8" }}>
                {formatDate(log.createdAt)} · {log.actorName} が{ACTIVITY_ACTION_LABELS[log.action]}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────
export default function HandoverPage() {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [library, setLibrary]     = useState<LibraryDoc[]>([]);
  const [tab, setTab]             = useState<Tab>("handover");
  const [search, setSearch]       = useState("");
  const [filterStatus, setFS]     = useState<FS>("all");
  const [filterKind, setFK]       = useState<FK>("all");
  const [filterPriority, setFP]   = useState<FP>("all");
  const [filterAssignee, setFA]   = useState<string>("all");
  const [showComplete, setSC]     = useState(false);
  const [expandedId, setExp]      = useState<string | null>(null);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    initializeStore();
    initializeLibrary();
    setHandovers(loadHandovers());
    setTasks(loadTasks());
    setLibrary(loadLibrary());
    setMounted(true);
  }, []);

  const filtered = useMemo(() => handovers
    .filter(h => showComplete || h.status !== "completed")
    .filter(h => filterStatus   === "all" || h.status   === filterStatus)
    .filter(h => filterKind     === "all" || (h.kind ?? getHandoverKind(h)) === filterKind)
    .filter(h => filterPriority === "all" || h.priority === filterPriority)
    .filter(h => filterAssignee === "all" || h.assignee === filterAssignee)
    .filter(h => {
      if (!search) return true;
      const q = search.toLowerCase();
      const audienceText = (h.audiences ?? []).map(a => a.label).join(" ").toLowerCase();
      return h.title.toLowerCase().includes(q) || h.content.toLowerCase().includes(q) || h.assignee.toLowerCase().includes(q) || audienceText.includes(q);
    })
    .sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      // action を優先的に上位に、その中で重要度順
      const kindOrder: Record<HandoverKind, number> = { action: 0, check: 1, share: 2 };
      const aKind = a.kind ?? getHandoverKind(a);
      const bKind = b.kind ?? getHandoverKind(b);
      if (kindOrder[aKind] !== kindOrder[bKind]) return kindOrder[aKind] - kindOrder[bKind];
      return priorityOrder(a.priority) - priorityOrder(b.priority);
    }),
  [handovers, showComplete, filterStatus, filterKind, filterPriority, filterAssignee, search]);

  const filteredTasks = useMemo(() => tasks
    .filter(t => showComplete || t.status !== "completed")
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return priorityOrder(a.priority) - priorityOrder(b.priority);
    }),
  [tasks, showComplete, search]);

  if (!mounted) return <LoadingScreen />;

  const assignees = Array.from(new Set(handovers.map(h => h.assignee))).sort();

  const handleStatusChange = (id: string, status: HandoverStatus) => {
    const updated = handovers.map(h =>
      h.id === id ? { ...h, status, completedAt: status === "completed" ? new Date().toISOString() : undefined } : h
    );
    setHandovers(updated);
    saveHandovers(updated);
    const action = status === "completed" ? "handover_completed" : status === "in_progress" ? "handover_in_progress" : null;
    if (action) recordActivity("handover", id, action);
  };

  const handleReadToggle = (id: string) => {
    const updated = handovers.map(h => {
      if (h.id !== id) return h;
      const nextRead = !(h.isRead ?? false);
      const receipts = (h.receipts ?? []).map(r =>
        r.userId === CURRENT_USER.id
          ? { ...r, readAt: nextRead ? (r.readAt ?? new Date().toISOString()) : undefined }
          : r
      );
      return { ...h, isRead: nextRead, receipts };
    });
    setHandovers(updated);
    saveHandovers(updated);
  };

  const handleConfirm = (id: string) => {
    const now = new Date().toISOString();
    const updated = handovers.map(h => {
      if (h.id !== id) return h;
      const receipts = (h.receipts ?? []).map(r =>
        r.userId === CURRENT_USER.id
          ? { ...r, readAt: r.readAt ?? now, confirmedAt: r.confirmedAt ?? now }
          : r
      );
      return { ...h, isRead: true, isConfirmed: true, receipts };
    });
    setHandovers(updated);
    saveHandovers(updated);
    recordActivity("handover", id, "handover_confirmed");
  };

  const handleAddComment = (id: string, body: string) => {
    addHandoverComment(id, body);
    setHandovers(loadHandovers());
  };

  const handleTaskToggle = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id !== id) return t;
      const next = t.status === "completed" ? "todo" as const : "completed" as const;
      return { ...t, status: next, completedAt: next === "completed" ? new Date().toISOString() : undefined };
    });
    setTasks(updated);
    saveTasks(updated);
  };

  const openCount     = handovers.filter(h => h.status !== "completed").length;
  const needsConfirmCount = handovers.filter(h => {
    const k = h.kind ?? getHandoverKind(h);
    const rr = h.readRequirement ?? getDefaultReadRequirement(k, h);
    return rr === "confirm" && !(h.isConfirmed ?? false);
  }).length;
  const openTaskCount = tasks.filter(t => t.status !== "completed").length;
  const hasFilter     = filterStatus !== "all" || filterKind !== "all" || filterPriority !== "all" || filterAssignee !== "all" || !!search;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>

        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.4px", marginBottom: "3px" }}>申し送り</h1>
            <p style={{ fontSize: "13px", color: "#94A3B8" }}>未対応 {openCount}件 · 要確認 {needsConfirmCount}件 · タスク {openTaskCount}件</p>
          </div>
          <Link href="/logs/new" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 15px", background: "#2F5EAA", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            <PlusCircle size={14} /> 記録する
          </Link>
        </div>

        {/* サマリー */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "8px", marginBottom: "14px" }}>
          {[
            { label: "未対応",   value: openCount,     color: "#1E293B", bg: "#FFFFFF", border: "#E2E8F0" },
            { label: "要確認",   value: needsConfirmCount, color: needsConfirmCount > 0 ? "#C0392B" : "#1E293B", bg: needsConfirmCount > 0 ? "#FBEEEC" : "#FFFFFF", border: needsConfirmCount > 0 ? "#EFCCC6" : "#E2E8F0" },
            { label: "タスク",   value: openTaskCount, color: "#1E293B", bg: "#FFFFFF", border: "#E2E8F0" },
            { label: "完了済み", value: handovers.filter(h => h.status === "completed").length, color: "#0F766E", bg: "#EAF6F4", border: "#BFE3DE" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "9px", padding: "11px 14px" }}>
              <p style={{ fontSize: "10px", color: "#94A3B8", marginBottom: "3px" }}>{label}</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* 検索バー */}
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <Search size={15} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="タイトル・内容・担当者で検索"
            style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", color: "#1E293B", outline: "none", background: "#FFFFFF" }}
            onFocus={e => e.target.style.borderColor = "#2F5EAA"}
            onBlur={e => e.target.style.borderColor = "#E2E8F0"}
          />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#94A3B8" /></button>}
        </div>

        {/* フィルター */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "9px", padding: "11px 14px", marginBottom: "12px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { label: "ステータス", value: filterStatus, onChange: setFS as (v: string) => void, options: [["all","すべて"],["open","未対応"],["in_progress","対応中"],["completed","完了"]] },
            { label: "種類",       value: filterKind,   onChange: setFK as (v: string) => void, options: [["all","すべて"],["share","共有事項"],["check","確認してほしい"],["action","対応が必要"]] },
            { label: "重要度",     value: filterPriority, onChange: setFP as (v: string) => void, options: [["all","すべて"],["urgent","緊急"],["high","高"],["medium","中"],["low","低"]] },
          ].map(({ label, value, onChange, options }) => (
            <div key={label}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "#94A3B8", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
              <div style={{ display: "flex", gap: "3px" }}>
                {(options as [string,string][]).map(([v, l]) => (
                  <button key={v} onClick={() => onChange(v)} style={{ padding: "3px 9px", borderRadius: "5px", border: "none", background: value === v ? "#EEF3FB" : "#F1F5F9", color: value === v ? "#2F5EAA" : "#64748B", fontSize: "12px", fontWeight: value === v ? 600 : 400, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "#94A3B8", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>担当者</p>
            <select value={filterAssignee} onChange={e => setFA(e.target.value)} style={{ padding: "3px 9px", borderRadius: "5px", border: "1px solid #E2E8F0", background: "#F1F5F9", color: "#64748B", fontSize: "12px", cursor: "pointer", outline: "none" }}>
              <option value="all">すべて</option>
              {assignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "12px", color: "#64748B" }}>
              <input type="checkbox" checked={showComplete} onChange={e => setSC(e.target.checked)} />
              完了済みも表示
            </label>
          </div>
          {hasFilter && (
            <button onClick={() => { setFS("all"); setFK("all"); setFP("all"); setFA("all"); setSearch(""); }} style={{ fontSize: "11px", color: "#2F5EAA", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              解除
            </button>
          )}
        </div>

        {/* タブ */}
        <div style={{ display: "flex", borderBottom: "2px solid #F1F5F9", marginBottom: "12px" }}>
          {([["handover", `申し送り（${filtered.length}）`], ["task", `タスク（${filteredTasks.length}）`]] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", fontWeight: tab === t ? 700 : 400, color: tab === t ? "#1E293B" : "#94A3B8", borderBottom: `2px solid ${tab === t ? "#2F5EAA" : "transparent"}`, marginBottom: "-2px" }}>
              {l}
            </button>
          ))}
        </div>

        {/* 申し送り一覧 */}
        {tab === "handover" && (
          filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              <CheckCircle2 size={36} color="#E2E8F0" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>該当する申し送りはありません</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map(h => (
                <HandoverCard
                  key={h.id}
                  h={h}
                  library={library}
                  isExpanded={expandedId === h.id}
                  onToggle={() => setExp(expandedId === h.id ? null : h.id)}
                  onStatusChange={handleStatusChange}
                  onReadToggle={handleReadToggle}
                  onConfirm={handleConfirm}
                  onAddComment={handleAddComment}
                />
              ))}
            </div>
          )
        )}

        {/* タスク一覧 */}
        {tab === "task" && (
          filteredTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              <CheckCircle2 size={36} color="#E2E8F0" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>タスクはありません</p>
              <p style={{ fontSize: "12px", color: "#CBD5E1", marginTop: "4px" }}>「対応が必要」な申し送りから自動生成されます</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredTasks.map(t => <TaskRow key={t.id} task={t} onComplete={handleTaskToggle} />)}
            </div>
          )
        )}

        {tab === "task" && filteredTasks.length > 0 && (
          <Link href="/tasks" style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "12px", fontSize: "12px", color: "#2F5EAA", textDecoration: "none", fontWeight: 500 }}>
            タスク専用ページで詳細管理 →
          </Link>
        )}

      </div>
    </div>
  );
}
