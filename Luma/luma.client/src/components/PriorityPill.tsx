import { PRIORITY_META, type TaskPriority } from '../types/types';

const PRIORITY_STYLES: Record<string, string> = {
    Critical: 'bg-red-100 text-red-600 font-semibold',
    High: 'bg-amber-100 text-amber-600',
    Medium: 'bg-gray-100 text-gray-500',
    Low: 'bg-gray-50 text-gray-400',
};

export default function PriorityPill({ priority }: { priority: TaskPriority }) {
    const meta = PRIORITY_META[priority] ?? PRIORITY_META.Medium;
    return (
        <span
            className={`inline-flex items-center font-['IBM_Plex_Mono'] text-[11px] font-medium tracking-wide px-3 py-1 rounded-full border border-black/5 whitespace-nowrap ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Medium}`}
        >
            {meta.label}
        </span>
    );
}
