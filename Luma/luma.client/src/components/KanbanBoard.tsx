import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { Label, Task, TaskStatus, TaskPriority } from '../types/types';
import { STATUS_LABELS } from '../types/types';
import Avatar from './Avatar';
import {
    Flame,
    AlertTriangle,
    Minus,
    ArrowDown,
    GripVertical,
    Plus,
} from 'lucide-react';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onTaskMoved: (taskId: string, status: TaskStatus) => void;
    onTaskCreate?: (title: string, status: TaskStatus) => void;
    labels?: Record<string, Label[]>;
}

const COLUMNS: TaskStatus[] = ['ToDo', 'InProgress', 'Done'];

const STATUS_ACCENT: Record<TaskStatus, string> = {
    ToDo: 'bg-text-muted',
    InProgress: 'bg-accent',
    Done: 'bg-emerald-500',
};

const PRIORITY_ICON: Record<TaskPriority, ReactNode> = {
    Critical: <Flame className="size-3.5 text-orange-500" />,
    High: <AlertTriangle className="size-3.5 text-red-400" />,
    Medium: <Minus className="size-3.5 text-text-muted" />,
    Low: <ArrowDown className="size-3.5 text-text-muted" />,
};

function formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
}

export default function KanbanBoard({
    tasks,
    onTaskClick,
    onTaskMoved,
    onTaskCreate,
}: KanbanBoardProps) {
    const [dragId, setDragId] = useState<string | null>(null);
    const [addingUnder, setAddingUnder] = useState<TaskStatus | null>(null);
    const [addTitle, setAddTitle] = useState('');
    const addRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (addingUnder && addRef.current) {
            addRef.current.focus();
        }
    }, [addingUnder]);

    const handleDrop = (status: TaskStatus) => {
        if (!dragId) return;
        const task = tasks.find((t) => t.id === dragId);
        setDragId(null);
        if (!task || task.status === status) return;
        onTaskMoved(dragId, status);
    };

    const commitAdd = () => {
        const trimmed = addTitle.trim();
        if (!trimmed || !addingUnder || !onTaskCreate) return;
        onTaskCreate(trimmed, addingUnder);
        setAddTitle('');
        setAddingUnder(null);
    };

    return (
        <div className="flex gap-3 overflow-x-auto pb-3">
            {COLUMNS.map((status) => {
                const columnTasks = tasks.filter((t) => t.status === status);
                return (
                    <div
                        key={status}
                        className="min-w-[280px] w-[300px] flex-shrink-0 flex flex-col bg-surface-1/40 rounded-lg border border-border-subtle"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragEnter={(e) => e.preventDefault()}
                        onDrop={() => void handleDrop(status)}
                    >
                        <div className="h-[3px] w-full rounded-t-lg bg-text-muted" style={{ backgroundColor: STATUS_ACCENT[status].replace('bg-', '') === 'text-muted' ? undefined : undefined }}>
                            {status === 'ToDo' && (
                                <div className="h-[3px] w-full rounded-t-lg bg-text-muted" />
                            )}
                            {status === 'InProgress' && (
                                <div className="h-[3px] w-full rounded-t-lg bg-accent" />
                            )}
                            {status === 'Done' && (
                                <div className="h-[3px] w-full rounded-t-lg bg-emerald-500" />
                            )}
                        </div>

                        <div className="flex items-center justify-between px-3 pt-3 pb-1">
                            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                                {STATUS_LABELS[status]}
                            </span>
                            <span className="text-[10px] font-mono font-medium tabular-nums px-1.5 py-0.5 rounded bg-surface-2 text-text-muted">
                                {columnTasks.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1.5 min-h-[120px]">
                            {columnTasks.length === 0 && (
                                <div className="text-text-muted text-xs py-4 text-center select-none">
                                    No tasks
                                </div>
                            )}
                            {columnTasks.map((task) => {
                                const isDragging = dragId === task.id;
                                const col = task.dueDate ? new Date(task.dueDate) : null;
                                const dueLabel = col ? formatDate(task.dueDate) : '';

                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => {
                                            setDragId(task.id);
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('text/plain', task.id);
                                        }}
                                        onDragEnd={() => setDragId(null)}
                                        onClick={() => onTaskClick(task)}
                                        className={[
                                            'group bg-surface-1/60 border border-border-subtle rounded-md p-2.5 cursor-pointer transition-all duration-150',
                                            isDragging
                                                ? 'opacity-50 border-accent'
                                                : 'hover:border-border-default hover:shadow-sm',
                                        ].join(' ')}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-mono font-medium text-text-muted tabular-nums tracking-tight">
                                                {task.issueKey}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <span className="flex items-center">
                                                    {PRIORITY_ICON[task.priority]}
                                                </span>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <GripVertical className="size-3.5 text-text-muted" />
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-medium text-text-primary leading-tight mt-1 line-clamp-2">
                                            {task.title}
                                        </h3>

                                        <div className="flex items-center justify-between gap-2 mt-2.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {task.assigneeFullName ? (
                                                    <Avatar name={task.assigneeFullName} size={20} />
                                                ) : (
                                                    <span className="size-5 rounded-full bg-surface-2 flex items-center justify-center text-text-muted">
                                                        <span className="text-[10px]">?</span>
                                                    </span>
                                                )}
                                                {dueLabel && (
                                                    <span className="text-[11px] text-text-muted font-mono tabular-nums truncate">
                                                        {dueLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {addingUnder === status ? (
                            <div className="px-2 pb-2">
                                <input
                                    ref={addRef}
                                    type="text"
                                    value={addTitle}
                                    onChange={(e) => setAddTitle(e.target.value)}
                                    onBlur={commitAdd}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            commitAdd();
                                        }
                                        if (e.key === 'Escape') {
                                            setAddingUnder(null);
                                            setAddTitle('');
                                        }
                                    }}
                                    placeholder="Issue title"
                                    className="w-full rounded-md border border-border-default bg-surface-1 px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingUnder(status)}
                                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary px-3 pb-2.5 pt-1 w-full text-left transition-colors"
                            >
                                <Plus className="size-3.5" />
                                Add issue
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}