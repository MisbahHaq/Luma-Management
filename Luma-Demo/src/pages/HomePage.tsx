import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Play, Zap, BarChart3, CheckSquare, Users, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/app', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    if (isAuthenticated) {
        return null;
    }

    const handleDemoLogin = async () => {
        await login('admin@luma.com', 'Admin@123');
        navigate('/app', { replace: true });
    };

    return (
        <div className="min-h-screen bg-bg text-text-primary overflow-hidden">
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg/70 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-text-primary">Luma</span>
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent border border-accent/20">Demo</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/login')} className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                                Sign in
                            </button>
                            <button onClick={handleDemoLogin} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30">
                                Try Demo
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute inset-0 bg-gradient-to-b from-accent/8 via-bg to-bg" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/20 rounded-full blur-[120px] opacity-40" />
                        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] opacity-30" />
                    </div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="text-center max-w-4xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-1 border border-border-subtle text-xs text-text-secondary mb-8">
                                <Sparkles className="w-3.5 h-3.5 text-accent" />
                                <span>Now with real-time collaboration</span>
                            </div>
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary mb-6 leading-[1.1]">
                                Project management that{' '}
                                <span className="bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent">
                                    moves
                                </span>{' '}
                                with your team
                            </h1>
                            <p className="text-lg sm:text-xl text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
                                Plan, track, and deliver projects with precision. Luma brings together tasks, sprints, reports, and team collaboration in one modern workspace.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button onClick={handleDemoLogin} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-accent text-white hover:bg-accent/90 transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 w-full sm:w-auto justify-center">
                                    <Play className="w-4 h-4" />
                                    Try Interactive Demo
                                </button>
                                <button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default hover:bg-surface-1 transition-all w-full sm:w-auto justify-center">
                                    Create Free Account
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-text-muted mt-4">
                                No credit card required · Demo uses sample data
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-20 relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-tight">
                                Everything you need to ship faster
                            </h2>
                            <p className="text-base text-text-muted max-w-xl mx-auto">
                                Powerful features wrapped in a simple, intuitive interface designed for modern teams.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="group relative bg-surface-1 border border-border-subtle rounded-2xl p-6 hover:border-border-default hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <CheckSquare className="w-6 h-6 text-accent" />
                                    </div>
                                    <h3 className="text-base font-semibold text-text-primary mb-2">Task Management</h3>
                                    <p className="text-sm text-text-muted leading-relaxed">Create, assign, and track tasks with priorities, labels, and custom fields. Kanban boards and list views keep everyone aligned.</p>
                                </div>
                            </div>
                            <div className="group relative bg-surface-1 border border-border-subtle rounded-2xl p-6 hover:border-border-default hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <BarChart3 className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-text-primary mb-2">Sprints & Reports</h3>
                                    <p className="text-sm text-text-muted leading-relaxed">Plan sprints, track burndown charts, and monitor velocity. Make data-driven decisions with real-time project health metrics.</p>
                                </div>
                            </div>
                            <div className="group relative bg-surface-1 border border-border-subtle rounded-2xl p-6 hover:border-border-default hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Users className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-text-primary mb-2">Team Collaboration</h3>
                                    <p className="text-sm text-text-muted leading-relaxed">Workspaces, project roles, comments, and real-time notifications keep your team connected and productive.</p>
                                </div>
                            </div>
                            <div className="group relative bg-surface-1 border border-border-subtle rounded-2xl p-6 hover:border-border-default hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-base font-semibold text-text-primary mb-2">Project Workspaces</h3>
                                    <p className="text-sm text-text-muted leading-relaxed">Organize work into workspaces. Invite members, set permissions, and keep projects structured and accessible.</p>
                                </div>
                            </div>
                            <div className="group relative bg-surface-1 border border-border-subtle rounded-2xl p-6 hover:border-border-default hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Shield className="w-6 h-6 text-sky-400" />
                                    </div>
                                    <h3 className="text-base font-semibold text-text-primary mb-2">Secure Access</h3>
                                    <p className="text-sm text-text-muted leading-relaxed">JWT authentication, role-based access control, and SSO integration keep your data safe and your team compliant.</p>
                                </div>
                            </div>
                            <div className="group relative bg-surface-1 border border-border-subtle rounded-2xl p-6 hover:border-border-default hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-base font-semibold text-text-primary mb-2">Real-time Updates</h3>
                                    <p className="text-sm text-text-muted leading-relaxed">Instant notifications for task assignments, comments, and status changes. Never miss an update again.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-surface-1/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-surface-1 border border-border-subtle rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-purple-500/5 to-transparent" />
                            <div className="relative">
                                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-tight">
                                    Ready to get started?
                                </h2>
                                <p className="text-base text-text-muted mb-8 max-w-xl mx-auto">
                                    Join teams who are already using Luma to manage their projects more effectively.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <button onClick={handleDemoLogin} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-accent text-white hover:bg-accent/90 transition-all shadow-xl shadow-accent/25 w-full sm:w-auto justify-center">
                                        <Play className="w-4 h-4" />
                                        Try Interactive Demo
                                    </button>
                                    <button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default hover:bg-surface-2 transition-all w-full sm:w-auto justify-center">
                                        Create Free Account
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="border-t border-border-subtle py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                                    <Zap className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-text-primary">Luma</span>
                            </div>
                            <p className="text-xs text-text-muted">Demo application for demonstration purposes only.</p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
