import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicPortalApi } from '../api/mock';

export default function PublicPortal() {
    const { projectId } = useParams();
    const [token, setToken] = useState('');
    const [authed, setAuthed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !token.trim()) return;
        setError(null);
        try {
            const p = await publicPortalApi.project(projectId, token);
            const t = await publicPortalApi.tasks(projectId, token);
            const m = await publicPortalApi.members(projectId, token);
            setProject(p.data);
            setTasks(t.data);
            setMembers(m.data);
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
                <main className="container portal-container">
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
                                    className="mt-1"
                                />
                            </label>
                            <button type="submit" className="modern-btn-primary portal-submit">
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
                    </div>
                )}
                <div className="card">
                    <h3>Tasks ({tasks.length})</h3>
                    {tasks.length === 0 ? (
                        <p className="muted">No tasks yet.</p>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Assignee</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task: any) => (
                                        <tr key={task.id}>
                                            <td>{task.title}</td>
                                            <td>{task.status}</td>
                                            <td>{task.priority}</td>
                                            <td>{task.assigneeFullName || 'Unassigned'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="card">
                    <h3>Team Members ({members.length})</h3>
                    {members.length === 0 ? (
                        <p className="muted">No members yet.</p>
                    ) : (
                        <ul className="list">
                            {members.map((member: any) => (
                                <li key={member.userId}>
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
