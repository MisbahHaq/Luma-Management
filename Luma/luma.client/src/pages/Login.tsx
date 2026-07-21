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

                <p className="muted small" style={{ textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
                    <span>No account? <Link to="/register" style={{ color: '#8B5CF6', fontWeight: 600 }}>Create one</Link></span>
                    <Link to="/forgot-password" style={{ color: '#8B5CF6', fontWeight: 600 }}>Forgot password?</Link>
                </p>
            </form>
        </div>
    );
}
