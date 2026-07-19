import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationsBell() {
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const toggle = () => setOpen((o) => !o);

    const handleClick = (n: { id: string; link: string | null; isRead: boolean }) => {
        if (!n.isRead) {
            void markRead(n.id);
        }
        if (n.link) {
            navigate(n.link);
        }
        setOpen(false);
    };

    return (
        <div className="notif">
            <button className="btn btn-ghost notif-bell" onClick={toggle} aria-label="Notifications">
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {open && (
                <>
                    <div className="notif-overlay" onClick={() => setOpen(false)} />
                    <div className="notif-panel card">
                        <div className="notif-head">
                            <strong>Notifications</strong>
                            {unreadCount > 0 && (
                                <button className="btn btn-ghost small" onClick={() => void markAllRead()}>
                                    Mark all read
                                </button>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <p className="muted small">No notifications yet.</p>
                        ) : (
                            <ul className="notif-list">
                                {notifications.map((n) => (
                                    <li
                                        key={n.id}
                                        className={n.isRead ? 'notif-item' : 'notif-item unread'}
                                        onClick={() => handleClick(n)}
                                    >
                                        <p>{n.message}</p>
                                        <small className="muted">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
