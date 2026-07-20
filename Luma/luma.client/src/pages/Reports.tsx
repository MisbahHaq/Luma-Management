import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi, exportApi } from '../api/endpoints';
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
        setLoading(true);
        Promise.all([loadHealth(), loadBurndown(), loadVelocity()])
            .finally(() => setLoading(false));
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
        <div className="page">
            <header className="topbar">
                <h1>Reports & Insights</h1>
                <div className="topbar-right">
                    <button className="btn btn-ghost" onClick={() => navigate('/')}>
                        Back to Dashboard
                    </button>
                </div>
            </header>

            <main className="container">
                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <p className="muted">Loading...</p>
                ) : (
                    <>
                        <div className="tabs">
                            <button className={`tab ${tab === 'health' ? 'active' : ''}`} onClick={() => setTab('health')}>Project Health</button>
                            <button className={`tab ${tab === 'burndown' ? 'active' : ''}`} onClick={() => setTab('burndown')}>Burndown</button>
                            <button className={`tab ${tab === 'velocity' ? 'active' : ''}`} onClick={() => setTab('velocity')}>Velocity</button>
                            <button className={`tab ${tab === 'exports' ? 'active' : ''}`} onClick={() => setTab('exports')}>Exports</button>
                        </div>

                        {tab === 'health' && health && (
                            <div className="card">
                                <h2>{health.projectName} - Health</h2>
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
                                <div className="health-status">
                                    <strong>Status: </strong>
                                    <span className={`badge ${health.healthStatus === 'Good' ? 'badge-success' : health.healthStatus === 'At Risk' ? 'badge-warning' : 'badge-danger'}`}>
                                        {health.healthStatus}
                                    </span>
                                </div>
                            </div>
                        )}

                        {tab === 'burndown' && burndown && (
                            <div className="card">
                                <h2>{burndown.sprintName} - Burndown</h2>
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
                                                    <td>{new Date(point.date).toLocaleDateString()}</td>
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
                            <div className="card">
                                <h2>Velocity - {velocity.projectName}</h2>
                                <p><strong>Average Velocity:</strong> {velocity.averageVelocity} tasks/sprint</p>
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
                                                    <td>{new Date(point.sprintStart).toLocaleDateString()}</td>
                                                    <td>{new Date(point.sprintEnd).toLocaleDateString()}</td>
                                                    <td>{point.completedTasks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {tab === 'exports' && (
                            <div className="card">
                                <h2>Export Data</h2>
                                <div className="export-actions">
                                    <button className="btn btn-primary" onClick={downloadExcel}>
                                        Export to Excel
                                    </button>
                                    <button className="btn btn-primary" onClick={downloadPdf}>
                                        Export Project PDF
                                    </button>
                                    <button className="btn btn-primary" onClick={downloadBurndownPdf}>
                                        Export Burndown PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
