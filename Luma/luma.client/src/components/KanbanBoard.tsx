import { useState, useRef, useEffect } from 'react';
import type { Label, Task, TaskStatus, TaskPriority } from '../types/types';
import { STATUS_LABELS } from '../types/types';
import Avatar from './Avatar';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onTaskMoved: (taskId: string, status: TaskStatus) => void;
    onTaskCreate?: (title: string, status: TaskStatus) => void;
    labels?: Record<string, Label[]>;
}

const COLUMNS: TaskStatus[] = ['ToDo', 'InProgress', 'Review', 'Done'];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
    Critical: '#DC2626',
    High: '#D97706',
    Medium: '#4B7C74',
    Low: '#6B7280',
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
    labels,
}: KanbanBoardProps) {
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
    const [addingUnder, setAddingUnder] = useState<TaskStatus | null>(null);
    const [addTitle, setAddTitle] = useState('');
    const addRef = useRef<HTMLInputElement>(null);
    const dragCountRef = useRef<Record<string, number>>({});

    useEffect(() => {
        if (addingUnder && addRef.current) {
            addRef.current.focus();
        }
    }, [addingUnder]);

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
        <div className="kanban-board">
            {COLUMNS.map((status) => {
                const columnTasks = tasks.filter((t) => t.status === status);
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
                                onClick={() => setAddingUnder(status)}
                                className="flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="kanban-card-list">
                            {columnTasks.map((task) => {
                                const isDragging = dragId === task.id;
                                const taskLabels = labels?.[task.id] ?? [];
                                const dueLabel = formatDate(task.dueDate);
                                const priorityColor = PRIORITY_COLORS[task.priority];

                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={() => handleDragStart(task.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => onTaskClick(task)}
                                        className={[
                                            'kanban-card',
                                            isDragging ? 'dragging' : '',
                                        ].join(' ')}
                                    >
                                        {taskLabels.length > 0 && (
                                            <div className="kanban-card-tags">
                                                {taskLabels.map((l) => (
                                                    <span key={l.id} className="kanban-card-tag">{l.name}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="kanban-card-title">{task.title}</div>

                                        <div className="kanban-card-meta">
                                            <div className="kanban-card-meta-left">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="kanban-card-priority-dot"
                                                        style={{ backgroundColor: priorityColor }}
                                                    />
                                                    {task.assigneeFullName ? (
                                                        <Avatar name={task.assigneeFullName} size={18} />
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400 font-medium">Unassigned</span>
                                                    )}
                                                </div>
                                                {dueLabel && (
                                                    <span className="text-[11px] text-gray-400 font-medium tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
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
                            <div className="px-3 pb-3">
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
                                    placeholder="Issue title..."
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-300 focus:bg-white transition-colors"
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingUnder(status)}
                                className="kanban-add-card"
                            >
                                <Plus className="size-3.5 inline-block mr-1 -mt-0.5" />
                                Add card
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
