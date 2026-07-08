import { Category, CATEGORY_LABELS } from "@/app/types";
import { CheckSquare, AlertOctagon, Megaphone, FileText } from "lucide-react";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
}

const CATEGORY_CONFIG = {
  task: {
    bg: "#EEF3FB",
    color: "#2F5EAA",
    border: "#C9DAF1",
    icon: CheckSquare,
  },
  caution: {
    bg: "#FDF6EC",
    color: "#B45309",
    border: "#F0DDBB",
    icon: AlertOctagon,
  },
  report: {
    bg: "#EAF6F4",
    color: "#0F766E",
    border: "#BFE3DE",
    icon: Megaphone,
  },
  note: {
    bg: "#F8FAFC",
    color: "#8A8F98",
    border: "#E5E9EF",
    icon: FileText,
  },
};

export default function CategoryBadge({
  category,
  size = "md",
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const iconSize = size === "sm" ? 10 : 12;
  const fontSize = size === "sm" ? "10.5px" : "12px";
  const padding = size === "sm" ? "2px 7px" : "3px 9px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        borderRadius: "100px",
        padding,
        fontSize,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={iconSize} strokeWidth={2.3} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}
