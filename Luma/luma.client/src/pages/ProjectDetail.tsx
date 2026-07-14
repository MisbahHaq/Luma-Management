import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetailModal from '../components/TaskDetailModal';
import {
    PRIORITY_LABELS,
    STATUS_LABELS,
    type Project,
    type Task,
    type TaskPriority,
    type TaskStatus,
} from '../types/types';

type ViewMode = 'list' | 'kanban';

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [view, setView] = useState<ViewMode>('kanban');
    const [selected, setSelected] = useState<Task | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
    const [saving, setSaving] = useState(false);

    const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Member';

    const load = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [projRes, tasksRes] = await Promise.all([
                client.get<Project>(`/projects/${id}`),
                client.get<Task[]>(`/tasks/project/${id}`),
            ]);
            setProject(projRes.data);
            setTasks(tasksRes.data);
        } catch {
            setError('Failed to load project.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleTaskSaved = (updated: Task) => {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSelected(updated);
    };

    const createTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !id) return;
        setSaving(true);
        setError(null);
        try {
            const { data } = await client.post<Task>('/tasks', {
                title: title.trim(),
                description: description.trim() || null,
                status: 'ToDo' as TaskStatus,
                priority: newPriority,
                projectId: id,
                assigneeId: null,
            });
            setTasks((prev) => [...prev, data]);
            setTitle('');
            setDescription('');
            setNewPriority('Medium');
            setShowCreate(false);
        } catch {
            setError('Failed to create task.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page">
            <header className="topbar">
                <button className="btn btn-ghost" onClick={() => navigate('/')}>
                    ← Back
                </button>
                <div className="topbar-right">
                    <button
                        className={view === 'list' ? 'btn btn-active' : 'btn btn-ghost'}
                        onClick={() => setView('list')}
                    >
                        List
                    </button>
                    <button
                        className={view === 'kanban' ? 'btn btn-active' : 'btn btn-ghost'}
                        onClick={() => setView('kanban')}
                    >
                        Kanban
                    </button>
                </div>
            </header>

            <main className="container">
                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <p className="muted">Loading...</p>
                ) : project ? (
                    <>
                        <div className="section-head">
                            <div>
                                <h2>{project.name}</h2>
                                <p className="muted">{project.description ?? 'No description'}</p>
                            </div>
                            {canEdit && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowCreate(true)}
                                >
                                    + New Task
                                </button>
                            )}
                        </div>

                        {view === 'kanban' ? (
                            <KanbanBoard tasks={tasks} onTaskClick={setSelected} />
                        ) : (
                            <div className="card">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Assignee</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="clickable"
                                                onClick={() => setSelected(t)}
                                            >
                                                <td>{t.title}</td>
                                                <td>{STATUS_LABELS[t.status]}</td>
                                                <td>{PRIORITY_LABELS[t.priority]}</td>
                                                <td>{t.assigneeFullName ?? 'Unassigned'}</td>
                                            </tr>
                                        ))}
                                        {tasks.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="muted">
                                                    No tasks yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="muted">Project not found.</p>
                )}
            </main>

            {selected && (
                <TaskDetailModal
                    task={selected}
                    canEdit={canEdit}
                    onClose={() => setSelected(null)}
                    onSaved={handleTaskSaved}
                />
            )}

            {showCreate && (
                <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
                    <form
                        className="card modal"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={createTask}
                    >
                        <h3>New task</h3>
                        <label>
                            Title
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                                autoFocus
                            />
                        </label>
                        <label>
                            Description
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Optional"
                            />
                        </label>
                        <label>
                            Priority
                            <select
                                value={newPriority}
                                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {PRIORITY_LABELS[p]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setShowCreate(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Add task'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
