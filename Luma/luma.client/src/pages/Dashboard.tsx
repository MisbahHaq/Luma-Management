import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import ProjectListRow from '../components/ProjectListRow';
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

    const loadProjects = async () => {
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
    };

    useEffect(() => {
        loadProjects();
    }, []);

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

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="Projects">
            <div className="section-head">
                <div>
                    <h2>All projects</h2>
                    <p className="muted small">{stats.length} project{stats.length === 1 ? '' : 's'}</p>
                </div>
                {canWrite && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + New Project
                    </button>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <p className="muted">Loading...</p>
            ) : stats.length === 0 ? (
                <p className="muted">No projects yet.</p>
            ) : (
                <div className="card table-card">
                    <table className="table project-table">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Tasks</th>
                                <th>Completion</th>
                                <th>Status</th>
                                <th>Updated</th>
                                <th>Owner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((s) => (
                                <ProjectListRow
                                    key={s.project.id}
                                    project={s.project}
                                    taskCount={s.taskCount}
                                    completion={s.completion}
                                    lastUpdated={s.lastUpdated}
                                    onOpen={() => openProject(s.project.id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <form
                        className="card modal"
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
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppShell>
    );
}
