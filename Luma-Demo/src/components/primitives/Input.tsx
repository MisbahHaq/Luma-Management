interface InputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    autoFocus?: boolean;
}

export function Input({ label, value, onChange, placeholder, type = 'text', autoFocus }: InputProps) {
    return (
        <label className="block">
            {label && <span className="block text-xs font-medium text-text-secondary mb-1">{label}</span>}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="w-full bg-surface-2 border border-border-subtle rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
        </label>
    );
}
