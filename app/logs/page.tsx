"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import LoadingScreen from "@/app/components/LoadingScreen";
import PriorityBadge from "@/app/components/PriorityBadge";
import { WorkLog, SHIFT_TYPE_LABELS, ShiftType } from "@/app/types";
import { initializeStore, loadLogs, formatDate } from "@/app/lib/store";
import {
  FileText, PlusCircle, ChevronDown, ChevronUp,
  ClipboardList, User, Clock,
} from "lucide-react";

const SHIFT_COLORS: Record<ShiftType, { bg: string; color: string; border: string }> = {
  day:     { bg: "#EEF3FB", color: "#2F5EAA", border: "#C9DAF1" },
  evening: { bg: "#F2EFFB", color: "#6D4FC2", border: "#DBD3F2" },
  night:   { bg: "#0F172A", color: "#94A3B8", border: "#1E293B" },
  early:   { bg: "#EAF6F4", color: "#0F766E", border: "#BFE3DE" },
  late:    { bg: "#F8FAFC", color: "#8A8F98", border: "#E5E9EF" },
  other:   { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0" },
};

export default function LogsPage() {
  const [logs, setLogs]           = useState<WorkLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterShift, setFilterShift] = useState<ShiftType | "all">("all");
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    initializeStore();
    setLogs(loadLogs());
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingScreen />;

  const filtered = logs
    .filter(l => filterShift === "all" || l.shiftType === filterShift)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.5px", marginBottom: "4px" }}>
              勤務ログ
            </h1>
            <p style={{ fontSize: "14px", color: "#64748B" }}>{logs.length}件のログが記録されています</p>
          </div>
          <Link href="/logs/new" style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "9px 18px", background: "#2F5EAA", color: "white",
            borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 600,
          }}>
            <PlusCircle size={15} /> 新しい記録を入力
          </Link>
        </div>

        {/* 勤務種別フィルター */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          {(["all", "day", "evening", "night", "early", "late", "other"] as const).map(s => (
            <button key={s} onClick={() => setFilterShift(s)} style={{
              padding: "5px 12px", borderRadius: "100px",
              border: `1.5px solid ${filterShift === s ? "#2F5EAA" : "#E2E8F0"}`,
              background: filterShift === s ? "#EEF3FB" : "#FFFFFF",
              color: filterShift === s ? "#2F5EAA" : "#64748B",
              fontSize: "12px", fontWeight: filterShift === s ? 600 : 400,
              cursor: "pointer",
            }}>
              {s === "all" ? "すべて" : SHIFT_TYPE_LABELS[s]}
            </button>
          ))}
        </div>

        <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "12px" }}>
          {filtered.length}件を表示
        </p>

        {/* ログカード */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8" }}>
            <FileText size={40} color="#E2E8F0" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>ログがありません</p>
            <p style={{ fontSize: "13px" }}>新しい記録を入力してください</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map(log => {
              const shiftStyle = SHIFT_COLORS[log.shiftType];
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} style={{
                  background: "#FFFFFF", border: "1px solid #E2E8F0",
                  borderRadius: "12px", overflow: "hidden",
                }}>
                  {/* ヘッダー */}
                  <div
                    style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "12px" }}
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    {/* 勤務種別バッジ */}
                    <div style={{
                      padding: "4px 10px", borderRadius: "100px",
                      background: shiftStyle.bg, color: shiftStyle.color,
                      border: `1px solid ${shiftStyle.border}`,
                      fontSize: "12px", fontWeight: 700, flexShrink: 0,
                      alignSelf: "flex-start", marginTop: "1px",
                    }}>
                      {SHIFT_TYPE_LABELS[log.shiftType]}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* メタ */}
                      <div style={{ display: "flex", gap: "12px", marginBottom: "5px", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748B" }}>
                          <User size={12} /> {log.author}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#94A3B8" }}>
                          <Clock size={12} /> {formatDate(log.createdAt)}
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748B" }}>
                          → <strong style={{ color: "#1E293B" }}>{log.nextAssignee}</strong>
                        </span>
                      </div>

                      {/* プレビュー */}
                      <p style={{
                        fontSize: "13px", color: "#64748B", lineHeight: 1.5,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {log.content}
                      </p>
                    </div>

                    {/* 右側 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <PriorityBadge priority={log.selfPriority} size="sm" />
                        {(log.handoverCount ?? 0) > 0 && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "3px",
                            fontSize: "11px", fontWeight: 600, color: "#0F766E",
                            background: "#EAF6F4", padding: "2px 8px", borderRadius: "100px",
                            border: "1px solid #BFE3DE",
                          }}>
                            <ClipboardList size={11} /> {log.handoverCount}件
                          </span>
                        )}
                      </div>
                      {isExpanded
                        ? <ChevronUp size={15} color="#94A3B8" />
                        : <ChevronDown size={15} color="#94A3B8" />}
                    </div>
                  </div>

                  {/* 展開 */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid #F1F5F9", padding: "16px" }}>
                      <p style={{ fontSize: "13px", color: "#1E293B", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {log.content}
                      </p>
                      <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                        <Link href="/handover" style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "6px 12px", background: "#EAF6F4", color: "#0F766E",
                          border: "1px solid #BFE3DE", borderRadius: "7px",
                          fontSize: "12px", fontWeight: 600, textDecoration: "none",
                        }}>
                          <ClipboardList size={13} /> このログの申し送りを見る
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
