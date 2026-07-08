"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import PriorityBadge from "@/app/components/PriorityBadge";
import CategoryBadge from "@/app/components/CategoryBadge";
import ConfidenceBadge from "@/app/components/ConfidenceBadge";
import {
  HandoverCandidate,
  Category,
  Priority,
  ReviewStatus,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  HANDOVER_KIND_LABELS,
  Task,
} from "@/app/types";
import { generateCandidates } from "@/app/lib/generateCandidates";
import {
  loadCurrentLog, clearCurrentLog, appendHandovers, appendLog, appendTasks, generateId, relativeDateString,
  createInitialReceipts,
} from "@/app/lib/store";
import {
  CheckCircle2,
  Edit3,
  X,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Quote,
  Save,
  Clock,
  ShieldAlert,
  CheckCheck,
  FileSearch,
  ListFilter,
  UserCheck,
} from "lucide-react";

const CATEGORY_ORDER: Category[] = ["caution", "task", "report", "note"];

function groupByCategory(
  candidates: HandoverCandidate[]
): Record<Category, HandoverCandidate[]> {
  return {
    task: candidates.filter((c) => c.category === "task"),
    caution: candidates.filter((c) => c.category === "caution"),
    report: candidates.filter((c) => c.category === "report"),
    note: candidates.filter((c) => c.category === "note"),
  };
}

function needsReview(c: HandoverCandidate): boolean {
  // readRequirement === "confirm" のものは登録前に必ず確認が必要
  return c.readRequirement === "confirm";
}

interface CandidateCardProps {
  candidate: HandoverCandidate;
  onStatusChange: (id: string, status: ReviewStatus) => void;
  onEdit: (id: string, field: "content" | "priority", value: string) => void;
}

function CandidateCard({ candidate, onStatusChange, onEdit }: CandidateCardProps) {
  const [expanded, setExpanded] = useState(
    candidate.priority === "urgent" || candidate.priority === "high"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(
    candidate.editedContent ?? candidate.content
  );
  const [editPriority, setEditPriority] = useState<Priority>(
    candidate.editedPriority ?? candidate.priority
  );

  const isRequired = needsReview(candidate);

  const priorityBarColors: Record<Priority, string> = {
    urgent: "#C0392B",
    high: "#B45309",
    medium: "#8A8F98",
    low: "#CBD5E1",
  };

  const statusConfig = {
    pending: { label: "未確認", color: "#94A3B8", bg: "#F8FAFC" },
    confirmed: { label: "確認済み", color: "#0F766E", bg: "#EAF6F4" },
    editing: { label: "修正中", color: "#2F5EAA", bg: "#EEF3FB" },
    dismissed: { label: "不要", color: "#94A3B8", bg: "#F1F5F9" },
  };

  const currentStatus = statusConfig[candidate.reviewStatus];

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${
          candidate.reviewStatus === "confirmed"
            ? "#BFE3DE"
            : candidate.reviewStatus === "dismissed"
            ? "#E2E8F0"
            : isRequired
            ? "#F0DDBB"
            : "#E2E8F0"
        }`,
        borderRadius: "12px",
        overflow: "hidden",
        opacity: candidate.reviewStatus === "dismissed" ? 0.6 : 1,
        transition: "all 0.2s",
      }}
    >
      {/* 左端の重要度カラーバー */}
      <div style={{ display: "flex" }}>
        <div
          style={{
            width: "4px",
            background:
              candidate.reviewStatus === "dismissed"
                ? "#E2E8F0"
                : priorityBarColors[candidate.priority],
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1 }}>
          {/* ヘッダー */}
          <div
            style={{
              padding: "14px 16px 14px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              cursor: "pointer",
            }}
            onClick={() => setExpanded(!expanded)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* バッジ群 */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "8px",
                  alignItems: "center",
                }}
              >
                <CategoryBadge category={candidate.category} size="sm" />
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  fontSize: "10px", fontWeight: 600,
                  color: candidate.kind === "action" ? "#B45309" : candidate.kind === "check" ? "#2F5EAA" : "#64748B",
                  background: candidate.kind === "action" ? "#FDF6EC" : candidate.kind === "check" ? "#EEF3FB" : "#F8FAFC",
                  border: `1px solid ${candidate.kind === "action" ? "#F0DDBB" : candidate.kind === "check" ? "#C9DAF1" : "#E2E8F0"}`,
                  borderRadius: "100px", padding: "1px 7px",
                }}>
                  {HANDOVER_KIND_LABELS[candidate.kind]}
                </span>
                {candidate.kind === "action" && <PriorityBadge priority={candidate.priority} size="sm" />}
                <ConfidenceBadge confidence={candidate.confidence} size="sm" />
                {isRequired && candidate.reviewStatus === "pending" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#B45309",
                      background: "#FDF6EC",
                      border: "1px solid #F0DDBB",
                      borderRadius: "100px",
                      padding: "2px 7px",
                    }}
                  >
                    <ShieldAlert size={11} />
                    確認必須
                  </span>
                )}
              </div>

              {/* 宛先チップ */}
              {candidate.audiences && candidate.audiences.length > 0 && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {candidate.audiences.map((a, i) => (
                    <span key={i} style={{
                      display: "inline-flex", alignItems: "center", gap: "3px",
                      fontSize: "10.5px", color: "#8A8F98",
                      background: "#F8FAFC", border: "1px solid #E5E9EF",
                      borderRadius: "100px", padding: "1px 8px",
                    }}>
                      宛先：{a.label}
                    </span>
                  ))}
                </div>
              )}

              {/* タイトル */}
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color:
                    candidate.reviewStatus === "dismissed"
                      ? "#94A3B8"
                      : "#1E293B",
                  lineHeight: 1.4,
                  textDecoration:
                    candidate.reviewStatus === "dismissed"
                      ? "line-through"
                      : "none",
                }}
              >
                {candidate.title}
              </p>
            </div>

            {/* ステータス表示 + 展開ボタン */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: currentStatus.color,
                  background: currentStatus.bg,
                  padding: "2px 8px",
                  borderRadius: "100px",
                }}
              >
                {currentStatus.label}
              </span>
              {expanded ? (
                <ChevronUp size={16} color="#94A3B8" />
              ) : (
                <ChevronDown size={16} color="#94A3B8" />
              )}
            </div>
          </div>

          {/* 展開コンテンツ */}
          {expanded && (
            <div
              style={{
                borderTop: "1px solid #F1F5F9",
                padding: "16px",
              }}
            >
              {/* 元ログの対応箇所 */}
              <div
                style={{
                  background: "#F7F8FA",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    marginBottom: "5px",
                  }}
                >
                  <Quote size={12} color="#94A3B8" />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    元ログの該当箇所
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>
                  「{candidate.sourceExcerpt}」
                </p>
              </div>

              {/* 内容（編集モードまたは表示モード） */}
              {isEditing ? (
                <div style={{ marginBottom: "14px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#64748B",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    内容を修正
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #2F5EAA",
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: "#1E293B",
                      lineHeight: 1.6,
                      resize: "vertical",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />

                  {/* 重要度変更 */}
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#64748B",
                      display: "block",
                      marginTop: "10px",
                      marginBottom: "6px",
                    }}
                  >
                    重要度を変更
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {(["urgent", "high", "medium", "low"] as Priority[]).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setEditPriority(p)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            border: `1.5px solid ${
                              editPriority === p ? "#2F5EAA" : "#E2E8F0"
                            }`,
                            background:
                              editPriority === p ? "#EEF3FB" : "#FFFFFF",
                            color: editPriority === p ? "#2F5EAA" : "#64748B",
                            fontSize: "13px",
                            fontWeight: editPriority === p ? 600 : 400,
                            cursor: "pointer",
                          }}
                        >
                          {PRIORITY_LABELS[p]}
                        </button>
                      )
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <button
                      onClick={() => {
                        onEdit(candidate.id, "content", editContent);
                        onEdit(candidate.id, "priority", editPriority);
                        onStatusChange(candidate.id, "confirmed");
                        setIsEditing(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        background: "#0F766E",
                        color: "white",
                        border: "none",
                        borderRadius: "7px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Save size={14} />
                      修正して確認済みにする
                    </button>
                    <button
                      onClick={() => {
                        setEditContent(candidate.editedContent ?? candidate.content);
                        setEditPriority(candidate.editedPriority ?? candidate.priority);
                        setIsEditing(false);
                      }}
                      style={{
                        padding: "8px 14px",
                        background: "#FFFFFF",
                        color: "#64748B",
                        border: "1px solid #E2E8F0",
                        borderRadius: "7px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "14px",
                    color: "#1E293B",
                    lineHeight: 1.7,
                    marginBottom: "14px",
                    padding: "10px 12px",
                    background: "#FAFAFA",
                    borderRadius: "8px",
                    border: "1px solid #F1F5F9",
                  }}
                >
                  {candidate.editedContent ?? candidate.content}
                </div>
              )}

              {/* 低信頼度の警告 */}
              {candidate.confidence === "low" && !isEditing && (
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    padding: "10px 12px",
                    background: "#FDF6EC",
                    border: "1px solid #F0DDBB",
                    borderRadius: "8px",
                    marginBottom: "14px",
                  }}
                >
                  <AlertTriangle
                    size={14}
                    color="#B45309"
                    style={{ flexShrink: 0, marginTop: "1px" }}
                  />
                  <p style={{ fontSize: "12px", color: "#92400E", lineHeight: 1.5 }}>
                    この候補は信頼度が低い可能性があります。元ログをよく確認し、内容が正確かどうかご判断ください。
                  </p>
                </div>
              )}

              {/* アクションボタン */}
              {!isEditing && candidate.reviewStatus !== "confirmed" && candidate.reviewStatus !== "dismissed" && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => onStatusChange(candidate.id, "confirmed")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 16px",
                      background: "#EAF6F4",
                      color: "#0F766E",
                      border: "1.5px solid #BFE3DE",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <CheckCircle2 size={15} />
                    確認済み
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      onStatusChange(candidate.id, "editing");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 16px",
                      background: "#EEF3FB",
                      color: "#2F5EAA",
                      border: "1.5px solid #C9DAF1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <Edit3 size={15} />
                    修正する
                  </button>
                  <button
                    onClick={() => onStatusChange(candidate.id, "dismissed")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 16px",
                      background: "#F8FAFC",
                      color: "#94A3B8",
                      border: "1.5px solid #E2E8F0",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <X size={15} />
                    不要
                  </button>
                </div>
              )}

              {/* 確認済みの場合 */}
              {candidate.reviewStatus === "confirmed" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#0F766E",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>
                      確認済み — 申し送りに追加されます
                    </span>
                  </div>
                  <button
                    onClick={() => onStatusChange(candidate.id, "pending")}
                    style={{
                      fontSize: "12px",
                      color: "#94A3B8",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    取り消す
                  </button>
                </div>
              )}

              {/* 不要の場合 */}
              {candidate.reviewStatus === "dismissed" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#94A3B8" }}>
                    この候補は登録しません
                  </span>
                  <button
                    onClick={() => onStatusChange(candidate.id, "pending")}
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    再度確認する
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HandoverReviewPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<HandoverCandidate[]>([]);
  const [log, setLog] = useState<ReturnType<typeof loadCurrentLog>>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const pageOpenedAt = useRef<number>(0);

  useEffect(() => {
    // ページ開封時刻を記録（確認時間チェック用）
    pageOpenedAt.current = Date.now();
    const currentLog = loadCurrentLog();
    if (!currentLog) {
      router.push("/logs/new");
      return;
    }
    setLog(currentLog);
    const generated = generateCandidates(currentLog);
    setCandidates(generated);
  }, [router]);

  const handleStatusChange = (id: string, status: ReviewStatus) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, reviewStatus: status } : c))
    );
  };

  const handleEdit = (
    id: string,
    field: "content" | "priority",
    value: string
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (field === "content") return { ...c, editedContent: value };
        if (field === "priority") return { ...c, editedPriority: value as Priority };
        return c;
      })
    );
  };

  // 登録可能かチェック
  const requiredCandidates = candidates.filter(
    (c) => needsReview(c) && c.reviewStatus === "pending"
  );
  const confirmedCandidates = candidates.filter(
    (c) => c.reviewStatus === "confirmed"
  );
  const canRegister =
    requiredCandidates.length === 0 && confirmedCandidates.length > 0;

  const handleRegister = () => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const elapsed = now - pageOpenedAt.current;
    // 30秒未満で登録しようとした場合に警告
    if (elapsed < 30000) {
      setShowWarning(true);
      return;
    }
    doRegister();
  };

  const handleForceRegister = () => {
    setShowWarning(false);
    doRegister();
  };

  const doRegister = () => {
    if (!log) return;
    setIsRegistering(true);

    const now = new Date().toISOString();

    const newHandovers = confirmedCandidates.map((c) => {
      // audiencesが候補に無ければ、次の担当者への個人宛てとして扱う（既存の挙動を維持）
      const finalAudiences = c.audiences && c.audiences.length > 0
        ? c.audiences
        : [{ type: "user" as const, ids: [], label: log.nextAssignee }];
      return {
        id: generateId("h"),
        logId: log.id,
        category: c.category,
        kind: c.kind,
        readRequirement: c.readRequirement,
        title: c.title,
        content: c.editedContent ?? c.content,
        priority: c.editedPriority ?? c.priority,
        confidence: c.confidence,
        sourceExcerpt: c.sourceExcerpt,
        assignee: log.nextAssignee,
        author: log.author,
        status: "open" as const,
        isRead: false,
        isConfirmed: false,
        createdAt: now,
        audiences: finalAudiences,
        receipts: createInitialReceipts(finalAudiences),
        comments: [],
      };
    });

    appendHandovers(newHandovers);

    // 「対応が必要」な申し送りだけがタスクとして自動生成される。
    // 単なる共有事項・確認事項はタスク化しない。
    // confirmedCandidates と newHandovers は同じ順序で対応しているため
    // kind === "action" の候補に対応する handover の id を正しくマッピングする
    const newTasks: Task[] = confirmedCandidates
      .map((c, i) => ({ c, handoverId: newHandovers[i]?.id ?? "" }))
      .filter(({ c }) => c.kind === "action")
      .map(({ c, handoverId }) => ({
        id: generateId("t"),
        handoverId,
        title: (c.editedContent ?? c.content).slice(0, 40).replace(/【.*?】/g, "").trim() || c.title,
        description: c.editedContent ?? c.content,
        assignee: log.nextAssignee,
        author: log.author,
        priority: c.editedPriority ?? c.priority,
        status: "todo" as const,
        dueDate: relativeDateString(2), // 登録直後に期限切れに見えないよう2日後を初期値にする
        createdAt: now,
        sourceHandoverTitle: c.title,
      }));

    if (newTasks.length > 0) appendTasks(newTasks);

    // ログにhandoverCountを付与して保存
    appendLog({ ...log, handoverCount: confirmedCandidates.length });

    // 登録済みのログを current から外し、同じログからの二重登録を防ぐ
    clearCurrentLog();

    setTimeout(() => {
      setIsRegistering(false);
      setRegistered(true);
    }, 800);
  };

  const grouped = groupByCategory(candidates);

  if (registered) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
        <Navbar />
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "4rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              background: "#EAF6F4",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <CheckCircle2 size={36} color="#0F766E" />
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#1E293B",
              marginBottom: "10px",
            }}
          >
            申し送りを登録しました
          </h2>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.7, marginBottom: "28px" }}>
            {confirmedCandidates.length}件の申し送りを{log?.nextAssignee}さんに引き継ぎました。
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => router.push("/handover")}
              style={{
                padding: "10px 20px",
                background: "#0F766E",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              申し送り一覧を見る
            </button>
            <button
              onClick={() => router.push("/logs/new")}
              style={{
                padding: "10px 20px",
                background: "#FFFFFF",
                color: "#1E293B",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              新しい記録を入力
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />

      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "2rem 1.5rem 4rem",
        }}
      >
        {/* ── 処理フロー表示 ── */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "20px",
          overflow: "hidden",
        }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Rebioの整理プロセス
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0", overflowX: "auto" }}>
            {[
              { icon: FileSearch,  label: "ログ解析",       desc: "文章を文節単位で分解",      done: true  },
              { icon: ListFilter,  label: "候補を抽出",     desc: "キーワードでカテゴリ分類",   done: true  },
              { icon: AlertTriangle, label: "重要度を判定", desc: "優先度・信頼度を付与",       done: true  },
              { icon: ShieldAlert, label: "確認必須を判定", desc: "緊急・低信頼度を明示",       done: true  },
              { icon: UserCheck,   label: "あなたが確認",   desc: "内容を確認して登録",         done: false },
            ].map((step, i, arr) => (
              <div key={step.label} style={{ display: "flex", alignItems: "center", flex: i < arr.length - 1 ? "auto" : "none" }}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  minWidth: "80px", padding: "0 4px",
                }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: step.done ? "#EAF6F4" : "#EEF3FB",
                    border: `2px solid ${step.done ? "#0F766E" : "#2F5EAA"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "6px",
                    flexShrink: 0,
                  }}>
                    {step.done
                      ? <step.icon size={16} color="#0F766E" />
                      : <step.icon size={16} color="#2F5EAA" />
                    }
                  </div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: step.done ? "#0F766E" : "#2F5EAA", textAlign: "center", lineHeight: 1.3, whiteSpace: "nowrap" }}>
                    {step.label}
                  </p>
                  <p style={{ fontSize: "10px", color: "#94A3B8", textAlign: "center", lineHeight: 1.3, marginTop: "2px", maxWidth: "72px" }}>
                    {step.desc}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: i < arr.length - 2 ? "#BFE3DE" : "#C9DAF1", minWidth: "12px", maxWidth: "40px", margin: "0 2px", marginBottom: "20px" }} />
                )}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #F1F5F9",
            display: "flex", alignItems: "flex-start", gap: "8px",
          }}>
            <CheckCheck size={14} color="#2F5EAA" style={{ flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "12px", color: "#2F5EAA", lineHeight: 1.6 }}>
              <strong>Rebioが申し送り候補を作成しました。内容を確認してください。</strong>
              これらはあくまで整理候補です。正確性は保証されません。特に重要な項目は元のログと照合しながら確認をお願いします。
            </p>
          </div>
        </div>

        {/* ページタイトル */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.5px", marginBottom: "6px" }}>
            整理候補を確認してください
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6 }}>
            以下はRebioが勤務ログから抽出した申し送り候補です。
            <strong style={{ color: "#1E293B" }}>内容はあくまで候補であり、正確性は保証されません。</strong>
            各項目を確認し、問題がなければ「確認済み」にしてください。
          </p>
        </div>

        {/* 元ログ表示 */}
        {log && (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "10px",
              }}
            >
              <Quote size={14} color="#94A3B8" />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                元の勤務ログ
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "12px",
                  color: "#94A3B8",
                }}
              >
                次の担当者：
                <strong style={{ color: "#1E293B" }}>{log.nextAssignee}</strong>
              </span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#64748B",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {log.content}
            </p>
          </div>
        )}

        {/* 進捗バー */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                確認の進捗
              </span>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                {candidates.filter((c) => c.reviewStatus !== "pending").length} / {candidates.length}件
              </span>
            </div>
            <div
              style={{
                height: "6px",
                background: "#F1F5F9",
                borderRadius: "100px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #0F766E, #2F5EAA)",
                  borderRadius: "100px",
                  width: `${
                    candidates.length > 0
                      ? (candidates.filter((c) => c.reviewStatus !== "pending").length /
                          candidates.length) *
                        100
                      : 0
                  }%`,
                  transition: "width 0.4s",
                }}
              />
            </div>
          </div>
          {requiredCandidates.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#B45309",
                background: "#FDF6EC",
                padding: "4px 10px",
                borderRadius: "100px",
                border: "1px solid #F0DDBB",
                whiteSpace: "nowrap",
              }}
            >
              <AlertTriangle size={12} />
              確認必須：{requiredCandidates.length}件
            </div>
          )}
        </div>

        {/* 候補カード（カテゴリ別） */}
        {CATEGORY_ORDER.map((category) => {
          const items = grouped[category];
          if (items.length === 0) return null;
          return (
            <div key={category} style={{ marginBottom: "28px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {CATEGORY_LABELS[category]}
                <span
                  style={{
                    background: "#F1F5F9",
                    color: "#64748B",
                    borderRadius: "100px",
                    padding: "1px 8px",
                    fontSize: "11px",
                  }}
                >
                  {items.length}件
                </span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* 警告ダイアログ */}
        {showWarning && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "13px",
                padding: "28px",
                maxWidth: "400px",
                width: "100%",
                boxShadow: "0 8px 28px rgba(15,23,42,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#FDF6EC",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={20} color="#B45309" />
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1E293B",
                  }}
                >
                  確認時間が短すぎます
                </h3>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748B",
                  lineHeight: 1.7,
                  marginBottom: "20px",
                }}
              >
                重要項目を確認してください。申し送りの見落としを防ぐため、
                各候補の内容と元ログの対応箇所を確認することをお勧めします。
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowWarning(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#2F5EAA",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  確認に戻る
                </button>
                <button
                  onClick={handleForceRegister}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#FFFFFF",
                    color: "#94A3B8",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  このまま登録する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 未確認のヒント */}
        {requiredCandidates.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "14px 16px",
              background: "#FDF6EC",
              border: "1px solid #F0DDBB",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <AlertTriangle
              size={16}
              color="#B45309"
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
            <p style={{ fontSize: "13px", color: "#92400E", lineHeight: 1.6 }}>
              重要度「緊急」「高」または信頼度「低」の項目が{requiredCandidates.length}件未確認です。
              登録前に「確認済み」「修正する」「不要」のいずれかを選択してください。
            </p>
          </div>
        )}

        {confirmedCandidates.length === 0 && requiredCandidates.length === 0 && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "14px 16px",
              background: "#EEF3FB",
              border: "1px solid #C9DAF1",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <Info
              size={16}
              color="#2F5EAA"
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
            <p style={{ fontSize: "13px", color: "#2F5EAA", lineHeight: 1.6 }}>
              「確認済み」にした項目が登録されます。登録する申し送りを少なくとも1件選択してください。
            </p>
          </div>
        )}

        {/* 登録ボタン */}
        <button
          onClick={handleRegister}
          disabled={!canRegister || isRegistering}
          style={{
            width: "100%",
            padding: "15px 24px",
            background: canRegister ? "#0F766E" : "#E2E8F0",
            color: canRegister ? "#FFFFFF" : "#94A3B8",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: canRegister ? "pointer" : "not-allowed",
            letterSpacing: "-0.2px",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isRegistering ? (
            <>登録中…</>
          ) : (
            <>
              <CheckCircle2 size={18} />
              内容を確認し、申し送りとして登録（{confirmedCandidates.length}件）
            </>
          )}
        </button>
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#94A3B8",
            marginTop: "8px",
          }}
        >
          「確認済み」にした{confirmedCandidates.length}件が{log?.nextAssignee}さんへの申し送りとして登録されます
        </p>
      </div>
    </div>
  );
}
