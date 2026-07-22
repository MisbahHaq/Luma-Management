import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { Timer, ChevronRight } from 'lucide-react';
import client from '../api/client';
import type { Project } from '../types/types';
import { sprintsApi } from '../api/endpoints';

export default function SprintsPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [sprintCounts, setSprintCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        client.get<Project[]>('/projects')
            .then(async ({ data }) => {
                if (cancelled) return;
                setProjects(data);
                const counts: Record<string, number> = {};
                await Promise.all(
                    data.map(async (p) => {
                        try {
                            const { data: sprints } = await sprintsApi.forProject(p.id);
                            counts[p.id] = sprints.length;
                        } catch {
                            counts[p.id] = 0;
                        }
                    })
                );
                if (!cancelled) setSprintCounts(counts);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return (
        <AppShell breadcrumb={<>Workspace <span className="text-text-muted">/</span> <span>Sprints</span></>} title="Sprints">
            <div className="mb-5">
                <h2 className="text-sm font-medium text-text-primary">All sprints</h2>
                <p className="text-xs text-text-muted mt-0.5">Select a project to manage its sprints</p>
            </div>
            {loading ? (
                <p className="text-xs text-text-muted">Loading...</p>
            ) : projects.length === 0 ? (
                <div className="border border-border-subtle rounded-md bg-surface-1 py-10 text-center">
                    <p className="text-xs text-text-muted">No projects found.</p>
                </div>
            ) : (
                <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                    {projects.map((p) => {
                        const count = sprintCounts[p.id] ?? 0;
                        return (
                            <div
                                key={p.id}
                                onClick={() => navigate(`/projects/${p.id}`)}
                                className="group flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 cursor-pointer transition-colors"
                            >
                                <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center text-text-muted flex-shrink-0">
                                    <Timer className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-text-primary truncate">{p.name}</div>
                                    <div className="text-[11px] text-text-muted mt-0.5">
                                        {count} sprint{count === 1 ? '' : 's'}
                                    </div>
                                </div>
                                <span className="text-[11px] font-mono tabular-nums text-text-muted flex-shrink-0">{count}</span>
                                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        );
                    })}
                </div>
            )}
        </AppShell>
    );
}
