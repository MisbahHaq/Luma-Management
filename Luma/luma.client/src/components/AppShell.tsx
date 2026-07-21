import { useState, useCallback } from 'react';
import { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import NotificationsBell from './NotificationsBell';
import ProgressTrack from './ProgressTrack';
import StatusPill from './StatusPill';
import type { Project } from '../types/types';
import SearchResults from './SearchResults';

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
    { label: 'My Tasks', icon: '☑', href: '/my-tasks' },
    { label: 'Sprints', icon: '◷', href: '/sprints' },
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
    const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

    const handleSearchClose = useCallback(() => {
        setSearchQuery('');
    }, []);

    return (
        <div className="modern-shell">
            {sidebarOpen && <div className="modern-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <aside className={`modern-sidebar ${sidebarOpen ? 'modern-sidebar-open' : ''}`}>
                <div className="modern-sidebar-brand">
                    <span className="modern-sidebar-mark">◓</span>
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

                <div className="modern-sidebar-footer">
                    <button className="modern-sidebar-logout" onClick={logout}>
                        Log out
                    </button>
                </div>
            </aside>

            <div className="modern-main">
                <header className="modern-header">
                    <div className="modern-header-left">
                        <button className="modern-sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>

                        <div className="modern-workspace-switcher">
                            <button
                                className="modern-workspace-trigger"
                                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                            >
                                <span className="modern-workspace-icon">◉</span>
                                <span className="modern-workspace-label">{currentWorkspace?.name ?? 'Select workspace'}</span>
                                <span className="modern-workspace-arrow">{workspaceMenuOpen ? '▲' : '▼'}</span>
                            </button>
                            {workspaceMenuOpen && (
                                <div className="modern-workspace-menu">
                                    {workspaces.map(ws => (
                                        <button
                                            key={ws.id}
                                            className={`modern-workspace-option ${currentWorkspace?.id === ws.id ? 'active' : ''}`}
                                            onClick={() => {
                                                switchWorkspace(ws.id);
                                                setWorkspaceMenuOpen(false);
                                            }}
                                        >
                                            {ws.name}
                                            <span className="modern-workspace-slug">{ws.slug}</span>
                                        </button>
                                    ))}
                                    <button
                                        className="modern-workspace-option modern-workspace-create"
                                        onClick={() => {
                                            setWorkspaceMenuOpen(false);
                                            window.location.href = '/projects';
                                        }}
                                    >
                                        + New workspace
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="modern-search-container">
                            <div className="modern-search-wrap">
                                <svg className="modern-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="modern-search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <SearchResults query={searchQuery} onClose={handleSearchClose} />
                        </div>
                    </div>
                    <div className="modern-header-right">
                        <NotificationsBell />
                        <div className="modern-avatar" title={currentUser?.fullName ?? currentUser?.email}>
                            {(currentUser?.fullName?.[0] ?? currentUser?.email?.[0] ?? '?').toUpperCase()}
                        </div>
                    </div>
                </header>

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

                <main className="modern-content">{children}</main>
            </div>
        </div>
    );
}
