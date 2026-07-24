import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            navigate('/app', { replace: true });
        } catch {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4" style={{ backgroundImage: 'linear-gradient(to right, rgba(226,223,207,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,223,207,0.5) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="text-lg font-medium tracking-tight text-text-primary mb-1">Luma</div>
                    <p className="text-xs text-text-muted">Project management, stripped to the essentials.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-surface-1 border border-border-subtle rounded p-6">
                    <div className="mb-5">
                        <h1 className="text-sm font-medium text-text-primary tracking-tight">Sign in</h1>
                        <p className="text-xs text-text-muted mt-0.5">Access your workspace</p>
                    </div>

                    {error && (
                        <div className="mb-4 px-3 py-2 rounded text-xs text-accent border border-accent/20" style={{ background: 'rgba(193,84,31,0.1)' }}>
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block">
                            <span className="block text-xs font-medium text-text-secondary mb-1">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="w-full bg-surface-2 border border-border-subtle rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </label>

                        <label className="block">
                            <span className="block text-xs font-medium text-text-secondary mb-1">Password</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                                className="w-full bg-surface-2 border border-border-subtle rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-4 px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="flex items-center gap-3 my-4">
                        <span className="flex-1 h-px bg-border-subtle" />
                        <span className="text-[10px] text-text-muted uppercase tracking-wider">or</span>
                        <span className="flex-1 h-px bg-border-subtle" />
                    </div>

                    <a
                        href="/api/github/login"
                        className="flex items-center justify-center gap-2 w-full px-3 py-1.5 text-xs font-medium rounded border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-colors"
                    >
                        <svg height="18" viewBox="0 0 16 16" width="18" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                        Continue with GitHub
                    </a>

                    <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-text-muted">
                            No account?{' '}
                            <Link to="/register" className="text-accent hover:underline">
                                Create one
                            </Link>
                        </span>
                        <Link to="/forgot-password" className="text-accent hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
