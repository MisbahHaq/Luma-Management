import { useState, useEffect } from 'react';

interface NotificationsBellProps {
    className?: string;
}

export default function NotificationsBell({ className }: NotificationsBellProps) {
    const [open, setOpen] = useState(false);
    const [count] = useState(3);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-notifications]')) setOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [open]);

    return (
        <div className="relative" data-notifications>
            <button
                onClick={() => setOpen((o) => !o)}
                className={`p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors relative ${className ?? ''}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                        {count}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface-1 border border-border-subtle rounded-lg shadow-2xl z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between">
                        <span className="text-xs font-medium text-text-primary">Notifications</span>
                        <button className="text-[10px] text-accent hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                        <div className="px-3 py-2 text-xs text-text-muted text-center">No new notifications</div>
                    </div>
                </div>
            )}
        </div>
    );
}
