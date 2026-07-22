import { useEffect, useState, type FormEvent } from 'react';
import { Plus, ChevronRight, X, Timer } from 'lucide-react';
import {
    sprintsApi,
} from '../api/endpoints';
import {
    SPRINT_STATUS_LABELS,
    type Sprint,
    type SprintStatus,
    type Task,
} from '../types/types';
import { Badge } from './primitives/Badge';
import { Button } from './primitives/Button';

interface SprintsPanelProps {
    projectId: string;
    tasks: Task[];
    canEdit: boolean;
    onTasksChanged: () => void;
}

const SPRINT_STATUSES: SprintStatus[] = ['Planned', 'Active', 'Completed'];

const STATUS_LABELS: Record<Task['status'], string> = {
    ToDo: 'To Do',
    InProgress: 'In Progress',
    Done: 'Done',
};

const SPRINT_STATUS_LABELS_MAP: Record<SprintStatus, string> = {
    Planned: 'Planned',
    Active: 'Active',
    Completed: 'Completed',
};

export default function SprintsPanel({
    projectId,
    tasks,
    canEdit,
    onTasksChanged,
}: SprintsPanelProps) {
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<SprintStatus>('Planned');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            const { data } = await sprintsApi.forProject(projectId);
            setSprints(data);
        } catch {
            setError('Failed to load sprints.');
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const create = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await sprintsApi.create({
                name: name.trim(),
                description: description.trim() || null,
                status,
                startDate: startDate || null,
                endDate: endDate || null,
                projectId,
            });
            setName('');
            setDescription('');
            setStatus('Planned');
            setStartDate('');
            setEndDate('');
            setShowCreate(false);
            await load();
        } catch {
            setError('Failed to create sprint.');
        } finally {
            setSaving(false);
        }
    };

    const assignTask = async (sprintId: string, taskId: string) => {
        try {
            await sprintsApi.addTask(sprintId, taskId);
            await load();
            onTasksChanged();
        } catch {
            setError('Failed to assign task to sprint.');
        }
    };

    const unassignTask = async (sprintId: string, taskId: string) => {
        try {
            await sprintsApi.removeTask(sprintId, taskId);
            await load();
            onTasksChanged();
        } catch {
            setError('Failed to remove task from sprint.');
        }
    };

    return (
        <div className="card sprints-panel">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    Sprints
                </h3>
                {canEdit && (
                    <Button size="sm" onClick={() => setShowCreate((s) => !s)}>
                        <Plus className="w-3.5 h-3.5" />
                        New Sprint
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md px-3 py-2 text-xs mb-4">
                    {error}
                </div>
            )}

            {showCreate && canEdit && (
                <form className="bg-surface-2/50 border border-border-subtle rounded-lg p-3 mb-4" onSubmit={create}>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Sprint name"
                        autoFocus
                        className="bg-surface-1 border border-border-subtle rounded-md px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors w-full"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Goal / description"
                        rows={2}
                        className="bg-surface-1 border border-border-subtle rounded-md px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors w-full mt-2"
                    />
                    <div className="flex gap-2 mt-2">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as SprintStatus)}
                            className="bg-surface-1 border border-border-subtle rounded-md px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors w-full"
                        >
                            {SPRINT_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {SPRINT_STATUS_LABELS[s]}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-surface-1 border border-border-subtle rounded-md px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors w-full"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-surface-1 border border-border-subtle rounded-md px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors w-full"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" disabled={saving}>
                            {saving ? 'Saving...' : 'Create'}
                        </Button>
                    </div>
                </form>
            )}

            {sprints.length === 0 ? (
                <div className="text-center py-8">
                    <Timer className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                    <p className="text-xs text-text-secondary mb-1">No sprints yet</p>
                    <p className="text-[11px] text-text-muted">Create your first sprint to start tracking progress</p>
                </div>
            ) : (
                <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                    {sprints.map((s) => {
                        const sprintTasks = tasks.filter((t) => t.sprintId === s.id);
                        const done = sprintTasks.filter((t) => t.status === 'Done').length;
                        const pct = sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0;
                        const unassigned = tasks.filter((t) => !t.sprintId);

                        return (
                            <div key={s.id} className="border-b border-border-subtle last:border-0">
                                <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2/50 transition-colors">
                                    <button
                                        onClick={() => setExpanded((cur) => (cur === s.id ? null : s.id))}
                                        className="p-0.5 rounded hover:bg-surface-1 text-text-muted hover:text-text-secondary transition-colors"
                                    >
                                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${expanded === s.id ? 'rotate-90' : ''}`} />
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-text-primary truncate">{s.name}</span>
                                            <Badge variant={s.status === 'Active' ? 'info' : s.status === 'Completed' ? 'success' : 'default'}>
                                                {SPRINT_STATUS_LABELS_MAP[s.status]}
                                            </Badge>
                                        </div>
                                        {s.description && (
                                            <p className="text-[11px] text-text-muted mt-0.5 truncate">{s.description}</p>
                                        )}
                                    </div>

                                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[11px] text-text-muted font-mono tabular-nums">{sprintTasks.length} tasks</span>
                                        <div className="w-16 h-1 bg-surface-2 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[10px] font-mono tabular-nums text-text-muted w-[32px] text-right">{pct}%</span>
                                    </div>
                                </div>

                                {expanded === s.id && (
                                    <div className="px-3 pb-3 pl-10">
                                        {sprintTasks.length === 0 ? (
                                            <p className="text-xs text-text-muted py-2">No tasks in this sprint.</p>
                                        ) : (
                                            <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1 mb-3">
                                                {sprintTasks.map((t) => (
                                                    <div key={t.id} className="flex items-center gap-2 px-2.5 py-2 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 transition-colors">
                                                        <span className="text-xs font-mono text-text-muted tabular-nums w-[70px] flex-shrink-0">{t.issueKey}</span>
                                                        <span className="text-sm text-text-primary flex-1 truncate">{t.title}</span>
                                                        <Badge variant={t.status === 'Done' ? 'success' : t.status === 'InProgress' ? 'info' : 'default'}>
                                                            {STATUS_LABELS[t.status]}
                                                        </Badge>
                                                        {canEdit && (
                                                            <button
                                                                type="button"
                                                                className="p-1 rounded-md hover:bg-surface-1 text-text-muted hover:text-red-400 transition-colors"
                                                                onClick={() => void unassignTask(s.id, t.id)}
                                                                title="Remove from sprint"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {canEdit && unassigned.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    defaultValue=""
                                                    className="flex-1 bg-surface-1 border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            void assignTask(s.id, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                >
                                                    <option value="">Add task to sprint…</option>
                                                    {unassigned.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
