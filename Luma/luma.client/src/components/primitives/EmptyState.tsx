import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="mx-auto mb-3 w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-text-muted">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-muted max-w-[260px]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
