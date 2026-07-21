import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/types';

const ROLES: UserRole[] = ['Admin', 'Member', 'Viewer'];

export default function Register() {
    const { register } = useAuth();

    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('Member');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await register({ email, password, fullName: fullName || undefined, role });
            window.location.href = '/';
        } catch {
            setError('Could not create account. The email may already be in use.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Create account</h1>
                <p className="muted">Join your team on Luma</p>

                {error && <div className="alert alert-error">{error}</div>}

                <label>
                    Full name (optional)
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                    />
                </label>

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
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                    />
                </label>

                <label>
                    Role
                    <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                        {ROLES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </label>

                <button type="submit" className="modern-btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create account'}
                </button>

                <div className="auth-divider">
                    <span className="auth-divider-line" />
                    <span className="muted small">or</span>
                    <span className="auth-divider-line" />
                </div>

                <a href="/api/github/login" className="modern-btn-secondary auth-github-btn">
                    <svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    Continue with GitHub
                </a>

                <div className="auth-footer">
                    <span>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></span>
                </div>
            </form>
        </div>
    );
}
