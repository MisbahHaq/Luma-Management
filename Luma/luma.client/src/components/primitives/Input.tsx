import type { ReactNode } from "react";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  autoFocus?: boolean;
  icon?: ReactNode;
}

export function Input({
  value,
  onChange,
  placeholder = "",
  className = "",
  size = "md",
  autoFocus = false,
  icon,
}: InputProps) {
  const sizes = {
    sm: "h-7 px-2 text-xs",
    md: "h-8 px-2.5 text-sm",
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`flex-1 bg-surface-1 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors duration-150 outline-none ${sizes[size]} ${icon ? "pl-8" : ""} ${className}`}
    />
  );
}
