"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, FileText, ClipboardList, FolderOpen, Settings, PlusCircle,
} from "lucide-react";
import { colors, radius } from "@/app/lib/theme";
import { CURRENT_USER } from "@/app/lib/store";
import { getDataMode } from "@/app/lib/dataMode";

const NAV_ITEMS = [
  { href: "/",         label: "ホーム",   icon: Home },
  { href: "/logs",     label: "記録",     icon: FileText },
  { href: "/handover", label: "申し送り", icon: ClipboardList },
  { href: "/library",  label: "書類",     icon: FolderOpen },
];

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav style={{
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(6px)",
      borderBottom: `1px solid ${colors.border}`,
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: "0 1.5rem",
        display: "flex", alignItems: "center", height: "56px", gap: "4px",
      }}>
        {/* ロゴ */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", marginRight: "14px", flexShrink: 0 }}>
          <div style={{
            width: "26px", height: "26px",
            background: colors.brand,
            borderRadius: radius.sm,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={14} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "15px", color: colors.text, letterSpacing: "-0.3px" }}>
            Rebio
          </span>
        </Link>

        {/* メインナビ */}
        <div style={{ display: "flex", gap: "2px", flex: 1 }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 12px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: active ? 600 : 400,
                color: active ? colors.brand : colors.textSub,
                borderBottom: `2px solid ${active ? colors.brand : "transparent"}`,
                transition: "color 0.15s, border-color 0.15s",
                whiteSpace: "nowrap",
              }}>
                <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* 右端：設定・記録ボタン・ユーザー */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <Link href="/demo" style={{
            padding: "5px 8px",
            textDecoration: "none", fontSize: "12px", color: colors.textFaint,
            whiteSpace: "nowrap",
          }}>
            デモについて
          </Link>
          <Link href="/logs/new" style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "7px 14px",
            background: colors.brand, color: "white",
            borderRadius: radius.sm, textDecoration: "none",
            fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap",
          }}>
            <PlusCircle size={13} />
            記録する
          </Link>
          <Link href="/settings" style={{
            width: "30px", height: "30px",
            background: colors.bgSubtle,
            border: `1px solid ${colors.border}`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none",
          }}>
            <Settings size={13} color={colors.textSub} />
          </Link>
          <Link href="/login" title={`${CURRENT_USER.name}（${getDataMode() === "local" ? "デモモード" : "Supabaseモード"}） / ログイン画面へ`} style={{
            display: "flex", alignItems: "center", gap: "6px", textDecoration: "none",
          }}>
            <div style={{
              width: "28px", height: "28px",
              background: colors.brandSoft,
              border: `1px solid ${colors.brandBorder}`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, color: colors.brand,
              flexShrink: 0,
            }}>
              {CURRENT_USER.name.charAt(0)}
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
