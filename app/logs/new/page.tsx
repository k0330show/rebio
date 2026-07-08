"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { Priority, ShiftType, SHIFT_TYPE_LABELS, PRIORITY_LABELS, AudienceType, HandoverAudience, AUDIENCE_TYPE_LABELS } from "@/app/types";
import { saveCurrentLog, generateId, DEMO_USERS, DEMO_DEPARTMENTS, DEMO_ROLES, DEMO_SHIFT_TYPES, CURRENT_USER } from "@/app/lib/store";
import { FileText, User, AlertTriangle, ChevronRight, Info, Wand2, Zap, Users } from "lucide-react";

// ─── クイック入力テンプレート ─────────────────────────────────────────────────

const QUICK_TEMPLATES = [
  { label: "異常なし",     text: "巡回完了。大きな異常なし。\n備品残量確認済み。\n次シフトへの特記事項なし。" },
  { label: "巡回完了",     text: "定時巡回を全コース完了。\n各エリア異常なし。記録簿に記入済み。" },
  { label: "備品補充必要", text: "備品の在庫が少なくなっています。早めに補充・発注をお願いします。" },
  { label: "管理者報告必要", text: "本日の業務中に管理者への報告が必要な事項が発生しました。詳細を確認のうえ連絡をお願いします。" },
  { label: "次シフト確認", text: "次のシフトで確認・対応が必要な事項があります。以下をご確認ください。\n・" },
];

// ─── 業種別サンプルログ ───────────────────────────────────────────────────────

const SAMPLE_LOGS: { label: string; shiftType: ShiftType; content: string; nextAssignee: string; selfPriority: Priority }[] = [
  {
    label: "夜間巡回（施設）",
    shiftType: "night",
    content: "夜間巡回中、A入口の照明が点滅しているのを確認しました。明日の早番で状態を確認し、異常があれば設備管理へ連絡をお願いします。また、備品庫の使い捨て手袋（Mサイズ）が残り少なくなっています。週明けまでに発注をお願いします。利用者さまは全員落ち着いており、バイタルも問題ありません。",
    nextAssignee: "早川 みどり",
    selfPriority: "medium",
  },
  {
    label: "日勤終わり（警備）",
    shiftType: "day",
    content: "本日13時頃、北側駐車場で不審なバイクが長時間停車しているのを確認しました。声がけにより移動してもらいましたが、念のため記録しておきます。正面入口の自動ドアがやや反応遅れがあります。保守会社への点検依頼を出してください。巡回は全コース定刻通り完了、記録簿記入済みです。",
    nextAssignee: "中島 たけし",
    selfPriority: "high",
  },
  {
    label: "早番（小売・販売）",
    shiftType: "early",
    content: "朝の棚卸しで飲料コーナーのペットボトル水が品薄です。バックヤードに在庫がありますので、午前中に補充をお願いします。レジ2番のレシートペーパーが残り少なくなっています。交換用ロールはカウンター下の引き出しにあります。オープン作業は問題なく完了。",
    nextAssignee: "坂本 るり",
    selfPriority: "low",
  },
  {
    label: "日勤（物流・倉庫）",
    shiftType: "day",
    content: "午後の仕分け作業中、商品Aの出荷ラベルに印字ミスが3件見つかりました。該当商品は保留棚に移し、品質管理担当への確認依頼をお願いします。フォークリフト3号機のブレーキの効きが若干弱くなっています。点検が完了するまで使用を控えてください。本日の出荷は17時便まで全件完了しています。",
    nextAssignee: "富田 あいこ",
    selfPriority: "high",
  },
];

// ─── 重要度カラー ──────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { color: string; border: string; selectedBg: string; selectedBorder: string }> = {
  urgent: { color: "#C0392B", border: "#EFCCC6", selectedBg: "#FBEEEC", selectedBorder: "#C0392B" },
  high:   { color: "#B45309", border: "#F0DDBB", selectedBg: "#FDF6EC", selectedBorder: "#B45309" },
  medium: { color: "#8A8F98", border: "#E5E9EF", selectedBg: "#F8FAFC", selectedBorder: "#8A8F98" },
  low:    { color: "#64748B", border: "#E2E8F0", selectedBg: "#F8FAFC", selectedBorder: "#64748B" },
};

// ─── あいまい確認 ─────────────────────────────────────────────────────────────

function detectHints(content: string, nextAssignee: string): string[] {
  const hints: string[] = [];
  if (!nextAssignee.trim()) hints.push("次の担当者が未設定です。誰に引き継ぎますか？");
  if (/明日|翌日|次回/.test(content) && !/担当|お願い|確認して/.test(content))
    hints.push("「明日」という記述があります。担当者へのお願い事項を明記しましたか？");
  if (/報告|連絡/.test(content) && !/した|済|完了/.test(content))
    hints.push("報告・連絡が必要な可能性があります。報告済みかどうかを記載することをお勧めします。");
  return hints;
}

// ─── 送信対象チップ ヘルパー ───────────────────────────────────────────────────

function audienceChipStyle(selected: boolean): React.CSSProperties {
  return {
    padding: "5px 12px", borderRadius: "100px",
    border: `1.5px solid ${selected ? "#2F5EAA" : "#E2E8F0"}`,
    background: selected ? "#EEF3FB" : "#FFFFFF",
    color: selected ? "#2F5EAA" : "#475569",
    fontSize: "12px", fontWeight: selected ? 600 : 400, cursor: "pointer",
  };
}

// 同じtypeのaudienceに id をトグル追加/削除する。
// シンプルさを優先し、同一typeのaudienceは「id一つにつき1エントリ」として個別管理する。
function toggleAudienceChip(
  setAudiences: React.Dispatch<React.SetStateAction<HandoverAudience[]>>,
  type: AudienceType,
  id: string,
  label: string
) {
  setAudiences(prev => {
    const already = prev.some(a => a.type === type && a.ids.includes(id));
    if (already) {
      return prev.filter(a => !(a.type === type && a.ids.includes(id)));
    }
    return [...prev, { type, ids: [id], label }];
  });
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function LogNewPage() {
  const router = useRouter();
  const [shiftType, setShiftType]   = useState<ShiftType>("day");
  const [content, setContent]       = useState("");
  const [nextAssignee, setNextAssignee] = useState("");
  const [selfPriority, setSelfPriority] = useState<Priority>("medium");
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [showSamples, setShowSamples] = useState(false);
  const [showHints, setShowHints]   = useState(false);

  // v11: 送信対象（複数選択可）。デフォルトは「個人（次の担当者）」で現行の挙動を維持。
  const [audiences, setAudiences] = useState<HandoverAudience[]>([]);
  const [audienceTab, setAudienceTab] = useState<AudienceType>("user");

  const hints = detectHints(content, nextAssignee);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!content.trim()) e.content = "勤務内容を入力してください";
    else if (content.trim().length < 10) e.content = "10文字以上で入力してください";
    if (!nextAssignee.trim()) e.nextAssignee = "次の担当者名を入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // audiencesが未選択の場合は、既存の挙動どおり「次の担当者への個人宛て」として扱う
    const finalAudiences: HandoverAudience[] = audiences.length > 0
      ? audiences
      : [{ type: "user", ids: [], label: nextAssignee.trim() }];
    saveCurrentLog({
      id: generateId("log"), shiftType, content: content.trim(), nextAssignee: nextAssignee.trim(),
      selfPriority, createdAt: new Date().toISOString(), author: CURRENT_USER.name,
      audiences: finalAudiences,
    });
    router.push("/handover/review");
  };

  const applyTemplate = (text: string) => {
    setContent(prev => prev ? prev + "\n" + text : text);
    setErrors(e => ({ ...e, content: "" }));
  };

  const applySample = (idx: number) => {
    const s = SAMPLE_LOGS[idx];
    setShiftType(s.shiftType);
    setContent(s.content);
    setNextAssignee(s.nextAssignee);
    setSelfPriority(s.selfPriority);
    setErrors({});
    setShowSamples(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />

      <div style={{ maxWidth: "660px", margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>

        {/* ページヘッダー */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.4px", marginBottom: "4px" }}>
            勤務を記録する
          </h1>
          <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>
            引き継ぎ内容を入力してください。Rebioが申し送り候補を整理します。
          </p>
        </div>

        {/* ── クイック入力 ── */}
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "7px", display: "flex", alignItems: "center", gap: "5px" }}>
            <Zap size={11} /> クイック入力
          </p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {QUICK_TEMPLATES.map(t => (
              <button key={t.label} onClick={() => applyTemplate(t.text)} style={{
                padding: "5px 12px", borderRadius: "100px",
                border: "1px solid #E2E8F0", background: "#FFFFFF",
                fontSize: "12px", color: "#475569", cursor: "pointer",
                transition: "background 0.1s, border-color 0.1s",
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "#EEF3FB"; el.style.borderColor = "#2F5EAA"; el.style.color = "#2F5EAA"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "#FFFFFF"; el.style.borderColor = "#E2E8F0"; el.style.color = "#475569"; }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── フォーム ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", marginBottom: "12px" }}>

          {/* 勤務種別 */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px", marginBottom: "9px" }}>
              <FileText size={11} /> 勤務種別
            </label>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {(Object.entries(SHIFT_TYPE_LABELS) as [ShiftType, string][]).map(([v, label]) => (
                <button key={v} onClick={() => setShiftType(v)} style={{
                  padding: "5px 13px", borderRadius: "7px",
                  border: `1.5px solid ${shiftType === v ? "#2F5EAA" : "#E2E8F0"}`,
                  background: shiftType === v ? "#EEF3FB" : "#F7F8FA",
                  color: shiftType === v ? "#2F5EAA" : "#64748B",
                  fontSize: "13px", fontWeight: shiftType === v ? 600 : 400, cursor: "pointer",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* 本文 */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px", marginBottom: "7px" }}>
              <FileText size={11} /> 勤務内容・引き継ぎ事項 <span style={{ color: "#C0392B" }}>*</span>
            </label>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); if (errors.content) setErrors(p => ({ ...p, content: "" })); setShowHints(true); }}
              rows={9}
              placeholder="起きた出来事、対応した内容、次の担当者へ伝えたいことを記入してください&#10;&#10;例：夜間巡回中、A入口の照明が点滅しているのを確認しました。明日の早番で確認をお願いします。備品庫の手袋が残り少ないです。"
              style={{
                width: "100%", padding: "12px 14px",
                border: `1.5px solid ${errors.content ? "#C0392B" : "#E2E8F0"}`,
                borderRadius: "10px", fontSize: "14px", color: "#1E293B",
                lineHeight: 1.8, resize: "vertical", outline: "none", fontFamily: "inherit",
                background: errors.content ? "#FBEEEC" : "#FFFFFF",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={e => {
                if (!errors.content) {
                  e.target.style.borderColor = "#2F5EAA";
                  e.target.style.boxShadow = "0 0 0 3px rgba(47,94,170,0.10)";
                }
              }}
              onBlur={e => {
                if (!errors.content) {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }
              }}
            />
            {errors.content && (
              <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
                <AlertTriangle size={12} /> {errors.content}
              </p>
            )}
            <p style={{ fontSize: "11px", color: "#CBD5E1", marginTop: "4px", textAlign: "right" }}>{content.length}文字</p>
          </div>

          {/* 次の担当者 */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px", marginBottom: "9px" }}>
              <User size={11} /> 次の担当者 <span style={{ color: "#C0392B" }}>*</span>
            </label>
            <input
              type="text"
              value={nextAssignee}
              onChange={e => { setNextAssignee(e.target.value); if (errors.nextAssignee) setErrors(p => ({ ...p, nextAssignee: "" })); setShowHints(true); }}
              placeholder="例：山田 太郎"
              style={{
                width: "100%", padding: "10px 13px",
                border: `1.5px solid ${errors.nextAssignee ? "#C0392B" : "#E2E8F0"}`,
                borderRadius: "10px", fontSize: "14px", color: "#1E293B", outline: "none", fontFamily: "inherit",
                background: errors.nextAssignee ? "#FBEEEC" : "#FFFFFF",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={e => {
                if (!errors.nextAssignee) {
                  e.target.style.borderColor = "#2F5EAA";
                  e.target.style.boxShadow = "0 0 0 3px rgba(47,94,170,0.10)";
                }
              }}
              onBlur={e => {
                if (!errors.nextAssignee) {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }
              }}
            />
            {errors.nextAssignee && (
              <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
                <AlertTriangle size={12} /> {errors.nextAssignee}
              </p>
            )}
          </div>

          {/* 重要度 */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px", marginBottom: "9px" }}>
              <AlertTriangle size={11} /> 重要度（自己申告）
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
              {(["urgent","high","medium","low"] as Priority[]).map(p => {
                const c = PRIORITY_CONFIG[p];
                const sel = selfPriority === p;
                return (
                  <button key={p} onClick={() => setSelfPriority(p)} style={{
                    padding: "9px 8px",
                    border: `1.5px solid ${sel ? c.selectedBorder : c.border}`,
                    borderRadius: "8px", background: sel ? c.selectedBg : "#F7F8FA",
                    color: c.color, fontSize: "13px", fontWeight: sel ? 700 : 500, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                  }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", border: `2px solid ${c.color}`, background: sel ? c.color : "transparent", flexShrink: 0 }} />
                    {PRIORITY_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 送信対象 */}
          <div style={{ padding: "16px 20px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
              <Users size={11} /> 誰に共有しますか？
            </label>
            <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "9px" }}>
              未選択の場合は「次の担当者」への個人宛てとして共有されます
            </p>

            {/* タイプ切り替えタブ */}
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
              {(Object.keys(AUDIENCE_TYPE_LABELS) as AudienceType[]).map(t => (
                <button key={t} onClick={() => setAudienceTab(t)} style={{
                  padding: "5px 12px", borderRadius: "100px",
                  border: `1.5px solid ${audienceTab === t ? "#2F5EAA" : "#E2E8F0"}`,
                  background: audienceTab === t ? "#EEF3FB" : "#FFFFFF",
                  color: audienceTab === t ? "#2F5EAA" : "#64748B",
                  fontSize: "12px", fontWeight: audienceTab === t ? 600 : 400, cursor: "pointer",
                }}>
                  {AUDIENCE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {/* タイプごとの選択肢チップ */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
              {audienceTab === "all" && (
                <button
                  onClick={() => setAudiences(prev => {
                    const exists = prev.some(a => a.type === "all");
                    if (exists) return prev.filter(a => a.type !== "all");
                    return [...prev, { type: "all", ids: [], label: "全体" }];
                  })}
                  style={audienceChipStyle(audiences.some(a => a.type === "all"))}
                >
                  全体に共有する
                </button>
              )}
              {audienceTab === "department" && DEMO_DEPARTMENTS.map(d => {
                const selected = audiences.some(a => a.type === "department" && a.ids.includes(d.id));
                return (
                  <button key={d.id} onClick={() => toggleAudienceChip(setAudiences, "department", d.id, d.name)} style={audienceChipStyle(selected)}>
                    {d.name}
                  </button>
                );
              })}
              {audienceTab === "user" && DEMO_USERS.map(u => {
                const selected = audiences.some(a => a.type === "user" && a.ids.includes(u.id));
                return (
                  <button key={u.id} onClick={() => toggleAudienceChip(setAudiences, "user", u.id, u.name)} style={audienceChipStyle(selected)}>
                    {u.name}
                  </button>
                );
              })}
              {audienceTab === "role" && DEMO_ROLES.map(r => {
                const selected = audiences.some(a => a.type === "role" && a.ids.includes(r.id));
                return (
                  <button key={r.id} onClick={() => toggleAudienceChip(setAudiences, "role", r.id, r.name)} style={audienceChipStyle(selected)}>
                    {r.name}
                  </button>
                );
              })}
              {audienceTab === "shift" && DEMO_SHIFT_TYPES.map(s => {
                const selected = audiences.some(a => a.type === "shift" && a.ids.includes(s.id));
                return (
                  <button key={s.id} onClick={() => toggleAudienceChip(setAudiences, "shift", s.id, s.label)} style={audienceChipStyle(selected)}>
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* 選択済み対象の表示 */}
            {audiences.length > 0 && (
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", padding: "9px 11px", background: "#F7F8FA", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "#94A3B8", marginRight: "2px" }}>選択中：</span>
                {audiences.map((a, i) => (
                  <span key={`${a.type}-${a.label}-${i}`} style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "2px 8px", borderRadius: "100px",
                    background: "#EEF3FB", border: "1px solid #C9DAF1",
                    color: "#2F5EAA", fontSize: "11px", fontWeight: 500,
                  }}>
                    {a.label}
                    <span
                      onClick={() => setAudiences(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ cursor: "pointer", fontWeight: 700 }}
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── あいまい確認ヒント ── */}
        {showHints && hints.length > 0 && (
          <div style={{ background: "#FDF6EC", border: "1px solid #F0DDBB", borderRadius: "10px", padding: "12px 14px", marginBottom: "10px" }}>
            {hints.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: "7px", alignItems: "flex-start", marginBottom: i < hints.length - 1 ? "6px" : 0 }}>
                <Info size={13} color="#B45309" style={{ flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "12px", color: "#78350F", lineHeight: 1.6 }}>{h}</p>
              </div>
            ))}
          </div>
        )}

        {/* サンプル選択 */}
        <div style={{ marginBottom: "10px" }}>
          <button onClick={() => setShowSamples(!showSamples)} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0",
            borderRadius: "7px", cursor: "pointer", fontSize: "12px", color: "#64748B",
          }}>
            <Wand2 size={13} /> 業種別サンプルを使う
          </button>
          {showSamples && (
            <div style={{ marginTop: "7px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
              {SAMPLE_LOGS.map((s, i) => (
                <button key={i} onClick={() => applySample(i)} style={{
                  display: "flex", alignItems: "flex-start", gap: "10px", width: "100%",
                  padding: "11px 14px", background: "none", border: "none",
                  borderBottom: i < SAMPLE_LOGS.length - 1 ? "1px solid #F1F5F9" : "none",
                  cursor: "pointer", textAlign: "left",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F7F8FA")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.selfPriority === "high" ? "#B45309" : "#CBD5E1", flexShrink: 0, marginTop: "5px" }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", marginBottom: "2px" }}>{s.label}</p>
                    <p style={{ fontSize: "12px", color: "#64748B" }}>{s.content.slice(0, 55)}…</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ヒント */}
        <div style={{ display: "flex", gap: "8px", padding: "11px 14px", background: "#EEF3FB", border: "1px solid #C9DAF1", borderRadius: "9px", marginBottom: "14px" }}>
          <Info size={14} color="#2F5EAA" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "12px", color: "#2F5EAA", lineHeight: 1.6 }}>
            次の画面でRebioが申し送り候補を整理します。内容は候補であり、担当者が確認・修正してから共有されます。
          </p>
        </div>

        {/* 送信ボタン */}
        <button onClick={handleSubmit} style={{
          width: "100%", padding: "13px 20px",
          background: "#2F5EAA", color: "white", border: "none",
          borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
        }}>
          Rebioで整理する
          <ChevronRight size={17} />
        </button>

      </div>
    </div>
  );
}
