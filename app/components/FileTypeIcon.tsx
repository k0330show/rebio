import { FileType } from "@/app/types";
import { FileText, Image, Table2, Sheet, Presentation, FileSpreadsheet } from "lucide-react";

interface FileTypeIconProps {
  fileType: FileType;
  size?: number;
}

export const FILE_TYPE_CONFIG: Record<FileType, { color: string; bg: string; border: string; label: string }> = {
  pdf:   { color: "#C0392B", bg: "#FBEEEC", border: "#EFCCC6", label: "PDF" },
  image: { color: "#6D4FC2", bg: "#F2EFFB", border: "#DBD3F2", label: "画像" },
  csv:   { color: "#0F766E", bg: "#EAF6F4", border: "#BFE3DE", label: "CSV" },
  excel: { color: "#3C7A4F", bg: "#EEF6F0", border: "#CCE3D2", label: "Excel" },
  word:  { color: "#2F5EAA", bg: "#EEF3FB", border: "#C9DAF1", label: "Word" },
  pptx:  { color: "#B45309", bg: "#FDF6EC", border: "#F0DDBB", label: "PPT" },
};

const ICONS: Record<FileType, React.ElementType> = {
  pdf:   FileText,
  image: Image,
  csv:   Sheet,
  excel: FileSpreadsheet,
  word:  FileText,
  pptx:  Presentation,
};

// lucide-react に Sheet・Presentation がない場合のフォールバック
function SafeIcon({ fileType, size }: { fileType: FileType; size: number }) {
  switch (fileType) {
    case "csv":   return <Table2 size={size} />;
    case "excel": return <Table2 size={size} />;
    case "pptx":  return <FileText size={size} />;
    default:      return <FileText size={size} />;
  }
}

export default function FileTypeIcon({ fileType, size = 20 }: FileTypeIconProps) {
  const config = FILE_TYPE_CONFIG[fileType];
  const Icon = ICONS[fileType];

  return (
    <div style={{
      width: size + 16, height: size + 16,
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: "8px",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {Icon ? (
        <Icon size={size} color={config.color} />
      ) : (
        <SafeIcon fileType={fileType} size={size} />
      )}
    </div>
  );
}

export function FileTypeBadge({ fileType }: { fileType: FileType }) {
  const config = FILE_TYPE_CONFIG[fileType];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: "100px",
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      fontSize: "11px", fontWeight: 700,
      letterSpacing: "0.3px",
    }}>
      {config.label}
    </span>
  );
}
