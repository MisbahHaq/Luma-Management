function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
    name,
    size = 28,
}: {
    name: string | null | undefined;
    size?: number;
}) {
    const label = name ? initials(name) : '?';
    return (
        <span
            className="inline-flex items-center justify-center bg-gray-200 text-gray-600 rounded-full font-['Inter'] font-medium select-none"
            title={name ?? 'Unassigned'}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {label}
        </span>
    );
}
