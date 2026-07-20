import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function KebabMenu({
    children,
    label = 'Actions',
}: {
    children: (close: () => void) => ReactNode;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    return (
        <div className="kebab" ref={ref}>
            <button
                type="button"
                className="kebab-trigger"
                aria-label={label}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((o) => !o);
                }}
            >
                ⋮
            </button>
            {open && (
                <div className="kebab-menu card" onClick={(e) => e.stopPropagation()}>
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
}
