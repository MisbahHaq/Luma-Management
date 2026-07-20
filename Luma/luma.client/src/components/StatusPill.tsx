import { STATUS_META, type TaskStatus } from '../types/types';

export default function StatusPill({ status }: { status: TaskStatus }) {
    const meta = STATUS_META[status] ?? STATUS_META.ToDo;
    return <span className={`pill ${meta.className}`}>{meta.label}</span>;
}
