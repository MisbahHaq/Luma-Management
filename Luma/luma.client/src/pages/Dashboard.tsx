import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { tasksApi } from '../api/endpoints';
import type { Project, Task } from '../types/types';

interface ProjectStat {
    project: Project;
    taskCount: number;
    completion: number;
    lastUpdated: string | null;
}

export default function Dashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<ProjectStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const canWrite = currentUser?.role === 'Admin' || currentUser?.role === 'Member';

    const computeStats = (project: Project, tasks: Task[]): ProjectStat => {
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === 'Done').length;
        const completion = total === 0 ? 0 : Math.round((done / total) * 100);
        const lastUpdated = tasks.reduce<string | null>(
            (acc, t) => (acc === null || t.createdAt > acc ? t.createdAt : acc),
            project.createdAt,
        );
        return { project, taskCount: total, completion, lastUpdated };
    };

    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            const { data: projects } = await client.get<Project[]>('/projects');
            const enriched = await Promise.all(
                projects.map(async (p) => {
                    try {
                        const res = await tasksApi.byProject(p.id, 1, 100);
                        return computeStats(p, res.data.items);
                    } catch {
                        return computeStats(p, []);
                    }
                }),
            );
            setStats(enriched);
        } catch {
            setError('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadProjects();
    }, [loadProjects]);

    const openProject = (id: string) => navigate(`/projects/${id}`);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            await client.post<Project>('/projects', {
                name: name.trim(),
                description: description.trim() || null,
            });
            setName('');
            setDescription('');
            setShowModal(false);
            await loadProjects();
        } catch {
            setError('Failed to create project.');
        } finally {
            setSaving(false);
        }
    };

    const userName = currentUser?.fullName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User';

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="Projects">
            <div className="modern-greeting-row">
                <div>
                    <h1 className="modern-greeting">Welcome back, {userName}</h1>
                    <p className="modern-subtitle">{stats.length} project{stats.length === 1 ? '' : 's'} across your workspace</p>
                </div>
                {canWrite && (
                    <button className="modern-btn-primary" onClick={() => setShowModal(true)}>
                        + New Project
                    </button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <p className="muted">Loading...</p>
            ) : stats.length === 0 ? (
                <div className="modern-bento-card" style={{ textAlign: 'center', padding: 48 }}>
                    <p className="muted" style={{ fontSize: 15 }}>No projects yet. Create your first project to get started.</p>
                </div>
            ) : (
                <div className="modern-stats-row">
                    {stats.map((s) => (
                        <div
                            key={s.project.id}
                            className="modern-stat-card"
                            style={{ backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                            onClick={() => openProject(s.project.id)}
                        >
                            <div className="modern-stat-icon" style={{ background: 'rgba(167,139,250,0.12)' }}>
                                <span style={{ fontSize: 20 }}>📁</span>
                            </div>
                            <div className="modern-stat-info">
                                <div className="modern-stat-value">{s.project.name}</div>
                                <div className="modern-stat-label">{s.taskCount} tasks · {s.completion}% complete</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <form
                        className="card modal modal-lg"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleCreate}
                    >
                        <h3>New project</h3>
                        <label>
                            Name
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Project name"
                                autoFocus
                            />
                        </label>
                        <label>
                            Description
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description"
                                rows={3}
                            />
                        </label>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="modern-btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppShell>
    );
}
