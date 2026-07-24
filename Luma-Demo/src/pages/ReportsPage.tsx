import { useMemo } from 'react';
import AppShell from '../components/AppShell';
import { mockDashboard } from '../api/mock';

export default function ReportsPage() {
    const projectHealths = useMemo(() => mockDashboard.projects, []);

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="Reports">
            <div className="max-w-7xl mx-auto space-y-5">
            <div>
                <h1 className="text-base font-semibold text-text-primary">Reports & Analytics</h1>
                <p className="text-xs text-text-muted mt-1">Project health, burndown, and velocity insights.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Total Projects</div>
                    <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{mockDashboard.totalProjects}</div>
                </div>
                <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Completed</div>
                    <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{mockDashboard.completedTasks}</div>
                </div>
                <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">In Progress</div>
                    <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{mockDashboard.inProgressTasks}</div>
                </div>
                <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Overdue</div>
                    <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{mockDashboard.overdueTasks}</div>
                </div>
            </div>

            <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
                <h2 className="text-sm font-semibold text-text-primary mb-3">Project Health</h2>
                <div className="space-y-3">
                    {projectHealths.map((p) => (
                        <div key={p.projectId} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-primary truncate">{p.projectName}</div>
                                <div className="text-[11px] text-text-muted mt-0.5">{p.completionPercentage}% complete · {p.overdueTasks} overdue</div>
                            </div>
                            <div className="w-32 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, p.completionPercentage)}%` }} />
                            </div>
                            <span className="text-[11px] font-mono tabular-nums text-text-muted w-[36px] text-right">{Math.round(p.completionPercentage)}%</span>
                        </div>
                    ))}
                </div>
            </div>
            </div>
        </AppShell>
    );
}
