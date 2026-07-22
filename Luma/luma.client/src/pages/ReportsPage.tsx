import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { BarChart3, ChevronRight } from 'lucide-react';
import client from '../api/client';
import type { Project } from '../types/types';

export default function ReportsPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get<Project[]>('/projects')
            .then(({ data }) => { setProjects(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <AppShell breadcrumb={<>Workspace <span className="text-text-muted">/</span> <span>Reports</span></>} title="Reports">
            <div className="mb-5">
                <h2 className="text-sm font-medium text-text-primary">Select a project</h2>
                <p className="text-xs text-text-muted mt-0.5">Choose a project to view its reports and insights</p>
            </div>
            {loading ? (
                <p className="text-xs text-text-muted">Loading...</p>
            ) : projects.length === 0 ? (
                <div className="border border-border-subtle rounded-md bg-surface-1 py-10 text-center">
                    <p className="text-xs text-text-muted">No projects found.</p>
                </div>
            ) : (
                <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => navigate(`/reports/${p.id}`)}
                            className="group flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 cursor-pointer transition-colors"
                        >
                            <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center text-text-muted flex-shrink-0">
                                <BarChart3 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-primary truncate">{p.name}</div>
                                <div className="text-[11px] text-text-muted mt-0.5 truncate">{p.description ?? 'No description'}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            )}
        </AppShell>
    );
}
