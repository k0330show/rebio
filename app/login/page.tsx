"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDataMode } from "@/app/lib/dataMode";
import { CURRENT_USER } from "@/app/lib/store";
import { LogIn, Mail, ShieldCheck, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const mode = getDataMode();

  const handleDemoContinue = () => {
    router.push("/");
  };

  const handleSupabaseLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Supabaseモードでの実ログイン処理はここに実装する（v13時点ではUIの土台のみ）。
    // 実装時は supabase.auth.signInWithOtp や signInWithOAuth を呼び出す想定。
    router.push("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "40px", height: "40px", background: "#2F5EAA", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          }}>
            <LogIn size={20} color="white" />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.4px" }}>Rebioにログイン</h1>
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>現場の引き継ぎを次の行動につなげる</p>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "13px", padding: "24px" }}>
          {mode === "local" ? (
            <>
              <div style={{ display: "flex", gap: "8px", padding: "11px 14px", background: "#EEF3FB", border: "1px solid #C9DAF1", borderRadius: "9px", marginBottom: "18px" }}>
                <Info size={14} color="#2F5EAA" style={{ flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "12px", color: "#2F5EAA", lineHeight: 1.6 }}>
                  現在はlocalStorageデモモードです。Supabase未設定のため、ログイン不要でデモユーザー「{CURRENT_USER.name}」として利用できます。
                </p>
              </div>
              <button
                onClick={handleDemoContinue}
                style={{
                  width: "100%", padding: "11px", background: "#2F5EAA", color: "white",
                  border: "none", borderRadius: "9px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                }}
              >
                デモユーザーとして続ける
              </button>
            </>
          ) : (
            <form onSubmit={handleSupabaseLogin}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "6px" }}>
                メールアドレス
              </label>
              <div style={{ position: "relative", marginBottom: "14px" }}>
                <Mail size={14} color="#94A3B8" style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: "100%", padding: "9px 12px 9px 32px",
                    border: "1.5px solid #E2E8F0", borderRadius: "8px",
                    fontSize: "14px", color: "#1E293B", outline: "none",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: "100%", padding: "11px", background: "#2F5EAA", color: "white",
                  border: "none", borderRadius: "9px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                }}
              >
                続ける（ログイン処理は今後実装予定）
              </button>
            </form>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "14px", padding: "10px 14px", background: "#F8FAFC", border: "1px solid #E5E9EF", borderRadius: "9px" }}>
          <ShieldCheck size={13} color="#94A3B8" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.6 }}>
            Rebioはデモアプリです。認証情報は実際には送信されません。詳しくは<Link href="/demo" style={{ color: "#2F5EAA" }}>デモについて</Link>をご覧ください。
          </p>
        </div>
      </div>
    </div>
  );
}
