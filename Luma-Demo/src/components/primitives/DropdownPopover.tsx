import { useState, useEffect, type ReactNode } from 'react';

interface DropdownPopoverProps {
    trigger: ReactNode;
    children: ReactNode;
}

export function DropdownPopover({ trigger, children }: DropdownPopoverProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-dropdown]')) setOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [open]);

    return (
        <div className="relative" data-dropdown>
            <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface-1 border border-border-subtle rounded-lg shadow-2xl z-50 overflow-hidden py-1">
                    {children}
                </div>
            )}
        </div>
    );
}
