import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

export interface Command {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
}

interface KBarProps {
  open: boolean;
  onClose: () => void;
  onAction: (name: string) => void;
  commands: Command[];
}

export function KBar({ open, onClose, onAction, commands }: KBarProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onAction(filtered[selectedIndex].id);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, selectedIndex, filtered, onClose, onAction]);

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-surface-1 border border-border-subtle rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2 px-3 border-b border-border-subtle">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 h-10 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-text-muted bg-surface-2 rounded border border-border-subtle">
            ESC
          </kbd>
        </div>
        <div
          ref={listRef}
          className="max-h-[320px] overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-text-muted">
              No results found.
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                  idx === selectedIndex ? "bg-surface-2 text-text-primary" : "text-text-secondary hover:bg-surface-2"
                }`}
                onClick={() => {
                  onAction(cmd.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="shrink-0 text-text-muted">{cmd.icon}</span>
                <span className="flex-1 text-sm">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-text-muted bg-surface-2 rounded border border-border-subtle">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
