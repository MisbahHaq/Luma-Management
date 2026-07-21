import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi, exportApi } from '../api/endpoints';
import AppShell from '../components/AppShell';
import type {
    ProjectHealth,
    BurndownReport,
    VelocityReport,
} from '../types/types';

type Tab = 'health' | 'burndown' | 'velocity' | 'exports';

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
                    <span className="crumb-link" onClick={() => navigate('/')}>Workspace</span>
                    <span className="crumb-sep">›</span>
                    <span>Reports</span>
                </>
            }
            title="Reports & Insights"
        >
            <main className="modern-content">
                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <p className="muted">Loading...</p>
                ) : (
                    <>
                        <div className="modern-view-toggle">
                            {(['health', 'burndown', 'velocity', 'exports'] as const).map((t) => (
                                <button
                                    key={t}
                                    className={`modern-view-btn ${tab === t ? 'active' : ''}`}
                                    onClick={() => setTab(t)}
                                >
                                    {t === 'health' ? 'Project Health' : t === 'burndown' ? 'Burndown' : t === 'velocity' ? 'Velocity' : 'Exports'}
                                </button>
                            ))}
                        </div>

                        {tab === 'health' && health && (
                            <div className="modern-bento-card">
                                <h3 className="modern-bento-title">{health.projectName} - Health</h3>
                                <div className="stats-grid">
                                    <div className="stat">
                                        <span className="stat-value">{health.totalTasks}</span>
                                        <span className="stat-label">Total Tasks</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{health.completedTasks}</span>
                                        <span className="stat-label">Completed</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{health.inProgressTasks}</span>
                                        <span className="stat-label">In Progress</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{health.todoTasks}</span>
                                        <span className="stat-label">To Do</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{health.overdueTasks}</span>
                                        <span className="stat-label">Overdue</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{health.completionPercentage}%</span>
                                        <span className="stat-label">Completion</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: 16 }}>
                                    <strong>Status: </strong>
                                    <span className={`badge ${health.healthStatus === 'Good' ? 'badge-success' : health.healthStatus === 'At Risk' ? 'badge-warning' : 'badge-danger'}`}>
                                        {health.healthStatus}
                                    </span>
                                </div>
                            </div>
                        )}

                        {tab === 'burndown' && burndown && (
                            <div className="modern-bento-card">
                                <h3 className="modern-bento-title">{burndown.sprintName} - Burndown</h3>
                                {burndown.dataPoints.length === 0 ? (
                                    <p className="muted">No burndown data available.</p>
                                ) : (
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Remaining</th>
                                                <th>Ideal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {burndown.dataPoints.map((point, idx) => (
                                                <tr key={idx}>
                                                    <td className="timestamp">{new Date(point.date).toLocaleDateString()}</td>
                                                    <td>{point.remainingTasks}</td>
                                                    <td>{point.idealRemaining}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {tab === 'velocity' && velocity && (
                            <div className="modern-bento-card">
                                <h3 className="modern-bento-title">Velocity - {velocity.projectName}</h3>
                                <p style={{ marginBottom: 12 }}><strong>Average Velocity:</strong> {velocity.averageVelocity} tasks/sprint</p>
                                {velocity.dataPoints.length === 0 ? (
                                    <p className="muted">No velocity data available.</p>
                                ) : (
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Sprint</th>
                                                <th>Start</th>
                                                <th>End</th>
                                                <th>Completed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {velocity.dataPoints.map((point) => (
                                                <tr key={point.sprintId}>
                                                    <td>{point.sprintName}</td>
                                                    <td className="timestamp">{new Date(point.sprintStart).toLocaleDateString()}</td>
                                                    <td className="timestamp">{new Date(point.sprintEnd).toLocaleDateString()}</td>
                                                    <td>{point.completedTasks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {tab === 'exports' && (
                            <div className="modern-bento-card">
                                <h3 className="modern-bento-title">Export Data</h3>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <button className="modern-btn-primary" onClick={downloadExcel}>
                                        Export to Excel
                                    </button>
                                    <button className="modern-btn-primary" onClick={downloadPdf}>
                                        Export Project PDF
                                    </button>
                                    <button className="modern-btn-primary" onClick={downloadBurndownPdf}>
                                        Export Burndown PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </AppShell>
    );
}
