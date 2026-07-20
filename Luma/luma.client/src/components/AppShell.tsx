import { useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';
import Sidebar from './Sidebar';
import Avatar from './Avatar';
import ProgressTrack from './ProgressTrack';
import StatusPill from './StatusPill';
import type { Project } from '../types/types';

interface AppShellProps {
    children: ReactNode;
    breadcrumb?: ReactNode;
    title?: string;
    project?: Project | null;
    completion?: number;
}

export default function AppShell({
    children,
    breadcrumb,
    title,
    project,
    completion,
}: AppShellProps) {
    const { currentUser, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`shell ${collapsed ? 'shell-collapsed' : ''}`}>
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            <div className="shell-main">
                <header className="topbar shell-topbar">
                    <div className="topbar-left">
                        {breadcrumb && <nav className="breadcrumb">{breadcrumb}</nav>}
                        {title && <h1 className="topbar-title">{title}</h1>}
                        {project && (
                            <StatusPill status={completion === 100 ? 'Done' : 'InProgress'} />
                        )}
                    </div>
                    <div className="topbar-right">
                        {project && typeof completion === 'number' && (
                            <div className="topbar-progress">
                                <ProgressTrack value={completion} tone="accent" />
                            </div>
                        )}
                        <NotificationsBell />
                        <div className="topbar-user">
                            <Avatar name={currentUser?.fullName ?? currentUser?.email} size={28} />
                            <span className="muted small hide-narrow">
                                {currentUser?.fullName ?? currentUser?.email}
                            </span>
                        </div>
                        <button className="btn btn-ghost small" onClick={logout}>
                            Sign out
                        </button>
                    </div>
                </header>
                <main className="shell-content">{children}</main>
            </div>
        </div>
    );
}
