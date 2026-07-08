"use client";

import { LibraryMockContent } from "@/app/types";
import { FileText, Table, Image as ImageIcon } from "lucide-react";

// /library の右側詳細ペイン用の軽量プレビュー。
// /library/[id] のような大画面プレビューではなく、選択中ファイルの
// 中身がひと目で分かる程度のコンパクトな表示にとどめる。
export default function DocPreviewCompact({ content }: { content: LibraryMockContent }) {
  switch (content.type) {
    case "pdf":
      return (
        <div style={{ background: "#F7F8FA", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <FileText size={13} color="#94A3B8" />
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{content.pageCount}ページ中 1ページ目</span>
          </div>
          <p style={{
            fontSize: "12px", color: "#475569", lineHeight: 1.7,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 6, WebkitBoxOrient: "vertical",
            whiteSpace: "pre-wrap",
          }}>
            {content.pages[0] ?? "（内容なし）"}
          </p>
        </div>
      );

    case "excel": {
      const sheet = content.sheets[0];
      if (!sheet) return null;
      return (
        <div style={{ background: "#F7F8FA", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px", overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Table size={13} color="#94A3B8" />
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>シート「{sheet.name}」・全{content.sheets.length}シート</span>
          </div>
          <table style={{ borderCollapse: "collapse", fontSize: "11px", width: "100%" }}>
            <thead>
              <tr>
                {sheet.headers.map((h, i) => (
                  <th key={i} style={{ border: "1px solid #E2E8F0", padding: "4px 8px", background: "#F1F5F9", textAlign: "left", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.slice(0, 4).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ border: "1px solid #E2E8F0", padding: "4px 8px", color: "#1E293B", whiteSpace: "nowrap" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {sheet.rows.length > 4 && (
            <p style={{ fontSize: "10px", color: "#CBD5E1", marginTop: "6px" }}>他 {sheet.rows.length - 4} 行</p>
          )}
        </div>
      );
    }

    case "csv":
      return (
        <div style={{ background: "#F7F8FA", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px", overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Table size={13} color="#94A3B8" />
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{content.headers.length}列 × {content.rows.length}行</span>
          </div>
          <table style={{ borderCollapse: "collapse", fontSize: "11px", width: "100%" }}>
            <thead>
              <tr>
                {content.headers.map((h, i) => (
                  <th key={i} style={{ border: "1px solid #E2E8F0", padding: "4px 8px", background: "#F1F5F9", textAlign: "left", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.slice(0, 4).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ border: "1px solid #E2E8F0", padding: "4px 8px", color: "#1E293B", whiteSpace: "nowrap" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {content.rows.length > 4 && (
            <p style={{ fontSize: "10px", color: "#CBD5E1", marginTop: "6px" }}>他 {content.rows.length - 4} 行</p>
          )}
        </div>
      );

    case "word":
      return (
        <div style={{ background: "#F7F8FA", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <FileText size={13} color="#94A3B8" />
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{content.title}</span>
          </div>
          {content.sections.slice(0, 2).map((s, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              {s.heading && <p style={{ fontSize: "12px", fontWeight: 700, color: "#1E293B", marginBottom: "3px" }}>{s.heading}</p>}
              <p style={{
                fontSize: "12px", color: "#475569", lineHeight: 1.6,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
              }}>
                {s.body}
              </p>
            </div>
          ))}
          {content.sections.length > 2 && (
            <p style={{ fontSize: "10px", color: "#CBD5E1" }}>他 {content.sections.length - 2} セクション</p>
          )}
        </div>
      );

    case "pptx":
      return (
        <div style={{ background: "#F7F8FA", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <FileText size={13} color="#94A3B8" />
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>全{content.slides.length}スライド</span>
          </div>
          <div style={{
            aspectRatio: "16/9", background: content.slides[0]?.accentColor ?? "#B45309",
            borderRadius: "6px", padding: "12px", color: "white",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>{content.slides[0]?.title}</p>
            {content.slides[0]?.body.slice(0, 2).map((b, i) => (
              <p key={i} style={{ fontSize: "10px", opacity: 0.9 }}>・{b}</p>
            ))}
          </div>
        </div>
      );

    case "image":
      return (
        <div style={{
          borderRadius: "8px", overflow: "hidden",
          aspectRatio: "16/10",
          background: `linear-gradient(135deg, ${content.colorScheme.join(", ")})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ImageIcon size={28} color="rgba(255,255,255,0.8)" />
        </div>
      );

    default:
      return null;
  }
}
