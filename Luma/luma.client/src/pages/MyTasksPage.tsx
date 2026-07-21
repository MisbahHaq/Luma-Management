import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import AppShell from '../components/AppShell';
import IssueHierarchyTable from '../components/IssueHierarchyTable';
import { tasksApi } from '../api/endpoints';
import type { Task, TaskStatus, TaskPriority, TaskItemType } from '../types/types';

type FilterStatus = TaskStatus | 'all';
type FilterPriority = TaskPriority | 'all';
type FilterType = TaskItemType | 'all';

const STATUSES: FilterStatus[] = ['all', 'ToDo', 'InProgress', 'Done'];
const PRIORITIES: FilterPriority[] = ['all', 'Low', 'Medium', 'High', 'Critical'];
const TYPES: FilterType[] = ['all', 'Task', 'Story', 'Bug', 'Epic'];

export default function MyTasksPage() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
    const [typeFilter, setTypeFilter] = useState<FilterType>('all');
    const [projectFilter, setProjectFilter] = useState<string>('all');
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await tasksApi.myTasks({
                page: 1,
                pageSize: 100,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                priority: priorityFilter !== 'all' ? priorityFilter : undefined,
                type: typeFilter !== 'all' ? typeFilter : undefined,
                projectId: projectFilter !== 'all' ? projectFilter : undefined,
            });
            setTasks(data.items);
            setError(null);
        } catch {
            setError('Failed to load your tasks.');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, priorityFilter, typeFilter, projectFilter]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    useEffect(() => {
        client.get<{ id: string; name: string }[]>('/projects')
            .then(({ data }) => setProjects(data))
            .catch(() => setProjects([]));
    }, []);

    const handleOpenTask = useCallback((task: Task) => {
        navigate(`/projects/${task.projectId}`);
    }, [navigate]);

    const handleDelete = useCallback(async (task: Task) => {
        await tasksApi.remove(task.id);
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
    }, []);

    const handleToggleDone = useCallback(async (task: Task) => {
        const newStatus = task.status === 'Done' ? 'ToDo' : 'Done';
        await tasksApi.move(task.id, newStatus);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    }, []);

    const handleQuickAdd = useCallback(async (parentId: string | null, type: TaskItemType) => {
        const title = prompt(`${type} title:`);
        if (!title?.trim()) return;
        const { data } = await tasksApi.create({
            title: title.trim(),
            type,
            parentTaskId: parentId,
            projectId: tasks[0]?.projectId || '',
            status: 'ToDo',
            priority: 'Medium',
        });
        setTasks((prev) => [...prev, data]);
    }, [tasks]);

    const groupedTasks = useMemo(() => {
        if (statusFilter !== 'all') return tasks;
        return tasks;
    }, [tasks, statusFilter]);

    const canEdit = true;

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="My Tasks">
            <div className="modern-greeting-row">
                <div>
                    <h1 className="modern-greeting">My Tasks</h1>
                    <p className="modern-subtitle">{tasks.length} task{tasks.length === 1 ? '' : 's'} assigned to you</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="modern-view-toggle" style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ marginBottom: 0, fontSize: 13, color: '#71717A' }}>
                        Status
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                            style={{ padding: '6px 10px', fontSize: 13 }}
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>
                            ))}
                        </select>
                    </label>
                    <label style={{ marginBottom: 0, fontSize: 13, color: '#71717A' }}>
                        Priority
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
                            style={{ padding: '6px 10px', fontSize: 13 }}
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>{p === 'all' ? 'All' : p}</option>
                            ))}
                        </select>
                    </label>
                    <label style={{ marginBottom: 0, fontSize: 13, color: '#71717A' }}>
                        Type
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                            style={{ padding: '6px 10px', fontSize: 13 }}
                        >
                            {TYPES.map((t) => (
                                <option key={t} value={t}>{t === 'all' ? 'All' : t}</option>
                            ))}
                        </select>
                    </label>
                    {projects.length > 0 && (
                        <label style={{ marginBottom: 0, fontSize: 13, color: '#71717A' }}>
                            Project
                            <select
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                                style={{ padding: '6px 10px', fontSize: 13 }}
                            >
                                <option value="all">All projects</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            </div>

            {loading ? (
                <p className="muted">Loading...</p>
            ) : tasks.length === 0 ? (
                <div className="modern-bento-card" style={{ textAlign: 'center', padding: 48 }}>
                    <p className="muted" style={{ fontSize: 15 }}>No tasks assigned to you yet.</p>
                </div>
            ) : (
                <IssueHierarchyTable
                    tasks={groupedTasks}
                    members={[]}
                    canEdit={canEdit}
                    onOpenTask={handleOpenTask}
                    onToggleDone={handleToggleDone}
                    onDelete={handleDelete}
                    onQuickAdd={handleQuickAdd}
                />
            )}
        </AppShell>
    );
}
