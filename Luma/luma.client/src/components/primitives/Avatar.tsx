interface AvatarProps {
  name: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div
      className={`inline-flex items-center justify-center rounded-md text-white shrink-0 ${sizeClasses[size]} ${className}`}
      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
    >
      {initials}
    </div>
  );
}
