import { STATUS_META, type TaskStatus } from '../types/types';

const STATUS_STYLES: Record<string, string> = {
    ToDo: 'bg-gray-100 text-gray-500',
    InProgress: 'bg-purple-100 text-purple-700',
    Done: 'bg-green-100 text-green-700',
};

export default function StatusPill({ status }: { status: TaskStatus }) {
    const meta = STATUS_META[status] ?? STATUS_META.ToDo;
    return (
        <span
            className={`inline-flex items-center font-['IBM_Plex_Mono'] text-[11px] font-medium tracking-wide px-3 py-1 rounded-full border border-black/5 whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES.ToDo}`}
        >
            {meta.label}
        </span>
    );
}
