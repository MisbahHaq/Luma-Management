import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';

export default function Placeholder({ title, hint }: { title: string; hint: string }) {
    const navigate = useNavigate();
    return (
        <AppShell breadcrumb={<span>Workspace</span>} title={title}>
            <div className="modern-greeting-row">
                <div>
                    <h1 className="modern-greeting">{title}</h1>
                    <p className="modern-subtitle">{hint}</p>
                </div>
                <button className="modern-btn-primary" onClick={() => navigate('/')}>
                    Go to projects
                </button>
            </div>
            <div className="modern-bento-card modern-empty-state">
                <p className="muted">{hint}</p>
            </div>
        </AppShell>
    );
}
