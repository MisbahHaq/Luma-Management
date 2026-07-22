import { useEffect } from 'react';

interface Shortcut {
    key: string;
    handler: () => void;
    preventDefault?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey;
                const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey;
                const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey;
                const altMatch = shortcut.altKey === undefined || shortcut.altKey === e.altKey;

                if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
                    if (shortcut.preventDefault !== false) {
                        e.preventDefault();
                    }
                    shortcut.handler();
                    break;
                }
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [shortcuts]);
}
