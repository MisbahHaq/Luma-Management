import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockDashboard, mockProjects } from '../api/mock';

export default function Reports() {
    const { projectId } = useParams<{ projectId: string }>();
    const project = mockProjects.find((p) => p.id === projectId);
    const health = useMemo(() => mockDashboard.projects.find((p) => p.projectId === projectId), [projectId]);

    if (!project || !health) {
        return (
            <div className="max-w-7xl mx-auto">
                <p className="text-text-muted text-xs">Project not found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            <div>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                    <Link to="/reports" className="hover:text-text-secondary">Reports</Link>
                    <span>/</span>
                    <span className="text-text-primary">{project.name}</span>
                </div>
                <h1 className="text-base font-semibold text-text-primary">{project.name} Reports</h1>
                <p className="text-xs text-text-muted mt-1">Burndown, velocity, and health metrics for this project.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Total Tasks</div>
                    <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{health.totalTasks}</div>
                </div>
                <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Completion</div>
                    <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{health.completionPercentage}%</div>
                </div>
                <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Overdue</div>
                    <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{health.overdueTasks}</div>
                </div>
                <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Time Logged</div>
                    <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{health.totalTimeLoggedHours}h</div>
                </div>
            </div>

            <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
                <h2 className="text-sm font-semibold text-text-primary mb-3">Status Distribution</h2>
                <div className="space-y-2">
                    {health.statusDistribution.map((s) => (
                        <div key={s.status} className="flex items-center gap-3">
                            <div className="w-24 text-xs text-text-secondary">{s.status}</div>
                            <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${s.percentage}%` }} />
                            </div>
                            <div className="w-12 text-right text-[11px] font-mono tabular-nums text-text-muted">{s.count}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
                <h2 className="text-sm font-semibold text-text-primary mb-3">Assignee Workload</h2>
                <div className="space-y-2">
                    {health.assigneeWorkload.map((a) => (
                        <div key={a.assigneeId} className="flex items-center gap-3">
                            <div className="flex-1 text-sm text-text-primary truncate">{a.assigneeName}</div>
                            <div className="text-xs text-text-muted">{a.taskCount} tasks</div>
                            <div className="text-xs text-text-muted">{a.totalHoursLogged}h logged</div>
                        </div>
                    ))}
                    {health.assigneeWorkload.length === 0 && (
                        <div className="text-xs text-text-muted">No assignees yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
