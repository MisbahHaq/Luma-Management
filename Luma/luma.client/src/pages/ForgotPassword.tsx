import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError('Email is required.');
            return;
        }

        setLoading(true);
        try {
            await forgotPassword(email.trim());
            setSent(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Reset password</h1>
                <p className="muted">Enter your email and we'll send you a reset link.</p>

                {error && <div className="alert alert-error">{error}</div>}

                {sent ? (
                    <div className="auth-success">
                        <p className="auth-success-text">Check your inbox</p>
                        <p className="muted">
                            If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                        </p>
                        <Link to="/login" className="auth-link">Back to sign in</Link>
                    </div>
                ) : (
                    <>
                        <label>
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoFocus
                            />
                        </label>

                        <button type="submit" className="modern-btn-primary" disabled={loading}>
                            {loading ? 'Sending...' : 'Send reset link'}
                        </button>

                        <p className="muted small auth-center-text">
                            Remember your password? <Link to="/login" className="auth-link">Sign in</Link>
                        </p>
                    </>
                )}
            </form>
        </div>
    );
}
