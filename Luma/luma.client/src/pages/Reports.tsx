import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi, exportApi } from '../api/endpoints';
import AppShell from '../components/AppShell';
import { Badge } from '../components/primitives/Badge';
import { FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import type {
    ProjectHealth,
    BurndownReport,
    VelocityReport,
} from '../types/types';

type Tab = 'health' | 'burndown' | 'velocity' | 'exports';

const TABS: { id: Tab; label: string }[] = [
    { id: 'health', label: 'Health' },
    { id: 'burndown', label: 'Burndown' },
    { id: 'velocity', label: 'Velocity' },
    { id: 'exports', label: 'Exports' },
];

export default function Reports() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('health');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [health, setHealth] = useState<ProjectHealth | null>(null);
    const [burndown, setBurndown] = useState<BurndownReport | null>(null);
    const [velocity, setVelocity] = useState<VelocityReport | null>(null);

    const loadHealth = async () => {
        if (!projectId) return;
        try {
            const { data } = await reportsApi.health(projectId);
            setHealth(data);
        } catch {
            setError('Failed to load project health.');
        }
    };

    const loadBurndown = async () => {
        if (!projectId) return;
        try {
            const { data } = await reportsApi.burndown(projectId);
            setBurndown(data);
        } catch {
            setError('Failed to load burndown data.');
        }
    };

    const loadVelocity = async () => {
        if (!projectId) return;
        try {
            const { data } = await reportsApi.velocity(projectId);
            setVelocity(data);
        } catch {
            setError('Failed to load velocity data.');
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([loadHealth(), loadBurndown(), loadVelocity()])
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const downloadExcel = () => {
        if (!projectId) return;
        window.open(exportApi.excel(projectId), '_blank');
    };

    const downloadPdf = () => {
        if (!projectId) return;
        window.open(exportApi.pdf(projectId), '_blank');
    };

    const downloadBurndownPdf = () => {
        if (!projectId) return;
        window.open(exportApi.burndownPdf(projectId), '_blank');
    };

    return (
        <AppShell
            breadcrumb={
                <>
                    <span className="text-text-muted cursor-pointer hover:text-text-secondary" onClick={() => navigate('/')}>Workspace</span>
                    <span className="text-text-muted">/</span>
                    <span>Reports</span>
                </>
            }
            title="Reports"
        >
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md px-3 py-2 text-xs mb-4">{error}</div>}

            {/* Tab bar */}
            <div className="flex items-center gap-0.5 bg-surface-2 rounded-lg p-0.5 w-fit mb-5">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === t.id ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-xs text-text-muted">Loading...</p>
            ) : (
                <>
                    {/* Health */}
                    {tab === 'health' && health && (
                        <div className="space-y-4">
                            <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                                <div className="px-3 py-2.5 border-b border-border-subtle flex items-center justify-between">
                                    <span className="text-sm font-medium text-text-primary">{health.projectName} Health</span>
                                    <Badge variant={health.healthStatus === 'Good' ? 'success' : health.healthStatus === 'At Risk' ? 'warning' : 'danger'}>
                                        {health.healthStatus}
                                    </Badge>
                                </div>
                                <div className="divide-y divide-border-subtle">
                                    {[
                                        { label: 'Total Tasks', value: health.totalTasks },
                                        { label: 'Completed', value: health.completedTasks },
                                        { label: 'In Progress', value: health.inProgressTasks },
                                        { label: 'To Do', value: health.todoTasks },
                                        { label: 'Overdue', value: health.overdueTasks },
                                        { label: 'Completion', value: `${health.completionPercentage}%` },
                                    ].map((stat) => (
                                        <div key={stat.label} className="flex items-center justify-between px-3 py-2">
                                            <span className="text-xs text-text-secondary">{stat.label}</span>
                                            <span className="text-sm font-medium text-text-primary font-mono tabular-nums">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {health.statusDistribution?.length > 0 && (
                                <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                                    <div className="px-3 py-2 border-b border-border-subtle text-xs font-medium text-text-secondary">Status Distribution</div>
                                    {health.statusDistribution.map((d) => (
                                        <div key={d.status} className="flex items-center justify-between px-3 py-2 border-b border-border-subtle last:border-0">
                                            <span className="text-xs text-text-secondary">{d.status}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1 bg-surface-2 rounded-full overflow-hidden">
                                                    <div className="h-full bg-accent rounded-full" style={{ width: `${d.percentage}%` }} />
                                                </div>
                                                <span className="text-[11px] font-mono tabular-nums text-text-muted w-[48px] text-right">{d.count} · {d.percentage}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {health.priorityDistribution?.length > 0 && (
                                <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                                    <div className="px-3 py-2 border-b border-border-subtle text-xs font-medium text-text-secondary">Priority Distribution</div>
                                    {health.priorityDistribution.map((d) => (
                                        <div key={d.priority} className="flex items-center justify-between px-3 py-2 border-b border-border-subtle last:border-0">
                                            <span className="text-xs text-text-secondary">{d.priority}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1 bg-surface-2 rounded-full overflow-hidden">
                                                    <div className="h-full bg-accent rounded-full" style={{ width: `${d.percentage}%` }} />
                                                </div>
                                                <span className="text-[11px] font-mono tabular-nums text-text-muted w-[48px] text-right">{d.count} · {d.percentage}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Burndown */}
                    {tab === 'burndown' && burndown && (
                        <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                            <div className="px-3 py-2.5 border-b border-border-subtle">
                                <span className="text-sm font-medium text-text-primary">{burndown.sprintName}</span>
                                <span className="text-[11px] text-text-muted ml-2">{burndown.sprintStart} — {burndown.sprintEnd}</span>
                            </div>
                            {burndown.dataPoints.length === 0 ? (
                                <div className="px-3 py-8 text-center">
                                    <p className="text-xs text-text-muted">No burndown data available.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center px-3 py-2 bg-surface-2/50 text-[11px] font-medium text-text-muted uppercase tracking-wider">
                                        <span className="flex-1">Date</span>
                                        <span className="w-20 text-right">Remaining</span>
                                        <span className="w-20 text-right">Ideal</span>
                                    </div>
                                    {burndown.dataPoints.map((point, idx) => (
                                        <div key={idx} className="flex items-center px-3 py-2 border-b border-border-subtle last:border-0">
                                            <span className="flex-1 text-xs text-text-secondary">{new Date(point.date).toLocaleDateString()}</span>
                                            <span className="w-20 text-right text-xs font-mono tabular-nums text-text-primary">{point.remainingTasks}</span>
                                            <span className="w-20 text-right text-xs font-mono tabular-nums text-text-muted">{point.idealRemaining}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Velocity */}
                    {tab === 'velocity' && velocity && (
                        <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                            <div className="px-3 py-2.5 border-b border-border-subtle flex items-center justify-between">
                                <span className="text-sm font-medium text-text-primary">{velocity.projectName}</span>
                                <span className="text-xs text-text-muted">Avg: {velocity.averageVelocity} tasks/sprint</span>
                            </div>
                            {velocity.dataPoints.length === 0 ? (
                                <div className="px-3 py-8 text-center">
                                    <p className="text-xs text-text-muted">No velocity data available.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center px-3 py-2 bg-surface-2/50 text-[11px] font-medium text-text-muted uppercase tracking-wider">
                                        <span className="flex-1">Sprint</span>
                                        <span className="w-24 text-right">Start</span>
                                        <span className="w-24 text-right">End</span>
                                        <span className="w-16 text-right">Done</span>
                                    </div>
                                    {velocity.dataPoints.map((point) => (
                                        <div key={point.sprintId} className="flex items-center px-3 py-2 border-b border-border-subtle last:border-0">
                                            <span className="flex-1 text-xs text-text-primary truncate">{point.sprintName}</span>
                                            <span className="w-24 text-right text-xs font-mono tabular-nums text-text-muted">{new Date(point.sprintStart).toLocaleDateString()}</span>
                                            <span className="w-24 text-right text-xs font-mono tabular-nums text-text-muted">{new Date(point.sprintEnd).toLocaleDateString()}</span>
                                            <span className="w-16 text-right text-xs font-mono tabular-nums text-text-primary">{point.completedTasks}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Exports */}
                    {tab === 'exports' && (
                        <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1 divide-y divide-border-subtle">
                            <button onClick={downloadExcel} className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-surface-2/50 transition-colors">
                                <FileSpreadsheet className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-text-primary">Export to Excel</div>
                                    <div className="text-[11px] text-text-muted">Download all project data as .xlsx</div>
                                </div>
                            </button>
                            <button onClick={downloadPdf} className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-surface-2/50 transition-colors">
                                <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-text-primary">Export Project PDF</div>
                                    <div className="text-[11px] text-text-muted">Download project summary as .pdf</div>
                                </div>
                            </button>
                            <button onClick={downloadBurndownPdf} className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-surface-2/50 transition-colors">
                                <Calendar className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-text-primary">Export Burndown PDF</div>
                                    <div className="text-[11px] text-text-muted">Download burndown chart as .pdf</div>
                                </div>
                            </button>
                        </div>
                    )}
                </>
            )}
        </AppShell>
    );
}
