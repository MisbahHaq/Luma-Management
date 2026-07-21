export default function ProgressTrack({
    value,
    showLabel = true,
    tone = 'default',
}: {
    value: number;
    showLabel?: boolean;
    tone?: 'default' | 'accent';
}) {
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    const fillColor = tone === 'accent' ? 'bg-purple-500' : 'bg-gray-800';
    return (
        <span className="inline-flex items-center gap-2 w-full">
            <span className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <span className={`h-full rounded-full ${fillColor} transition-all duration-300`} style={{ width: `${pct}%` }} />
            </span>
            {showLabel && <span className="font-['IBM_Plex_Mono'] text-xs text-gray-500 tabular-nums">{pct}%</span>}
        </span>
    );
}
