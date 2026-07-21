import { useState, type FormEvent, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!tokenFromUrl) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setError('Missing or invalid reset token.');
        }
    }, [tokenFromUrl]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!tokenFromUrl) {
            setError('Missing or invalid reset token.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(tokenFromUrl, newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch {
            setError('Invalid or expired reset token.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Set new password</h1>
                <p className="muted">Choose a strong password for your account.</p>

                {error && <div className="alert alert-error">{error}</div>}

                {success ? (
                    <div className="auth-success">
                        <p className="auth-success-text">Password updated</p>
                        <p className="muted">Redirecting to sign in...</p>
                    </div>
                ) : (
                    <>
                        <label>
                            New password
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                autoFocus
                            />
                        </label>

                        <label>
                            Confirm password
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat your password"
                            />
                        </label>

                        <button type="submit" className="modern-btn-primary" disabled={loading || !tokenFromUrl}>
                            {loading ? 'Updating...' : 'Update password'}
                        </button>

                        <p className="muted small auth-center-text">
                            <Link to="/login" className="auth-link">Back to sign in</Link>
                        </p>
                    </>
                )}
            </form>
        </div>
    );
}
