import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types/types';

export default function Dashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const canWrite = currentUser?.role === 'Admin' || currentUser?.role === 'Member';

    const loadProjects = async () => {
        setLoading(true);
        try {
            const { data } = await client.get<Project[]>('/projects');
            setProjects(data);
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
        <div className="page">
            <header className="topbar">
                <h1>Luma</h1>
                <div className="topbar-right">
                    <span className="muted">
                        {currentUser?.fullName ?? currentUser?.email} ({currentUser?.role})
                    </span>
                    <button className="btn btn-ghost" onClick={logout}>
                        Sign out
                    </button>
                </div>
            </header>

            <main className="container">
                <div className="section-head">
                    <h2>Projects</h2>
                    {canWrite && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            + New Project
                        </button>
                    )}
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <p className="muted">Loading...</p>
                ) : projects.length === 0 ? (
                    <p className="muted">No projects yet.</p>
                ) : (
                    <div className="grid">
                        {projects.map((p) => (
                            <button
                                key={p.id}
                                className="card project-card"
                                onClick={() => openProject(p.id)}
                            >
                                <h3>{p.name}</h3>
                                <p className="muted">{p.description ?? 'No description'}</p>
                                <small className="muted">
                                    Created by {p.createdByUserFullName ?? 'Unknown'}
                                </small>
                            </button>
                        ))}
                    </div>
                )}
            </main>

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
        </div>
    );
}
