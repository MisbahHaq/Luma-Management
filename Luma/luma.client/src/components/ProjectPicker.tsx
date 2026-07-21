import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import AppShell from './AppShell';
import Avatar from './Avatar';
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, []);

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title={title}>
            <div className="modern-greeting-row">
                <div>
                    <h1 className="modern-greeting">{title}</h1>
                    <p className="modern-subtitle">{subtitle ?? 'Select a project'}</p>
                </div>
                <button className="modern-btn-primary" onClick={() => navigate('/')}>
                    Back to Home
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <p className="muted">Loading...</p>
            ) : projects.length === 0 ? (
                <div className="modern-bento-card" style={{ textAlign: 'center', padding: 48 }}>
                    <p className="muted" style={{ fontSize: 15 }}>No projects yet.</p>
                </div>
            ) : (
                <div className="modern-stats-row">
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            className="modern-stat-card"
                            style={{ backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                            onClick={() => onSelect(p)}
                        >
                            <div className="modern-stat-icon" style={{ background: 'rgba(167,139,250,0.12)' }}>
                                <span style={{ fontSize: 20 }}>📁</span>
                            </div>
                            <div className="modern-stat-info">
                                <div className="modern-stat-value">{p.name}</div>
                                <div className="modern-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                    <Avatar name={p.createdByUserFullName} size={20} />
                                    <span>{p.createdByUserFullName ?? 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AppShell>
    );
}
