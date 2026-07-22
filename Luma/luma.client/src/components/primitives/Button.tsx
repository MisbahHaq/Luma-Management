import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "default" | "primary" | "ghost" | "destructive";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "default",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  icon,
}: ButtonProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default: "border border-border-subtle bg-transparent hover:bg-surface-2 text-text-primary",
    primary: "bg-accent text-white hover:bg-accent/90",
    ghost: "border border-transparent hover:bg-surface-2 text-text-primary",
    destructive: "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
