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
            navigate('/');
        } catch {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Luma</h1>
                <p className="muted">Sign in to your workspace</p>

                {error && <div className="alert alert-error">{error}</div>}

                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        placeholder="you@example.com"
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="••••••••"
                    />
                </label>

                <button type="submit" className="modern-btn-primary" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                    <span className="muted small">or</span>
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                </div>

                <a href="/api/github/login" className="modern-btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                    <svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    Sign in with GitHub
                </a>

                <p className="muted small" style={{ textAlign: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                    <span>No account? <Link to="/register" style={{ color: '#8B5CF6', fontWeight: 600 }}>Create one</Link></span>
                    <Link to="/forgot-password" style={{ color: '#8B5CF6', fontWeight: 600 }}>Forgot password?</Link>
                </p>
            </form>
        </div>
    );
}
