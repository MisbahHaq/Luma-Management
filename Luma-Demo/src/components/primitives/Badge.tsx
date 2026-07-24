import { type ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'success' | 'info' | 'outline' | 'urgent';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
    const styles: Record<string, string> = {
        default: 'bg-surface-2 text-text-secondary border border-border-subtle',
        success: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
        info: 'bg-sky-500/10 text-sky-700 border border-sky-500/20',
        outline: 'bg-transparent text-text-muted border border-border-subtle',
        urgent: 'bg-accent/10 text-accent border border-accent/20',
    };
    return (
        <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[variant]}`}>
            {children}
        </span>
    );
}
