import { useState } from 'react';
import { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';
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

const NAV_ITEMS = [
    { label: 'Home', icon: '⌂', href: '/', active: true },
    { label: 'Projects', icon: '▦', href: '/projects' },
    { label: 'Sprints', icon: '◷', href: '/sprints' },
    { label: 'Tasks', icon: '☑', href: '/tasks' },
    { label: 'Reports', icon: '◔', href: '/reports' },
    { label: 'Members', icon: '☺', href: '/members' },
];

export default function AppShell({
    children,
    breadcrumb,
    title,
    project,
    completion,
}: AppShellProps) {
    const { currentUser, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="modern-shell">
            {/* Mobile overlay */}
            {sidebarOpen && <div className="modern-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Modern Sidebar */}
            <aside className={`modern-sidebar ${sidebarOpen ? 'modern-sidebar-open' : ''}`}>
                <div className="modern-sidebar-brand">
                    <div className="modern-sidebar-mark">◓</div>
                    <span className="modern-sidebar-title">Luma</span>
                </div>

                <nav className="modern-sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`modern-sidebar-link ${item.active ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="modern-sidebar-icon">{item.icon}</span>
                            <span className="modern-sidebar-label">{item.label}</span>
                        </a>
                    ))}
                </nav>

                <div className="modern-sidebar-section">
                    <div className="modern-sidebar-category">General</div>
                    <a href="/settings" className="modern-sidebar-link" onClick={() => setSidebarOpen(false)}>
                        <span className="modern-sidebar-icon">⚙</span>
                        <span className="modern-sidebar-label">Settings</span>
                    </a>
                    <a href="#" className="modern-sidebar-link" onClick={() => setSidebarOpen(false)}>
                        <span className="modern-sidebar-icon">?</span>
                        <span className="modern-sidebar-label">Help</span>
                    </a>
                </div>

                <div className="modern-sidebar-section">
                    <div className="modern-sidebar-category">Tools</div>
                    <a href="#" className="modern-sidebar-link" onClick={() => setSidebarOpen(false)}>
                        <span className="modern-sidebar-icon">◆</span>
                        <span className="modern-sidebar-label">Integrations</span>
                    </a>
                    <a href="#" className="modern-sidebar-link" onClick={() => setSidebarOpen(false)}>
                        <span className="modern-sidebar-icon">⇄</span>
                        <span className="modern-sidebar-label">API Keys</span>
                    </a>
                </div>

                <button className="modern-sidebar-logout" onClick={logout}>
                    Log out
                </button>
            </aside>

            {/* Main Content */}
            <div className="modern-main">
                {/* Modern Header */}
                <header className="modern-header">
                    <div className="modern-header-left">
                        <button className="modern-sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div className="modern-search-wrap">
                            <svg className="modern-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search projects, tasks, sprints..."
                                className="modern-search"
                            />
                        </div>
                        <div className="modern-filter-chips">
                            {['Projects', 'Sprints', 'Tasks', 'Members'].map((chip) => (
                                <button key={chip} className="modern-chip">
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="modern-header-right">
                        <NotificationsBell />
                        <button className="modern-icon-btn" title="Settings">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </button>
                        <div className="modern-avatar" title={currentUser?.fullName ?? currentUser?.email}>
                            {(currentUser?.fullName?.[0] ?? currentUser?.email?.[0] ?? '?').toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page Header (breadcrumb + title + progress) */}
                {(breadcrumb || title || project) && (
                    <div className="modern-page-header">
                        <div className="modern-page-header-left">
                            {breadcrumb && <nav className="modern-breadcrumb">{breadcrumb}</nav>}
                            {title && <h1 className="modern-page-title">{title}</h1>}
                            {project && (
                                <StatusPill status={completion === 100 ? 'Done' : 'InProgress'} />
                            )}
                        </div>
                        <div className="modern-page-header-right">
                            {project && typeof completion === 'number' && (
                                <div className="modern-page-progress">
                                    <ProgressTrack value={completion} tone="accent" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                <main className="modern-content">{children}</main>
            </div>
        </div>
    );
}
