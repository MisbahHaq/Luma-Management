import { TASK_TYPE_META, type TaskItemType } from '../types/types';

export default function TypeBadge({ type }: { type: TaskItemType }) {
    const meta = TASK_TYPE_META[type] ?? TASK_TYPE_META.Task;
    return <span className={`type-badge ${meta.className}`}>{meta.label}</span>;
}
