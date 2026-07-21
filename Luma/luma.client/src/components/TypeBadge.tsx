import { TASK_TYPE_META, type TaskItemType } from '../types/types';

const TYPE_STYLES: Record<string, string> = {
    Epic: 'bg-purple-100 text-purple-700',
    Story: 'bg-blue-100 text-blue-700',
    Bug: 'bg-red-100 text-red-600',
    Task: 'bg-gray-100 text-gray-500',
};

export default function TypeBadge({ type }: { type: TaskItemType }) {
    const meta = TASK_TYPE_META[type] ?? TASK_TYPE_META.Task;
    return (
        <span
            className={`inline-flex items-center font-['IBM_Plex_Mono'] text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-md border border-transparent whitespace-nowrap ${TYPE_STYLES[type] ?? TYPE_STYLES.Task}`}
        >
            {meta.label}
        </span>
    );
}
