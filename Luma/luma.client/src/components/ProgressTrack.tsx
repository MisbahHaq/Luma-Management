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
    return (
        <span className="progress-track">
            <span className={`progress-fill ${tone === 'accent' ? 'progress-accent' : ''}`} style={{ width: `${pct}%` }} />
            {showLabel && <span className="progress-label instrument">{pct}%</span>}
        </span>
    );
}
