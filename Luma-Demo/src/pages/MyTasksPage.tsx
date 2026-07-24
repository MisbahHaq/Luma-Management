import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { mockTasks, STATUS_LABELS, PRIORITY_LABELS, TASK_TYPE_LABELS } from '../api/mock';
import type { TaskStatus, TaskPriority, TaskItemType } from '../types';

type FilterState = {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    type: TaskItemType | 'all';
    projectId: string | 'all';
};

export default function MyTasksPage() {
    const { user } = useAuth();
    const [filters, setFilters] = useState<FilterState>({ status: 'all', priority: 'all', type: 'all', projectId: 'all' });

    const myTasks = useMemo(() => {
        return mockTasks.filter((t) => t.assigneeId === user?.id);
    }, [user?.id]);

    const filtered = useMemo(() => {
        return myTasks.filter((t) => {
            if (filters.status !== 'all' && t.status !== filters.status) return false;
            if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
            if (filters.type !== 'all' && t.type !== filters.type) return false;
            if (filters.projectId !== 'all' && t.projectId !== filters.projectId) return false;
            return true;
        });
    }, [myTasks, filters]);

    const toggle = (key: keyof FilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="My Tasks">
            <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-surface-2 rounded p-0.5">
                        {(['all', 'ToDo', 'InProgress', 'Done'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => toggle('status', s)}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${filters.status === s ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                            >
                                {s === 'all' ? 'All' : STATUS_LABELS[s as TaskStatus]}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            value={filters.priority}
                            onChange={(e) => toggle('priority', e.target.value)}
                            className="bg-surface-2 border border-border-subtle rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
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
                            className="bg-surface-2 border border-border-subtle rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                        >
                            <option value="all">All Types</option>
                            <option value="Task">Task</option>
                            <option value="Story">Story</option>
                            <option value="Bug">Bug</option>
                            <option value="Epic">Epic</option>
                        </select>
                    </div>
                </div>

                <div className="border border-border-subtle rounded overflow-hidden bg-surface-1">
                    {filtered.length === 0 ? (
                        <div className="px-3 py-10 text-center text-xs text-text-muted">No tasks assigned to you.</div>
                    ) : (
                        filtered.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 transition-colors" style={{ borderLeft: '2px solid var(--text-primary)' }}>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-text-primary truncate">{task.title}</div>
                                    <div className="text-[11px] text-text-muted mt-0.5">
                                        <span className="font-mono tracking-wide">{task.issueKey}</span> · {STATUS_LABELS[task.status]} · {PRIORITY_LABELS[task.priority]} · {TASK_TYPE_LABELS[task.type]}
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[10px] text-text-muted font-mono">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppShell>
    );
}
