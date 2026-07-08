"use client";

import Navbar from "@/app/components/Navbar";
import { ShieldCheck, Database, User, Bell, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA" }}>
      <Navbar />
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.4px", marginBottom: "4px" }}>設定</h1>
        <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "24px" }}>デモ版では設定の変更は保存されません</p>

        {[
          { icon: User, title: "プロフィール", desc: "氏名・部署・担当シフトの設定", tag: "デモ" },
          { icon: Bell, title: "通知", desc: "未対応の申し送り・期限切れタスクの通知設定", tag: "デモ" },
          { icon: Palette, title: "表示", desc: "ダッシュボードの表示項目・テーマの設定", tag: "デモ" },
          { icon: Database, title: "データについて", desc: "デモデータのリセット・エクスポート", tag: "デモ" },
          { icon: ShieldCheck, title: "安全設計について", desc: "整理候補と確認フローに関する説明", tag: "" },
        ].map(({ icon: Icon, title, desc, tag }) => (
          <div key={title} style={{
            display: "flex", gap: "14px", alignItems: "center",
            padding: "14px 16px",
            background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px",
            marginBottom: "8px",
          }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={17} color="#64748B" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>{title}</p>
              <p style={{ fontSize: "12px", color: "#94A3B8" }}>{desc}</p>
            </div>
            {tag && (
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#94A3B8", background: "#F1F5F9", padding: "2px 7px", borderRadius: "100px" }}>
                {tag}
              </span>
            )}
          </div>
        ))}

        <div style={{ marginTop: "24px", padding: "16px 18px", background: "#EEF3FB", border: "1px solid #C9DAF1", borderRadius: "10px", display: "flex", gap: "10px" }}>
          <ShieldCheck size={16} color="#2F5EAA" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "12px", color: "#2F5EAA", lineHeight: 1.7 }}>
            Rebioはデモアプリケーションです。すべてのデータはブラウザのlocalStorageに保存され、サーバーへは送信されません。リセットしたい場合はブラウザのDevTools &gt; Application &gt; LocalStorageからクリアしてください。
          </p>
        </div>
      </div>
    </div>
  );
}
