import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email) {
            setError('Email is required.');
            return;
        }
        await new Promise((r) => setTimeout(r, 500));
        setSent(true);
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Reset password</h1>
                <p className="muted">Enter your email and we'll send you a reset link.</p>
                {error && <div className="alert alert-error">{error}</div>}
                {sent ? (
                    <p className="text-sm text-text-secondary text-center py-4">If an account exists, a reset link has been sent.</p>
                ) : (
                    <>
                        <label>
                            Email
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
                        </label>
                        <button type="submit" className="modern-btn-primary">Send reset link</button>
                    </>
                )}
                <div className="auth-footer">
                    <Link to="/login" className="auth-link">Back to login</Link>
                </div>
            </form>
        </div>
    );
}
