import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "epic" | "story" | "bug" | "outline";
  className?: string;
  icon?: ReactNode;
}

const variantClasses: Record<string, string> = {
  default: "bg-surface-2 text-text-secondary",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger: "bg-red-500/15 text-red-400",
  info: "bg-sky-500/15 text-sky-400",
  epic: "bg-purple-500/15 text-purple-400",
  story: "bg-blue-500/15 text-blue-400",
  bug: "bg-red-500/15 text-red-400",
  outline: "border border-border-subtle text-text-secondary",
};

export function Badge({
  children,
  variant = "default",
  className = "",
  icon,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono tabular-nums text-[10px] font-medium px-1.5 py-0.5 rounded-md ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
