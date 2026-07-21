import { useState } from 'react';
import type { Label, Task, TaskStatus } from '../types/types';
import { STATUS_LABELS, PRIORITY_LABELS } from '../types/types';
import { tasksApi } from '../api/endpoints';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onTaskMoved: (taskId: string, status: TaskStatus) => void;
    labels?: Record<string, Label[]>;
}

const COLUMNS: TaskStatus[] = ['ToDo', 'InProgress', 'Done'];

export default function KanbanBoard({ tasks, onTaskClick, onTaskMoved, labels }: KanbanBoardProps) {
    const [dragId, setDragId] = useState<string | null>(null);

    const handleDrop = async (status: TaskStatus) => {
        if (!dragId) return;
        const task = tasks.find((t) => t.id === dragId);
        setDragId(null);
        if (!task || task.status === status) return;
        try {
            await tasksApi.move(dragId, status);
            onTaskMoved(dragId, status);
        } catch {
            // ignore
        }
    };

    return (
        <div className="kanban">
            {COLUMNS.map((status) => {
                const columnTasks = tasks.filter((t) => t.status === status);
                return (
                    <div
                        key={status}
                        className="kanban-column"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => void handleDrop(status)}
                    >
                        <div className="kanban-column-head">
                            <h3>{STATUS_LABELS[status]}</h3>
                            <span className="badge">{columnTasks.length}</span>
                        </div>
                        <div className="kanban-column-body">
                            {columnTasks.map((task) => (
                                <button
                                    key={task.id}
                                    className="task-card"
                                    draggable
                                    onDragStart={() => setDragId(task.id)}
                                    onClick={() => onTaskClick(task)}
                                >
                                    <span className={`priority priority-${task.priority}`}>
                                        {PRIORITY_LABELS[task.priority]}
                                    </span>
                                    <div className="kanban-card-header">
                                        <h4 className="kanban-card-title">{task.title}</h4>
                                        <small className="muted kanban-card-key">{task.issueKey}</small>
                                    </div>
                                    {task.assigneeFullName && (
                                        <small className="muted">
                                            👤 {task.assigneeFullName}
                                        </small>
                                    )}
                                    {(labels?.[task.id] ?? []).length > 0 && (
                                        <div className="kanban-labels">
                                            {(labels?.[task.id] ?? []).map((l) => (
                                                <span
                                                    key={l.id}
                                                    className="label-chip"
                                                    style={{
                                                        backgroundColor: `${l.color}20`,
                                                        color: l.color,
                                                        borderColor: `${l.color}40`,
                                                    }}
                                                >
                                                    {l.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {task.dueDate && (
                                        <small className="muted timestamp">
                                            ⏰ {new Date(task.dueDate).toLocaleDateString()}
                                        </small>
                                    )}
                                </button>
                            ))}
                            {columnTasks.length === 0 && (
                                <p className="muted small">No tasks</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
