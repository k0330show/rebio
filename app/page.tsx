"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import LoadingScreen from "@/app/components/LoadingScreen";
import PriorityBadge from "@/app/components/PriorityBadge";
import CategoryBadge from "@/app/components/CategoryBadge";
import FileTypeIcon from "@/app/components/FileTypeIcon";
import {
  Handover, Task, WorkLog, LibraryDoc,
  SHIFT_TYPE_LABELS, TASK_STATUS_LABELS, ACTIVITY_ACTION_LABELS,
} from "@/app/types";
import {
  initializeStore, initializeLibrary,
  loadHandovers, loadTasks, loadLogs, loadLibrary, loadRecentIds,
  formatDate, priorityOrder, isBeforeToday,
  getHandoverKind, getDefaultReadRequirement,
  CURRENT_USER, isUserInAudiences, loadActivityLogs,
} from "@/app/lib/store";
import {
  AlertTriangle, CheckCircle2, ClipboardList, FileText,
  PlusCircle, ArrowRight, Clock3, Circle, ShieldCheck,
  FolderOpen, Clock, ChevronRight, User, Workflow,
} from "lucide-react";

// ─── 小コンポーネント ─────────────────────────────────────────────────────────

function GroupLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {children}
      </p>
      {count !== undefined && (
        <span style={{ background: "#F1F5F9", color: "#94A3B8", borderRadius: "100px", fontSize: "10px", fontWeight: 600, padding: "1px 6px" }}>
          {count}
        </span>
      )}
    </div>
  );
}

function SeeAll({ href, label = "すべて見る" }: { href: string; label?: string }) {
  return (
    <Link href={href} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "#2F5EAA", textDecoration: "none", fontWeight: 500, marginTop: "10px" }}>
      {label} <ArrowRight size={12} />
    </Link>
  );
}

const PBAR: Record<string, string> = { urgent: "#C0392B", high: "#B45309", medium: "#8A8F98", low: "#CBD5E1" };

// ─── 申し送りミニカード ───────────────────────────────────────────────────────

function HandoverRow({ h }: { h: Handover }) {
  const kind = h.kind ?? getHandoverKind(h);
  const readRequirement = h.readRequirement ?? getDefaultReadRequirement(kind, h);
  const isAction = kind === "action";
  const SIcon = h.status === "open" ? Circle : h.status === "in_progress" ? Clock3 : CheckCircle2;
  const sColor = h.status === "open" ? "#CBD5E1" : h.status === "in_progress" ? "#2F5EAA" : "#0F766E";
  const needsConfirm = readRequirement === "confirm" && !(h.isConfirmed ?? false);
  // v11: 宛先表示はaudiencesを優先する。/handoverページと同じロジックで統一する。
  const destination = h.audiences && h.audiences.length > 0
    ? h.audiences.map(a => a.label).join("・")
    : (h.assignee || "宛先未設定");
  return (
    <Link href="/handover" style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "0",
        border: "1px solid #F1F5F9", borderRadius: "8px", overflow: "hidden",
        background: "#FAFAFA",
        transition: "background 0.1s",
      }}
        onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
        onMouseLeave={e => (e.currentTarget.style.background = "#FAFAFA")}
      >
        <div style={{ width: "3px", background: isAction ? PBAR[h.priority] : "#CBD5E1", flexShrink: 0, alignSelf: "stretch" }} />
        <div style={{ padding: "9px 11px", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "5px", marginBottom: "3px", flexWrap: "wrap" }}>
            <CategoryBadge category={h.category} size="sm" />
            {isAction && <PriorityBadge priority={h.priority} size="sm" />}
            {needsConfirm && (
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#C0392B" }}>要確認</span>
            )}
          </div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {h.title}
          </p>
          <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
            <User size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
            {destination} · {formatDate(h.createdAt)}
          </p>
        </div>
        {isAction && (
          <div style={{ padding: "10px 10px", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <SIcon size={15} color={sColor} />
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── タスクミニ行 ─────────────────────────────────────────────────────────────

function TaskRow({ t }: { t: Task }) {
  const isOverdue = !!t.dueDate && isBeforeToday(t.dueDate) && t.status !== "completed";
  return (
    <Link href="/tasks" style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "9px 12px", border: "1px solid #F1F5F9", borderRadius: "8px", background: "#FAFAFA",
        transition: "background 0.1s",
      }}
        onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
        onMouseLeave={e => (e.currentTarget.style.background = "#FAFAFA")}
      >
        <div style={{ width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, border: `2px solid ${t.status === "in_progress" ? "#2F5EAA" : "#CBD5E1"}`, background: t.status === "in_progress" ? "#EEF3FB" : "transparent" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
          <div style={{ display: "flex", gap: "6px", marginTop: "2px", alignItems: "center" }}>
            <PriorityBadge priority={t.priority} size="sm" />
            {t.dueDate && (
              <span style={{ fontSize: "11px", color: isOverdue ? "#C0392B" : "#94A3B8", fontWeight: isOverdue ? 600 : 400, display: "flex", alignItems: "center", gap: "2px" }}>
                {isOverdue && <AlertTriangle size={10} />}
                {t.dueDate}
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 600, color: t.status === "in_progress" ? "#2F5EAA" : "#94A3B8", flexShrink: 0 }}>
          {TASK_STATUS_LABELS[t.status]}
        </span>
      </div>
    </Link>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [logs, setLogs]           = useState<WorkLog[]>([]);
  const [library, setLibrary]     = useState<LibraryDoc[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<ReturnType<typeof loadActivityLogs>>([]);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    initializeStore();
    initializeLibrary();
    setHandovers(loadHandovers());
    setTasks(loadTasks());
    setLogs(loadLogs());
    setLibrary(loadLibrary());
    setRecentIds(loadRecentIds());
    setActivityLogs(loadActivityLogs());
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingScreen />;

  const today = new Date().toDateString();
  const ME = CURRENT_USER.name; // デモ：ログイン機能が無いため田中花子を自分として固定

  // ─ 今日見るべきもの ─
  // 緊急バナーは「対応が必要」なものだけを対象にする（共有事項は含めない）
  const urgentOpen    = handovers.filter(h => (h.kind ?? getHandoverKind(h)) === "action" && (h.priority === "urgent" || h.priority === "high") && h.status !== "completed");
  // v11: 「自分に関係するもの」= 個人宛て・自分の部署/役職/シフト宛て・全体向けのいずれかに自分が含まれるもの
  const myOpen        = handovers.filter(h => {
    if ((h.kind ?? getHandoverKind(h)) === "share") return false;
    if (h.status === "completed") return false;
    if (h.assignee === ME) return true;
    return isUserInAudiences(h.audiences, CURRENT_USER);
  });
  const allOpen       = handovers.filter(h => (h.kind ?? getHandoverKind(h)) !== "share" && h.status !== "completed");
  const actionOpenCount = handovers.filter(h => (h.kind ?? getHandoverKind(h)) === "action" && h.status !== "completed").length;
  const overdueTask   = tasks.filter(t => t.dueDate && isBeforeToday(t.dueDate) && t.status !== "completed");
  const openTasks     = tasks.filter(t => t.status !== "completed");
  const todayLogs     = logs.filter(l => new Date(l.createdAt).toDateString() === today);

  // 重要な申し送り（緊急・高を先頭に、最大5件）
  const importantHandovers = [...allOpen]
    .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority))
    .slice(0, 5);

  // 自分に関係する申し送り（最大3件）
  const myHandovers = myOpen.slice(0, 3);

  // 期限切れ・本日期限タスク（最大4件）
  const urgentTasks = [
    ...overdueTask,
    ...tasks.filter(t => t.dueDate === new Date().toISOString().slice(0, 10) && t.status !== "completed"),
    ...openTasks.filter(t => (t.priority === "urgent" || t.priority === "high") && !overdueTask.find(od => od.id === t.id)),
  ].filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i).slice(0, 4);

  // ─ 責任の流れ（v16） ─
  // 既存のhandovers/tasks/activityLogsから、業務上の責任がどこにあるかを軽く可視化する。
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const daysSince = (iso: string) => Math.floor((now - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));

  // 自分がボールを持っているもの＝自分に関係する未完了の申し送り
  const myBallCount = myOpen.length;
  // 確認待ちで止まっているもの＝readRequirementがconfirmで未確認のもの
  const waitingConfirmCount = handovers.filter(h => h.readRequirement === "confirm" && !(h.isConfirmed ?? false) && h.status !== "completed").length;
  // 対応が必要なもの＝action種別で未完了
  const needsActionCount = actionOpenCount;
  // 長時間止まっているもの＝作成から3日以上経過し、まだ未完了のもの（最大3件）
  const stalledHandovers = allOpen
    .filter(h => daysSince(h.createdAt) >= 3)
    .sort((a, b) => daysSince(b.createdAt) - daysSince(a.createdAt))
    .slice(0, 3);
  // 最近解決したもの＝直近で完了になった申し送り（最大3件）
  const recentlyResolved = [...handovers]
    .filter(h => h.status === "completed" && h.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 3);

  // 最近開いた書類（最大3件）
  const recentDocs = recentIds
    .map(id => library.find(d => d.id === id))
    .filter(Boolean)
    .slice(0, 3) as LibraryDoc[];

  // ピン留め書類（最大2件）
  const pinnedDocs = library.filter(d => d.isPinned).slice(0, 2);

  // 最新ログ（最大2件）
  const recentLogs = [...logs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>

        {/* ── ページヘッダー ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.4px" }}>
              おはようございます、田中さん
            </h1>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>
              {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
              　対応が必要 {actionOpenCount}件 · 未完了タスク {openTasks.length}件
            </p>
          </div>
          <Link href="/logs/new" style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", background: "#2F5EAA", color: "white",
            borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 600,
          }}>
            <PlusCircle size={14} /> 記録する
          </Link>
        </div>

        {/* ── 緊急バナー ── */}
        {urgentOpen.length > 0 && (
          <div style={{
            display: "flex", gap: "10px", padding: "12px 16px",
            background: "#FBEEEC", border: "1px solid #EFCCC6", borderRadius: "10px",
            marginBottom: "18px", alignItems: "flex-start",
          }}>
            <AlertTriangle size={16} color="#C0392B" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#8C3229", marginBottom: "2px" }}>
                緊急・高の申し送りが{urgentOpen.length}件あります
              </p>
              <p style={{ fontSize: "12px", color: "#A8402F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {urgentOpen.slice(0, 2).map(h => h.title).join("　/　")}
              </p>
            </div>
            <Link href="/handover" style={{ fontSize: "12px", fontWeight: 600, color: "#C0392B", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: "3px" }}>
              確認 <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── 責任の流れ（v16） ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <Workflow size={14} color="#2F5EAA" />
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#1E293B" }}>責任の流れ</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link href="/handover" style={{ textDecoration: "none", flex: "1 1 140px" }}>
              <div style={{ padding: "9px 12px", background: "#F7F8FA", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: "10.5px", color: "#94A3B8", marginBottom: "2px" }}>自分がボールを持っている</p>
                <p style={{ fontSize: "17px", fontWeight: 800, color: "#1E293B" }}>{myBallCount}<span style={{ fontSize: "11px", fontWeight: 400, color: "#94A3B8" }}>件</span></p>
              </div>
            </Link>
            <Link href="/handover" style={{ textDecoration: "none", flex: "1 1 140px" }}>
              <div style={{ padding: "9px 12px", background: "#F7F8FA", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: "10.5px", color: "#94A3B8", marginBottom: "2px" }}>確認待ちで止まっている</p>
                <p style={{ fontSize: "17px", fontWeight: 800, color: waitingConfirmCount > 0 ? "#B45309" : "#1E293B" }}>{waitingConfirmCount}<span style={{ fontSize: "11px", fontWeight: 400, color: "#94A3B8" }}>件</span></p>
              </div>
            </Link>
            <Link href="/handover" style={{ textDecoration: "none", flex: "1 1 140px" }}>
              <div style={{ padding: "9px 12px", background: "#F7F8FA", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: "10.5px", color: "#94A3B8", marginBottom: "2px" }}>対応が必要</p>
                <p style={{ fontSize: "17px", fontWeight: 800, color: needsActionCount > 0 ? "#B45309" : "#1E293B" }}>{needsActionCount}<span style={{ fontSize: "11px", fontWeight: 400, color: "#94A3B8" }}>件</span></p>
              </div>
            </Link>
            <Link href="/handover" style={{ textDecoration: "none", flex: "1 1 140px" }}>
              <div style={{ padding: "9px 12px", background: "#F7F8FA", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: "10.5px", color: "#94A3B8", marginBottom: "2px" }}>長時間止まっている（3日以上）</p>
                <p style={{ fontSize: "17px", fontWeight: 800, color: stalledHandovers.length > 0 ? "#C0392B" : "#1E293B" }}>{stalledHandovers.length}<span style={{ fontSize: "11px", fontWeight: 400, color: "#94A3B8" }}>件</span></p>
              </div>
            </Link>
            <Link href="/handover" style={{ textDecoration: "none", flex: "1 1 140px" }}>
              <div style={{ padding: "9px 12px", background: "#F7F8FA", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: "10.5px", color: "#94A3B8", marginBottom: "2px" }}>最近解決した</p>
                <p style={{ fontSize: "17px", fontWeight: 800, color: "#0F766E" }}>{recentlyResolved.length}<span style={{ fontSize: "11px", fontWeight: 400, color: "#94A3B8" }}>件</span></p>
              </div>
            </Link>
          </div>
          {activityLogs.length > 0 && (
            <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "10px" }}>
              直近：{activityLogs[0].actorName} が{ACTIVITY_ACTION_LABELS[activityLogs[0].action]}（{formatDate(activityLogs[0].createdAt)}）
            </p>
          )}
        </div>

        {/* ── 2カラムグリッド ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "16px",
        }}>

          {/* ── 左カラム ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* 自分に関係する申し送り */}
            {myHandovers.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 18px" }}>
                <GroupLabel count={myOpen.length}>自分に関係するもの</GroupLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {myHandovers.map(h => <HandoverRow key={h.id} h={h} />)}
                </div>
                {myOpen.length > 3 && <SeeAll href="/handover" label={`あと${myOpen.length - 3}件を見る`} />}
              </div>
            )}

            {/* 重要な申し送り */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 18px" }}>
              <GroupLabel count={allOpen.length}>未対応の申し送り</GroupLabel>
              {importantHandovers.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <CheckCircle2 size={26} color="#E2E8F0" style={{ margin: "0 auto 6px" }} />
                  <p style={{ fontSize: "13px", color: "#94A3B8" }}>未対応の申し送りはありません</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {importantHandovers.map(h => <HandoverRow key={h.id} h={h} />)}
                </div>
              )}
              <SeeAll href="/handover" />
            </div>

            {/* 今日やること（期限切れ・緊急タスク） */}
            {urgentTasks.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 18px" }}>
                <GroupLabel count={overdueTask.length > 0 ? overdueTask.length : undefined}>
                  {overdueTask.length > 0 ? "期限切れ・緊急タスク" : "優先タスク"}
                </GroupLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {urgentTasks.map(t => <TaskRow key={t.id} t={t} />)}
                </div>
                <SeeAll href="/tasks" />
              </div>
            )}

          </div>

          {/* ── 右カラム ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* 数値サマリー */}
            <div style={{
              background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
            }}>
              {[
                { label: "緊急・高", value: urgentOpen.length, color: urgentOpen.length > 0 ? "#C0392B" : "#1E293B" },
                { label: "未完了タスク", value: openTasks.length, color: "#1E293B" },
                { label: "本日のログ", value: todayLogs.length, color: "#1E293B" },
                { label: "解決済み", value: recentlyResolved.length, color: "#0F766E" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: "10px 12px", background: "#F7F8FA", borderRadius: "8px" }}>
                  <p style={{ fontSize: "10px", color: "#94A3B8", marginBottom: "3px" }}>{label}</p>
                  <p style={{ fontSize: "22px", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* 最近開いた書類 */}
            {(recentDocs.length > 0 || pinnedDocs.length > 0) && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px" }}>
                <GroupLabel>書類</GroupLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {pinnedDocs.map(doc => (
                    <Link key={doc.id} href={`/library/${doc.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 9px", background: "#FDF6EC", border: "1px solid #F0DDBB", borderRadius: "7px" }}>
                        <FileTypeIcon fileType={doc.fileType} size={13} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{doc.name}</span>
                        <ChevronRight size={11} color="#CBD5E1" />
                      </div>
                    </Link>
                  ))}
                  {recentDocs.filter(d => !pinnedDocs.find(p => p.id === d.id)).map(doc => (
                    <Link key={doc.id} href={`/library/${doc.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 9px", background: "#F7F8FA", border: "1px solid #F1F5F9", borderRadius: "7px" }}>
                        <FileTypeIcon fileType={doc.fileType} size={13} />
                        <span style={{ fontSize: "12px", color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{doc.name}</span>
                        <Clock size={10} color="#CBD5E1" />
                      </div>
                    </Link>
                  ))}
                </div>
                <SeeAll href="/library" label="書類をすべて見る" />
              </div>
            )}

            {/* 最新の勤務ログ */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <GroupLabel>最新の記録</GroupLabel>
              </div>
              {recentLogs.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#94A3B8" }}>まだ記録がありません</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentLogs.map(log => (
                    <div key={log.id} style={{ padding: "10px 12px", background: "#F7F8FA", borderRadius: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#2F5EAA" }}>{SHIFT_TYPE_LABELS[log.shiftType]}</span>
                        <span style={{ fontSize: "10px", color: "#94A3B8" }}>{formatDate(log.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#64748B" }}>
                        {log.author} → <strong style={{ color: "#1E293B" }}>{log.nextAssignee}</strong>
                      </p>
                      {(log.handoverCount ?? 0) > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "4px", fontSize: "10px", fontWeight: 600, color: "#0F766E", background: "#EAF6F4", padding: "1px 7px", borderRadius: "100px", border: "1px solid #BFE3DE" }}>
                          <ClipboardList size={9} /> {log.handoverCount}件
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <SeeAll href="/logs" label="記録をすべて見る" />
            </div>

            {/* 安全設計メモ */}
            <div style={{ padding: "12px 14px", background: "#EEF3FB", border: "1px solid #C9DAF1", borderRadius: "10px", display: "flex", gap: "8px" }}>
              <ShieldCheck size={14} color="#2F5EAA" style={{ flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "11px", color: "#2F5EAA", lineHeight: 1.6 }}>
                整理候補は担当者が確認してから共有されます。内容に迷ったら修正してください。
              </p>
            </div>

          </div>
        </div>

        {/* ── 下部：おすすめの体験順 ── */}
        <div style={{
          marginTop: "20px",
          background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              はじめての方へ：おすすめの体験順
            </p>
            <Link href="/demo" style={{ fontSize: "11px", color: "#2F5EAA", textDecoration: "none" }}>
              詳しく見る →
            </Link>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { step: "1", href: "/logs/new",  label: "勤務ログを記録する",            icon: FileText,      color: "#2F5EAA" },
              { step: "2", href: "/logs/new",  label: "勤務ログ作成後に整理候補を確認", icon: ClipboardList, color: "#0F766E" },
              { step: "3", href: "/handover",  label: "申し送り一覧を見る",            icon: CheckCircle2,  color: "#6D4FC2" },
              { step: "4", href: "/library",   label: "関連書類を見る",                icon: FolderOpen,    color: "#B45309" },
            ].map(({ step, href, label, icon: Icon, color }) => (
              <Link key={`${step}-${href}`} href={href} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 14px", borderRadius: "8px",
                border: "1px solid #E2E8F0", background: "#F7F8FA",
                textDecoration: "none",
                transition: "background 0.1s, border-color 0.1s",
                flex: "1 1 auto", minWidth: "160px",
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "#FFFFFF"; el.style.borderColor = color; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "#F7F8FA"; el.style.borderColor = "#E2E8F0"; }}
              >
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${color}18`, border: `1.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color, flexShrink: 0 }}>
                  {step}
                </span>
                <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1E293B" }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
