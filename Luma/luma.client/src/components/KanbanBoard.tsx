import { useState } from 'react';
import type { Task, TaskStatus } from '../types/types';
import { STATUS_LABELS, PRIORITY_LABELS } from '../types/types';
import { tasksApi } from '../api/endpoints';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onTaskMoved: (taskId: string, status: TaskStatus) => void;
}

const COLUMNS: TaskStatus[] = ['ToDo', 'InProgress', 'Done'];

export default function KanbanBoard({ tasks, onTaskClick, onTaskMoved }: KanbanBoardProps) {
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
                                    className="card task-card"
                                    draggable
                                    onDragStart={() => setDragId(task.id)}
                                    onClick={() => onTaskClick(task)}
                                >
                                    <span className={`priority priority-${task.priority}`}>
                                        {PRIORITY_LABELS[task.priority]}
                                    </span>
                                    <h4>{task.title}</h4>
                                    {task.assigneeFullName && (
                                        <small className="muted">
                                            👤 {task.assigneeFullName}
                                        </small>
                                    )}
                                    {task.dueDate && (
                                        <small className="muted">
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
