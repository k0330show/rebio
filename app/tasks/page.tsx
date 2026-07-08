"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import LoadingScreen from "@/app/components/LoadingScreen";
import PriorityBadge from "@/app/components/PriorityBadge";
import FileTypeIcon from "@/app/components/FileTypeIcon";
import { Task, TaskStatus, Priority, LibraryDoc, TASK_STATUS_LABELS, PRIORITY_LABELS } from "@/app/types";
import {
  initializeStore, initializeLibrary, loadTasks, saveTasks, loadLibrary, priorityOrder,
  taskStatusOrder, formatDate, isBeforeToday,
} from "@/app/lib/store";
import {
  CheckCircle2, Circle, Clock3, User, Calendar,
  ClipboardList, ChevronDown, ChevronUp, AlertTriangle, Search, X,
} from "lucide-react";

type FilterStatus   = TaskStatus | "all";
type FilterPriority = Priority   | "all";

const STATUS_CONFIG = {
  todo:        { label: "未着手",  color: "#94A3B8", bg: "#F8FAFC", border: "#E2E8F0",  icon: Circle       },
  in_progress: { label: "対応中",  color: "#2F5EAA", bg: "#EEF3FB", border: "#C9DAF1",  icon: Clock3       },
  completed:   { label: "完了",    color: "#0F766E", bg: "#EAF6F4", border: "#BFE3DE",  icon: CheckCircle2 },
};

export default function TasksPage() {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [library, setLibrary]   = useState<LibraryDoc[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus]     = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    initializeStore();
    initializeLibrary();
    setTasks(loadTasks());
    setLibrary(loadLibrary());
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingScreen />;

  // 担当者一覧
  const assignees = Array.from(new Set(tasks.map(t => t.assignee))).sort();

  const handleStatusChange = (id: string, status: TaskStatus) => {
    const updated = tasks.map(t =>
      t.id === id
        ? { ...t, status, completedAt: status === "completed" ? new Date().toISOString() : undefined }
        : t
    );
    setTasks(updated);
    saveTasks(updated);
  };

  const filtered = tasks
    .filter(t => filterStatus   === "all" || t.status   === filterStatus)
    .filter(t => filterPriority === "all" || t.priority === filterPriority)
    .filter(t => filterAssignee === "all" || t.assignee === filterAssignee)
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      // 完了を末尾へ
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      const ps = priorityOrder(a.priority) - priorityOrder(b.priority);
      if (ps !== 0) return ps;
      return taskStatusOrder(a.status) - taskStatusOrder(b.status);
    });

  const openCount      = tasks.filter(t => t.status !== "completed").length;
  const urgentCount    = tasks.filter(t => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const today = new Date().toDateString();
  const todayDueCount  = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today && t.status !== "completed").length;

  const isOverdue = (t: Task) =>
    !!t.dueDate && isBeforeToday(t.dueDate) && t.status !== "completed";

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.4px", marginBottom: "3px" }}>タスク</h1>
            <p style={{ fontSize: "13px", color: "#94A3B8" }}>申し送りから生成されたタスク · 未完了 {openCount}件</p>
          </div>
          <Link href="/handover" style={{ fontSize: "12px", color: "#2F5EAA", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}>
            申し送り一覧 →
          </Link>
        </div>

        {/* 検索バー */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <Search size={14} color="#94A3B8" style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="タイトル・担当者で検索"
            style={{ width: "100%", padding: "8px 11px 8px 31px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", color: "#1E293B", outline: "none", background: "#FFFFFF" }}
            onFocus={e => e.target.style.borderColor = "#2F5EAA"}
            onBlur={e => e.target.style.borderColor = "#E2E8F0"}
          />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}><X size={13} color="#94A3B8" /></button>}
        </div>

        {/* サマリー */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "未完了",         value: openCount,      color: "#1E293B", bg: "#FFFFFF", border: "#E2E8F0" },
            { label: "本日期限",       value: todayDueCount,  color: todayDueCount > 0 ? "#B45309" : "#1E293B", bg: todayDueCount > 0 ? "#FDF6EC" : "#FFFFFF", border: todayDueCount > 0 ? "#F0DDBB" : "#E2E8F0" },
            { label: "緊急・高（未完）", value: urgentCount,   color: urgentCount > 0 ? "#C0392B" : "#1E293B", bg: urgentCount > 0 ? "#FBEEEC" : "#FFFFFF", border: urgentCount > 0 ? "#EFCCC6" : "#E2E8F0" },
            { label: "完了済み",       value: completedCount, color: "#0F766E", bg: "#EAF6F4", border: "#BFE3DE" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "10px", padding: "14px 16px" }}>
              <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "4px" }}>{label}</p>
              <p style={{ fontSize: "26px", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* フィルター */}
        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: "10px", padding: "14px 16px", marginBottom: "16px",
          display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start",
        }}>
          {/* ステータス */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>ステータス</p>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["all", "todo", "in_progress", "completed"] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: "4px 10px", borderRadius: "6px", border: "none",
                  background: filterStatus === s ? "#EEF3FB" : "#F1F5F9",
                  color: filterStatus === s ? "#2F5EAA" : "#64748B",
                  fontSize: "12px", fontWeight: filterStatus === s ? 600 : 400, cursor: "pointer",
                }}>
                  {s === "all" ? "すべて" : TASK_STATUS_LABELS[s as TaskStatus]}
                </button>
              ))}
            </div>
          </div>

          {/* 重要度 */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>重要度</p>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["all", "urgent", "high", "medium", "low"] as const).map(p => (
                <button key={p} onClick={() => setFilterPriority(p)} style={{
                  padding: "4px 10px", borderRadius: "6px", border: "none",
                  background: filterPriority === p ? "#EEF3FB" : "#F1F5F9",
                  color: filterPriority === p ? "#2F5EAA" : "#64748B",
                  fontSize: "12px", fontWeight: filterPriority === p ? 600 : 400, cursor: "pointer",
                }}>
                  {p === "all" ? "すべて" : PRIORITY_LABELS[p as Priority]}
                </button>
              ))}
            </div>
          </div>

          {/* 担当者 */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>担当者</p>
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              style={{
                padding: "4px 10px", borderRadius: "6px",
                border: "1px solid #E2E8F0", background: "#F1F5F9",
                color: "#64748B", fontSize: "12px", cursor: "pointer", outline: "none",
              }}
            >
              <option value="all">すべて</option>
              {assignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "12px" }}>{filtered.length}件を表示</p>

        {/* タスクカード */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8" }}>
            <CheckCircle2 size={40} color="#E2E8F0" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>該当するタスクはありません</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map(task => {
              const sc = STATUS_CONFIG[task.status];
              const SIcon = sc.icon;
              const isExpanded = expandedId === task.id;
              const overdue = isOverdue(task);

              return (
                <div key={task.id} style={{
                  background: "#FFFFFF",
                  border: `1px solid ${overdue ? "#EFCCC6" : "#E2E8F0"}`,
                  borderRadius: "12px", overflow: "hidden",
                  opacity: task.status === "completed" ? 0.7 : 1,
                }}>
                  <div style={{ display: "flex" }}>
                    {/* 重要度バー */}
                    <div style={{
                      width: "3px", flexShrink: 0,
                      background: task.status === "completed" ? "#E2E8F0"
                        : task.priority === "urgent" ? "#C0392B"
                        : task.priority === "high" ? "#B45309"
                        : task.priority === "medium" ? "#8A8F98" : "#CBD5E1",
                    }} />

                    <div style={{ flex: 1 }}>
                      {/* メイン行 */}
                      <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        {/* 完了ボタン */}
                        <button
                          onClick={() => handleStatusChange(task.id, task.status === "completed" ? "todo" : "completed")}
                          style={{
                            width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                            border: `2px solid ${task.status === "completed" ? "#0F766E" : "#E2E8F0"}`,
                            background: task.status === "completed" ? "#EAF6F4" : "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            padding: 0,
                          }}
                          title={task.status === "completed" ? "未着手に戻す" : "完了にする"}
                        >
                          {task.status === "completed" && <CheckCircle2 size={14} color="#0F766E" />}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: "14px", fontWeight: 600, color: task.status === "completed" ? "#94A3B8" : "#1E293B",
                            textDecoration: task.status === "completed" ? "line-through" : "none",
                            lineHeight: 1.4, marginBottom: "5px",
                          }}>
                            {task.title}
                          </p>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            <PriorityBadge priority={task.priority} size="sm" />
                            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "#64748B" }}>
                              <User size={12} />{task.assignee}
                            </span>
                            {task.dueDate && (
                              <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: overdue ? "#C0392B" : "#94A3B8", fontWeight: overdue ? 600 : 400 }}>
                                <Calendar size={12} />
                                {overdue && <AlertTriangle size={11} />}
                                {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ステータス＋展開 */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              fontSize: "11px", fontWeight: 600,
                              color: sc.color, background: sc.bg,
                              border: `1px solid ${sc.border}`,
                              padding: "2px 8px", borderRadius: "100px",
                            }}>
                              <SIcon size={11} />
                              {sc.label}
                            </span>
                          </div>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : task.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            {isExpanded ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                          </button>
                        </div>
                      </div>

                      {/* 展開コンテンツ */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #F1F5F9", padding: "14px" }}>
                          <p style={{ fontSize: "13px", color: "#1E293B", lineHeight: 1.7, marginBottom: "12px" }}>
                            {task.description}
                          </p>

                          {/* 元の申し送り */}
                          <div style={{
                            display: "flex", gap: "6px", alignItems: "flex-start",
                            background: "#F7F8FA", border: "1px solid #E2E8F0",
                            borderRadius: "7px", padding: "8px 12px", marginBottom: "10px",
                          }}>
                            <ClipboardList size={13} color="#94A3B8" style={{ marginTop: "1px", flexShrink: 0 }} />
                            <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.5 }}>
                              元の申し送り：{task.sourceHandoverTitle}
                            </p>
                          </div>

                          {/* 関連書類 */}
                          {library.filter(d => d.relatedTaskIds.includes(task.id)).length > 0 && (
                            <div style={{ marginBottom: "10px" }}>
                              <p style={{ fontSize: "10px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "5px" }}>関連書類</p>
                              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                {library.filter(d => d.relatedTaskIds.includes(task.id)).map(doc => (
                                  <Link key={doc.id} href={`/library/${doc.id}`} style={{ textDecoration: "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "#FDF6EC", border: "1px solid #F0DDBB", borderRadius: "100px" }}>
                                      <FileTypeIcon fileType={doc.fileType} size={10} />
                                      <span style={{ fontSize: "11px", color: "#B45309", fontWeight: 500 }}>{doc.name}</span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          <p style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "12px" }}>
                            作成者：{task.author} · {formatDate(task.createdAt)}
                            {task.completedAt && ` · 完了：${formatDate(task.completedAt)}`}
                          </p>

                          {/* ステータス変更ボタン */}
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {task.status !== "todo" && (
                              <button onClick={() => handleStatusChange(task.id, "todo")} style={{
                                display: "flex", alignItems: "center", gap: "5px",
                                padding: "7px 12px", background: "#F8FAFC", color: "#64748B",
                                border: "1px solid #E2E8F0", borderRadius: "7px",
                                fontSize: "12px", fontWeight: 500, cursor: "pointer",
                              }}>
                                <Circle size={13} /> 未着手に戻す
                              </button>
                            )}
                            {task.status !== "in_progress" && (
                              <button onClick={() => handleStatusChange(task.id, "in_progress")} style={{
                                display: "flex", alignItems: "center", gap: "5px",
                                padding: "7px 12px", background: "#EEF3FB", color: "#2F5EAA",
                                border: "1px solid #C9DAF1", borderRadius: "7px",
                                fontSize: "12px", fontWeight: 600, cursor: "pointer",
                              }}>
                                <Clock3 size={13} /> 対応中にする
                              </button>
                            )}
                            {task.status !== "completed" && (
                              <button onClick={() => handleStatusChange(task.id, "completed")} style={{
                                display: "flex", alignItems: "center", gap: "5px",
                                padding: "7px 12px", background: "#EAF6F4", color: "#0F766E",
                                border: "1px solid #BFE3DE", borderRadius: "7px",
                                fontSize: "12px", fontWeight: 600, cursor: "pointer",
                              }}>
                                <CheckCircle2 size={13} /> 完了にする
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
