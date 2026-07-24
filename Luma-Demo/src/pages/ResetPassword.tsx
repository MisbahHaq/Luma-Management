import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        await new Promise((r) => setTimeout(r, 500));
        setDone(true);
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Set new password</h1>
                <p className="muted">Choose a strong password for your account.</p>
                {error && <div className="alert alert-error">{error}</div>}
                {done ? (
                    <p className="text-sm text-text-secondary text-center py-4">Password updated. You can now sign in.</p>
                ) : (
                    <>
                        <label>
                            New password
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
                        </label>
                        <button type="submit" className="modern-btn-primary">Update password</button>
                    </>
                )}
                <div className="auth-footer">
                    <Link to="/login" className="auth-link">Back to login</Link>
                </div>
            </form>
        </div>
    );
}
