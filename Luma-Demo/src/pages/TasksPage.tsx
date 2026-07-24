import { useState, useMemo, useRef } from 'react';
import AppShell from '../components/AppShell';
import { mockTasks, STATUS_LABELS, TASK_TYPE_LABELS } from '../api/mock';
import { Avatar } from '../components/primitives/Avatar';
import { Plus } from 'lucide-react';
import type { TaskStatus, TaskPriority, TaskItemType } from '../types';

type FilterState = {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    type: TaskItemType | 'all';
    projectId: string | 'all';
};

const COLUMNS: TaskStatus[] = ['ToDo', 'InProgress', 'Review', 'Done'];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    Critical: '#C1541F',
    High: '#C1541F',
    Medium: '#7A7869',
    Low: '#7A7869',
};

function formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
}

export default function TasksPage() {
    const [filters, setFilters] = useState<FilterState>({ status: 'all', priority: 'all', type: 'all', projectId: 'all' });
    const [tasks, setTasks] = useState(mockTasks);
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
    const dragCountRef = useRef<Record<string, number>>({});

    const filtered = useMemo(() => {
        return tasks.filter((t) => {
            if (filters.status !== 'all' && t.status !== filters.status) return false;
            if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
            if (filters.type !== 'all' && t.type !== filters.type) return false;
            if (filters.projectId !== 'all' && t.projectId !== filters.projectId) return false;
            return true;
        });
    }, [tasks, filters]);

    const toggle = (key: keyof FilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleDragStart = (taskId: string) => {
        setDragId(taskId);
    };

    const handleDragEnd = () => {
        setDragId(null);
        setDragOverStatus(null);
        dragCountRef.current = {};
    };

    const handleDragEnter = (status: TaskStatus, e: React.DragEvent) => {
        e.preventDefault();
        dragCountRef.current[status] = (dragCountRef.current[status] || 0) + 1;
        setDragOverStatus(status);
    };

    const handleDragLeave = (status: TaskStatus, e: React.DragEvent) => {
        e.preventDefault();
        dragCountRef.current[status] = (dragCountRef.current[status] || 0) - 1;
        if (dragCountRef.current[status] <= 0) {
            dragCountRef.current[status] = 0;
            setDragOverStatus((prev) => (prev === status ? null : prev));
        }
    };

    const handleDrop = (status: TaskStatus) => {
        dragCountRef.current[status] = 0;
        setDragOverStatus(null);
        if (!dragId) return;
        setTasks((prev) => prev.map((t) => (t.id === dragId ? { ...t, status } : t)));
        setDragId(null);
    };

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="All Tasks">
            <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-surface-1 rounded border border-border-subtle">
                        {(['all', 'ToDo', 'InProgress', 'Review', 'Done'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => toggle('status', s)}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${filters.status === s ? 'bg-surface-2 text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                            >
                                {s === 'all' ? 'All' : STATUS_LABELS[s as TaskStatus]}
                            </button>
                        ))}
                    </div>
                    <select
                        value={filters.priority}
                        onChange={(e) => toggle('priority', e.target.value)}
                        className="bg-surface-1 border border-border-subtle rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                    >
                        <option value="all">All Priorities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <select
                        value={filters.type}
                        onChange={(e) => toggle('type', e.target.value)}
                        className="bg-surface-1 border border-border-subtle rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                    >
                        <option value="all">All Types</option>
                        <option value="Task">Task</option>
                        <option value="Story">Story</option>
                        <option value="Bug">Bug</option>
                        <option value="Epic">Epic</option>
                    </select>
                </div>

                <div className="kanban-board">
                    {COLUMNS.map((status) => {
                        const columnTasks = filtered.filter((t) => t.status === status);
                        const isOver = dragOverStatus === status;

                        return (
                            <div
                                key={status}
                                className={`kanban-column${isOver ? ' drag-over' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={(e) => handleDragEnter(status, e)}
                                onDragLeave={(e) => handleDragLeave(status, e)}
                                onDrop={() => void handleDrop(status)}
                            >
                                <div className="kanban-column-header">
                                    <div className="flex items-center gap-2">
                                        <span className="kanban-column-title">{STATUS_LABELS[status]}</span>
                                        <span className="kanban-column-count">{columnTasks.length}</span>
                                    </div>
                                    <button
                                        onClick={() => {}}
                                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-surface-2 text-text-muted transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="kanban-card-list">
                                    {columnTasks.map((task) => {
                                        const isDragging = dragId === task.id;
                                        const dueLabel = formatDate(task.dueDate);
                                        const priorityColor = PRIORITY_COLORS[task.priority];

                                        return (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={() => handleDragStart(task.id)}
                                                onDragEnd={handleDragEnd}
                                                className={[
                                                    'kanban-card',
                                                    isDragging ? 'dragging' : '',
                                                ].join(' ')}
                                            >
                                                <div className="kanban-card-tags">
                                                    <span className="kanban-card-tag">{TASK_TYPE_LABELS[task.type]}</span>
                                                </div>

                                                <div className="kanban-card-title">{task.title}</div>

                                                <div className="kanban-card-meta">
                                                    <div className="kanban-card-meta-left">
                                                        <div className="flex items-center gap-1.5">
                                                            <span
                                                                className="kanban-card-priority-dot"
                                                                style={{ backgroundColor: priorityColor }}
                                                            />
                                                            {task.assigneeFullName ? (
                                                                <Avatar name={task.assigneeFullName} size="xs" />
                                                            ) : (
                                                                <span className="text-[11px] text-text-muted font-medium">Unassigned</span>
                                                            )}
                                                        </div>
                                                        {dueLabel && (
                                                            <span className="text-[11px] text-text-muted font-medium tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                                                                {dueLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="kanban-add-card">
                                    <Plus className="size-3.5 inline-block mr-1 -mt-0.5" />
                                    Add card
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppShell>
    );
}
