import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import client from '../api/client';
import AppShell from '../components/AppShell';
import IssueHierarchyTable from '../components/IssueHierarchyTable';
import { tasksApi, labelsApi } from '../api/endpoints';
import type { Label, Task, TaskStatus, TaskPriority, TaskItemType } from '../types/types';

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
    const [taskLabels, setTaskLabels] = useState<Record<string, Label[]>>({});

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

    useEffect(() => {
        if (tasks.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTaskLabels({});
            return;
        }
        const uniqueProjectIds = Array.from(new Set(tasks.map((t) => t.projectId)));
        let cancelled = false;
        Promise.all(
            uniqueProjectIds.map(async (pid) => {
                const { data } = await labelsApi.forProject(pid);
                return { projectId: pid, labels: data };
            }),
        ).then((results) => {
            if (cancelled) return;
            const map: Record<string, Label[]> = {};
            for (const r of results) {
                for (const l of r.labels) {
                    if (!map[l.projectId]) map[l.projectId] = [];
                    map[l.projectId].push(l);
                }
            }
            setTaskLabels(map);
        }).catch(() => setTaskLabels({}));
        return () => { cancelled = true; };
    }, [tasks]);

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

    const filterSelectClass = "bg-surface-1 border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer";

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="My Tasks">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-base font-semibold text-text-primary">My Tasks</h1>
                    <p className="text-xs text-text-muted mt-0.5">{tasks.length} task{tasks.length === 1 ? '' : 's'} assigned to you</p>
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md px-3 py-2 text-xs mb-4">{error}</div>}

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Filters</span>
                </div>
                <div className="h-4 w-px bg-border-subtle hidden sm:block" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as FilterStatus)} className={filterSelectClass}>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>
                    ))}
                </select>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)} className={filterSelectClass}>
                    {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p === 'all' ? 'All' : p}</option>
                    ))}
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as FilterType)} className={filterSelectClass}>
                    {TYPES.map((t) => (
                        <option key={t} value={t}>{t === 'all' ? 'All' : t}</option>
                    ))}
                </select>
                {projects.length > 0 && (
                    <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={filterSelectClass}>
                        <option value="all">All projects</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {loading ? (
                <div className="flex items-center gap-2 py-8">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-text-muted">Loading tasks...</span>
                </div>
            ) : tasks.length === 0 ? (
                <div className="border border-border-subtle rounded-md bg-surface-1 py-12 text-center">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                    <p className="text-sm font-medium text-text-primary mb-1">No tasks assigned</p>
                    <p className="text-xs text-text-muted">You're all caught up! Check back later or browse projects.</p>
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
                    labels={taskLabels}
                />
            )}
        </AppShell>
    );
}
