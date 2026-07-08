import { Confidence, CONFIDENCE_LABELS } from "@/app/types";
import { ShieldCheck, Shield, ShieldAlert } from "lucide-react";

interface ConfidenceBadgeProps {
  confidence: Confidence;
  size?: "sm" | "md";
}

const CONFIDENCE_CONFIG = {
  high: {
    bg: "#EAF6F4",
    color: "#0F766E",
    border: "#BFE3DE",
    icon: ShieldCheck,
    label: "信頼度：高",
  },
  medium: {
    bg: "#F8FAFC",
    color: "#8A8F98",
    border: "#E5E9EF",
    icon: Shield,
    label: "信頼度：中",
  },
  low: {
    bg: "#FDF6EC",
    color: "#B45309",
    border: "#F0DDBB",
    icon: ShieldAlert,
    label: "信頼度：低（要確認）",
  },
};

export default function ConfidenceBadge({
  confidence,
  size = "md",
}: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[confidence];
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
      {CONFIDENCE_LABELS[confidence]}
    </span>
  );
}
