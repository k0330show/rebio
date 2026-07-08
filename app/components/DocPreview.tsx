"use client";

import { useState } from "react";
import {
  LibraryMockContent, PdfMockContent, ExcelMockContent,
  CsvMockContent, WordMockContent, PptxMockContent, ImageMockContent,
} from "@/app/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── PDF プレビュー ──────────────────────────────────────────────────────────
function PdfPreview({ content }: { content: PdfMockContent }) {
  const [page, setPage] = useState(0);
  return (
    <div>
      {/* ページコントロール */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px",
        background: "#374151", borderRadius: "8px 8px 0 0",
      }}>
        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
          {page + 1} / {content.pageCount} ページ
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: "4px 8px", background: page === 0 ? "#4B5563" : "#6B7280",
              border: "none", borderRadius: "5px", color: "white",
              cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1,
              display: "flex", alignItems: "center",
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setPage(Math.min(content.pageCount - 1, page + 1))}
            disabled={page === content.pageCount - 1}
            style={{
              padding: "4px 8px", background: page === content.pageCount - 1 ? "#4B5563" : "#6B7280",
              border: "none", borderRadius: "5px", color: "white",
              cursor: page === content.pageCount - 1 ? "not-allowed" : "pointer",
              opacity: page === content.pageCount - 1 ? 0.5 : 1,
              display: "flex", alignItems: "center",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ページ本文 */}
      <div style={{
        background: "#FFFFFF", minHeight: "480px",
        padding: "40px 48px",
        boxShadow: "inset 0 0 0 1px #E2E8F0",
        borderRadius: "0 0 8px 8px",
      }}>
        {/* ヘッダー罫線（PDF風） */}
        <div style={{ borderBottom: "2px solid #E2E8F0", marginBottom: "24px", paddingBottom: "8px" }}>
          <p style={{ fontSize: "10px", color: "#94A3B8", letterSpacing: "1px", textTransform: "uppercase" }}>
            デモプレビュー — ページ {page + 1}
          </p>
        </div>
        <pre style={{
          fontFamily: "inherit", fontSize: "13px", color: "#1E293B",
          lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {content.pages[page] ?? "（このページにはコンテンツがありません）"}
        </pre>
      </div>
    </div>
  );
}

// ─── Excel プレビュー ────────────────────────────────────────────────────────
function ExcelPreview({ content }: { content: ExcelMockContent }) {
  const [sheetIdx, setSheetIdx] = useState(0);
  const sheet = content.sheets[sheetIdx];
  if (!sheet) return null;

  return (
    <div>
      {/* シートタブ */}
      <div style={{ display: "flex", gap: "2px", background: "#D1FAE5", padding: "8px 8px 0", borderRadius: "8px 8px 0 0" }}>
        {content.sheets.map((s, i) => (
          <button key={s.name} onClick={() => setSheetIdx(i)} style={{
            padding: "6px 16px", border: "none", borderRadius: "5px 5px 0 0",
            background: sheetIdx === i ? "#FFFFFF" : "#A7F3D0",
            color: sheetIdx === i ? "#166534" : "#065F46",
            fontSize: "12px", fontWeight: sheetIdx === i ? 700 : 400,
            cursor: "pointer",
          }}>
            {s.name}
          </button>
        ))}
      </div>

      {/* スプレッドシート */}
      <div style={{ overflowX: "auto", background: "#FFFFFF", borderRadius: "0 0 8px 8px", border: "1px solid #D1FAE5" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#ECFDF5" }}>
              {/* 行番号列 */}
              <th style={{ width: "32px", padding: "8px 6px", border: "1px solid #D1FAE5", color: "#6B7280", fontWeight: 400, textAlign: "center" }}>
              </th>
              {sheet.headers.map((h, i) => (
                <th key={i} style={{
                  padding: "8px 12px", border: "1px solid #D1FAE5",
                  color: "#166534", fontWeight: 700, textAlign: "left", whiteSpace: "nowrap",
                  background: "#D1FAE5",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "#FFFFFF" : "#F0FDF4" }}>
                <td style={{ padding: "6px", border: "1px solid #E2E8F0", color: "#9CA3AF", textAlign: "center", fontSize: "11px" }}>
                  {ri + 1}
                </td>
                {row.map((cell, ci) => {
                  const cellStr = String(cell);
                  const isWarning = cellStr.includes("⚠") || cellStr.includes("要発注") || cellStr.includes("要確認");
                  return (
                    <td key={ci} style={{
                      padding: "7px 12px", border: "1px solid #E2E8F0",
                      color: isWarning ? "#C0392B" : "#1E293B",
                      fontWeight: isWarning ? 600 : 400,
                      whiteSpace: "nowrap",
                    }}>
                      {cellStr}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CSV プレビュー ──────────────────────────────────────────────────────────
function CsvPreview({ content }: { content: CsvMockContent }) {
  return (
    <div>
      <div style={{
        background: "#F8FAFC", padding: "8px 12px", borderRadius: "8px 8px 0 0",
        border: "1px solid #E2E8F0", borderBottom: "none",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <span style={{ fontSize: "11px", color: "#64748B", fontFamily: "monospace" }}>
          CSV — {content.headers.length}列 × {content.rows.length}行（デモデータ）
        </span>
      </div>
      <div style={{ overflowX: "auto", background: "#FFFFFF", borderRadius: "0 0 8px 8px", border: "1px solid #E2E8F0" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "12px", fontFamily: "monospace" }}>
          <thead>
            <tr style={{ background: "#F1F5F9" }}>
              {content.headers.map((h, i) => (
                <th key={i} style={{
                  padding: "8px 12px", border: "1px solid #E2E8F0",
                  color: "#1E293B", fontWeight: 700, textAlign: "left", whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: "7px 12px", border: "1px solid #E2E8F0",
                    color: "#1E293B", whiteSpace: "nowrap",
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Word プレビュー ─────────────────────────────────────────────────────────
function WordPreview({ content }: { content: WordMockContent }) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: "8px",
      padding: "48px 56px",
      minHeight: "520px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      {/* Word風ヘッダー */}
      <div style={{ textAlign: "center", marginBottom: "36px", paddingBottom: "20px", borderBottom: "2px solid #1D4ED8" }}>
        <h1 style={{
          fontSize: "22px", fontWeight: 800, color: "#1E293B",
          letterSpacing: "-0.5px", marginBottom: "4px",
        }}>
          {content.title}
        </h1>
        <p style={{ fontSize: "11px", color: "#94A3B8", letterSpacing: "0.5px" }}>
          デモプレビュー — 実際の .docx ファイルを開くと正確なレイアウトで表示されます
        </p>
      </div>

      {content.sections.map((section, i) => (
        <div key={i} style={{ marginBottom: "24px" }}>
          {section.heading && (
            <h2 style={{
              fontSize: "15px", fontWeight: 700, color: "#1D4ED8",
              marginBottom: "8px",
              paddingBottom: "4px",
              borderBottom: "1px solid #C9DAF1",
            }}>
              {section.heading}
            </h2>
          )}
          <p style={{
            fontSize: "13px", color: "#1E293B", lineHeight: 1.9,
            whiteSpace: "pre-wrap",
          }}>
            {section.body}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── PowerPoint プレビュー ───────────────────────────────────────────────────
function PptxPreview({ content }: { content: PptxMockContent }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const slide = content.slides[slideIdx];
  if (!slide) return null;

  const accent = slide.accentColor ?? "#2F5EAA";

  return (
    <div>
      {/* スライド本体（16:9比率） */}
      <div style={{ position: "relative", paddingBottom: "56.25%", background: "#1E293B", borderRadius: "8px 8px 0 0", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          {slide.slideType === "title" ? (
            /* タイトルスライド */
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
              padding: "5%",
            }}>
              <div style={{ width: "60px", height: "4px", background: accent, borderRadius: "2px", marginBottom: "20px" }} />
              <h1 style={{
                fontSize: "clamp(18px, 3vw, 32px)", fontWeight: 800,
                color: "#FFFFFF", textAlign: "center", lineHeight: 1.3,
                marginBottom: "16px",
              }}>
                {slide.title}
              </h1>
              {slide.body.map((line, i) => (
                <p key={i} style={{ fontSize: "clamp(12px, 1.8vw, 16px)", color: `${accent}CC`, textAlign: "center" }}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            /* コンテンツスライド */
            <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "5% 6%" }}>
              {/* スライドヘッダー */}
              <div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: "12px", marginBottom: "20px" }}>
                <h2 style={{
                  fontSize: "clamp(14px, 2.2vw, 22px)", fontWeight: 800,
                  color: "#FFFFFF", lineHeight: 1.3,
                }}>
                  {slide.title}
                </h2>
              </div>
              {/* 本文 */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
                {slide.body.map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: accent, flexShrink: 0, marginTop: "6px",
                    }} />
                    <p style={{ fontSize: "clamp(11px, 1.6vw, 15px)", color: "#E2E8F0", lineHeight: 1.6 }}>
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* スライド番号 */}
          <div style={{
            position: "absolute", bottom: "12px", right: "16px",
            fontSize: "11px", color: "#64748B",
          }}>
            {slideIdx + 1} / {content.slides.length}
          </div>
        </div>
      </div>

      {/* サムネイルナビ */}
      <div style={{
        display: "flex", gap: "6px", padding: "10px 12px",
        background: "#1E293B", borderRadius: "0 0 8px 8px",
        overflowX: "auto",
      }}>
        {content.slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setSlideIdx(i)}
            style={{
              flexShrink: 0,
              padding: "6px 10px",
              borderRadius: "5px",
              border: `2px solid ${slideIdx === i ? (s.accentColor ?? "#2F5EAA") : "#374151"}`,
              background: slideIdx === i ? "#374151" : "#1E293B",
              color: slideIdx === i ? "#FFFFFF" : "#9CA3AF",
              fontSize: "11px", fontWeight: slideIdx === i ? 600 : 400,
              cursor: "pointer", whiteSpace: "nowrap",
              maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 画像プレビュー ──────────────────────────────────────────────────────────
function ImagePreview({ content }: { content: ImageMockContent }) {
  const stops = content.colorScheme;
  const gradient = `linear-gradient(135deg, ${stops.join(", ")})`;

  return (
    <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
      {/* モック画像エリア */}
      <div style={{
        background: gradient,
        height: "360px",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {/* グリッド線でフロアマップ感を演出 */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* 中央テキスト */}
        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "rgba(255,255,255,0.3)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", border: "1px solid rgba(255,255,255,0.4)",
          }}>
            <span style={{ fontSize: "28px" }}>🖼</span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
            {content.alt}
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
            デモプレビュー
          </p>
        </div>
      </div>

      {/* キャプション */}
      {content.caption && (
        <div style={{ padding: "10px 14px", background: "#F7F8FA", borderTop: "1px solid #E2E8F0" }}>
          <p style={{ fontSize: "12px", color: "#64748B", textAlign: "center" }}>{content.caption}</p>
        </div>
      )}
    </div>
  );
}

// ─── メインエクスポート ──────────────────────────────────────────────────────
export default function DocPreview({ content }: { content: LibraryMockContent }) {
  switch (content.type) {
    case "pdf":   return <PdfPreview   content={content} />;
    case "excel": return <ExcelPreview content={content} />;
    case "csv":   return <CsvPreview   content={content} />;
    case "word":  return <WordPreview  content={content} />;
    case "pptx":  return <PptxPreview  content={content} />;
    case "image": return <ImagePreview content={content} />;
    default:      return null;
  }
}
