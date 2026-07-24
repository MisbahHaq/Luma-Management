import { type ReactNode } from 'react';

interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    size?: 'sm' | 'md';
    variant?: 'primary' | 'ghost' | 'outline';
    disabled?: boolean;
    className?: string;
}

export function Button({ children, onClick, type = 'button', size = 'md', variant = 'primary', disabled, className }: ButtonProps) {
    const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const sizes = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs';
    const variants: Record<string, string> = {
        primary: 'bg-accent text-white border-accent/80 hover:bg-accent/90',
        ghost: 'bg-transparent text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-default',
        outline: 'bg-transparent text-text-secondary border-border-subtle hover:text-text-primary',
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${variants[variant]} ${className ?? ''}`}>
            {children}
        </button>
    );
}
