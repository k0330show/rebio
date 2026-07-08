import { Priority, PRIORITY_LABELS } from "@/app/types";
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";

interface PriorityBadgeProps {
  priority: Priority;
  size?: "sm" | "md";
}

const PRIORITY_CONFIG = {
  urgent: {
    bg: "#FBEEEC",
    color: "#C0392B",
    border: "#EFCCC6",
    icon: AlertTriangle,
  },
  high: {
    bg: "#FDF6EC",
    color: "#B45309",
    border: "#F0DDBB",
    icon: ArrowUp,
  },
  medium: {
    bg: "#F8FAFC",
    color: "#8A8F98",
    border: "#E5E9EF",
    icon: Minus,
  },
  low: {
    bg: "#F8FAFC",
    color: "#94A3B8",
    border: "#E5E9EF",
    icon: ArrowDown,
  },
};

export default function PriorityBadge({
  priority,
  size = "md",
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
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
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
