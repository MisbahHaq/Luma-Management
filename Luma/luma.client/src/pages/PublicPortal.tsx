import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicPortalApi } from '../api/endpoints';

export default function PublicPortal() {
    const { projectId } = useParams();
    const [token, setToken] = useState('');
    const [authed, setAuthed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !token.trim()) return;
        setError(null);
        try {
            const [p, t, m, h] = await Promise.all([
                publicPortalApi.project(projectId, token),
                publicPortalApi.tasks(projectId, token),
                publicPortalApi.members(projectId, token),
                publicPortalApi.health(projectId, token),
            ]);
            setProject(p.data);
            setTasks(t.data);
            setMembers(m.data);
            setHealth(h.data);
            setAuthed(true);
        } catch {
            setError('Invalid token or project not found.');
        }
    };

    if (!authed) {
        return (
            <div className="page">
                <header className="topbar">
                    <h1>Luma - Client Portal</h1>
                </header>
                <main className="container" style={{ maxWidth: 480 }}>
                    <div className="card">
                        <h2>Access Project</h2>
                        <p className="muted">Enter the project access token provided by the project owner.</p>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleConnect}>
                            <label>
                                Access Token
                                <input
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Paste token here"
                                    autoFocus
                                />
                            </label>
                            <button type="submit" className="modern-btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                                View Project
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="topbar">
                <h1>Luma - Client Portal</h1>
                <div className="topbar-right">
                    <span className="muted">{project?.name}</span>
                </div>
            </header>

            <main className="container">
                {error && <div className="alert alert-error">{error}</div>}

                {project && (
                    <div className="card">
                        <h2>{project.name}</h2>
                        <p className="muted">{project.description || 'No description'}</p>
                        <small className="muted">
                            Created by {project.createdBy} on <span className="timestamp">{new Date(project.createdAt).toLocaleDateString()}</span>
                        </small>
                    </div>
                )}

                {health && (
                    <div className="card">
                        <h3>Project Health</h3>
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
                                <span className="stat-value">{health.overdueTasks}</span>
                                <span className="stat-label">Overdue</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{health.completionPercentage}%</span>
                                <span className="stat-label">Completion</span>
                            </div>
                            <div className="stat">
                                <span className={`badge ${health.healthStatus === 'Good' ? 'badge-success' : health.healthStatus === 'At Risk' ? 'badge-warning' : 'badge-danger'}`}>
                                    {health.healthStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h3>Tasks ({tasks.length})</h3>
                    {tasks.length === 0 ? (
                        <p className="muted">No tasks yet.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Assignee</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>{task.title}</td>
                                        <td>{task.status}</td>
                                        <td>{task.priority}</td>
                                        <td>{task.assignee || 'Unassigned'}</td>
                                        <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="card">
                    <h3>Team Members ({members.length})</h3>
                    {members.length === 0 ? (
                        <p className="muted">No members yet.</p>
                    ) : (
                        <ul className="list">
                            {members.map((member, idx) => (
                                <li key={idx}>
                                    <strong>{member.fullName}</strong> - {member.email}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}
