"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import {
  FileText, ClipboardList, CheckSquare, FolderOpen,
  ShieldCheck, ChevronRight, ArrowRight, Sparkles,
  Zap, CheckCheck, AlertTriangle, PlusCircle,
  BookOpen, Users, MessageCircle,
} from "lucide-react";

// ─── セクションヘッダー ───────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.3px", marginBottom: "12px" }}>
      {children}
    </h2>
  );
}

// ─── フィーチャーカード ───────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent }: {
  icon: React.ReactNode; title: string; desc: string; accent: string;
}) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "16px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>{title}</p>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── ページ案内カード ─────────────────────────────────────────────────────────
function PageCard({ href, icon, title, desc, label, accent }: {
  href: string; icon: React.ReactNode; title: string; desc: string; label: string; accent: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          padding: "18px 20px",
          height: "100%",
          transition: "box-shadow 0.15s, border-color 0.15s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "0 2px 8px rgba(15,23,42,0.06)";
          el.style.borderColor = accent;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "none";
          el.style.borderColor = "#E2E8F0";
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
          <span style={{ fontSize: "11px", fontWeight: 600, color: accent, background: `${accent}14`, padding: "2px 8px", borderRadius: "100px" }}>
            {label}
          </span>
        </div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>{title}</p>
        <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.5, marginBottom: "10px" }}>{desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: accent, fontWeight: 600 }}>
          開く <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}

// ─── 安全設計ステップ ─────────────────────────────────────────────────────────
function SafetyStep({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%",
        background: "#EEF3FB", border: "2px solid #C9DAF1",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: "13px", fontWeight: 800, color: "#2F5EAA",
      }}>
        {num}
      </div>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "2px" }}>{title}</p>
        <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────
export default function DemoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>

        {/* ── ヒーロー ── */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "13px",
          padding: "40px 40px 36px",
          marginBottom: "32px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "280px", height: "280px", background: "radial-gradient(circle, rgba(47,94,170,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Sparkles size={15} color="#2F5EAA" />
              <span style={{ fontSize: "12px", color: "#2F5EAA", fontWeight: 600, letterSpacing: "0.5px" }}>
                ポートフォリオ・デモアプリ
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.8px", lineHeight: 1.2, marginBottom: "14px" }}>
              仕事の流れと責任の所在を、<br />見える化する。
            </h1>
            <p style={{ fontSize: "16px", color: "#64748B", lineHeight: 1.7, maxWidth: "620px", marginBottom: "24px" }}>
              Rebioは、記録・申し送り・タスク・書類・コメントをつなげることで、
              業務上の情報が誰に渡り、どこで止まり、どのように対応されたかを確認できる
              業務共有SaaSのデモMVPです。
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Link href="/logs/new" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "#2F5EAA", color: "white", border: "none", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                <PlusCircle size={14} /> 勤務ログを作成して試す
              </Link>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "#F7F8FA", color: "#1E293B", border: "1px solid #E2E8F0", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}>
                ダッシュボードを見る <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 開発背景 ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "28px 32px", marginBottom: "24px" }}>
          <SectionTitle>なぜ作ったか</SectionTitle>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.85, marginBottom: "16px" }}>
            医療・介護・警備・小売・物流など、シフト制で動く現場では、
            口頭・紙・チャット・ファイル共有など、複数の方法で情報がやり取りされています。
            その一方で、重要な情報が次の担当者に正しく伝わらなかったり、
            記録は残っていても誰が対応するのかが曖昧になったりする課題があります。
          </p>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.85 }}>
            Rebioは、記録を残すだけでなく、申し送り・タスク・書類・コメントをつなげて、
            業務の経緯を追いやすくすることを目的に設計しました。
            「誰が確認したか」「誰が対応するか」「何を根拠に判断したか」を確認しやすくし、
            引き継ぎの抜け漏れを減らすことを目指しています。
          </p>
        </div>

        {/* ── 想定ユーザー ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "28px 32px", marginBottom: "24px" }}>
          <SectionTitle>想定ユーザーと使用場面</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {[
              { emoji: "🏥", label: "医療・介護施設", desc: "利用者の状態変化、与薬、ケア記録" },
              { emoji: "🔒", label: "警備・施設管理", desc: "巡回記録、不審者対応、設備異常" },
              { emoji: "🛒", label: "小売・販売", desc: "在庫補充、レジ状況、クレーム記録" },
              { emoji: "📦", label: "物流・倉庫", desc: "出荷状況、設備点検、ピッキング" },
              { emoji: "🍽️", label: "飲食・清掃", desc: "営業記録、清掃チェック、設備報告" },
              { emoji: "🏢", label: "一般事務", desc: "業務引き継ぎ、連絡事項、次の行動の共有" },
            ].map(({ emoji, label, desc }) => (
              <div key={label} style={{ padding: "14px", background: "#F7F8FA", borderRadius: "9px", border: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: "20px", marginBottom: "6px" }}>{emoji}</p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>{label}</p>
                <p style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 主な機能 ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "28px 32px", marginBottom: "24px" }}>
          <SectionTitle>主な機能</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <FeatureCard
              icon={<FileText size={18} color="#2F5EAA" />}
              accent="#2F5EAA"
              title="勤務ログ入力・整理"
              desc="現場スタッフが勤務内容を入力すると、Rebioが申し送り候補をカテゴリ・重要度・信頼度付きで整理します。"
            />
            <FeatureCard
              icon={<CheckCheck size={18} color="#0F766E" />}
              accent="#0F766E"
              title="整理候補は確認してから登録"
              desc="生成された内容は候補として扱います。担当者が確認・修正・不要の判断をしてから登録する設計です。"
            />
            <FeatureCard
              icon={<ClipboardList size={18} color="#6D4FC2" />}
              accent="#6D4FC2"
              title="申し送りの性質を分けて表示"
              desc="共有事項・確認してほしい・対応が必要、の3種類を区別します。対応欄やステータスは必要な場合に分かりやすく表示します。"
            />
            <FeatureCard
              icon={<Users size={18} color="#2F5EAA" />}
              accent="#2F5EAA"
              title="共有先を指定できる"
              desc="全体・部署・個人・役職・シフトから共有先を指定できます。既読・確認は件数で集計し、確認状況を把握できます。"
            />
            <FeatureCard
              icon={<MessageCircle size={18} color="#0F766E" />}
              accent="#0F766E"
              title="コメントで経過を残せる"
              desc="「確認しました」「明日対応します」など、申し送りに対する補足を残せます。会話よりも業務の経緯を残すことを重視しています。"
            />
            <FeatureCard
              icon={<CheckSquare size={18} color="#B45309" />}
              accent="#B45309"
              title="対応が必要なものだけタスク化"
              desc="すべての申し送りをタスクにするのではなく、対応が必要な内容だけをタスクとして扱います。"
            />
            <FeatureCard
              icon={<FolderOpen size={18} color="#8A8F98" />}
              accent="#8A8F98"
              title="書類はシンプルに管理"
              desc="PDF・Excel・Word・PowerPoint・CSV・画像を一覧・選択・プレビューできます。カテゴリやタグは現場に合わせて自由に使えます。"
            />
          </div>
        </div>

        {/* ── 安全設計 ── */}
        <div style={{ background: "#EEF3FB", border: "1px solid #C9DAF1", borderRadius: "12px", padding: "28px 32px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <ShieldCheck size={22} color="#2F5EAA" />
            <SectionTitle>候補生成ロジックを使う上での安全設計</SectionTitle>
          </div>
          <p style={{ fontSize: "14px", color: "#2F5EAA", lineHeight: 1.7, marginBottom: "20px" }}>
            Rebioでは、システムが作成した候補をそのまま確定するのではなく、必ず人が確認してから登録する設計にしています。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <SafetyStep
              num="1"
              title="システムは候補を提示するだけ"
              desc="生成された申し送りはすべて整理候補として扱い、正式登録前に担当者が確認します。"
            />
            <SafetyStep
              num="2"
              title="重要な項目は確認必須"
              desc="重要度が高い項目や、信頼度が低い項目は、確認なしでは登録できない仕組みにしています。"
            />
            <SafetyStep
              num="3"
              title="元ログの根拠を表示"
              desc="各候補に、元ログのどの部分から抽出したかを表示し、内容を確認できるようにしています。"
            />
            <SafetyStep
              num="4"
              title="確認時間が短すぎる場合は警告"
              desc="ページを開いて30秒未満で登録しようとした場合、確認時間に関する警告を表示します。"
            />
            <SafetyStep
              num="5"
              title="断定的な表現を避ける"
              desc="「判断しました」ではなく「候補を作成しました」「確認してください」という表現に寄せています。"
            />
          </div>
        </div>

        {/* ── Library設計意図 ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "28px 32px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <BookOpen size={20} color="#B45309" />
            <SectionTitle>書類ライブラリの設計意図</SectionTitle>
          </div>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.85, marginBottom: "12px" }}>
            Rebioの書類機能は、業務で使う資料を申し送りやタスクと一緒に確認しやすくするためのものです。
            左にカテゴリ、中央にファイル一覧、右に選択中ファイルの詳細を表示するエクスプローラー型の画面にしています。
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {[
              {
                title: "用途を限定しすぎない",
                desc: "点検表・マニュアル・報告書など、現場ごとに自由に使えるようにしています。",
              },
              {
                title: "必要な時だけ紐づける",
                desc: "書類は申し送り・タスクと紐づけできますが、必須ではありません。単なるファイル置き場としても使えます。",
              },
              {
                title: "一覧性を重視する",
                desc: "ファイル一覧の右側に選択中ファイルの簡易プレビューを表示し、探しやすさを優先しています。",
              },
              {
                title: "複数形式を想定する",
                desc: "PDF・Excel・Word・PowerPoint・CSV・画像に対応したデモ用プレビューを用意しています。",
              },
            ].map(({ title, desc }) => (
              <div key={title} style={{ padding: "14px", background: "#F7F8FA", borderRadius: "9px", border: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>{title}</p>
                <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 画面案内 ── */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.3px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={18} color="#8A8F98" /> デモの流れを体験する
          </h2>
          <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "14px" }}>
            記録する → 整理する → 必要な相手に共有する → 確認・対応する → 履歴として残す
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            <PageCard
              href="/logs/new"
              icon={<PlusCircle size={18} color="#2F5EAA" />}
              accent="#2F5EAA"
              label="記録する"
              title="勤務ログを入力"
              desc="サンプルボタンで即体験。業種別サンプルログを選んで、整理候補の生成フローを確認できます。"
            />
            <PageCard
              href="/handover/review"
              icon={<CheckCheck size={18} color="#0F766E" />}
              accent="#0F766E"
              label="整理する"
              title="整理候補を確認"
              desc="作成された候補を確認。重要度・信頼度・元ログを見ながら、確認済み・修正する・不要を選択できます。"
            />
            <PageCard
              href="/handover"
              icon={<ClipboardList size={18} color="#6D4FC2" />}
              accent="#6D4FC2"
              label="共有・確認する"
              title="申し送りを確認"
              desc="共有事項・確認してほしい・対応が必要、の3種類を区別して表示します。"
            />
            <PageCard
              href="/tasks"
              icon={<CheckSquare size={18} color="#B45309" />}
              accent="#B45309"
              label="対応する"
              title="次の行動を確認"
              desc="対応が必要な申し送りから作成されたタスクを確認できます。期限や進み具合も見られます。"
            />
            <PageCard
              href="/library"
              icon={<FolderOpen size={18} color="#8A8F98" />}
              accent="#8A8F98"
              label="資料を見る"
              title="書類"
              desc="エクスプローラー型の一覧で、業務に関係する書類を確認できます。"
            />
            <PageCard
              href="/logs"
              icon={<FileText size={18} color="#64748B" />}
              accent="#64748B"
              label="振り返る"
              title="勤務ログ一覧"
              desc="過去のログを勤務種別でフィルタリングし、生成された申し送り件数も確認できます。"
            />
          </div>
        </div>

        {/* ── デモMVPとしての位置づけ ── */}
        <div style={{ padding: "20px 24px", background: "#EEF3FB", border: "1px solid #C9DAF1", borderRadius: "12px", marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", color: "#2F5EAA", lineHeight: 1.8 }}>
            現在の公開デモはlocalStorageベースで動作します。
            認証・チーム管理・クラウドDB保存・権限管理などは、実運用に向けた今後の拡張想定です。
            候補生成はルールベースのキーワードマッチングで実装しており、将来的にはLLMとの接続により、
            より柔軟な候補整理へ拡張する想定です。
          </p>
        </div>

        {/* ── デモ注意書き ── */}
        <div style={{ padding: "20px 24px", background: "#FDF6EC", border: "1px solid #F0DDBB", borderRadius: "12px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <AlertTriangle size={18} color="#B45309" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#92400E", marginBottom: "6px" }}>デモアプリについて</p>
              <ul style={{ fontSize: "13px", color: "#78350F", lineHeight: 1.8, paddingLeft: "0", listStyle: "none" }}>
                <li>• localStorageモードでは、データはブラウザ内に保存されます（サーバー送信なし）</li>
                <li>• 実在する個人・企業・施設のデータは一切含まれていません</li>
                <li>• 本番環境での実運用データの取り扱いには対応していません</li>
                <li>• 現在の候補生成はルールベースのキーワードマッチングで実装しています</li>
                <li>• ページを更新してもデータは保持されます。リセットしたい場合はブラウザのストレージをクリアしてください</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── 技術スタック ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "28px 32px", marginBottom: "24px" }}>
          <SectionTitle>使用技術</SectionTitle>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { label: "Next.js 16", color: "#1E293B", bg: "#F1F5F9" },
              { label: "TypeScript 5", color: "#2F5EAA", bg: "#EEF3FB" },
              { label: "Tailwind CSS 4", color: "#0F766E", bg: "#EAF6F4" },
              { label: "lucide-react", color: "#6D4FC2", bg: "#F2EFFB" },
              { label: "App Router", color: "#B45309", bg: "#FDF6EC" },
              { label: "localStorage", color: "#64748B", bg: "#F8FAFC" },
              { label: "ルールベース候補生成", color: "#8A8F98", bg: "#F8FAFC" },
            ].map(({ label, color, bg }) => (
              <span key={label} style={{ padding: "5px 12px", borderRadius: "100px", background: bg, color, fontSize: "12px", fontWeight: 600 }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── 今後の拡張 ── */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "28px 32px" }}>
          <SectionTitle>今後の拡張予定</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                title: "LLMによる申し送り整理",
                desc: "現在はルールベース実装。Claude APIなどの実際のLLMと接続して、より柔軟な候補整理を実現します。",
              },
              {
                title: "ユーザー認証・チーム管理",
                desc: "実際の業務利用に向けて、スタッフのログイン・ロール管理・チーム別データ分離を実装します。",
              },
              {
                title: "クラウドDB保存の本実装",
                desc: "Supabase移行を見据えた設計をもとに、申し送り・タスク・書類データのクラウド保存を実装します。",
              },
              {
                title: "実運用向けのファイル管理",
                desc: "Storage連携、権限管理、プレビュー範囲の拡張など、実運用に必要な書類管理機能を強化します。",
              },
              {
                title: "モバイル最適化",
                desc: "現場スタッフがスマートフォンから記録・確認しやすいよう、PWA対応やモバイルUIの改善を進めます。",
              },
              {
                title: "通知・リマインダー",
                desc: "未対応の申し送りや期限超過タスクを、プッシュ通知・メール通知で知らせる仕組みを追加します。",
              },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display: "flex", gap: "10px", padding: "12px 14px", background: "#F7F8FA", border: "1px solid #F1F5F9", borderRadius: "8px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2F5EAA", flexShrink: 0, marginTop: "6px" }} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "2px" }}>{title}</p>
                  <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}