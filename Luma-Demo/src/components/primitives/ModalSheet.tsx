import { type ReactNode } from 'react';

interface ModalSheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function ModalSheet({ open, onClose, title, children, footer }: ModalSheetProps) {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="relative bg-surface-1 border border-border-subtle rounded animate-in fade-in slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                    <h3 className="text-sm font-medium text-text-primary">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-surface-2 text-text-muted">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4">{children}</div>
                {footer && <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-end gap-2">{footer}</div>}
            </div>
        </div>
    );
}
