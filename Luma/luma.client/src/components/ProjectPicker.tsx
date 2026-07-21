import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import AppShell from './AppShell';
import type { Project } from '../types/types';

interface ProjectPickerProps {
    title: string;
    subtitle?: string;
    onSelect: (project: Project) => void;
}

export default function ProjectPicker({ title, subtitle, onSelect }: ProjectPickerProps) {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
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
        void load();
    }, []);

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title={title}>
            <div className="section-head">
                <div>
                    <h2>{subtitle ?? 'Select a project'}</h2>
                    <p className="muted small">{projects.length} project{projects.length === 1 ? '' : 's'}</p>
                </div>
                <button className="btn btn-ghost" onClick={() => navigate('/')}>
                    ← Back
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <p className="muted">Loading...</p>
            ) : projects.length === 0 ? (
                <p className="muted">No projects yet.</p>
            ) : (
                <div className="card table-card">
                    <table className="table project-table">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Owner</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((p) => (
                                <tr
                                    key={p.id}
                                    className="project-row clickable"
                                    onClick={() => onSelect(p)}
                                >
                                    <td className="project-name">
                                        <span className="project-dot" />
                                        <div>
                                            <div className="project-title">{p.name}</div>
                                            {p.description && (
                                                <div className="project-desc muted small">{p.description}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="small">{p.createdByUserFullName ?? 'Unknown'}</span>
                                    </td>
                                    <td className="instrument timestamp">
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AppShell>
    );
}
