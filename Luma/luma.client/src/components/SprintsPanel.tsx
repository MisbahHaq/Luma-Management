import { useEffect, useState, type FormEvent } from 'react';
import {
    sprintsApi,
} from '../api/endpoints';
import {
    SPRINT_STATUS_LABELS,
    type Sprint,
    type SprintStatus,
    type Task,
} from '../types/types';

interface SprintsPanelProps {
    projectId: string;
    tasks: Task[];
    canEdit: boolean;
    onTasksChanged: () => void;
}

const SPRINT_STATUSES: SprintStatus[] = ['Planned', 'Active', 'Completed'];

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
            <div className="section-head">
                <h4>Sprints &amp; Milestones</h4>
                {canEdit && (
                    <button className="btn btn-primary small" onClick={() => setShowCreate((s) => !s)}>
                        + New Sprint
                    </button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {showCreate && canEdit && (
                <form className="sprint-form" onSubmit={create}>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Sprint name"
                        autoFocus
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Goal / description"
                        rows={2}
                    />
                    <div className="form-row">
                        <select value={status} onChange={(e) => setStatus(e.target.value as SprintStatus)}>
                            {SPRINT_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {SPRINT_STATUS_LABELS[s]}
                                </option>
                            ))}
                        </select>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost small" onClick={() => setShowCreate(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary small" disabled={saving}>
                            {saving ? 'Saving...' : 'Create'}
                        </button>
                    </div>
                </form>
            )}

            {sprints.length === 0 ? (
                <p className="muted small">No sprints yet.</p>
            ) : (
                <ul className="sprint-list">
                    {sprints.map((s) => {
                        const sprintTasks = tasks.filter((t) => t.sprintId === s.id);
                        const done = sprintTasks.filter((t) => t.status === 'Done').length;
                        const pct = sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0;
                        const unassigned = tasks.filter((t) => !t.sprintId);
                        return (
                            <li key={s.id} className="sprint">
                                <button
                                    className="sprint-head"
                                    onClick={() => setExpanded((cur) => (cur === s.id ? null : s.id))}
                                >
                                    <span>
                                        <strong>{s.name}</strong>{' '}
                                        <span className={`tag tag-${s.status.toLowerCase()}`}>
                                            {SPRINT_STATUS_LABELS[s.status]}
                                        </span>
                                    </span>
                                    <small className="muted">
                                        {sprintTasks.length} tasks · {pct}% done
                                    </small>
                                </button>

                                <div className="progress">
                                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                                </div>

                                {s.description && <p className="muted small">{s.description}</p>}

                                {expanded === s.id && (
                                    <div className="sprint-detail">
                                        {sprintTasks.length === 0 ? (
                                            <p className="muted small">No tasks in this sprint.</p>
                                        ) : (
                                            <ul className="sprint-task-list">
                                                {sprintTasks.map((t) => (
                                                    <li key={t.id}>
                                                        <span>{t.title}</span>
                                                        <span className={`tag tag-${t.status.toLowerCase()}`}>
                                                            {t.status}
                                                        </span>
                                                        {canEdit && (
                                                            <button
                                                                className="btn btn-ghost small"
                                                                onClick={() => void unassignTask(s.id, t.id)}
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {canEdit && unassigned.length > 0 && (
                                            <div className="sprint-add">
                                                <select
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            void assignTask(s.id, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                >
                                                    <option value="">Add task to sprint…</option>
                                                    {unassigned.map((t) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
