import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { milestonesApi } from '../api/endpoints';
import type { Milestone, Task, MilestoneStatus } from '../types/types';

interface MilestonesPanelProps {
    projectId: string;
    tasks: Task[];
    canEdit: boolean;
    onTasksChanged: () => void;
}

export default function MilestonesPanel({ projectId, tasks, canEdit, onTasksChanged }: MilestonesPanelProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDueDate, setEditDueDate] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await milestonesApi.forProject(projectId);
            setMilestones(data);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            await milestonesApi.create(projectId, {
                name: name.trim(),
                description: description.trim() || null,
                dueDate: dueDate || null,
            });
            setName('');
            setDescription('');
            setDueDate('');
            setShowCreate(false);
            await load();
        } catch {
            // ignore
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (milestone: Milestone) => {
        setSaving(true);
        try {
            await milestonesApi.update(milestone.id, {
                name: editName.trim() || undefined,
                description: editDescription.trim() || undefined,
                dueDate: editDueDate || undefined,
            });
            setEditingId(null);
            await load();
        } catch {
            // ignore
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this milestone?')) return;
        try {
            await milestonesApi.remove(id);
            await load();
            onTasksChanged();
        } catch {
            // ignore
        }
    };

    const handleStatusToggle = async (milestone: Milestone) => {
        const next: MilestoneStatus = milestone.status === 'Open' ? 'Completed' : 'Open';
        try {
            await milestonesApi.update(milestone.id, { status: next });
            await load();
        } catch {
            // ignore
        }
    };

    const handleAssignTask = async (milestoneId: string, taskId: string) => {
        try {
            await milestonesApi.addTask(milestoneId, taskId);
            await load();
            onTasksChanged();
        } catch {
            // ignore
        }
    };

    const handleUnassignTask = async (milestoneId: string, taskId: string) => {
        try {
            await milestonesApi.removeTask(milestoneId, taskId);
            await load();
            onTasksChanged();
        } catch {
            // ignore
        }
    };

    const unassignedTasks = tasks.filter(t => !t.milestoneId);

    return (
        <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Milestones</h3>
                {canEdit && (
                    <button className="modern-btn-primary" onClick={() => setShowCreate(true)}>
                        + New Milestone
                    </button>
                )}
            </div>

            {loading ? (
                <p className="muted">Loading...</p>
            ) : milestones.length === 0 ? (
                <p className="muted">No milestones yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {milestones.map((m) => (
                        <div key={m.id} className="modern-bento-card" style={{ padding: 16 }}>
                            {editingId === m.id ? (
                                <form onSubmit={(e) => { e.preventDefault(); void handleUpdate(m); }}>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Milestone name"
                                        style={{ width: '100%', marginBottom: 8 }}
                                        autoFocus
                                    />
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Description"
                                        rows={2}
                                        style={{ width: '100%', marginBottom: 8 }}
                                    />
                                    <input
                                        type="date"
                                        value={editDueDate}
                                        onChange={(e) => setEditDueDate(e.target.value)}
                                        style={{ width: '100%', marginBottom: 8 }}
                                    />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button type="submit" className="modern-btn-primary" disabled={saving}>
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 16 }}>{m.name}</div>
                                            {m.description && <div style={{ color: '#71717A', fontSize: 14, marginTop: 4 }}>{m.description}</div>}
                                            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: '#71717A' }}>
                                                {m.dueDate && <span>Due: {new Date(m.dueDate).toLocaleDateString()}</span>}
                                                <span>{m.taskCount} tasks</span>
                                                <span>{m.progressPercentage}% complete</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <button
                                                className={`btn ${m.status === 'Open' ? 'btn-primary' : 'btn-ghost'}`}
                                                onClick={() => handleStatusToggle(m)}
                                                style={{ fontSize: 12 }}
                                            >
                                                {m.status === 'Open' ? 'Mark Complete' : 'Reopen'}
                                            </button>
                                            {canEdit && (
                                                <>
                                                    <button className="btn btn-ghost" onClick={() => {
                                                        setEditingId(m.id);
                                                        setEditName(m.name);
                                                        setEditDescription(m.description ?? '');
                                                        setEditDueDate(m.dueDate ?? '');
                                                    }}>Edit</button>
                                                    <button className="btn btn-ghost" onClick={() => handleDelete(m.id)} style={{ color: '#DC2626' }}>Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${m.progressPercentage}%`, height: '100%', background: '#7C3AED', borderRadius: 3 }} />
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div style={{ marginTop: 12 }}>
                                            <select
                                                className="modern-select"
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        void handleAssignTask(m.id, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Assign task...</option>
                                                {unassignedTasks.map(t => (
                                                    <option key={t.id} value={t.id}>{t.issueKey} - {t.title}</option>
                                                ))}
                                            </select>
                                            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {tasks.filter(t => t.milestoneId === m.id).map(t => (
                                                    <span key={t.id} className="modern-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                        {t.issueKey} - {t.title}
                                                        <button onClick={() => handleUnassignTask(m.id, t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
                    <form className="modal modal-lg" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
                        <div className="modal-head">
                            <h3>New milestone</h3>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>✕</button>
                        </div>
                        <label>
                            Name
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Milestone name" autoFocus />
                        </label>
                        <label>
                            Description
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional" />
                        </label>
                        <label>
                            Due date
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </label>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button type="submit" className="modern-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
