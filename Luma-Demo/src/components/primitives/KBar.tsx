import { useState, useEffect, type ReactNode } from 'react';

interface KBarProps {
    open: boolean;
    onClose: () => void;
    onAction: (id: string) => void;
    commands: { id: string; label: string; icon?: ReactNode; shortcut?: string }[];
}

export function KBar({ open, onClose, onAction, commands }: KBarProps) {
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (open) setQuery('');
    }, [open]);

    if (!open) return null;

    const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-surface-1 border border-border-subtle rounded overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                    />
                    <kbd className="text-[10px] font-mono bg-surface-2 text-text-muted px-1.5 py-0.5 rounded border border-border-subtle">ESC</kbd>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
                    {filtered.length === 0 && (
                        <div className="px-3 py-6 text-center text-xs text-text-muted">No results found.</div>
                    )}
                    {filtered.map((cmd) => (
                        <button
                            key={cmd.id}
                            onClick={() => { onAction(cmd.id); onClose(); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-surface-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <span className="w-8 h-8 flex items-center justify-center rounded-md bg-surface-2 text-text-muted">
                                {cmd.icon}
                            </span>
                            <span className="flex-1 text-left">{cmd.label}</span>
                            {cmd.shortcut && (
                                <kbd className="text-[10px] font-mono bg-surface-2 text-text-muted px-1.5 py-0.5 rounded border border-border-subtle">{cmd.shortcut}</kbd>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
