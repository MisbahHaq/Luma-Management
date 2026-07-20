import { PRIORITY_META, type TaskPriority } from '../types/types';

export default function PriorityPill({ priority }: { priority: TaskPriority }) {
    const meta = PRIORITY_META[priority] ?? PRIORITY_META.Medium;
    return <span className={`pill ${meta.className}`}>{meta.label}</span>;
}
