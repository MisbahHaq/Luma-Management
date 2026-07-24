import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ArrowRight, Zap, CheckSquare, BarChart3,
    Users, GitBranch, Shield, Sparkles
} from 'lucide-react';

export default function HomePage() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/app', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    if (isAuthenticated) return null;

    const handleDemoLogin = async () => {
        await login('admin@luma.com', 'Admin@123');
        navigate('/app', { replace: true });
    };

    return (
        <div className="min-h-screen bg-bg text-text-primary antialiased selection:bg-accent-soft selection:text-text-primary" style={{ backgroundImage: 'linear-gradient(to right, rgba(226,223,207,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,223,207,0.5) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-border-subtle bg-bg/80 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <Zap className="w-4 h-4 text-text-primary" />
                        <span className="text-sm font-medium tracking-tight text-text-primary">Luma</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={handleDemoLogin}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors"
                        >
                            Try Demo
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-14">
                <section className="pt-24 pb-16 border-b border-border-subtle">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="max-w-2xl">
                            <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-text-primary mb-4 leading-tight">
                                Project management,<br />stripped to the essentials.
                            </h1>

                            <p className="text-sm sm:text-base text-text-muted mb-8 leading-relaxed">
                                Centralize tasks, sprint tracking, and team workload analytics into a fast, uncluttered workspace.
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDemoLogin}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors"
                                >
                                    Launch Demo
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="px-4 py-2 text-xs font-medium rounded border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-colors"
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 border-b border-border-subtle">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: CheckSquare,
                                    title: 'Task Tracking',
                                    desc: 'Kanban boards and focused list views with custom priority filters.',
                                },
                                {
                                    icon: BarChart3,
                                    title: 'Sprint Metrics',
                                    desc: 'Real-time velocity tracking and automated burndown summaries.',
                                },
                                {
                                    icon: Users,
                                    title: 'Team Sync',
                                    desc: 'In-context comments, assignees, and workspace-level permissions.',
                                },
                                {
                                    icon: GitBranch,
                                    title: 'Work Hierarchies',
                                    desc: 'Break down complex initiatives into epics, tasks, and subtasks.',
                                },
                                {
                                    icon: Shield,
                                    title: 'Access Controls',
                                    desc: 'Role-based authorization and session management out of the box.',
                                },
                                {
                                    icon: Sparkles,
                                    title: 'Live Updates',
                                    desc: 'Real-time status changes and assignments without page refreshes.',
                                },
                            ].map((feature, idx) => (
                                <div key={idx} className="space-y-2">
                                    <feature.icon className="w-4 h-4 text-text-muted" />
                                    <h3 className="text-xs font-medium text-text-primary">{feature.title}</h3>
                                    <p className="text-xs text-text-muted leading-normal">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-lg font-medium text-text-primary">Ready to test Luma?</h2>
                            <p className="text-xs text-text-muted mt-1">Jump straight into the demo with pre-populated project data.</p>
                        </div>
                        <button
                            onClick={handleDemoLogin}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors shrink-0"
                        >
                            Start Demo
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </section>

                <footer className="border-t border-border-subtle py-6">
                    <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-[11px] text-text-muted">
                        <span>Luma &copy; Demo</span>
                        <span>Internal preview</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}