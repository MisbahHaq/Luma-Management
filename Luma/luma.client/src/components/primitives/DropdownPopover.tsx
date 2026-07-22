import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface DropdownPopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownPopover({
  trigger,
  children,
  className = "",
  open: controlledOpen,
  onOpenChange,
}: DropdownPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={`absolute left-0 top-full mt-1 z-40 min-w-[200px] bg-surface-1 border border-border-subtle rounded-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150 ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
