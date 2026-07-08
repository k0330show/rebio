"use client";

import { Loader2 } from "lucide-react";

// v15: 各ページのマウント前に一瞬表示される軽量なローディング表示。
// Navbarは表示せず、中央にスピナーのみを出す最小限の実装にとどめる。
export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: "#F7F8FA",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Loader2 size={22} color="#94A3B8" className="animate-spin" />
    </div>
  );
}
