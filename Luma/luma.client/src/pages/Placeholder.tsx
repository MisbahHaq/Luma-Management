import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';

export default function Placeholder({ title, hint }: { title: string; hint: string }) {
    const navigate = useNavigate();
    return (
        <AppShell breadcrumb={<span>Workspace</span>} title={title}>
            <div className="card placeholder-card">
                <h2>{title}</h2>
                <p className="muted">{hint}</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    Go to projects
                </button>
            </div>
        </AppShell>
    );
}
