import { type ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            {icon && <div className="mb-3 text-text-muted">{icon}</div>}
            <p className="text-sm text-text-secondary mb-1">{title}</p>
            {description && <p className="text-xs text-text-muted mb-4">{description}</p>}
            {action}
        </div>
    );
}
